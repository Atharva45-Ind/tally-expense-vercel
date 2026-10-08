const pad = (n) => String(n).padStart(2, '0');

export function money(amount, currency = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : undefined, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function moneyCompact(amount, currency = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : undefined, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

// Local calendar date as YYYY-MM-DD (not UTC, so "today" matches the user's clock).
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const thisMonth = () => todayStr().slice(0, 7);

export function monthLabel(month) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function shortMonth(month) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short' });
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// First and last day of a month as YYYY-MM-DD.
export function monthBounds(month) {
  const [y, m] = month.split('-').map(Number);
  return { from: `${month}-01`, to: `${month}-${pad(new Date(y, m, 0).getDate())}` };
}

export function prettyDate(day) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
];

export const paymentLabel = (value) => PAYMENT_METHODS.find((p) => p.value === value)?.label || value;
