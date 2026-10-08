const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const serialize = require('../utils/serialize');
const { parseDay, addDays } = require('../utils/dates');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const populateCategory = ['category', 'name color'];

async function assertOwnsCategory(userId, categoryId) {
  if (!(await Category.exists({ _id: categoryId, user: userId }))) {
    throw new HttpError(400, 'Category not found');
  }
}

exports.list = asyncHandler(async (req, res) => {
  const { from, to, category, q, page, limit } = req.valid.query;

  // ObjectIds are built up front so the same filter works for find() and aggregate().
  const filter = { user: new mongoose.Types.ObjectId(req.user.id) };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = parseDay(from);
    if (to) filter.date.$lt = addDays(parseDay(to), 1);
  }
  if (category) filter.category = new mongoose.Types.ObjectId(category);
  if (q) filter.note = { $regex: escapeRegex(q), $options: 'i' };

  const [items, total, sums] = await Promise.all([
    Expense.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(...populateCategory)
      .lean(),
    Expense.countDocuments(filter),
    Expense.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amountMinor' } } }]),
  ]);

  res.json({
    items: items.map(serialize.expense),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    totalAmount: serialize.toMajor(sums[0] ? sums[0].total : 0),
  });
});

exports.create = asyncHandler(async (req, res) => {
  const { amount, category, date, note, paymentMethod } = req.valid.body;
  await assertOwnsCategory(req.user.id, category);

  const expense = await Expense.create({
    user: req.user.id,
    category,
    amountMinor: Math.round(amount * 100),
    date: parseDay(date),
    note: note ?? '',
    paymentMethod: paymentMethod ?? 'other',
  });
  await expense.populate(...populateCategory);
  res.status(201).json({ expense: serialize.expense(expense.toObject()) });
});

exports.update = asyncHandler(async (req, res) => {
  const { amount, category, date, note, paymentMethod } = req.valid.body;
  const set = {};
  if (amount !== undefined) set.amountMinor = Math.round(amount * 100);
  if (date !== undefined) set.date = parseDay(date);
  if (note !== undefined) set.note = note;
  if (paymentMethod !== undefined) set.paymentMethod = paymentMethod;
  if (category !== undefined) {
    await assertOwnsCategory(req.user.id, category);
    set.category = category;
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: req.valid.params.id, user: req.user.id },
    { $set: set },
    { new: true, runValidators: true }
  )
    .populate(...populateCategory)
    .lean();
  if (!expense) throw new HttpError(404, 'Expense not found');
  res.json({ expense: serialize.expense(expense) });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await Expense.findOneAndDelete({ _id: req.valid.params.id, user: req.user.id });
  if (!deleted) throw new HttpError(404, 'Expense not found');
  res.status(204).end();
});
