const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    currency: { type: String, default: 'INR', uppercase: true, minlength: 3, maxlength: 3 },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
