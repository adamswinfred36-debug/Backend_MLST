const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const isProduction = process.env.NODE_ENV === 'production';
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configuração do multer para upload de imagens
const storage = hasCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        return {
          folder: process.env.CLOUDINARY_FOLDER || 'mercado-livre/products',
          public_id: `product-${uniqueSuffix}`,
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        };
      },
    })
  : isProduction
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
        },
      });

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas!'));
  }
});

// GET - Listar todos os produtos ativos
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = { active: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { 'price.current': 1 };
    if (sort === 'price-desc') sortOption = { 'price.current': -1 };
    if (sort === 'rating') sortOption = { 'rating.average': -1 };
    
    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Buscar produto por slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Criar novo produto
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data);

    if (isProduction && !hasCloudinary && req.files && req.files.length > 0) {
      return res.status(503).json({
        message:
          'Upload de imagens está desabilitado em produção sem Cloudinary. Configure CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.'
      });
    }
    
    // Adicionar URLs das imagens
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => (hasCloudinary ? file.path : `/uploads/${file.filename}`));
    }
    
    const product = new Product(productData);
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Atualizar produto
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data);

    if (isProduction && !hasCloudinary && req.files && req.files.length > 0) {
      return res.status(503).json({
        message:
          'Upload de imagens está desabilitado em produção sem Cloudinary. Configure CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.'
      });
    }
    
    // Adicionar novas imagens se houver
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => (hasCloudinary ? file.path : `/uploads/${file.filename}`));
      productData.images = [...(productData.images || []), ...newImages];
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Deletar produto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Categorias disponíveis
router.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { active: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
