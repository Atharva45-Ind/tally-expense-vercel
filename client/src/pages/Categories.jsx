import { useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import useCategories from '../hooks/useCategories.js';

export default function Categories() {
  const { categories, reload } = useCategories();
  const [newCat, setNewCat] = useState({ name: '', color: '#3f8fe0' });
  const [editing, setEditing] = useState(null); // { id, name, color }
  const [error, setError] = useState('');

  async function run(action) {
    setError('');
    try {
      await action();
      await reload();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  }

  async function add(e) {
    e.preventDefault();
    if (await run(() => api.post('/categories', newCat))) setNewCat((c) => ({ ...c, name: '' }));
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (await run(() => api.put(`/categories/${editing.id}`, { name: editing.name, color: editing.color }))) setEditing(null);
  }

  function remove(c) {
    if (window.confirm(`Delete the "${c.name}" category?`)) run(() => api.delete(`/categories/${c.id}`));
  }

  return (
    <>
      <header className="page-head">
        <h1>Categories</h1>
      </header>

      <form className="panel inline-form" onSubmit={add}>
        <label className="field grow">
          <span>New category</span>
          <input value={newCat.name} maxLength={40} onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. Subscriptions" required />
        </label>
        <label className="field">
          <span>Color</span>
          <input type="color" value={newCat.color} onChange={(e) => setNewCat((c) => ({ ...c, color: e.target.value }))} />
        </label>
        <button className="btn btn-primary">Add category</button>
      </form>

      {error && <p className="error">{error}</p>}

      <section className="panel flush">
        <ul className="cat-list">
          {categories.map((c) =>
            editing?.id === c.id ? (
              <li key={c.id}>
                <form className="cat-edit" onSubmit={saveEdit}>
                  <input type="color" aria-label="Color" value={editing.color} onChange={(e) => setEditing((x) => ({ ...x, color: e.target.value }))} />
                  <input aria-label="Name" value={editing.name} maxLength={40} onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))} required />
                  <button className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </form>
              </li>
            ) : (
              <li key={c.id}>
                <span className="chip">
                  <span className="dot" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="row-actions">
                  <button className="link-btn" onClick={() => setEditing({ id: c.id, name: c.name, color: c.color })}>
                    Edit
                  </button>
                  <button className="link-btn danger" onClick={() => remove(c)}>
                    Delete
                  </button>
                </span>
              </li>
            )
          )}
        </ul>
      </section>
    </>
  );
}
