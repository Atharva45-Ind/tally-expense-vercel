const { z } = require('zod');
const { MONTH_RE, DAY_RE, isRealDay } = require('../utils/dates');
const { PAYMENT_METHODS } = require('../constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const month = z.string().regex(MONTH_RE, 'Use YYYY-MM');
const day = z.string().regex(DAY_RE, 'Use YYYY-MM-DD').refine(isRealDay, 'Not a real date');
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #1d6b4f');
const money = z
  .number({ invalid_type_error: 'Must be a number', required_error: 'Required' })
  .positive('Must be greater than 0')
  .max(1e9, 'Too large')
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Use at most 2 decimals');

// Every request schema has the same envelope so the validate middleware stays generic.
const shape = ({ body, query, params } = {}) =>
  z.object({ body: body ?? z.any(), query: query ?? z.any(), params: params ?? z.any() });

const idParams = z.object({ id: objectId });

// ---- auth
exports.register = shape({
  body: z.object({
    name: z.string().trim().min(1, 'Required').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters').max(72, 'At most 72 characters'),
    currency: z.string().trim().length(3, 'Use a 3-letter code').toUpperCase().optional(),
  }),
});

exports.login = shape({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Required'),
  }),
});

// ---- categories
const categoryBody = z.object({
  name: z.string().trim().min(1, 'Required').max(40),
  color: hexColor.optional(),
});
exports.createCategory = shape({ body: categoryBody });
exports.updateCategory = shape({ params: idParams, body: categoryBody.partial() });
exports.idOnly = shape({ params: idParams });

// ---- expenses
const expenseBody = z.object({
  amount: money,
  category: objectId,
  date: day,
  note: z.string().trim().max(200).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
});
exports.createExpense = shape({ body: expenseBody });
exports.updateExpense = shape({ params: idParams, body: expenseBody.partial() });
exports.listExpenses = shape({
  query: z.object({
    from: day.optional(),
    to: day.optional(),
    category: objectId.optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// ---- budgets
exports.listBudgets = shape({ query: z.object({ month: month.optional() }) });
exports.upsertBudget = shape({ body: z.object({ category: objectId, month, limit: money }) });

// ---- analytics
exports.summary = shape({ query: z.object({ month: month.optional() }) });
exports.byCategory = shape({ query: z.object({ from: day, to: day }) });
exports.trend = shape({
  query: z.object({
    months: z.coerce.number().int().min(1).max(24).default(6),
    to: month.optional(),
  }),
});
