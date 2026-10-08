const { Schema, model } = require('mongoose');

const budgetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    limitMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'limitMinor must be an integer' },
    },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = model('Budget', budgetSchema);
