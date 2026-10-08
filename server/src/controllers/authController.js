const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const serialize = require('../utils/serialize');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { DEFAULT_CATEGORIES } = require('../constants');

const signToken = (user) => jwt.sign({ sub: String(user._id) }, jwtSecret, { expiresIn: jwtExpiresIn });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, currency } = req.valid.body;
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, ...(currency && { currency }) });
  await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));

  res.status(201).json({ token: signToken(user), user: serialize.user(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  res.json({ token: signToken(user), user: serialize.user(user) });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: serialize.user(user) });
});
