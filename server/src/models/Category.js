const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    color: { type: String, default: '#6366f1', match: /^#[0-9a-fA-F]{6}$/ },
  },
  { timestamps: true }
);

// One name per user, case-insensitive ("Food" and "food" collide).
categorySchema.index({ user: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = model('Category', categorySchema);
