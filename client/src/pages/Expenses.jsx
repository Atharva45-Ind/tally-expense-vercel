import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useCategories from '../hooks/useCategories.js';
import ExpenseModal from '../components/ExpenseModal.jsx';
import { money, paymentLabel, prettyDate } from '../utils/format.js';

const EMPTY_FILTERS = { from: '', to: '', category: '', q: '' };

export default function Expenses() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null); // null = closed, {} = new, expense = edit

  // Wait for a pause in typing before querying.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === search ? f : { ...f, q: search }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    const params = { page, limit: 15 };
    for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;
    api
      .get('/expenses', { params })
      .then((res) => {
        if (!ignore) {
          setResult(res.data);
          setError('');
        }
      })
      .catch((err) => !ignore && setError(errorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [filters, page, refreshKey]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };
  const hasFilters = Object.values(filters).some(Boolean);

  async function remove(expense) {
    if (!window.confirm(`Delete this ${money(expense.amount, user.currency)} expense?`)) return;
    try {
      await api.delete(`/expenses/${expense.id}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <header className="page-head">
        <h1>Expenses</h1>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={() => setEditor({})} disabled={!categories.length}>
            Add expense
          </button>
        </div>
      </header>

      <section className="filters">
        <label className="field">
          <span>From</span>
          <input type="date" value={filters.from} onChange={setFilter('from')} />
        </label>
        <label className="field">
          <span>To</span>
          <input type="date" value={filters.to} onChange={setFilter('to')} />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={filters.category} onChange={setFilter('category')}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field grow">
          <span>Search notes</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. coffee" />
        </label>
        {hasFilters && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setSearch('');
              setPage(1);
            }}
          >
            Clear filters
          </button>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="panel flush">
          <div className="table-meta">
            <span>
              {result.total} {result.total === 1 ? 'expense' : 'expenses'}
            </span>
            <strong>{money(result.totalAmount, user.currency)} total</strong>
          </div>

          {result.items.length === 0 ? (
            <p className="empty">{hasFilters ? 'No expenses match these filters.' : 'No expenses yet. Add your first one.'}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Note</th>
                    <th>Paid with</th>
                    <th className="num">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((e) => (
                    <tr key={e.id}>
                      <td>{prettyDate(e.date)}</td>
                      <td>
                        <span className="chip">
                          <span className="dot" style={{ background: e.category?.color }} />
                          {e.category?.name}
                        </span>
                      </td>
                      <td className="note">{e.note || <span className="muted">–</span>}</td>
                      <td>{paymentLabel(e.paymentMethod)}</td>
                      <td className="num">{money(e.amount, user.currency)}</td>
                      <td className="row-actions">
                        <button className="link-btn" onClick={() => setEditor(e)}>
                          Edit
                        </button>
                        <button className="link-btn danger" onClick={() => remove(e)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.totalPages > 1 && (
            <div className="pager">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {result.page} of {result.totalPages}
              </span>
              <button className="btn btn-ghost" disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </section>
      )}

      {editor && (
        <ExpenseModal
          expense={editor.id ? editor : null}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
