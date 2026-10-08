const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const schemas = require('../validators/schemas');
const authCtrl = require('../controllers/authController');
const categoryCtrl = require('../controllers/categoryController');
const expenseCtrl = require('../controllers/expenseController');
const budgetCtrl = require('../controllers/budgetController');
const analyticsCtrl = require('../controllers/analyticsController');

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));

// Slow down password guessing.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
router.post('/auth/register', authLimiter, validate(schemas.register), authCtrl.register);
router.post('/auth/login', authLimiter, validate(schemas.login), authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

// Everything below requires a valid token.
router.use(auth);

router.get('/categories', categoryCtrl.list);
router.post('/categories', validate(schemas.createCategory), categoryCtrl.create);
router.put('/categories/:id', validate(schemas.updateCategory), categoryCtrl.update);
router.delete('/categories/:id', validate(schemas.idOnly), categoryCtrl.remove);

router.get('/expenses', validate(schemas.listExpenses), expenseCtrl.list);
router.post('/expenses', validate(schemas.createExpense), expenseCtrl.create);
router.put('/expenses/:id', validate(schemas.updateExpense), expenseCtrl.update);
router.delete('/expenses/:id', validate(schemas.idOnly), expenseCtrl.remove);

router.get('/budgets', validate(schemas.listBudgets), budgetCtrl.list);
router.put('/budgets', validate(schemas.upsertBudget), budgetCtrl.upsert);
router.delete('/budgets/:id', validate(schemas.idOnly), budgetCtrl.remove);

router.get('/analytics/summary', validate(schemas.summary), analyticsCtrl.summary);
router.get('/analytics/by-category', validate(schemas.byCategory), analyticsCtrl.byCategory);
router.get('/analytics/trend', validate(schemas.trend), analyticsCtrl.trend);

module.exports = router;
