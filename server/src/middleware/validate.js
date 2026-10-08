// Validates { body, query, params } against a zod schema and exposes the
// parsed (coerced, defaulted) result as req.valid.
module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) return next(result.error);
  req.valid = result.data;
  next();
};
