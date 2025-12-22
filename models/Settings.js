const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    pixKey: {
      type: String,
      default: '',
      trim: true,
    },
    pixTxidDefault: {
      type: String,
      default: 'ABC',
      trim: true,
    },
    whatsappNumber: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
