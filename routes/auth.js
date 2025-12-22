const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const router = express.Router();

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const authCustomer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Faça login para continuar' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, active: true });
    if (!user) return res.status(401).json({ message: 'Sessão inválida' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sessão inválida' });
  }
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, cpf, whatsapp } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });
    if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'E-mail já cadastrado' });

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      cpf: cpf ? String(cpf).trim() : '',
      whatsapp: whatsapp ? String(whatsapp).trim() : '',
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, cpf: user.cpf, whatsapp: user.whatsapp },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/register/login', async (req, res) => {
  try {
    const { email, password, name, cpf, whatsapp } = req.body;
    if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });
    if (!password) return res.status(400).json({ message: 'Senha é obrigatória' });
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'E-mail já cadastrado' });

    const derivedName = String(name || '').trim() || normalizedEmail.split('@')[0] || 'Cliente';

    const user = await User.create({
      name: derivedName,
      email: normalizedEmail,
      password: String(password),
      cpf: cpf ? String(cpf).trim() : '',
      whatsapp: whatsapp ? String(whatsapp).trim() : '',
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, cpf: user.cpf, whatsapp: user.whatsapp },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  return res.status(410).json({
    message: 'Login desativado. Use /api/auth/register/login para criar o acesso.',
  });
});

// GET /api/auth/me
router.get('/me', authCustomer, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      cpf: req.user.cpf,
      whatsapp: req.user.whatsapp,
    },
  });
});

module.exports = { router, authCustomer };
