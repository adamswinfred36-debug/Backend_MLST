const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateTempPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findOne({ _id: decoded.id, active: true });
    
    if (!admin) {
      throw new Error();
    }
    
    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Por favor, faça login para continuar' });
  }
};

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email, active: true });
    if (!admin) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Registrar novo admin (protegido)
router.post('/register', authMiddleware, async (req, res) => {
  try {
    // Apenas superadmin pode criar novos admins
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const { username, email, password, role } = req.body;
    
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin já existe' });
    }
    
    const admin = new Admin({ username, email, password, role });
    await admin.save();
    
    res.status(201).json({
      message: 'Admin criado com sucesso',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET - Verificar token
router.get('/verify', authMiddleware, async (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      role: req.admin.role
    }
  });
});

// GET - Obter configurações (protegido)
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT - Atualizar configurações (protegido)
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { pixKey, pixTxidDefault, whatsappNumber } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (typeof pixKey === 'string') settings.pixKey = pixKey;
    if (typeof pixTxidDefault === 'string') settings.pixTxidDefault = pixTxidDefault;
    if (typeof whatsappNumber === 'string') settings.whatsappNumber = whatsappNumber;

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET - Listar pedidos (protegido)
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const query = {};
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email cpf whatsapp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    res.json({ items, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT - Atualizar status do pedido (protegido)
router.put('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    order.status = status;
    order.paidAt = status === 'paid' ? new Date() : null;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Apagar pedido (protegido)
router.delete('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.json({ message: 'Pedido apagado com sucesso' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// GET - Listar clientes (protegido)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find({ active: true })
        .select('name email cpf whatsapp passwordUpdatedAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ active: true }),
    ]);

    res.json({ items, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE - Apagar login (desativar cliente) (protegido)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, active: true });
    if (!user) return res.status(404).json({ message: 'Cliente não encontrado' });

    user.active = false;
    await user.save();

    return res.json({ message: 'Login apagado com sucesso' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// PUT - Definir nova senha do cliente (protegido)
router.put('/users/:id/password', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const user = await User.findOne({ _id: id, active: true });
    if (!user) return res.status(404).json({ message: 'Cliente não encontrado' });

    user.password = String(password);
    await user.save();

    return res.json({ message: 'Senha do cliente atualizada com sucesso' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// POST - Gerar senha temporária do cliente (protegido)
// Retorna a senha gerada apenas nesta resposta.
router.post('/users/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, active: true });
    if (!user) return res.status(404).json({ message: 'Cliente não encontrado' });

    const tempPassword = generateTempPassword(10);
    user.password = tempPassword;
    await user.save();

    return res.json({ message: 'Senha temporária gerada', tempPassword });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// POST - Verificar senha do cliente (protegido)
// Útil para debug em ambiente local: confirma se a senha informada bate com o hash.
router.post('/users/:id/verify-password', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ message: 'Informe a senha para verificação' });
    }

    const user = await User.findOne({ _id: id, active: true });
    if (!user) return res.status(404).json({ message: 'Cliente não encontrado' });

    const match = await user.comparePassword(String(password));
    return res.json({ match });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
