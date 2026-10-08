// Creates a demo account with ~6 months of expenses so the charts have something to show.
//   npm run seed        ->  login with demo@example.com / password123
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('../src/config/env');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Expense = require('../src/models/Expense');
const Budget = require('../src/models/Budget');
const { DEFAULT_CATEGORIES } = require('../src/constants');
const { currentMonth, shiftMonth, monthRange } = require('../src/utils/dates');

const EMAIL = 'demo@example.com';

// Small seeded PRNG so every run produces the same data.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Typical spend per category in rupees: [min, max, chance per day]
const PROFILE = {
  Food: [120, 650, 0.8],
  Transport: [40, 380, 0.55],
  Utilities: [300, 1800, 0.06],
  Entertainment: [199, 1500, 0.12],
  Shopping: [400, 4200, 0.1],
  Health: [150, 1800, 0.05],
  Other: [50, 700, 0.12],
};
const METHODS = ['upi', 'upi', 'upi', 'card', 'cash'];
const NOTES = {
  Food: ['Lunch', 'Groceries', 'Dinner out', 'Coffee', 'Snacks'],
  Transport: ['Auto', 'Metro card', 'Cab', 'Fuel'],
  Utilities: ['Electricity', 'Internet', 'Phone recharge'],
  Entertainment: ['Movie', 'Streaming', 'Concert'],
  Shopping: ['Clothes', 'Books', 'Home items'],
  Health: ['Pharmacy', 'Clinic'],
  Other: ['Misc'],
};

(async () => {
  await connectDB();

  const existing = await User.findOne({ email: EMAIL });
  if (existing) {
    await Promise.all([
      Expense.deleteMany({ user: existing._id }),
      Budget.deleteMany({ user: existing._id }),
      Category.deleteMany({ user: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
  }

  const user = await User.create({
    name: 'Demo User',
    email: EMAIL,
    passwordHash: await bcrypt.hash('password123', 12),
    currency: 'INR',
  });
  const cats = await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));
  const byName = Object.fromEntries(cats.map((c) => [c.name, c]));

  const rand = rng(42);
  const now = new Date();
  const docs = [];
  const thisMonth = currentMonth();

  for (let back = 5; back >= 0; back -= 1) {
    const month = shiftMonth(thisMonth, -back);
    const { start, end } = monthRange(month);
    const lastDay = back === 0 ? now.getUTCDate() : Math.round((end - start) / 86400000);

    docs.push({
      user: user._id,
      category: byName.Rent._id,
      amountMinor: 1800000,
      date: start,
      note: 'Monthly rent',
      paymentMethod: 'bank',
    });

    for (let d = 0; d < lastDay; d += 1) {
      const date = new Date(start.getTime() + d * 86400000);
      for (const [name, [min, max, chance]] of Object.entries(PROFILE)) {
        if (rand() > chance) continue;
        const notes = NOTES[name];
        docs.push({
          user: user._id,
          category: byName[name]._id,
          amountMinor: Math.round(min + rand() * (max - min)) * 100,
          date,
          note: notes[Math.floor(rand() * notes.length)],
          paymentMethod: METHODS[Math.floor(rand() * METHODS.length)],
        });
      }
    }
  }

  await Expense.insertMany(docs);
  await Budget.insertMany([
    { user: user._id, category: byName.Food._id, month: thisMonth, limitMinor: 800000 },
    { user: user._id, category: byName.Shopping._id, month: thisMonth, limitMinor: 500000 },
    { user: user._id, category: byName.Entertainment._id, month: thisMonth, limitMinor: 300000 },
    { user: user._id, category: byName.Transport._id, month: thisMonth, limitMinor: 450000 },
  ]);

  console.log(`Seeded ${docs.length} expenses. Log in with ${EMAIL} / password123`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
