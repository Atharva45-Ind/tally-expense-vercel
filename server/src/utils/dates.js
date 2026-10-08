// All dates are calendar dates stored at UTC midnight, so month boundaries
// are the same no matter where the server or the user is.
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
const currentMonth = () => monthKey(new Date());

const parseDay = (s) => new Date(`${s}T00:00:00.000Z`);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

function isRealDay(s) {
  const d = parseDay(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(Date.UTC(y, m - 1 + delta, 1)));
}

function daysInMonth(month) {
  const { start, end } = monthRange(month);
  return Math.round((end - start) / 86400000);
}

module.exports = {
  MONTH_RE,
  DAY_RE,
  currentMonth,
  parseDay,
  addDays,
  isRealDay,
  monthRange,
  shiftMonth,
  daysInMonth,
};
