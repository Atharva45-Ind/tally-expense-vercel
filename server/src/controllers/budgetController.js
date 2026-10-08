const Budget = require('../models/Budget');
const Category = require('../models/Category');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const serialize = require('../utils/serialize');
const { currentMonth, monthRange } = require('../utils/dates');
const { totalsByCategory } = require('../services/analyticsService');

exports.list = asyncHandler(async (req, res) => {
  const month = req.valid.query.month || currentMonth();
  const { start, end } = monthRange(month);

  const [budgets, rows] = await Promise.all([
    Budget.find({ user: req.user.id, month }).populate('category', 'name color').lean(),
    totalsByCategory(req.user.id, start, end),
  ]);
  const spentBy = new Map(rows.map((r) => [String(r._id), r.total]));

  const items = budgets
    .filter((b) => b.category)
    .map((b) => serialize.budget(b, spentBy.get(String(b.category._id)) || 0))
    .sort((a, b) => b.percentUsed - a.percentUsed);

  res.json({ month, items });
});

// Create or replace the limit for one category in one month.
exports.upsert = asyncHandler(async (req, res) => {
  const { category, month, limit } = req.valid.body;
  if (!(await Category.exists({ _id: category, user: req.user.id }))) {
    throw new HttpError(400, 'Category not found');
  }
  const budget = await Budget.findOneAndUpdate(
    { user: req.user.id, category, month },
    { $set: { limitMinor: Math.round(limit * 100) } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.json({ id: String(budget._id), month, category, limit });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await Budget.findOneAndDelete({ _id: req.valid.params.id, user: req.user.id });
  if (!deleted) throw new HttpError(404, 'Budget not found');
  res.status(204).end();
});
