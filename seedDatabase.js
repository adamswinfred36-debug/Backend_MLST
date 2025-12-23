const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Product = require('./models/Product');
require('dotenv').config();

const slugify = (title) => {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const seedDatabase = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Conectado ao MongoDB');

    // Limpar dados existentes (opcional)
    // Proteção: só limpa se SEED_RESET=true (evita apagar produção por engano)
    if (String(process.env.SEED_RESET || '').toLowerCase() === 'true') {
      console.log('🗑️  Limpando dados antigos (SEED_RESET=true)...');
      await Admin.deleteMany({});
      await Product.deleteMany({});
    } else {
      console.log('ℹ️  Seed sem reset (para apagar tudo use SEED_RESET=true)');
    }

    // Criar Admin (se não existir)
    console.log('👤 Verificando administrador...');
    const existingAdmin = await Admin.findOne({ role: 'superadmin' });
    if (existingAdmin) {
      console.log('ℹ️  Já existe um superadmin no sistema.');
      console.log(`   Email: ${existingAdmin.email}`);
    } else {
      const admin = new Admin({
        username: 'admin',
        email: 'admin@mercadolivre.com',
        password: 'admin123',
        role: 'superadmin'
      });
      await admin.save();
      console.log('✅ Admin criado!');
      console.log('   Email: admin@mercadolivre.com');
      console.log('   Senha: admin123');
    }

    // Criar 10 Produtos
    console.log('\n📦 Criando 10 produtos...\n');

    const products = [
      {
        title: 'Fogão 4 Bocas Atlas Mônaco Top Glass Acendimento Automático Cor Branco',
        description: 'Fogão de piso com 4 queimadores elétricos e forno com capacidade de 50 litros. Mesa de vidro temperado - Bonita, resistente e prática de limpar. Grades chapa com 6 pontos de apoio - Mais estabilidade para as panelas. Acendimento automático - Muito prático de usar. Forno Limpa Fácil - Muito fácil limpar o forno. Puxador de aço, robusto e ergonômico.',
        price: {
          original: 1021.90,
          current: 199.90,
          discount: 80
        },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Casa, Móveis e Decoração',
        brand: 'Atlas',
        specifications: {
          'Quantidade de queimadores elétricos': '4',
          'Linha': 'Mônaco Top Glass',
          'Modelo': '4 bocas com mesa de vidro',
          'Cor': 'Branco',
          'Voltagem': '127/220V',
          'Tipo de gás': 'GLP',
          'Tipo de montagem': 'De chão'
        },
        features: [
          'Tipo de porta do forno: Com visor',
          'Com isolamento térmico (lã de basalto), que deixa o produto MUITO mais econômico',
          'Com mesa de vidro - Bonita, resistente e prática de limpar',
          'Grades chapa com 6 pontos de apoio - Mais estabilidade para as panelas',
          'Acendimento automático, "Girou, clicou, acendeu" - Muito prático de usar',
          'Forno Limpa Fácil - Muito fácil limpar o forno',
          'Puxador de aço, robusto e ergonômico',
          'Versão 4 queimadores e Forno com 50 Litros'
        ],
        stock: {
          quantity: 41,
          available: true
        },
        rating: {
          average: 4.8,
          count: 311
        },
        seller: {
          name: 'Mercado Livre',
          official: true,
          sales: 1000000
        },
        shipping: {
          free: true,
          fast: true
        },
        active: true
      },
      {
        title: 'Notebook Dell Inspiron 15 3000 Intel Core i5 8GB RAM 256GB SSD Tela 15.6" Full HD Windows 11',
        description: 'Notebook ideal para trabalho e estudos. Processador Intel Core i5 de 11ª geração garante desempenho excepcional para multitarefas. Memória RAM de 8GB permite executar vários programas simultaneamente. SSD de 256GB oferece inicialização rápida e melhor desempenho. Tela Full HD de 15.6 polegadas com cores vibrantes. Windows 11 pré-instalado.',
        price: {
          original: 3499.00,
          current: 2699.00,
          discount: 23
        },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Informática',
        brand: 'Dell',
        specifications: {
          'Modelo': 'Inspiron 15 3000',
          'Processador': 'Intel Core i5-1135G7',
          'RAM': '8GB DDR4',
          'Armazenamento': '256GB SSD',
          'Tela': '15.6" Full HD',
          'Placa de vídeo': 'Intel Iris Xe Graphics',
          'Sistema Operacional': 'Windows 11 Home',
          'Peso': '1.85kg',
          'Cor': 'Preto'
        },
        features: [
          'Processador Intel Core i5 de 11ª geração',
          '8GB de memória RAM DDR4',
          'SSD de 256GB para inicialização rápida',
          'Tela Full HD de 15.6 polegadas',
          'Webcam HD integrada',
          'Windows 11 Home original',
          'Teclado numérico integrado',
          'Bateria de longa duração',
          'Conexões: USB 3.2, HDMI, USB-C'
        ],
        stock: {
          quantity: 15,
          available: true
        },
        rating: {
          average: 4.6,
          count: 892
        },
        seller: {
          name: 'Dell Store',
          official: true,
          sales: 5000000
        },
        shipping: {
          free: true,
          fast: true
        },
        active: true
      },
      {
        title: 'Samsung Galaxy A54 5G 256GB 8GB RAM Câmera Tripla 50MP Tela 6.4" 120Hz Preto',
        description: 'O Samsung Galaxy A54 5G é o smartphone ideal para quem busca performance e qualidade fotográfica. Com câmera tripla de 50MP, capture fotos incríveis em qualquer condição de iluminação. Tela Super AMOLED de 6.4 polegadas com taxa de atualização de 120Hz proporciona fluidez e cores vibrantes. Processador Exynos 1380 oferece desempenho excepcional.',
        price: {
          original: 2499.00,
          current: 1799.00,
          discount: 28
        },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Celulares e Telefones',
        brand: 'Samsung',
        specifications: {
          'Modelo': 'Galaxy A54 5G',
          'Armazenamento': '256GB',
          'RAM': '8GB',
          'Tela': '6.4" Super AMOLED 120Hz',
          'Câmera Principal': '50MP',
          'Câmera Ultra-wide': '12MP',
          'Câmera Frontal': '32MP',
          'Bateria': '5000mAh',
          'Processador': 'Exynos 1380',
          'Sistema': 'Android 13',
          'Conectividade': '5G, Wi-Fi 6, Bluetooth 5.3'
        },
        features: [
          'Câmera tripla com sensor principal de 50MP',
          'Tela Super AMOLED 6.4" com 120Hz',
          '8GB de RAM para multitarefas',
          '256GB de armazenamento interno',
          'Bateria de 5000mAh com carregamento rápido 25W',
          'Processador Exynos 1380 octa-core',
          'Conectividade 5G para internet ultra-rápida',
          'Resistência à água e poeira IP67',
          'Android 13 com One UI 5.1',
          'Leitor de digital sob a tela'
        ],
        stock: {
          quantity: 87,
          available: true
        },
        rating: {
          average: 4.7,
          count: 1543
        },
        seller: {
          name: 'Samsung Store',
          official: true,
          sales: 10000000
        },
        shipping: {
          free: true,
          fast: true
        },
        active: true
      },
      {
        title: 'Smart TV LG 55 Polegadas 4K UHD ThinQ AI HDR Ativo Bluetooth WiFi 55UR7800PSA',
        description: 'Smart TV LG de 55 polegadas com resolução 4K Ultra HD e ThinQ AI. Processador α5 Gen6 AI oferece qualidade de imagem aprimorada. HDR10 e HLG para cores e contrastes realistas. WebOS 23 com acesso a apps de streaming. Bluetooth para conectar fones e caixas de som. WiFi integrado. Controle remoto Magic com comandos de voz.',
        price: {
          original: 3299.00,
          current: 2499.00,
          discount: 24
        },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Eletrônicos',
        brand: 'LG',
        specifications: {
          'Tamanho': '55 polegadas',
          'Resolução': '4K Ultra HD (3840x2160)',
          'Processador': 'α5 Gen6 AI Processor 4K',
          'HDR': 'HDR10, HLG',
          'Sistema': 'webOS 23',
          'Conectividade': 'WiFi, Bluetooth 5.0',
          'HDMI': '3 portas (HDMI 2.1)',
          'USB': '2 portas',
          'Áudio': '20W (2.0 canais)',
          'Dimensões': '123cm x 71cm x 8cm'
        },
        features: [
          'Resolução 4K Ultra HD para imagens nítidas',
          'Processador α5 Gen6 AI para melhor qualidade',
          'ThinQ AI com comandos de voz',
          'HDR10 e HLG para cores realistas',
          'webOS 23 com apps de streaming integrados',
          'Bluetooth para áudio sem fio',
          'WiFi integrado',
          '3 portas HDMI 2.1 com eARC',
          'Game Optimizer para melhor experiência em jogos',
          'Design ultrafino com moldura mínima'
        ],
        stock: {
          quantity: 23,
          available: true
        },
        rating: {
          average: 4.8,
          count: 2341
        },
        seller: {
          name: 'LG Store',
          official: true,
          sales: 8000000
        },
        shipping: {
          free: true,
          fast: false
        },
        active: true
      },
      {
        title: 'Cafeteira Expresso Nespresso Essenza Mini Preta 110V',
        description: 'Cafeteira expresso Nespresso Essenza Mini, compacta e moderna. Sistema de alta pressão 19 bar para extrair o melhor do café. Compatível com cápsulas Nespresso originais e compatíveis. Desligamento automático após 9 minutos. Capacidade do reservatório: 0,6L. Dois tamanhos de xícara programáveis. Aquecimento rápido em 25 segundos.',
        price: {
          original: 499.00,
          current: 349.00,
          discount: 30
        },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Casa, Móveis e Decoração',
        brand: 'Nespresso',
        specifications: {
          'Modelo': 'Essenza Mini',
          'Voltagem': '110V',
          'Potência': '1260W',
          'Pressão': '19 bar',
          'Capacidade do Reservatório': '0,6L',
          'Tipo': 'Cápsulas',
          'Cor': 'Preta',
          'Dimensões': '33cm x 12cm x 20cm',
          'Peso': '2.3kg'
        },
        features: [
          'Sistema de alta pressão 19 bar',
          'Compatível com cápsulas Nespresso',
          'Aquecimento rápido em 25 segundos',
          'Dois tamanhos de xícara programáveis',
          'Desligamento automático',
          'Reservatório removível de 0,6L',
          'Design compacto e moderno',
          'Economia de energia',
          'Fácil limpeza e manutenção'
        ],
        stock: {
          quantity: 156,
          available: true
        },
        rating: {
          average: 4.9,
          count: 4567
        },
        seller: {
          name: 'Nespresso Store',
          official: true,
          sales: 3000000
        },
        shipping: {
          free: true,
          fast: true
        },
        active: true
      }
      ,
      {
        title: 'Fone de Ouvido Bluetooth JBL Tune 510BT Preto',
        description: 'Fone Bluetooth com som JBL Pure Bass. Até 40 horas de bateria e carregamento rápido. Controles no próprio fone e conexão multipontos.',
        price: { original: 249.90, current: 179.90, discount: 28 },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Eletrônicos',
        brand: 'JBL',
        specifications: {
          'Conectividade': 'Bluetooth',
          'Bateria': 'Até 40h',
          'Carregamento rápido': 'Sim',
          'Cor': 'Preto'
        },
        features: ['Som JBL Pure Bass', 'Conexão multipontos', 'Microfone integrado', 'Dobrável e leve'],
        stock: { quantity: 120, available: true },
        rating: { average: 4.7, count: 9800 },
        seller: { name: 'JBL Store', official: true, sales: 2500000 },
        shipping: { free: true, fast: true },
        active: true
      },
      {
        title: 'Air Fryer Mondial 4L Family Inox 1500W',
        description: 'Fritadeira sem óleo com capacidade de 4 litros. Potência 1500W, controle de temperatura e timer. Ideal para refeições rápidas e saudáveis.',
        price: { original: 399.90, current: 289.90, discount: 28 },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Casa, Móveis e Decoração',
        brand: 'Mondial',
        specifications: {
          'Capacidade': '4L',
          'Potência': '1500W',
          'Voltagem': '127V/220V',
          'Cor': 'Inox'
        },
        features: ['Cesto antiaderente', 'Timer', 'Controle de temperatura', 'Fácil limpeza'],
        stock: { quantity: 65, available: true },
        rating: { average: 4.8, count: 12500 },
        seller: { name: 'Mondial Oficial', official: true, sales: 1800000 },
        shipping: { free: true, fast: true },
        active: true
      },
      {
        title: 'PlayStation 5 Slim 1TB + 1 Controle',
        description: 'Console PlayStation 5 versão Slim com 1TB de armazenamento. Desempenho de nova geração, gráficos incríveis e carregamento ultrarrápido.',
        price: { original: 4699.00, current: 3999.00, discount: 15 },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Eletrônicos',
        brand: 'Sony',
        specifications: {
          'Armazenamento': '1TB',
          'Mídia': 'Digital/Disco (varia)',
          'Cor': 'Branco',
          'Conexões': 'HDMI, USB, Wi‑Fi'
        },
        features: ['SSD ultrarrápido', 'Ray tracing', 'Controle DualSense', '4K'],
        stock: { quantity: 8, available: true },
        rating: { average: 4.9, count: 5400 },
        seller: { name: 'Sony Store', official: true, sales: 1200000 },
        shipping: { free: true, fast: true },
        active: true
      },
      {
        title: 'Kit Teclado e Mouse Sem Fio Logitech MK235',
        description: 'Kit teclado e mouse sem fio com conexão USB. Bateria de longa duração e design resistente a respingos. Ideal para home office.',
        price: { original: 189.90, current: 129.90, discount: 32 },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Informática',
        brand: 'Logitech',
        specifications: {
          'Conexão': 'Wireless 2.4GHz',
          'Layout': 'ABNT2',
          'Bateria': 'Longa duração',
          'Cor': 'Preto'
        },
        features: ['Plug and play', 'Resistente a respingos', 'Teclas confortáveis', 'Mouse compacto'],
        stock: { quantity: 200, available: true },
        rating: { average: 4.6, count: 8800 },
        seller: { name: 'Logitech Oficial', official: true, sales: 900000 },
        shipping: { free: true, fast: true },
        active: true
      },
      {
        title: 'Perfume Feminino Lancôme La Vie Est Belle 100ml',
        description: 'Fragrância feminina marcante e sofisticada. Notas florais e adocicadas com excelente fixação.',
        price: { original: 699.90, current: 549.90, discount: 21 },
        images: ['/uploads/placeholder-product.jpg'],
        category: 'Beleza e Cuidado Pessoal',
        brand: 'Lancôme',
        specifications: {
          'Volume': '100ml',
          'Tipo': 'Eau de Parfum',
          'Gênero': 'Feminino'
        },
        features: ['Alta fixação', 'Notas florais', 'Frasco premium'],
        stock: { quantity: 30, available: true },
        rating: { average: 4.9, count: 2100 },
        seller: { name: 'Beleza Store', official: false, sales: 250000 },
        shipping: { free: true, fast: false },
        active: true
      }
    ];

    let count = 0;
    for (const productData of products) {
      const slug = slugify(productData.title);
      const payload = {
        ...productData,
        slug,
        active: true,
      };

      const product = await Product.findOneAndUpdate(
        { slug },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      count++;
      console.log(`✅ ${count}. ${product.title.substring(0, 50)}...`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Preço: R$ ${product.price.current}`);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DATABASE POPULADO COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 Resumo:');
    console.log(`   ✅ 1 Admin criado`);
    console.log(`   ✅ ${count} Produtos criados`);
    console.log('');
    console.log('🌐 Acesse:');
    console.log('   Admin: http://localhost:3000/admin/login');
    console.log('   Email: admin@mercadolivre.com');
    console.log('   Senha: admin123');
    console.log('');
    console.log('   Site: http://localhost:3000');
    console.log('');
    console.log('💡 Dica: Inicie o backend e frontend para ver os produtos!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular database:', error);
    process.exit(1);
  }
};

seedDatabase();
