const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Conectado ao MongoDB');

    // Verificar se já existe um admin
    const existingAdmin = await Admin.findOne({ role: 'superadmin' });
    
    if (existingAdmin) {
      console.log('⚠️  Já existe um superadmin no sistema');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Criar superadmin padrão
    const admin = new Admin({
      username: 'admin',
      email: 'admin@mercadolivre.com',
      password: 'admin123', // Será hasheado automaticamente
      role: 'superadmin'
    });

    await admin.save();

    console.log('✅ Superadmin criado com sucesso!');
    console.log('');
    console.log('📧 Email: admin@mercadolivre.com');
    console.log('🔑 Senha: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('');
    console.log('🌐 Acesse: http://localhost:3000/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  }
};

createAdmin();
