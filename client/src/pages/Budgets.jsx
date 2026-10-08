import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useCategories from '../hooks/useCategories.js';
import { money, monthLabel, thisMonth } from '../utils/format.js';

const tone = (pct) => (pct > 100 ? 'over' : pct >= 80 ? 'warn' : 'ok');

export default function Budgets() {
  const { user } = useAuth();
  const cur = user.currency;
  const { categories } = useCategories();
  const [month, setMonth] = useState(thisMonth());
  const [items, setItems] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ category: '', limit: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/budgets', { params: { month } })
      .then((res) => !ignore && setItems(res.data.items))
      .catch((err) => !ignore && setError(errorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [month, refreshKey]);

  const categoryId = form.category || categories[0]?.id || '';

  async function save(e) {
    e.preventDefault();
    setError('');
    const limit = Number(form.limit);
    if (!(limit > 0)) return setError('Enter a limit greater than 0.');
    try {
      await api.put('/budgets', { category: categoryId, month, limit });
      setForm((f) => ({ ...f, limit: '' }));
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(budget) {
    try {
      await api.delete(`/budgets/${budget.id}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <header className="page-head">
        <h1>Budgets</h1>
        <div className="head-actions">
          <input type="month" aria-label="Month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </div>
      </header>

      <form className="panel inline-form" onSubmit={save}>
        <label className="field">
          <span>Category</span>
          <select value={categoryId} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Limit for {monthLabel(month)}</span>
          <input type="number" step="0.01" min="0.01" value={form.limit} onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))} required />
        </label>
        <button className="btn btn-primary">Set budget</button>
      </form>

      {error && <p className="error">{error}</p>}

      {items && (
        <section className="panel">
          <h2>{monthLabel(month)}</h2>
          {items.length === 0 ? (
            <p className="empty">No budgets for this month. Pick a category above and set a limit.</p>
          ) : (
            <ul className="budget-list">
              {items.map((b) => (
                <li key={b.id}>
                  <div className="budget-top">
                    <span className="chip">
                      <span className="dot" style={{ background: b.category.color }} />
                      {b.category.name}
                    </span>
                    <span className="budget-nums">
                      {money(b.spent, cur)} of {money(b.limit, cur)}
                    </span>
                    <button className="link-btn danger" onClick={() => remove(b)}>
                      Remove
                    </button>
                  </div>
                  <div className="progress" role="progressbar" aria-valuenow={Math.min(b.percentUsed, 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`progress-bar ${tone(b.percentUsed)}`} style={{ width: `${Math.min(b.percentUsed, 100)}%` }} />
                  </div>
                  <p className={`budget-note ${tone(b.percentUsed)}`}>
                    {b.percentUsed > 100
                      ? `Over by ${money(b.spent - b.limit, cur)}`
                      : `${b.percentUsed}% used, ${money(b.limit - b.spent, cur)} left`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
