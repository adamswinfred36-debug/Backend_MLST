const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/Product');
const { authCustomer } = require('./auth');

// POST /api/orders - cria um pedido (PIX manual -> status pending)
router.post('/', authCustomer, async (req, res) => {
  try {
    const { slug, quantity, customer, shipping, paymentMethod, card } = req.body;

    if (!slug) return res.status(400).json({ message: 'Slug do produto é obrigatório' });

    const q = Number(quantity || 1);
    const qty = Number.isFinite(q) && q > 0 ? q : 1;

    // Cliente é autenticado. Se CPF/WhatsApp ainda não estiverem no perfil,
    // tenta preencher a partir do payload do checkout (mantém compatibilidade).
    const cpfFromBody = typeof customer?.cpf === 'string' ? String(customer.cpf).trim() : '';
    const whatsappFromBody =
      typeof customer?.whatsapp === 'string'
        ? String(customer.whatsapp).trim()
        : typeof customer?.telefone === 'string'
          ? String(customer.telefone).trim()
          : '';

    let shouldSaveUser = false;
    if (!req.user.cpf && cpfFromBody) {
      req.user.cpf = cpfFromBody;
      shouldSaveUser = true;
    }
    if (!req.user.whatsapp && whatsappFromBody) {
      req.user.whatsapp = whatsappFromBody;
      shouldSaveUser = true;
    }
    if (shouldSaveUser) {
      await req.user.save();
    }

    const requiredShipping = ['cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado'];
    for (const field of requiredShipping) {
      if (!shipping?.[field]) return res.status(400).json({ message: `Campo obrigatório: shipping.${field}` });
    }

    const method = paymentMethod === 'card' ? 'card' : 'pix';

    const cardPayload = card && typeof card === 'object' ? card : {};
    const safeCard = {
      last4: String(cardPayload.last4 || '').trim(),
      brand: String(cardPayload.brand || '').trim(),
      holderName: String(cardPayload.holderName || '').trim(),
      expMonth: String(cardPayload.expMonth || '').trim(),
      expYear: String(cardPayload.expYear || '').trim(),
    };

    const product = await Product.findOne({ slug, active: true });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    const unitPrice = product.price?.current || 0;
    const total = unitPrice * qty;

    const customerEmail = String(req.user.email || '').trim().toLowerCase();
    const customerName = String(req.user.name || '').trim();
    const customerCpf = String(req.user.cpf || cpfFromBody || '').trim();
    const customerWhatsapp = String(req.user.whatsapp || whatsappFromBody || '').trim();

    if (!customerEmail) return res.status(400).json({ message: 'E-mail do cliente não encontrado' });
    if (!customerName) return res.status(400).json({ message: 'Nome do cliente não encontrado' });
    if (!customerCpf) return res.status(400).json({ message: 'CPF do cliente é obrigatório' });
    if (!customerWhatsapp) return res.status(400).json({ message: 'WhatsApp do cliente é obrigatório' });

    const order = await Order.create({
      userId: req.user._id,
      status: method === 'card' ? 'paid' : 'pending',
      paymentMethod: method,
      customer: {
        email: customerEmail,
        nome: customerName,
        cpf: customerCpf,
        telefone: customerWhatsapp,
        whatsapp: customerWhatsapp,
      },
      shipping: {
        cep: shipping.cep,
        endereco: shipping.endereco,
        numero: shipping.numero,
        complemento: shipping.complemento || '',
        bairro: shipping.bairro,
        cidade: shipping.cidade,
        estado: shipping.estado,
      },
      items: [
        {
          product: product._id,
          slug: product.slug,
          title: product.title,
          unitPrice,
          quantity: qty,
        },
      ],
      total,
      currency: 'BRL',
      card: {
        last4: method === 'card' ? safeCard.last4 : '',
        brand: method === 'card' ? safeCard.brand : '',
        holderName: method === 'card' ? safeCard.holderName : '',
        expMonth: method === 'card' ? safeCard.expMonth : '',
        expYear: method === 'card' ? safeCard.expYear : '',
      },
      pix: method === 'pix' ? { txid: 'ABC', payload: '' } : { txid: 'ABC', payload: '' },
      paidAt: method === 'card' ? new Date() : null,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
