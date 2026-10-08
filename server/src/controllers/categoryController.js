const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const serialize = require('../utils/serialize');

exports.list = asyncHandler(async (req, res) => {
  const items = await Category.find({ user: req.user.id }).collation({ locale: 'en' }).sort({ name: 1 }).lean();
  res.json({ items: items.map(serialize.category) });
});

exports.create = asyncHandler(async (req, res) => {
  const category = await Category.create({ ...req.valid.body, user: req.user.id });
  res.status(201).json({ category: serialize.category(category) });
});

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.valid.params.id, user: req.user.id },
    { $set: req.valid.body },
    { new: true, runValidators: true }
  );
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ category: serialize.category(category) });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.valid.params;
  if (await Expense.exists({ user: req.user.id, category: id })) {
    throw new HttpError(409, 'This category has expenses. Move or delete them first.');
  }
  const deleted = await Category.findOneAndDelete({ _id: id, user: req.user.id });
  if (!deleted) throw new HttpError(404, 'Category not found');
  await Budget.deleteMany({ user: req.user.id, category: id });
  res.status(204).end();
});
