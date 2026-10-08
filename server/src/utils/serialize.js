// Explicit response shapes. Money is stored as integer minor units
// (paise/cents) and exposed to the client as plain decimal amounts.
const toMajor = (minor) => Math.round(minor) / 100;

const category = (c) => (c && c._id ? { id: String(c._id), name: c.name, color: c.color } : null);

exports.user = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  currency: u.currency,
  createdAt: u.createdAt,
});

exports.category = category;

exports.expense = (e) => ({
  id: String(e._id),
  amount: toMajor(e.amountMinor),
  date: e.date.toISOString().slice(0, 10),
  note: e.note || '',
  paymentMethod: e.paymentMethod,
  categoryId: String(e.category && e.category._id ? e.category._id : e.category),
  category: category(e.category),
  createdAt: e.createdAt,
});

exports.budget = (b, spentMinor = 0) => ({
  id: String(b._id),
  month: b.month,
  category: category(b.category),
  limit: toMajor(b.limitMinor),
  spent: toMajor(spentMinor),
  percentUsed: Math.round((spentMinor / b.limitMinor) * 100),
});

exports.toMajor = toMajor;
