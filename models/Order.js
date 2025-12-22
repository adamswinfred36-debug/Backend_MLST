const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['pix', 'card'],
      default: 'pix',
    },
    card: {
      last4: { type: String, default: '' },
      brand: { type: String, default: '' },
      holderName: { type: String, default: '', trim: true },
      expMonth: { type: String, default: '', trim: true },
      expYear: { type: String, default: '', trim: true },
    },
    customer: {
      email: { type: String, required: true, trim: true, lowercase: true },
      nome: { type: String, required: true, trim: true },
      cpf: { type: String, required: true, trim: true },
      telefone: { type: String, required: true, trim: true },
      whatsapp: { type: String, default: '', trim: true },
    },
    shipping: {
      cep: { type: String, required: true, trim: true },
      endereco: { type: String, required: true, trim: true },
      numero: { type: String, required: true, trim: true },
      complemento: { type: String, default: '', trim: true },
      bairro: { type: String, required: true, trim: true },
      cidade: { type: String, required: true, trim: true },
      estado: { type: String, required: true, trim: true },
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        slug: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BRL',
    },
    pix: {
      txid: { type: String, default: 'ABC' },
      payload: { type: String, default: '' },
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
