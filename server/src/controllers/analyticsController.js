const asyncHandler = require('../utils/asyncHandler');
const {
  currentMonth,
  monthRange,
  shiftMonth,
  daysInMonth,
  parseDay,
  addDays,
} = require('../utils/dates');
const { totalsByCategory, withCategories, totalsByMonth } = require('../services/analyticsService');

const sum = (rows, key) => rows.reduce((acc, r) => acc + r[key], 0);

// Headline numbers for one month, compared with the month before.
exports.summary = asyncHandler(async (req, res) => {
  const month = req.valid.query.month || currentMonth();
  const prev = shiftMonth(month, -1);
  const cur = monthRange(month);
  const before = monthRange(prev);

  const [curRows, prevRows] = await Promise.all([
    totalsByCategory(req.user.id, cur.start, cur.end),
    totalsByCategory(req.user.id, before.start, before.end),
  ]);

  const totalMinor = sum(curRows, 'total');
  const prevMinor = sum(prevRows, 'total');
  // For the running month, average over days elapsed so far; otherwise the full month.
  const days = month === currentMonth() ? new Date().getUTCDate() : daysInMonth(month);
  const topCategory = curRows[0] ? (await withCategories([curRows[0]]))[0] : null;

  res.json({
    month,
    total: totalMinor / 100,
    count: sum(curRows, 'count'),
    previousTotal: prevMinor / 100,
    changePercent: prevMinor > 0 ? Math.round(((totalMinor - prevMinor) / prevMinor) * 1000) / 10 : null,
    dailyAverage: Math.round(totalMinor / days) / 100,
    topCategory,
  });
});

// Spend per category between two dates (inclusive), with share of total.
exports.byCategory = asyncHandler(async (req, res) => {
  const { from, to } = req.valid.query;
  const rows = await totalsByCategory(req.user.id, parseDay(from), addDays(parseDay(to), 1));
  const items = await withCategories(rows);
  const total = items.reduce((acc, i) => acc + i.total, 0);

  res.json({
    from,
    to,
    total: Math.round(total * 100) / 100,
    items: items.map((i) => ({ ...i, percent: total > 0 ? Math.round((i.total / total) * 1000) / 10 : 0 })),
  });
});

// Monthly totals for the last N months ending at `to`; empty months are filled with 0.
exports.trend = asyncHandler(async (req, res) => {
  const { months, to } = req.valid.query;
  const last = to || currentMonth();
  const first = shiftMonth(last, -(months - 1));

  const rows = await totalsByMonth(req.user.id, monthRange(first).start, monthRange(last).end);
  const byMonth = new Map(rows.map((r) => [r._id, r]));

  const result = [];
  for (let i = 0; i < months; i += 1) {
    const key = shiftMonth(first, i);
    const row = byMonth.get(key);
    result.push({ month: key, total: row ? row.total / 100 : 0, count: row ? row.count : 0 });
  }
  res.json({ months: result });
});
