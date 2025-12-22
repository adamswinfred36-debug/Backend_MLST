const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    original: {
      type: Number,
      required: true
    },
    current: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    }
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  specifications: {
    type: Map,
    of: String
  },
  features: [{
    type: String
  }],
  stock: {
    quantity: {
      type: Number,
      required: true,
      default: 0
    },
    available: {
      type: Boolean,
      default: true
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  seller: {
    name: {
      type: String,
      default: 'Mercado Livre'
    },
    official: {
      type: Boolean,
      default: true
    },
    sales: {
      type: Number,
      default: 0
    }
  },
  shipping: {
    free: {
      type: Boolean,
      default: false
    },
    fast: {
      type: Boolean,
      default: false
    }
  },
  slug: {
    type: String,
    unique: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Criar slug automaticamente
productSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
