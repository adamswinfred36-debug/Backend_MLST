const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    cpf: { type: String, default: '', trim: true, index: true },
    whatsapp: { type: String, default: '', trim: true },
    password: { type: String, required: true, minlength: 6 },
    passwordUpdatedAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordUpdatedAt = new Date();
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(String(candidatePassword), this.password);
};

module.exports = mongoose.model('User', userSchema);
