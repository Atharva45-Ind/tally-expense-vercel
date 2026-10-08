import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import { PAYMENT_METHODS, todayStr } from '../utils/format.js';

// Add a new expense, or edit one when `expense` is provided.
export default function ExpenseModal({ expense, categories, onClose, onSaved }) {
  const editing = Boolean(expense);
  const [form, setForm] = useState({
    amount: expense ? String(expense.amount) : '',
    date: expense ? expense.date : todayStr(),
    category: expense ? expense.categoryId : categories[0]?.id || '',
    paymentMethod: expense?.paymentMethod || 'upi',
    note: expense?.note || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError('Enter an amount greater than 0.');
    if (!form.category) return setError('Choose a category.');

    setSaving(true);
    try {
      const payload = { ...form, amount };
      if (editing) await api.put(`/expenses/${expense.id}`, payload);
      else await api.post('/expenses', payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={editing ? 'Edit expense' : 'Add expense'}>
        <h2>{editing ? 'Edit expense' : 'Add expense'}</h2>

        <label className="field">
          <span>Amount</span>
          <input type="number" inputMode="decimal" step="0.01" min="0.01" autoFocus value={form.amount} onChange={set('amount')} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label className="field">
            <span>Paid with</span>
            <select value={form.paymentMethod} onChange={set('paymentMethod')}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={set('category')} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Note (optional)</span>
          <input type="text" maxLength={200} value={form.note} onChange={set('note')} placeholder="What was it for?" />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
