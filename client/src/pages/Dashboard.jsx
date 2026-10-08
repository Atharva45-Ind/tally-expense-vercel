import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useCategories from '../hooks/useCategories.js';
import ExpenseModal from '../components/ExpenseModal.jsx';
import { money, moneyCompact, monthBounds, monthLabel, shortMonth, thisMonth } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const cur = user.currency;
  const { categories } = useCategories();
  const [month, setMonth] = useState(thisMonth());
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let ignore = false;
    setError('');
    const { from, to } = monthBounds(month);
    Promise.all([
      api.get('/analytics/summary', { params: { month } }),
      api.get('/analytics/by-category', { params: { from, to } }),
      api.get('/analytics/trend', { params: { months: 6, to: month } }),
    ])
      .then(([summary, byCat, trend]) => {
        if (!ignore) setData({ summary: summary.data, byCat: byCat.data, trend: trend.data.months });
      })
      .catch((err) => !ignore && setError(errorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [month, refreshKey]);

  const s = data?.summary;
  const change = s?.changePercent;
  const trendData = data?.trend.map((m) => ({ ...m, label: shortMonth(m.month) }));

  return (
    <>
      <header className="page-head">
        <h1>Dashboard</h1>
        <div className="head-actions">
          <input type="month" aria-label="Month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={!categories.length}>
            Add expense
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          <section className="hero">
            <div>
              <p className="hero-label">Spent in {monthLabel(month)}</p>
              <p className="hero-total">{money(s.total, cur)}</p>
              <p className="hero-sub">
                {s.count} {s.count === 1 ? 'expense' : 'expenses'}
                {change === null
                  ? ', nothing recorded the month before'
                  : change === 0
                    ? ', the same as the month before'
                    : `, ${Math.abs(change)}% ${change > 0 ? 'more' : 'less'} than the month before (${money(s.previousTotal, cur)})`}
              </p>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>Daily average</dt>
                <dd>{money(s.dailyAverage, cur)}</dd>
              </div>
              <div>
                <dt>Biggest category</dt>
                <dd>
                  {s.topCategory ? (
                    <>
                      <span className="dot" style={{ background: s.topCategory.color }} />
                      {s.topCategory.name}
                    </>
                  ) : (
                    'None yet'
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <div className="grid-2">
            <section className="panel">
              <h2>By category</h2>
              {data.byCat.items.length === 0 ? (
                <p className="empty">No expenses in {monthLabel(month)}. Add one to see the breakdown.</p>
              ) : (
                <div className="split">
                  <div className="chart" style={{ height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={data.byCat.items} dataKey="total" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2} stroke="none">
                          {data.byCat.items.map((i) => (
                            <Cell key={i.categoryId} fill={i.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => money(v, cur)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="legend">
                    {data.byCat.items.map((i) => (
                      <li key={i.categoryId}>
                        <span className="dot" style={{ background: i.color }} />
                        <span className="legend-name">{i.name}</span>
                        <span className="legend-pct">{i.percent}%</span>
                        <span className="legend-amt">{money(i.total, cur)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Last 6 months</h2>
              <div className="chart" style={{ height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={trendData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e3e8ec" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => moneyCompact(v, cur)} />
                    <Tooltip formatter={(v) => money(v, cur)} labelFormatter={() => ''} cursor={{ fill: 'rgba(15,43,51,0.05)' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44}>
                      {trendData.map((m) => (
                        <Cell key={m.month} fill={m.month === month ? '#e8a317' : '#b9c7cd'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      )}

      {adding && <ExpenseModal categories={categories} onClose={() => setAdding(false)} onSaved={() => setRefreshKey((k) => k + 1)} />}
    </>
  );
}
