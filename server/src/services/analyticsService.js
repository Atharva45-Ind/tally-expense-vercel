const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

// Aggregation pipelines don't auto-cast ids like find() does.
const oid = (id) => new mongoose.Types.ObjectId(id);

// Spend per category in [start, end). Totals are in minor units, largest first.
function totalsByCategory(userId, start, end) {
  return Expense.aggregate([
    { $match: { user: oid(userId), date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
}

// Attach category name/color and convert totals to major units.
async function withCategories(rows) {
  const cats = await Category.find({ _id: { $in: rows.map((r) => r._id) } }).lean();
  const byId = new Map(cats.map((c) => [String(c._id), c]));
  return rows.map((r) => {
    const c = byId.get(String(r._id));
    return {
      categoryId: String(r._id),
      name: c ? c.name : 'Unknown',
      color: c ? c.color : '#8a8f98',
      total: r.total / 100,
      count: r.count,
    };
  });
}

// Spend per calendar month ('YYYY-MM') in [start, end), in minor units.
function totalsByMonth(userId, start, end) {
  return Expense.aggregate([
    { $match: { user: oid(userId), date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: '$amountMinor' },
        count: { $sum: 1 },
      },
    },
  ]);
}

module.exports = { oid, totalsByCategory, withCategories, totalsByMonth };
