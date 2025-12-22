const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexão com MongoDB
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI não configurado. Configure a variável no Render.');
} else {
  mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 20000,
    })
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));
}

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Se o banco estiver indisponível, evita 500 genérico nas rotas /api
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ message: 'Banco de dados indisponível. Tente novamente em instantes.' });
});

// Criar diretório de uploads se não existir
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Rotas
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth').router);

// Healthcheck (Render)
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Índice da API
app.get('/api', (req, res) => {
  res.json({
    message: 'API Mercado Livre Clone',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      admin: '/api/admin',
      settings: '/api/settings',
      orders: '/api/orders',
      auth: '/api/auth',
    },
  });
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Mercado Livre Clone',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      admin: '/api/admin',
      settings: '/api/settings',
      orders: '/api/orders'
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
});
