const { Schema, model } = require('mongoose');
const { PAYMENT_METHODS } = require('../constants');

const expenseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    // Integer minor units (paise/cents) to avoid floating-point drift.
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'amountMinor must be an integer' },
    },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'other' },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

module.exports = model('Expense', expenseSchema);
