import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestoreDb, 
  isFirebaseConfigured, 
  saveFirebaseConfig,
  cleanFirestoreData,
  FIRESTORE_RULES_GUIDE 
} from '../services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  getDoc 
} from 'firebase/firestore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { 
  REAL_SALES_ORDERS, 
  REAL_CUSTOMERS, 
  REAL_TRANSACTIONS 
} from '../data/realSalesData';

// Campainha sonora para novos pedidos na cozinha
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {}
};

const SystemContext = createContext(null);

// 1. PRODUTOS INICIAIS (Lanches, Bebidas e Acompanhamentos)
const INITIAL_PRODUCTS = [
  // --- Prensados Oficiais ---
  { 
    id: 1, 
    name: 'Prensadinho', 
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Cheddar Cremoso / Cream Cheese, mussarela, bacon, milho, batata e molhos da casa.', 
    price: 17.50, 
    image: '/images/lanches/Prensadinho.jpg',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 11, quantity: 1 }, // Catupiry / Cheddar Cremoso / Cream Cheese
      { ingredientId: 10, quantity: 1 }, // Mussarela
      { ingredientId: 3, quantity: 1 },  // Bacon
      { ingredientId: 13, quantity: 1 }, // Milho
      { ingredientId: 14, quantity: 1 }, // Batata
      { ingredientId: 16, quantity: 1 }, // Molhos da casa
      { ingredientId: 101, quantity: 1 }, // Embalagem Térmica
      { ingredientId: 102, quantity: 2 }  // Guardanapos
    ]
  },
  { 
    id: 2, 
    name: 'Prensado de Frango', 
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Cheddar Cremoso / Cream Cheese, 150g de frango desfiado, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 23.00, 
    image: '/images/lanches/prensado de frango.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 7, quantity: 1 },  // 150g Frango desfiado
      { ingredientId: 11, quantity: 1 }, // Catupiry / Cheddar Cremoso / Cream Cheese
      { ingredientId: 10, quantity: 1 }, // Queijo / cheddar
      { ingredientId: 3, quantity: 1 },  // Bacon
      { ingredientId: 14, quantity: 1 }, // Batata
      { ingredientId: 13, quantity: 1 }, // Milho
      { ingredientId: 16, quantity: 1 }, // Molhos da casa
      { ingredientId: 101, quantity: 1 }, // Embalagem Térmica
      { ingredientId: 102, quantity: 2 }  // Guardanapos
    ]
  },
  { 
    id: 4, 
    name: 'Prensado Pernil', 
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Cheddar Cremoso / Cream Cheese, 150g de pernil desfiado, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 23.00, 
    image: '/images/lanches/prensado de pernil.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 8, quantity: 1 },  // 150g Pernil desfiado
      { ingredientId: 11, quantity: 1 }, // Catupiry / Cheddar Cremoso / Cream Cheese
      { ingredientId: 10, quantity: 1 }, // Queijo / cheddar
      { ingredientId: 3, quantity: 1 },  // Bacon
      { ingredientId: 14, quantity: 1 }, // Batata
      { ingredientId: 13, quantity: 1 }, // Milho
      { ingredientId: 16, quantity: 1 }, // Molhos da casa
      { ingredientId: 101, quantity: 1 }, // Embalagem Térmica
      { ingredientId: 102, quantity: 2 }  // Guardanapos
    ]
  },
  { 
    id: 3, 
    name: 'Prensado de Costela', 
    description: 'Pão, 2 salsichas, molho de tomate artesanal, Catupiry / Cheddar Cremoso / Cream Cheese, 150g de costela desfiada, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 28.00, 
    image: '/images/lanches/prensado de costela.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 9, quantity: 1 },  // 150g Costela desfiada
      { ingredientId: 11, quantity: 1 }, // Catupiry / Cheddar Cremoso / Cream Cheese
      { ingredientId: 10, quantity: 1 }, // Queijo / cheddar
      { ingredientId: 3, quantity: 1 },  // Bacon
      { ingredientId: 14, quantity: 1 }, // Batata
      { ingredientId: 13, quantity: 1 }, // Milho
      { ingredientId: 16, quantity: 1 }, // Molhos da casa
      { ingredientId: 101, quantity: 1 }, // Embalagem Térmica
      { ingredientId: 102, quantity: 2 }  // Guardanapos
    ]
  },
  { 
    id: 15, 
    name: 'Prensado de Fraldinha', 
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Cheddar Cremoso / Cream Cheese, 150g de fraldinha desfiada, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 25.00, 
    image: '/images/lanches/prensado de fraldinha.jfif',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 22, quantity: 1 }, // 150g Fraldinha desfiada
      { ingredientId: 11, quantity: 1 }, // Catupiry / Cheddar Cremoso / Cream Cheese
      { ingredientId: 10, quantity: 1 }, // Queijo / cheddar
      { ingredientId: 3, quantity: 1 },  // Bacon
      { ingredientId: 14, quantity: 1 }, // Batata
      { ingredientId: 13, quantity: 1 }, // Milho
      { ingredientId: 16, quantity: 1 }, // Molhos da casa
      { ingredientId: 101, quantity: 1 }, // Embalagem Térmica
      { ingredientId: 102, quantity: 2 }  // Guardanapos
    ]
  },
  // --- Bebidas Geladas Oficiais ---
  {
    id: 5,
    name: 'Coca-Cola 1 Litro',
    description: 'Refrigerante Coca-Cola garrafa 1 litro estupidamente gelada.',
    price: 10.00,
    image: '/images/bebidas/coca 1l.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 109, quantity: 1 }]
  },
  {
    id: 6,
    name: 'Coca-Cola 1 Litro Zero',
    description: 'Refrigerante Coca-Cola Zero açúcar garrafa 1 litro gelada.',
    price: 10.00,
    image: '/images/bebidas/coca zero 1l.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 110, quantity: 1 }]
  },
  {
    id: 7,
    name: 'Mate Couro 1 Litro',
    description: 'O autêntico refrigerante mineiro Mate Couro garrafa 1 litro bem gelado.',
    price: 8.50,
    image: '/images/bebidas/mate couro 1l.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 111, quantity: 1 }]
  },
  {
    id: 8,
    name: 'Guaraná 1 Litro',
    description: 'Refrigerante Guaraná garrafa 1 litro geladinho.',
    price: 8.50,
    image: '/images/bebidas/guarana 1l.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 112, quantity: 1 }]
  },
  {
    id: 9,
    name: 'Coca-Cola Lata 350ml',
    description: 'Refrigerante Coca-Cola em lata 350ml bem gelada.',
    price: 6.50,
    image: '/images/bebidas/coca 350ml.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 104, quantity: 1 }]
  },
  {
    id: 10,
    name: 'Coca-Cola Zero Lata 350ml',
    description: 'Refrigerante Coca-Cola Zero açúcar em lata 350ml gelada.',
    price: 6.50,
    image: '/images/bebidas/coca zero 350ml.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 108, quantity: 1 }]
  },
  {
    id: 11,
    name: 'Guaraná Antarctica Lata 350ml',
    description: 'Refrigerante Guaraná Antarctica em lata 350ml bem gelado.',
    price: 6.50,
    image: '/images/bebidas/guarana 350ml.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 105, quantity: 1 }]
  },
  {
    id: 14,
    name: 'Guaraná Antarctica Zero Lata 350ml',
    description: 'Refrigerante Guaraná Antarctica Zero açúcar em lata 350ml estupidamente gelado.',
    price: 6.50,
    image: '/images/bebidas/guarana zero 350ml.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 105, quantity: 1 }]
  },
  {
    id: 12,
    name: 'Fanta Laranja Lata 350ml',
    description: 'Refrigerante Fanta Laranja em lata 350ml bem gelada.',
    price: 6.50,
    image: '/images/bebidas/fanta 350ml.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 106, quantity: 1 }]
  },
  {
    id: 13,
    name: 'Sprite Lata 350ml',
    description: 'Refrigerante Sprite em lata 350ml bem gelado.',
    price: 6.50,
    image: '/images/bebidas/sprite 350ml.jpg',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 107, quantity: 1 }]
  }
];

// 2. COMPLEMENTOS E ADICIONAIS
const INITIAL_COMPLEMENTS = [
  // --- Opções Inclusas de Tipo de Pão (Escolha 1) ---
  { id: 'bread-tradicional', name: 'Pão tradicional', category: 'complement', group: 'bread', groupName: 'Tipo de Pão', price: 0, active: true },
  { id: 'bread-3-queijos', name: 'Pão 3 queijos', category: 'complement', group: 'bread', groupName: 'Tipo de Pão', price: 0, active: true },

  // --- Opções Inclusas de Queijo Cremoso (Escolha 1) ---
  { id: 'creamy-catupiry', name: 'Catupiry Original', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },
  { id: 'creamy-cheddar', name: 'Cheddar Cremoso', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },
  { id: 'creamy-creamcheese', name: 'Cream Cheese', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },

  // --- Opções Inclusas de Queijo Fatiado (Escolha 1) ---
  { id: 'melted-mussarela', name: 'Queijo Mussarela', category: 'complement', group: 'melted', groupName: 'Queijo Fatiado', price: 0, active: true },
  { id: 'melted-cheddar', name: 'Queijo Cheddar', category: 'complement', group: 'melted', groupName: 'Queijo Fatiado', price: 0, active: true },

  // --- Acompanhamento Opcional ---
  { id: 'side-vinagrete', name: 'Vinagrete', category: 'complement', group: 'side', groupName: 'Acompanhamento', price: 0, active: true },

  // --- Acréscimos / Adicionais Pagos ---
  { id: 'extra-bacon', name: 'Bacon', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 4.00, active: true },
  { id: 'extra-frango', name: 'Frango', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 4.00, active: true },
  { id: 'extra-costela', name: 'Costela', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 6.00, active: true },
  { id: 'extra-fraldinha', name: 'Fraldinha', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 6.00, active: true },
  { id: 'extra-pernil', name: 'Pernil', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 4.00, active: true },
  { id: 'extra-maionese-bacon', name: 'Maionese Bacon', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 2.50, active: true },
  { id: 'extra-maionese-temperada', name: 'Maionese Temperada', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 1.50, active: true },
  { id: 'extra-molho-rose', name: 'Molho Rosé', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 1.50, active: true },
  { id: 'extra-catupiry', name: 'Catupiry', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 3.50, active: true },
  { id: 'extra-cheddar', name: 'Cheddar', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 3.50, active: true },
  { id: 'extra-cream-cheese', name: 'Cream Cheese', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 3.50, active: true }
];

// 3. ESTOQUE & EMBALAGENS (Ficha Técnica e Insumos)
const INITIAL_INVENTORY = [
  // --- Insumos Base de Lanches ---
  { id: 1, name: 'Pão Tradicional', quantity: 60, minQuantity: 20, unit: 'un', unitCost: 1.00 },
  { id: 21, name: 'Pão 3 Queijos', quantity: 60, minQuantity: 20, unit: 'un', unitCost: 1.00 },
  { id: 2, name: 'Salsicha Premium', quantity: 150, minQuantity: 30, unit: 'un', unitCost: 0.60 },
  { id: 3, name: 'Bacon Fatiado / Crocante', quantity: 50, minQuantity: 15, unit: 'porção', unitCost: 1.50 },
  { id: 7, name: 'Frango Desfiado Temperado (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 3.50 },
  { id: 8, name: 'Pernil Desfiado Especial (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 4.50 },
  { id: 9, name: 'Costela Desfiada Suculenta (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 6.00 },
  { id: 22, name: 'Fraldinha Desfiada Suculenta (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 6.00 },
  { id: 10, name: 'Queijo Mussarela Fatiado', quantity: 80, minQuantity: 20, unit: 'porção', unitCost: 1.20 },
  { id: 11, name: 'Catupiry / Requeijão Cremoso', quantity: 60, minQuantity: 15, unit: 'porção', unitCost: 1.00 },
  { id: 12, name: 'Queijo Cheddar Cremoso/Fatiado', quantity: 60, minQuantity: 15, unit: 'porção', unitCost: 1.00 },
  { id: 17, name: 'Cream Cheese Cremoso', quantity: 50, minQuantity: 15, unit: 'porção', unitCost: 1.20 },
  { id: 13, name: 'Milho Verde em Conserva', quantity: 60, minQuantity: 15, unit: 'porção', unitCost: 0.40 },
  { id: 14, name: 'Batata Palha Crocante', quantity: 60, minQuantity: 15, unit: 'porção', unitCost: 0.50 },
  { id: 15, name: 'Molho de Tomate Artesanal', quantity: 60, minQuantity: 15, unit: 'porção', unitCost: 0.60 },
  { id: 16, name: 'Molhos Especiais da Casa', quantity: 80, minQuantity: 20, unit: 'porção', unitCost: 0.50 },
  { id: 18, name: 'Maionese de Bacon', quantity: 40, minQuantity: 10, unit: 'porção', unitCost: 0.80 },
  { id: 19, name: 'Maionese Temperada', quantity: 40, minQuantity: 10, unit: 'porção', unitCost: 0.50 },
  { id: 20, name: 'Molho Rosé Especial', quantity: 40, minQuantity: 10, unit: 'porção', unitCost: 0.50 },
  
  // --- Embalagens Automáticas e Bebidas Prontas ---
  { id: 101, name: 'Embalagem Térmica Prensado', quantity: 150, minQuantity: 40, unit: 'un', unitCost: 0.45 },
  { id: 102, name: 'Guardanapo Sachê', quantity: 300, minQuantity: 100, unit: 'un', unitCost: 0.05 },
  { id: 103, name: 'Sacola Delivery Kraft', quantity: 80, minQuantity: 25, unit: 'un', unitCost: 0.80 },
  { id: 104, name: 'Lata Coca-Cola 350ml', quantity: 48, minQuantity: 12, unit: 'un', unitCost: 3.20 },
  { id: 105, name: 'Lata Guaraná 350ml', quantity: 36, minQuantity: 12, unit: 'un', unitCost: 3.00 },
  { id: 106, name: 'Lata Fanta Laranja 350ml', quantity: 24, minQuantity: 10, unit: 'un', unitCost: 3.00 },
  { id: 107, name: 'Lata Sprite 350ml', quantity: 24, minQuantity: 10, unit: 'un', unitCost: 3.00 },
  { id: 108, name: 'Lata Coca-Cola Zero 350ml', quantity: 24, minQuantity: 10, unit: 'un', unitCost: 3.20 },
  { id: 109, name: 'Garrafa Coca-Cola 1 Litro', quantity: 20, minQuantity: 6, unit: 'un', unitCost: 5.50 },
  { id: 110, name: 'Garrafa Coca-Cola 1 Litro Zero', quantity: 15, minQuantity: 5, unit: 'un', unitCost: 5.50 },
  { id: 111, name: 'Garrafa Mate Couro 1 Litro', quantity: 20, minQuantity: 6, unit: 'un', unitCost: 4.50 },
  { id: 112, name: 'Garrafa Guaraná 1 Litro', quantity: 20, minQuantity: 6, unit: 'un', unitCost: 4.50 }
];

// 4. CONFIGURAÇÕES DA LOJA, HORÁRIOS, TAXAS E FIDELIDADE
const INITIAL_STORE_SETTINGS = {
  isOpen: true,
  autoSchedule: false,
  pausedUntil: null,
  pauseReason: null,
  openTime: '19:00',
  closeTime: '23:30',
  openDays: ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
  estimatedTime: '35 a 50 min',
  storeAddress: 'Rua Agapanto, 264 - Sagrada Família, Montes Claros - MG, CEP 39401-022',
  whatsapp: '38991611378',
  pixKey: '3899161-1378',
  storeLat: -16.7401,
  storeLng: -43.8746,
  deliveryMode: 'radius', // 'neighborhood' | 'radius' | 'hybrid'
  freeDeliveryThreshold: 70.00,
  cardDebitFee: 1.99,
  cardCreditFee: 3.49,
  pixFee: 0.00,
  loyaltyTargetStamps: 10,
  loyaltyMinOrder: 20.00,
  loyaltyRewardText: '1 Prensadinho Grátis ou R$ 20 OFF',
  autoPackagingDeduction: true,
  deliveryFeesByNeighborhood: {
    'Sagrada Família': 0.00,
    'Centro': 5.00,
    'Cândida Câmara': 5.00,
    'Todos os Santos': 5.00,
    'Santa Rita': 5.00,
    'Alice Maia': 7.50,
    'Morada do Sol': 7.50,
    'Major Prates': 7.50,
    'Ibituruna': 8.00,
    'São Luiz': 7.50,
    'Maracanã': 10.00,
    'Independência': 10.00,
    'Renascença': 10.00,
    'Delfino Magalhães': 12.00,
    'Village do Lago': 12.00
  },
  deliveryRadius: [
    { id: 'rad-1', maxKm: 3, fee: 5.00, description: 'Até 3 km (Sagrada Família, Centro, Cândida Câmara...)', active: true },
    { id: 'rad-2', maxKm: 5, fee: 7.50, description: '3 km a 5 km (Major Prates, Morada do Sol, Ibituruna, Alice Maia...)', active: true },
    { id: 'rad-3', maxKm: 8, fee: 10.00, description: '5 km a 8 km (Renascença, Maracanã, Independência, Delfino...)', active: true },
    { id: 'rad-4', maxKm: 12, fee: 14.00, description: '8 km a 12 km (Outras regiões de Montes Claros)', active: true }
  ],
  paymentFeeRates: {
    credit: 3.5,
    debit: 1.5,
    pix: 0,
    cash: 0
  },
    loyalty: {
    requiredOrders: 10,
    rewardValue: 20
  },
  mercadoPago: {
    enabled: true,
    sandbox: false,
    accessToken: 'APP_USR-5871168214552840-101316-1948f98e71fbd6fa559b3aa99105d959-611629089',
    publicKey: 'APP_USR-e5cc3365-f723-40e8-a6fa-358d62d442fa'
  },
  // Experiência do Cardápio (Delivery)
  enableImmersiveView: false,
  defaultViewMode: 'grid'
};

// 5. BAIRROS DE ENTREGA CONSOLIDADOS (Montes Claros - Distâncias da Rua Agapanto, 264)
export const MONTES_CLAROS_NEIGHBORHOODS = [
  // Raio 1: até 3 km (Zona da Loja / Centro / Imediações)
  { id: 'nb-1', name: 'Sagrada Família', distanceKm: 0.5, fee: 0.00, active: true },
  { id: 'nb-2', name: 'Cândida Câmara', distanceKm: 1.8, active: true },
  { id: 'nb-3', name: 'Jardim Panorama', distanceKm: 2.0, active: true },
  { id: 'nb-4', name: 'Todos os Santos', distanceKm: 2.2, active: true },
  { id: 'nb-5', name: 'Funcionários', distanceKm: 2.3, active: true },
  { id: 'nb-6', name: 'Vila Brasília', distanceKm: 2.4, active: true },
  { id: 'nb-7', name: 'Santa Rita', distanceKm: 2.5, active: true },
  { id: 'nb-8', name: 'Centro', distanceKm: 2.6, active: true },
  { id: 'nb-9', name: 'Vila Regina', distanceKm: 2.7, active: true },
  { id: 'nb-10', name: 'São José', distanceKm: 2.8, active: true },
  { id: 'nb-11', name: 'Melo', distanceKm: 2.8, active: true },
  { id: 'nb-12', name: 'Edgar Pereira', distanceKm: 2.9, active: true },
  { id: 'nb-13', name: 'Sumaré', distanceKm: 3.0, active: true },
  { id: 'nb-14', name: 'Cidade Santa Maria', distanceKm: 3.0, active: true },

  // Raio 2: 3 km a 5 km
  { id: 'nb-15', name: 'Jardim São Luiz', distanceKm: 3.2, active: true },
  { id: 'nb-16', name: 'São Luiz', distanceKm: 3.2, active: true },
  { id: 'nb-17', name: 'Alice Maia', distanceKm: 3.4, active: true },
  { id: 'nb-18', name: 'Roxo Verde', distanceKm: 3.5, active: true },
  { id: 'nb-19', name: 'Vera Cruz', distanceKm: 3.5, active: true },
  { id: 'nb-20', name: 'Morrinhos', distanceKm: 3.6, active: true },
  { id: 'nb-21', name: 'Morada do Sol', distanceKm: 3.8, active: true },
  { id: 'nb-22', name: 'Vila Oliveira', distanceKm: 3.8, active: true },
  { id: 'nb-23', name: 'Santo Expedito', distanceKm: 4.0, active: true },
  { id: 'nb-24', name: 'Santos Reis', distanceKm: 4.1, active: true },
  { id: 'nb-25', name: 'Canelas', distanceKm: 4.2, active: true },
  { id: 'nb-26', name: 'Alto São João', distanceKm: 4.3, active: true },
  { id: 'nb-27', name: 'Ibituruna', distanceKm: 4.5, active: true },
  { id: 'nb-28', name: 'Major Prates', distanceKm: 4.5, active: true },
  { id: 'nb-29', name: 'Morada do Parque', distanceKm: 4.7, active: true },
  { id: 'nb-30', name: 'Vila Guilhermina', distanceKm: 4.8, active: true },
  { id: 'nb-31', name: 'Vila Áurea', distanceKm: 4.8, active: true },
  { id: 'nb-32', name: 'Vargem Grande', distanceKm: 4.9, active: true },
  { id: 'nb-33', name: 'Barcelona', distanceKm: 5.0, active: true },

  // Raio 3: 5 km a 8 km
  { id: 'nb-34', name: 'Clarindo Lopes', distanceKm: 5.2, active: true },
  { id: 'nb-35', name: 'Maracanã', distanceKm: 5.3, active: true },
  { id: 'nb-36', name: 'Augusta Mota', distanceKm: 5.4, active: true },
  { id: 'nb-37', name: 'Alto da Boa Vista', distanceKm: 5.5, active: true },
  { id: 'nb-38', name: 'Esplanada', distanceKm: 5.6, active: true },
  { id: 'nb-39', name: 'Interlagos', distanceKm: 5.8, active: true },
  { id: 'nb-40', name: 'Planalto', distanceKm: 6.0, active: true },
  { id: 'nb-41', name: 'Independência', distanceKm: 6.2, active: true },
  { id: 'nb-42', name: 'Alcides Rabelo', distanceKm: 6.3, active: true },
  { id: 'nb-43', name: 'Santa Lúcia', distanceKm: 6.5, active: true },
  { id: 'nb-44', name: 'Renascença', distanceKm: 6.7, active: true },
  { id: 'nb-45', name: 'Cristo Rei', distanceKm: 6.8, active: true },
  { id: 'nb-46', name: 'Monte Alegre', distanceKm: 7.0, active: true },
  { id: 'nb-47', name: 'Santo Inácio', distanceKm: 7.0, active: true },
  { id: 'nb-48', name: 'Chiquinho Guimarães', distanceKm: 7.2, active: true },
  { id: 'nb-49', name: 'São Geraldo', distanceKm: 7.4, active: true },
  { id: 'nb-50', name: 'Bela Vista', distanceKm: 7.5, active: true },
  { id: 'nb-51', name: 'Delfino Magalhães', distanceKm: 7.6, active: true },
  { id: 'nb-52', name: 'Eldorado', distanceKm: 7.8, active: true },
  { id: 'nb-53', name: 'Vila Telma', distanceKm: 7.9, active: true },
  { id: 'nb-54', name: 'Conjunto Habitacional JK', distanceKm: 8.0, active: true },

  // Raio 4: 8 km a 12 km
  { id: 'nb-55', name: 'Village do Lago', distanceKm: 8.3, active: true },
  { id: 'nb-56', name: 'Vila Luiza', distanceKm: 8.5, active: true },
  { id: 'nb-57', name: 'Conjunto Cidade Industrial', distanceKm: 8.8, active: true },
  { id: 'nb-58', name: 'Novo Delfino', distanceKm: 9.0, active: true },
  { id: 'nb-59', name: 'Monte Carmelo', distanceKm: 9.2, active: true },
  { id: 'nb-60', name: 'Santa Rafaela', distanceKm: 9.4, active: true },
  { id: 'nb-61', name: 'Carmelo', distanceKm: 9.5, active: true },
  { id: 'nb-62', name: 'Residencial Minas Gerais', distanceKm: 9.8, active: true },
  { id: 'nb-63', name: 'Santa Laura', distanceKm: 10.0, active: true },
  { id: 'nb-64', name: 'Recanto das Águas', distanceKm: 10.2, active: true },
  { id: 'nb-65', name: 'Distrito Industrial', distanceKm: 10.5, active: true },
  { id: 'nb-66', name: 'Nova Suíça', distanceKm: 11.0, active: true },
  { id: 'nb-67', name: 'Vila Anália', distanceKm: 11.2, active: true },
  { id: 'nb-68', name: 'Sapucaia', distanceKm: 11.5, active: true },
  { id: 'nb-69', name: 'Jardim Liberdade', distanceKm: 11.8, active: true },
  { id: 'nb-70', name: 'Universitário', distanceKm: 12.0, active: true }
];

const INITIAL_NEIGHBORHOODS = MONTES_CLAROS_NEIGHBORHOODS;

// 6. ZONAS DE RAIO POR QUILOMETRAGEM (KM)
export const INITIAL_RADIUSES = [
  { id: 'rad-1', maxKm: 3, fee: 5.00, description: 'Até 3 km (Sagrada Família, Centro, Cândida Câmara, Todos os Santos...)', active: true },
  { id: 'rad-2', maxKm: 5, fee: 7.50, description: '3 km a 5 km (Major Prates, Morada do Sol, Ibituruna, Alice Maia, São Luiz...)', active: true },
  { id: 'rad-3', maxKm: 8, fee: 10.00, description: '5 km a 8 km (Maracanã, Independência, Renascença, Clarindo Lopes, Augusta Mota...)', active: true },
  { id: 'rad-4', maxKm: 12, fee: 14.00, description: '8 km a 12 km (Village do Lago, Delfino Magalhães, Monte Carmelo, regiões distantes...)', active: true }
];

// 7. CUPONS DE DESCONTO
const INITIAL_COUPONS = [
  { id: 'cp-1', code: 'BEMVINDO10', type: 'percent', value: 10, discount: 10, minOrder: 20.00, usesCount: 0, active: true },
  { id: 'cp-2', code: 'NUU5', type: 'fixed', value: 5.00, discount: 5.00, minOrder: 25.00, usesCount: 0, active: true },
  { id: 'cp-3', code: 'FRETENUU', type: 'free_delivery', value: 0, discount: 0, minOrder: 45.00, usesCount: 0, active: true }
];

// 8. MOTOBOYS CADASTRADOS
const INITIAL_MOTOBOYS = [
  { id: 'mb-1', name: 'Carlos Santos (Motoboy 1)', phone: '(31) 99881-1122', vehicle: 'Honda CG 160 (ABC-1234)', pixKey: 'carlos@pix.com', feePerDelivery: 6.00, dailyFee: 40.00, active: true },
  { id: 'mb-2', name: 'Lucas Silva (Motoboy 2)', phone: '(31) 99772-3344', vehicle: 'Yamaha Fazer (XYZ-9876)', pixKey: 'lucas@pix.com', feePerDelivery: 6.00, dailyFee: 40.00, active: true }
];

// 9. CLIENTES E MEMÓRIA DE FIDELIDADE
const INITIAL_CUSTOMERS = [
  { phone: '31999998888', name: 'Cliente Demonstração', address: 'Rua das Flores, 123 - Centro', neighborhood: 'Centro', stampsCount: 4, totalOrders: 4, lastOrderAt: '2026-09-20' }
];

// 10. EQUIPE E OPERADORES DO TURNO (Atendentes, Chapa, Caixa, Dono)
const INITIAL_OPERATORS = [
  { id: 'op-1', name: 'Kadu', role: 'Proprietário', active: true, pin: '1234' },
  { id: 'op-2', name: 'Daniel', role: 'Proprietário', active: true, pin: '1234' },
  { id: 'op-3', name: 'Fabiane', role: 'Atendente', active: true, pin: '1234' },
  { id: 'op-4', name: 'Julia', role: 'Atendente', active: true, pin: '1234' }
];

// Cotações de Fornecedores
const INITIAL_QUOTATIONS = [
  { id: 'q-1', productName: 'Molho Barbecue', supplier: 'Supermercado BH', brand: 'Saboroso', package: 'Balde 3,5 kg', packagePrice: 32.90, unitPrice: 9.40, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-2', productName: 'Molho de Tomate', supplier: 'Supermercado BH', brand: 'Colonial', package: 'Sachê 2 kg', packagePrice: 15.98, unitPrice: 7.99, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-6', productName: 'Queijo Mussarela Fatiado', supplier: 'Supermercado BH', brand: 'Saboroso', package: 'Quilo (kg)', packagePrice: 51.80, unitPrice: 51.80, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-13', productName: 'Salsicha Premium', supplier: 'Supermercado BH', brand: 'Seara', package: 'Quilo (kg)', packagePrice: 8.78, unitPrice: 8.78, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-17', productName: 'Bacon Fatiado', supplier: 'Supermercado BH', brand: 'Dona Carne', package: 'Quilo (kg)', packagePrice: 33.38, unitPrice: 33.38, unitType: 'kg', lastUpdated: '2026-08-25' }
];

export const SystemProvider = ({ children }) => {
  // --- Modal Oficial do Sistema (Substitui alerts e confirms nativos do navegador) ---
  const [systemModal, setSystemModal] = useState(null);

  const showAlert = (message, options = {}) => {
    return new Promise((resolve) => {
      setSystemModal({
        open: true,
        isConfirm: false,
        title: options.title || 'Nuu Prensado!!',
        message: typeof message === 'string' ? message : String(message || ''),
        badge: options.badge || null,
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK, Entendi',
        confirmColor: options.confirmColor || 'var(--color-brand)',
        onConfirm: () => {
          setSystemModal(null);
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        }
      });
    });
  };

  const showConfirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setSystemModal({
        open: true,
        isConfirm: true,
        title: options.title || 'Confirmação',
        message: typeof message === 'string' ? message : String(message || ''),
        badge: options.badge || 'CONFIRMAÇÃO',
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        confirmColor: options.confirmColor || (options.type === 'error' ? '#ef4444' : 'var(--color-brand)'),
        onConfirm: () => {
          setSystemModal(null);
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setSystemModal(null);
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      });
    });
  };

  // Intercepta window.alert para garantir que nenhuma mensagem nativa cinza do navegador apareça
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showAlert(msg, { title: 'Aviso do Sistema', type: 'info' });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // --- Estados Principais ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('nuu_products_v15');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      } catch (e) {
        return INITIAL_PRODUCTS;
      }
    }
    const oldSaved = localStorage.getItem('nuu_products_v14') || localStorage.getItem('nuu_products_v13') || localStorage.getItem('nuu_products_v12');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        const updated = parsed.map(p => {
          let price = p.price;
          // Todos os lanches que são R$22 mudam para 23. Prensado de Costela vai para R$28.
          if (price === 22) price = 23;
          if (p.name && p.name.toLowerCase().includes('costela')) price = 28;
          if (p.name && (p.name.toLowerCase().includes('frango') || p.name.toLowerCase().includes('pernil')) && price < 23) price = 23;
          const initMatch = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
          return {
            ...p,
            price,
            image: initMatch ? initMatch.image : p.image
          };
        });
        const existingIds = new Set(updated.map(p => p.id));
        const missing = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id));
        const finalProducts = missing.length > 0 ? [...updated, ...missing] : updated;
        localStorage.setItem('nuu_products_v15', JSON.stringify(finalProducts));
        return finalProducts;
      } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('hd_inventory_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map(i => i.id));
        const missing = INITIAL_INVENTORY.filter(i => !existingIds.has(i.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      } catch (e) {
        return INITIAL_INVENTORY;
      }
    }
    const oldSaved = localStorage.getItem('hd_inventory_v5');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        const updated = parsed.map(i => {
          if (i.id === 1 && i.name.includes('3 Queijos')) return { ...i, name: 'Pão Tradicional' };
          if (i.id === 21 && i.name.includes('Parmesão')) return { ...i, name: 'Pão 3 Queijos' };
          return i;
        });
        const existingIds = new Set(updated.map(i => i.id));
        const missing = INITIAL_INVENTORY.filter(i => !existingIds.has(i.id));
        const finalInv = missing.length > 0 ? [...updated, ...missing] : updated;
        localStorage.setItem('hd_inventory_v6', JSON.stringify(finalInv));
        return finalInv;
      } catch (e) {}
    }
    return INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState(() => {
    let list = [...REAL_SALES_ORDERS];
    const saved = localStorage.getItem('hd_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(list.map(o => [String(o.id), o]));
          parsed.forEach(o => {
            if (o && o.id) {
              const strId = String(o.id);
              map.set(strId, { ...(map.get(strId) || {}), ...o });
            }
          });
          list = Array.from(map.values());
        }
      } catch (e) {
        console.warn('Erro ao carregar hd_orders:', e);
      }
    }
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return list;
  });

  const [transactions, setTransactions] = useState(() => {
    let list = [...REAL_TRANSACTIONS];
    const saved = localStorage.getItem('hd_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(list.map(t => [String(t.id), t]));
          parsed.forEach(t => {
            if (t && t.id) {
              const strId = String(t.id);
              map.set(strId, { ...(map.get(strId) || {}), ...t });
            }
          });
          list = Array.from(map.values());
        }
      } catch (e) {
        console.warn('Erro ao carregar hd_transactions:', e);
      }
    }
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return list;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('hd_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [quotations, setQuotations] = useState(() => {
    const saved = localStorage.getItem('hd_quotations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_QUOTATIONS;
  });

  const [complements, setComplements] = useState(() => {
    const saved = localStorage.getItem('nuu_complements_v8');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const oldV7 = localStorage.getItem('nuu_complements_v7') || localStorage.getItem('nuu_complements_v6') || localStorage.getItem('nuu_complements_v5');
    if (oldV7) {
      try {
        const parsed = JSON.parse(oldV7);
        let filtered = parsed.filter(c => c.id !== 'bread-parmesao' && !c.name?.toLowerCase().includes('parmes'));
        filtered = filtered.map(c => {
          if (c.id === 'bread-3-queijos') return { ...c, name: 'Pão 3 queijos' };
          if (c.id === 'creamy-requeijao' || c.name?.toLowerCase().includes('requeijão')) {
            return { ...c, id: 'creamy-cheddar', name: 'Cheddar Cremoso', group: 'creamy', groupName: 'Queijo Cremoso' };
          }
          return c;
        });
        if (!filtered.some(c => c.id === 'bread-tradicional')) {
          filtered.unshift({ id: 'bread-tradicional', name: 'Pão tradicional', category: 'complement', group: 'bread', groupName: 'Tipo de Pão', price: 0, active: true });
        }
        if (!filtered.some(c => c.id === 'creamy-cheddar' || c.name === 'Cheddar Cremoso')) {
          filtered.push({ id: 'creamy-cheddar', name: 'Cheddar Cremoso', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true });
        }
        if (!filtered.some(c => c.id === 'extra-fraldinha')) {
          filtered.push({ id: 'extra-fraldinha', name: 'Fraldinha', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 6.00, active: true });
        }
        localStorage.setItem('nuu_complements_v8', JSON.stringify(filtered));
        return filtered;
      } catch (e) {}
    }
    return INITIAL_COMPLEMENTS;
  });

  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('nuu_store_settings_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeAddress && parsed.storeAddress.includes('Montes Claros')) {
          const fees = { ...INITIAL_STORE_SETTINGS.deliveryFeesByNeighborhood, ...(parsed.deliveryFeesByNeighborhood || {}) };
          if (fees['Sagrada Família'] === 5 || fees['Sagrada Família'] === 5.00) {
            fees['Sagrada Família'] = 0.00;
          }
          const normalized = {
            ...INITIAL_STORE_SETTINGS,
            ...parsed,
            deliveryFeesByNeighborhood: fees,
            closeTime: (parsed.closeTime === '23:59' || parsed.closeTime === '00:00') ? '23:30' : (parsed.closeTime || '23:30'),
            openTime: (!parsed.openTime || parsed.openTime === '18:00') ? '19:00' : parsed.openTime
          };
          return normalized;
        }
      } catch (e) {}
    }
    const oldV4 = localStorage.getItem('nuu_store_settings_v4') || localStorage.getItem('nuu_store_settings_v3');
    if (oldV4) {
      try {
        const parsed = JSON.parse(oldV4);
        if (parsed.storeAddress && parsed.storeAddress.includes('Montes Claros')) {
          const fees = { ...INITIAL_STORE_SETTINGS.deliveryFeesByNeighborhood, ...(parsed.deliveryFeesByNeighborhood || {}) };
          if (fees['Sagrada Família'] === 5 || fees['Sagrada Família'] === 5.00) {
            fees['Sagrada Família'] = 0.00;
          }
          const migrated = {
            ...INITIAL_STORE_SETTINGS,
            ...parsed,
            deliveryFeesByNeighborhood: fees,
            openTime: '19:00',
            closeTime: '23:30',
            openDays: ['ter', 'qua', 'qui', 'sex', 'sab', 'dom']
          };
          localStorage.setItem('nuu_store_settings_v5', JSON.stringify(migrated));
          return migrated;
        }
      } catch (e) {}
    }
    return INITIAL_STORE_SETTINGS;
  });

  const [deliveryNeighborhoods, setDeliveryNeighborhoods] = useState(() => {
    const saved = localStorage.getItem('nuu_neighborhoods_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(n => n.name === 'Sagrada Família' && (n.fee === 5 || n.fee === 5.00) ? { ...n, fee: 0.00 } : n);
        }
      } catch (e) {}
    }
    const old = localStorage.getItem('nuu_neighborhoods');
    if (old) {
      try {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed) && parsed.some(n => n.name === 'Sagrada Família')) {
          return parsed.map(n => n.name === 'Sagrada Família' && (n.fee === 5 || n.fee === 5.00) ? { ...n, fee: 0.00 } : n);
        }
      } catch (e) {}
    }
    return INITIAL_NEIGHBORHOODS;
  });

  const [deliveryRadiuses, setDeliveryRadiuses] = useState(() => {
    const saved = localStorage.getItem('nuu_radiuses_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_RADIUSES;
  });

  const [coupons, setCoupons] = useState(() => {
    const saved = localStorage.getItem('nuu_coupons');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COUPONS;
  });

  const [motoboys, setMotoboys] = useState(() => {
    const saved = localStorage.getItem('nuu_motoboys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_MOTOBOYS;
  });

  const [customers, setCustomers] = useState(() => {
    let list = [...REAL_CUSTOMERS];
    const saved = localStorage.getItem('nuu_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(list.map(c => [String(c.phone).replace(/\D/g, ''), c]));
          parsed.forEach(c => {
            if (c && c.phone) {
              const cleanPhone = String(c.phone).replace(/\D/g, '');
              map.set(cleanPhone, { ...(map.get(cleanPhone) || {}), ...c });
            }
          });
          list = Array.from(map.values());
        }
      } catch (e) {
        console.warn('Erro ao carregar nuu_customers:', e);
      }
    }
    return list;
  });

  const [operators, setOperators] = useState(() => {
    const savedV4 = localStorage.getItem('nuu_operators_v4');
    if (savedV4) {
      try {
        return JSON.parse(savedV4);
      } catch (e) {}
    }
    const saved = localStorage.getItem('nuu_operators_v3') || localStorage.getItem('nuu_operators_v2') || localStorage.getItem('nuu_operators');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(o => {
          if (o.name === 'Kadu' || o.name === 'Daniel') {
            return { ...o, role: 'Proprietário' };
          }
          return { ...o, role: 'Atendente' };
        });
      } catch (e) {}
    }
    return INITIAL_OPERATORS;
  });

  const [currentOperator, setCurrentOperator] = useState(() => {
    const saved = sessionStorage.getItem('nuu_current_operator');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && ['Kadu', 'Daniel', 'Fabiane', 'Julia'].includes(parsed.name)) {
          if (parsed.name === 'Kadu' || parsed.name === 'Daniel') {
            return { ...parsed, role: 'Proprietário' };
          }
          return { ...parsed, role: 'Atendente' };
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [cashShifts, setCashShifts] = useState(() => {
    const saved = localStorage.getItem('nuu_cash_shifts');
    return saved ? JSON.parse(saved) : [];
  });

  const [fidelityAlert, setFidelityAlert] = useState(null);

  const [firebaseActive, setFirebaseActive] = useState(isFirebaseConfigured);

  // Turno de caixa aberto ativo (se houver)
  const activeShift = cashShifts.find(s => s.status === 'open') || null;

  // --- Sincronização LocalStorage & BroadcastChannel ---
  useEffect(() => {
    localStorage.setItem('nuu_products_v15', JSON.stringify(products));
    localStorage.setItem('nuu_products_v14', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('hd_inventory_v6', JSON.stringify(inventory));
    localStorage.setItem('hd_inventory_v5', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('hd_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('hd_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('hd_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('hd_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('nuu_complements_v7', JSON.stringify(complements));
    localStorage.setItem('nuu_complements_v6', JSON.stringify(complements));
  }, [complements]);

  useEffect(() => {
    localStorage.setItem('nuu_store_settings_v5', JSON.stringify(storeSettings));
    localStorage.setItem('nuu_store_settings_v4', JSON.stringify(storeSettings));
    localStorage.setItem('nuu_store_settings_v3', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('nuu_neighborhoods_v2', JSON.stringify(deliveryNeighborhoods));
  }, [deliveryNeighborhoods]);

  useEffect(() => {
    localStorage.setItem('nuu_radiuses_v2', JSON.stringify(deliveryRadiuses));
  }, [deliveryRadiuses]);

  useEffect(() => {
    localStorage.setItem('nuu_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('nuu_motoboys', JSON.stringify(motoboys));
  }, [motoboys]);

  useEffect(() => {
    localStorage.setItem('nuu_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('nuu_operators_v4', JSON.stringify(operators));
    localStorage.setItem('nuu_operators_v3', JSON.stringify(operators));
    localStorage.setItem('nuu_operators_v2', JSON.stringify(operators));
    localStorage.setItem('nuu_operators', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('nuu_cash_shifts', JSON.stringify(cashShifts));
  }, [cashShifts]);

  // Reconciliação contínua e garantia absoluta: pedidos entregues geram receita em transactions
  // e clientes com telefone são mantidos e atualizados em customers
  useEffect(() => {
    // 1. Reconciliação financeira: pedidos com status 'delivered' (e não cancelados)
    const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.status !== 'canceled');
    if (deliveredOrders.length > 0) {
      setTransactions(prevTransactions => {
        let hasChanges = false;
        const currentTrans = [...prevTransactions];
        const existingOrderIds = new Set(
          currentTrans
            .filter(t => t.type === 'income')
            .map(t => {
              if (t.orderId) return String(t.orderId);
              const m = t.description?.match(/pedido\s*#(\d+)/i);
              return m ? m[1] : null;
            })
            .filter(Boolean)
        );

        deliveredOrders.forEach(order => {
          const ordIdStr = String(order.id);
          if (!existingOrderIds.has(ordIdStr)) {
            hasChanges = true;
            existingOrderIds.add(ordIdStr);
            currentTrans.push({
              id: `trans-rec-${ordIdStr}`,
              orderId: ordIdStr,
              date: order.deliveredAt || order.date || new Date().toISOString(),
              type: 'income',
              category: 'Vendas',
              value: parseFloat(order.total) || 0,
              grossValue: parseFloat(order.total) || 0,
              description: `Pedido #${order.id} (${order.customerName || 'Cliente'}) - ${order.paymentMethod || 'Pix'}`
            });
          }
        });

        if (hasChanges) {
          currentTrans.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          return currentTrans;
        }
        return prevTransactions;
      });
    }

    // 2. Reconciliação de clientes: garante que todos os clientes com telefone estejam em customers
    const validOrdersWithPhone = orders.filter(o => o.phone && o.status !== 'canceled');
    if (validOrdersWithPhone.length > 0) {
      setCustomers(prevCust => {
        const custMap = new Map();
        prevCust.forEach(c => {
          const clean = String(c.phone || '').replace(/\D/g, '');
          if (clean) custMap.set(clean, { ...c });
        });

        let changed = false;
        validOrdersWithPhone.forEach(ord => {
          const clean = String(ord.phone).replace(/\D/g, '');
          if (!clean) return;

          const existing = custMap.get(clean);
          if (!existing) {
            changed = true;
            custMap.set(clean, {
              phone: clean,
              name: ord.customerName || 'Cliente',
              address: ord.address || '',
              neighborhood: ord.neighborhood || '',
              stampsCount: ord.status === 'delivered' ? 1 : 0,
              totalOrders: 1,
              lastOrderAt: ord.date || new Date().toISOString()
            });
          } else {
            let updated = false;
            if (!existing.name && ord.customerName) { existing.name = ord.customerName; updated = true; }
            if (!existing.address && ord.address) { existing.address = ord.address; updated = true; }
            if (updated) changed = true;
          }
        });

        if (changed) {
          return Array.from(custMap.values());
        }
        return prevCust;
      });
    }
  }, [orders]);

  // Sincronização entre abas do mesmo navegador (BroadcastChannel)
  useEffect(() => {
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('nuu_system_channel');
      }
    } catch (e) {}

    const handleBroadcast = (e) => {
      if (e.data?.type === 'ORDERS_SYNC' && Array.isArray(e.data.orders)) {
        setOrders(e.data.orders);
        if (e.data.isNewOrder) playNotificationChime();
      }
      if (e.data?.type === 'SETTINGS_SYNC' && e.data.settings) {
        setStoreSettings(e.data.settings);
      }
      if (e.data?.type === 'PRODUCT_STATUS_SYNC' && e.data.productId !== undefined) {
        setProducts(prev => prev.map(p => String(p.id) === String(e.data.productId) ? { ...p, active: e.data.active } : p));
      }
      if (e.data?.type === 'PRODUCTS_SYNC' && Array.isArray(e.data.products)) {
        setProducts(e.data.products);
      }
      if (e.data?.type === 'COMPLEMENT_STATUS_SYNC' && e.data.complementId) {
        setComplements(prev => prev.map(c => String(c.id) === String(e.data.complementId) ? { ...c, active: e.data.active } : c));
      }
      if (e.data?.type === 'COMPLEMENTS_SYNC' && Array.isArray(e.data.complements)) {
        setComplements(e.data.complements);
      }
    };

    if (channel) {
      channel.addEventListener('message', handleBroadcast);
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleBroadcast);
        channel.close();
      }
    };
  }, []);

  // --- Sincronização em Nuvem 100% via Firebase Firestore ---
  const syncProductToRemote = async (prod) => {
    if (!prod || prod.id === undefined) return;
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'products', String(prod.id)), {
          id: Number(prod.id) || prod.id,
          name: prod.name || '',
          description: prod.description || '',
          price: Number(prod.price) || 0,
          image: prod.image || '',
          active: prod.active !== undefined ? Boolean(prod.active) : true,
          category: prod.category || 'prensados',
          hasCustomOptions: Boolean(prod.hasCustomOptions),
          recipe: prod.recipe || [],
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Erro ao sincronizar produto no Firestore:', err);
      }
    }
  };

  const syncComplementToRemote = async (comp) => {
    if (!comp || !comp.id) return;
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'complements', String(comp.id)), {
          id: String(comp.id),
          name: comp.name || '',
          category: comp.category || 'extra',
          group: comp.group || 'extras',
          group_name: comp.group_name || '',
          price: Number(comp.price) || 0,
          active: comp.active !== undefined ? Boolean(comp.active) : true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Erro ao sincronizar complemento no Firestore:', err);
      }
    }
  };

  const syncStoreSettingsToRemote = async (settings) => {
    if (!settings) return;
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'main'), {
          ...settings,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Erro ao sincronizar store_settings no Firestore:', err);
      }
    }
  };

  // Garante migração automática do horário de abertura para 19:00 caso venha com 18:00
  useEffect(() => {
    if (storeSettings?.openTime === '18:00' || !storeSettings?.openTime) {
      setStoreSettings(prev => {
        const updated = { ...prev, openTime: '19:00' };
        syncStoreSettingsToRemote(updated);
        return updated;
      });
    }
  }, [storeSettings?.openTime]);

  // Sincronização em tempo real de PEDIDOS com Cloud Firestore (Firebase)
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    let unsubscribe = null;
    try {
      const q = query(collection(db, 'orders'), orderBy('date', 'desc'), limit(100));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const remoteOrders = [];
        let hasNew = false;
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            hasNew = true;
          }
        });

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteOrders.push({
            ...data,
            id: String(docSnap.id)
          });
        });

        if (remoteOrders.length > 0) {
          setOrders(prev => {
            const map = new Map(REAL_SALES_ORDERS.map(o => [String(o.id), o]));
            prev.forEach(o => {
              if (o && o.id) map.set(String(o.id), { ...(map.get(String(o.id)) || {}), ...o });
            });
            remoteOrders.forEach(rem => {
              if (rem && rem.id) {
                map.set(String(rem.id), { ...(map.get(String(rem.id)) || {}), ...rem });
              }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            return merged;
          });
          if (hasNew) {
            playNotificationChime();
          }
        }
      }, (err) => {
        console.warn('Erro no listener do Firebase Firestore:', err);
      });
    } catch (err) {
      console.warn('Exceção ao conectar Firestore:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseActive]);

  // Sincronização em tempo real de PRODUTOS com Cloud Firestore (Firebase)
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    let unsubscribe = null;
    try {
      const colRef = collection(db, 'products');
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
          // Se o Firestore não tiver produtos ainda, sobe os produtos locais como carga inicial
          products.forEach(p => syncProductToRemote(p));
          return;
        }

        const remoteMap = new Map();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.id !== undefined) {
            remoteMap.set(Number(d.id), d);
          }
        });

        if (remoteMap.size > 0) {
          // Se o produto Fraldinha (id 15) não estiver no remote, sincroniza ele
          const fraldinha = INITIAL_PRODUCTS.find(p => p.id === 15);
          if (fraldinha && !remoteMap.has(15)) {
            syncProductToRemote(fraldinha);
          }

          setProducts(prev => {
            let changed = false;
            const updated = prev.map(p => {
              const rem = remoteMap.get(Number(p.id));
              if (!rem) return p;
              const newActive = rem.active !== undefined ? Boolean(rem.active) : p.active;
              let newPrice = rem.price !== undefined ? Number(rem.price) : p.price;
              // Migração de preços caso o Firestore ainda tenha valores anteriores
              if (newPrice === 22) newPrice = 23;
              if (p.name && p.name.toLowerCase().includes('costela') && (newPrice === 25 || newPrice === 22)) newPrice = 28;
              if (p.name && (p.name.toLowerCase().includes('frango') || p.name.toLowerCase().includes('pernil')) && newPrice < 23) newPrice = 23;

              if (p.active !== newActive || p.price !== newPrice) {
                changed = true;
              }
              return {
                ...p,
                active: newActive,
                price: newPrice,
                name: rem.name || p.name,
                description: rem.description !== undefined ? rem.description : p.description,
                image: rem.image || p.image,
                category: rem.category || p.category
              };
            });
            return changed ? updated : prev;
          });
        }
      }, (err) => {
        console.warn('Erro no listener de produtos Firestore:', err);
      });
    } catch (err) {
      console.warn('Exceção ao conectar produtos Firestore:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseActive]);

  // Sincronização em tempo real de COMPLEMENTOS com Cloud Firestore (Firebase)
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    let unsubscribe = null;
    try {
      const colRef = collection(db, 'complements');
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
          complements.forEach(c => syncComplementToRemote(c));
          return;
        }

        const remoteMap = new Map();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.id) {
            remoteMap.set(String(d.id), d);
          }
        });

        if (remoteMap.size > 0) {
          if (remoteMap.has('bread-parmesao')) {
            deleteDoc(doc(db, 'complements', 'bread-parmesao')).catch(() => {});
          }
          if (remoteMap.has('creamy-requeijao')) {
            deleteDoc(doc(db, 'complements', 'creamy-requeijao')).catch(() => {});
          }
          const tradBread = INITIAL_COMPLEMENTS.find(c => c.id === 'bread-tradicional');
          if (tradBread && !remoteMap.has('bread-tradicional')) {
            syncComplementToRemote(tradBread);
          }
          const cheddarCreamy = INITIAL_COMPLEMENTS.find(c => c.id === 'creamy-cheddar');
          if (cheddarCreamy && !remoteMap.has('creamy-cheddar')) {
            syncComplementToRemote(cheddarCreamy);
          }
          const fraldinhaExtra = INITIAL_COMPLEMENTS.find(c => c.id === 'extra-fraldinha');
          if (fraldinhaExtra && !remoteMap.has('extra-fraldinha')) {
            syncComplementToRemote(fraldinhaExtra);
          }

          setComplements(prev => {
            let changed = false;
            let filtered = prev.filter(c => c.id !== 'bread-parmesao' && !c.name?.toLowerCase().includes('parmes'));
            filtered = filtered.map(c => {
              if (c.id === 'creamy-requeijao' || c.name?.toLowerCase().includes('requeijão')) {
                changed = true;
                return { ...c, id: 'creamy-cheddar', name: 'Cheddar Cremoso', group: 'creamy', groupName: 'Queijo Cremoso' };
              }
              return c;
            });
            if (!filtered.some(c => c.id === 'bread-tradicional')) {
              filtered.unshift({ id: 'bread-tradicional', name: 'Pão tradicional', category: 'complement', group: 'bread', groupName: 'Tipo de Pão', price: 0, active: true });
              changed = true;
            }
            if (!filtered.some(c => c.id === 'creamy-cheddar' || c.name === 'Cheddar Cremoso')) {
              filtered.push({ id: 'creamy-cheddar', name: 'Cheddar Cremoso', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true });
              changed = true;
            }
            if (!filtered.some(c => c.id === 'extra-fraldinha')) {
              filtered.push({ id: 'extra-fraldinha', name: 'Fraldinha', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 6.00, active: true });
              changed = true;
            }
            const updated = filtered.map(c => {
              const rem = remoteMap.get(String(c.id));
              if (!rem) return c;
              const newActive = rem.active !== undefined ? Boolean(rem.active) : c.active;
              const newPrice = rem.price !== undefined ? Number(rem.price) : c.price;
              let newName = rem.name || c.name;
              if (c.id === 'bread-3-queijos') newName = 'Pão 3 queijos';
              if (c.id === 'bread-tradicional') newName = 'Pão tradicional';
              if (c.id === 'creamy-cheddar') newName = 'Cheddar Cremoso';
              if (c.active !== newActive || c.price !== newPrice || c.name !== newName) {
                changed = true;
              }
              return {
                ...c,
                active: newActive,
                price: newPrice,
                name: newName
              };
            });
            return changed ? updated : prev;
          });
        }
      }, (err) => {
        console.warn('Erro no listener de complementos Firestore:', err);
      });
    } catch (err) {
      console.warn('Exceção ao conectar complementos Firestore:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseActive]);

  // Sincronização em tempo real de STORE SETTINGS com Cloud Firestore (Firebase)
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    let unsubscribe = null;
    try {
      const docRef = doc(db, 'store_settings', 'main');
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (d) {
            setStoreSettings(prev => ({
              ...prev,
              isOpen: d.isOpen !== undefined ? Boolean(d.isOpen) : prev.isOpen,
              autoSchedule: d.autoSchedule !== undefined ? Boolean(d.autoSchedule) : prev.autoSchedule,
              openDays: d.openDays || prev.openDays,
              openTime: (d.openTime === '18:00' || !d.openTime) ? '19:00' : (d.openTime || prev.openTime || '19:00'),
              closeTime: (d.closeTime === '23:59' || d.closeTime === '00:00') ? '23:30' : (d.closeTime || prev.closeTime || '23:30'),
              deliveryFeeMode: d.deliveryFeeMode || prev.deliveryFeeMode,
              fixedDeliveryFee: d.fixedDeliveryFee !== undefined ? Number(d.fixedDeliveryFee) : prev.fixedDeliveryFee,
              perKmDeliveryFee: d.perKmDeliveryFee !== undefined ? Number(d.perKmDeliveryFee) : prev.perKmDeliveryFee,
              freeShippingMinOrder: d.freeShippingMinOrder !== undefined ? Number(d.freeShippingMinOrder) : prev.freeShippingMinOrder
            }));
          }
        }
      }, (err) => {
        console.warn('Erro no listener de store_settings Firestore:', err);
      });
    } catch (err) {
      console.warn('Exceção ao conectar store_settings Firestore:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseActive]);

  // Sincronização em tempo real de CUSTOMERS com Cloud Firestore (Firebase)
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    let unsubscribe = null;
    try {
      const colRef = collection(db, 'customers');
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteList = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.phone) {
              const clean = String(data.phone).replace(/\D/g, '');
              remoteList.push({ ...data, phone: clean });
            }
          });

          if (remoteList.length > 0) {
            setCustomers(prev => {
              const map = new Map(prev.map(c => [c.phone.replace(/\D/g, ''), c]));
              remoteList.forEach(rem => {
                const phone = rem.phone;
                if (map.has(phone)) {
                  const local = map.get(phone);
                  map.set(phone, {
                    ...local,
                    ...rem,
                    stampsCount: Math.max(local.stampsCount || 0, rem.stampsCount || 0),
                    loyaltyStamps: Math.max(local.loyaltyStamps || 0, rem.loyaltyStamps || 0),
                    totalOrders: Math.max(local.totalOrders || 0, rem.totalOrders || 0),
                    bonuses: Array.isArray(rem.bonuses) ? rem.bonuses : (local.bonuses || [])
                  });
                } else {
                  map.set(phone, rem);
                }
              });
              return Array.from(map.values());
            });
          }
        }
      }, (err) => {
        console.warn('Erro no listener de customers Firestore:', err);
      });
    } catch (err) {
      console.warn('Exceção ao conectar customers Firestore:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseActive]);

  // Sincronização em tempo real de CUPONS e VOUCHERS com Cloud Firestore (Firebase)
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    let unsubscribe = null;
    try {
      const colRef = collection(db, 'coupons');
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteCoupons = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.code) {
              remoteCoupons.push(data);
            }
          });

          if (remoteCoupons.length > 0) {
            setCoupons(prev => {
              const map = new Map(prev.map(c => [c.code.toUpperCase(), c]));
              remoteCoupons.forEach(rc => {
                const upper = rc.code.toUpperCase();
                if (map.has(upper)) {
                  const local = map.get(upper);
                  map.set(upper, { ...local, ...rc });
                } else {
                  map.set(upper, rc);
                }
              });
              return Array.from(map.values());
            });
          }
        }
      }, (err) => {
        console.warn('Erro no listener de coupons Firestore:', err);
      });
    } catch (err) {
      console.warn('Exceção ao conectar coupons Firestore:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseActive]);

  // --- Função para Salvar/Conectar Supabase (legado/desativado) ---
  const saveSupabaseConfig = () => false;

  // --- Função para Salvar/Conectar Firebase ---
  const handleSaveFirebaseConfig = (config) => {
    saveFirebaseConfig(config);
    const configured = isFirebaseConfigured();
    setFirebaseActive(configured);
    return configured;
  };

  // --- Controle de Loja e Horários ---
  const updateStoreSettings = (newSettings) => {
    const updated = { ...storeSettings, ...newSettings };
    setStoreSettings(updated);
    syncStoreSettingsToRemote(updated);
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'SETTINGS_SYNC', settings: updated });
        ch.close();
      }
    } catch (e) {}
  };

  // Verifica o status de pausa temporária da loja
  const getStorePauseStatus = () => {
    if (!storeSettings?.pausedUntil) {
      return { isPaused: false, remainingMinutes: 0, pausedUntil: null, pauseReason: '' };
    }
    const pauseEnd = new Date(storeSettings.pausedUntil).getTime();
    if (isNaN(pauseEnd) || Date.now() >= pauseEnd) {
      return { isPaused: false, remainingMinutes: 0, pausedUntil: null, pauseReason: '' };
    }
    const remainingMs = pauseEnd - Date.now();
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
    return {
      isPaused: true,
      remainingMinutes,
      pausedUntil: storeSettings.pausedUntil,
      pauseReason: storeSettings.pauseReason || 'Muitos pedidos sendo preparados no momento'
    };
  };

  // Pausa a chegada de novos pedidos temporariamente por X minutos
  const pauseStore = (minutes = 15, reason = 'Muitos pedidos sendo preparados no momento') => {
    const mins = Math.max(1, parseInt(minutes, 10) || 15);
    const pauseUntilDate = new Date(Date.now() + mins * 60000).toISOString();
    updateStoreSettings({
      isOpen: true,
      pausedUntil: pauseUntilDate,
      pauseReason: reason
    });
  };

  // Retoma o recebimento de pedidos imediatamente
  const resumeStore = () => {
    updateStoreSettings({
      isOpen: true,
      pausedUntil: null,
      pauseReason: null
    });
  };

  // Abre a loja
  const openStore = () => {
    updateStoreSettings({
      isOpen: true,
      pausedUntil: null,
      pauseReason: null
    });
  };

  // Fecha a loja
  const closeStore = (reason = '') => {
    updateStoreSettings({
      isOpen: false,
      pausedUntil: null,
      pauseReason: reason || null
    });
  };

  // Observador automático para reabrir assim que a pausa expirar
  useEffect(() => {
    if (!storeSettings?.pausedUntil) return;
    const checkPauseExpired = () => {
      const pauseEnd = new Date(storeSettings.pausedUntil).getTime();
      if (!isNaN(pauseEnd) && Date.now() >= pauseEnd) {
        updateStoreSettings({ pausedUntil: null, pauseReason: null });
      }
    };
    checkPauseExpired();
    const interval = setInterval(checkPauseExpired, 10000);
    return () => clearInterval(interval);
  }, [storeSettings?.pausedUntil]);

  // Verifica se a loja está aberta considerando pausa temporária, toggle manual ou horário automático
  const isStoreOpenNow = () => {
    // 0. Se a loja estiver com pausa temporária programada por minutos
    if (storeSettings.pausedUntil) {
      const pauseEnd = new Date(storeSettings.pausedUntil).getTime();
      if (!isNaN(pauseEnd) && Date.now() < pauseEnd) {
        return false;
      }
    }

    // 1. Se o dono desligou manualmente a loja, ela fica sempre fechada
    if (!storeSettings.isOpen) return false;

    // 2. Se o agendamento automático estiver desativado, segue o interruptor manual do dono
    if (!storeSettings.autoSchedule) return Boolean(storeSettings.isOpen);

    // 3. Se o agendamento automático estiver ativado, verifica dias e horários
    try {
      const now = new Date();
      const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const currentDay = days[now.getDay()];
      const yesterday = days[(now.getDay() + 6) % 7];

      const [openHour, openMin] = (storeSettings.openTime || '19:00').split(':').map(Number);
      const [closeHour, closeMin] = (storeSettings.closeTime || '23:30').split(':').map(Number);

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openHour * 60 + openMin;

      // Se o fechamento for à meia-noite (00:00)
      if (closeHour === 0 && closeMin === 0) {
        if (!storeSettings.openDays?.includes(currentDay)) return false;
        return nowMinutes >= openMinutes && nowMinutes <= 1440;
      }

      const closeMinutes = closeHour * 60 + closeMin;

      if (closeMinutes > openMinutes) {
        // Mesmo dia (ex: 19:00 às 23:30)
        if (!storeSettings.openDays?.includes(currentDay)) return false;
        return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
      } else {
        // Cruza a meia-noite (ex: 19:00 às 01:00)
        if (nowMinutes >= openMinutes) {
          return Boolean(storeSettings.openDays?.includes(currentDay));
        } else if (nowMinutes <= closeMinutes) {
          return Boolean(storeSettings.openDays?.includes(yesterday));
        }
        return false;
      }
    } catch (e) {
      return storeSettings.isOpen ?? true;
    }
  };

  // --- Cálculo Dinâmico de Frete (Bairro Específico > Raio em KM > Frete Grátis) ---
  const calculateDeliveryFee = (arg1, arg2, arg3) => {
    let neighborhoodName = '';
    let distanceKm = null;
    let subtotal = 0;

    if (typeof arg1 === 'object' && arg1 !== null) {
      neighborhoodName = arg1.neighborhoodName || '';
      distanceKm = arg1.distanceKm !== undefined ? arg1.distanceKm : null;
      subtotal = Number(arg1.subtotal) || 0;
    } else {
      neighborhoodName = typeof arg1 === 'string' ? arg1 : '';
      if (typeof arg2 === 'number') distanceKm = arg2;
      if (typeof arg3 === 'number') subtotal = arg3;
    }

    // 1. Frete Grátis por valor do pedido
    const freeThreshold = Number(storeSettings?.freeDeliveryThreshold) || 70.00;
    if (freeThreshold > 0 && subtotal >= freeThreshold) {
      return { fee: 0, isFree: true, reason: `Frete Grátis acima de R$ ${freeThreshold.toFixed(2)}!` };
    }

    const radiusesList = (deliveryRadiuses && deliveryRadiuses.length > 0)
      ? deliveryRadiuses
      : (storeSettings?.deliveryRadius || INITIAL_RADIUSES);
    const sortedRadiuses = [...radiusesList]
      .filter(r => r.active !== false)
      .sort((a, b) => a.maxKm - b.maxKm);

    const cleanName = (neighborhoodName || '').trim().toLowerCase();

    // 2. SOBREPOSIÇÃO PRIORITÁRIA DE BAIRRO:
    // Qualquer taxa cadastrada especificamente em storeSettings.deliveryFeesByNeighborhood
    // sobressai e prevalece sobre a regra de KM.
    if (cleanName && storeSettings?.deliveryFeesByNeighborhood) {
      const matchKey = Object.keys(storeSettings.deliveryFeesByNeighborhood).find(
        k => k.trim().toLowerCase() === cleanName
      );
      if (matchKey !== undefined) {
        const customFee = Number(storeSettings.deliveryFeesByNeighborhood[matchKey]);
        if (!isNaN(customFee)) {
          const isStoreNeighborhood = cleanName.includes('sagrada') || cleanName.includes('família') || cleanName.includes('familia');
          return {
            fee: customFee,
            isFree: customFee === 0,
            distanceKm: distanceKm || null,
            reason: customFee === 0 
              ? (isStoreNeighborhood ? 'Frete Grátis (Bairro da Loja)' : `Frete Grátis no bairro ${matchKey}`)
              : `Taxa Específica do Bairro ${matchKey}`
          };
        }
      }
    }

    // 2.1 Bairro da loja (Sagrada Família): se não houver taxa específica cadastrada, padrão R$ 0,00
    if (cleanName && (cleanName.includes('sagrada') || cleanName.includes('família') || cleanName.includes('familia'))) {
      return { fee: 0, isFree: true, distanceKm: 0.5, reason: 'Frete Grátis (Bairro da Loja)' };
    }

    // 3. DETERMINAÇÃO DA DISTÂNCIA EM KM:
    let finalDistanceKm = (distanceKm !== null && distanceKm !== undefined && !isNaN(distanceKm)) 
      ? Number(distanceKm) 
      : null;

    if (finalDistanceKm === null && cleanName) {
      // 3.1 Procura na base consolidada de Montes Claros
      const foundInMoc = MONTES_CLAROS_NEIGHBORHOODS.find(n => 
        n.name.toLowerCase() === cleanName || 
        cleanName.includes(n.name.toLowerCase()) ||
        n.name.toLowerCase().includes(cleanName)
      );
      if (foundInMoc && foundInMoc.distanceKm) {
        finalDistanceKm = foundInMoc.distanceKm;
      }

      // 3.2 Se ainda não achou, procura em deliveryNeighborhoods
      if (finalDistanceKm === null && deliveryNeighborhoods) {
        const foundInList = deliveryNeighborhoods.find(n => 
          (n.name || '').trim().toLowerCase() === cleanName && n.distanceKm
        );
        if (foundInList && foundInList.distanceKm) {
          finalDistanceKm = foundInList.distanceKm;
        }
      }
    }

    // 4. CÁLCULO PADRÃO POR QUILOMETRAGEM / RAIO (KM):
    if (finalDistanceKm !== null && sortedRadiuses.length > 0) {
      const match = sortedRadiuses.find(r => finalDistanceKm <= r.maxKm);
      if (match) {
        return { 
          fee: Number(match.fee) || 0, 
          isFree: Number(match.fee) === 0, 
          distanceKm: finalDistanceKm,
          reason: `Raio até ${match.maxKm} km (${match.description || `~${finalDistanceKm.toFixed(1)} km da loja`})` 
        };
      }
      const maxBand = sortedRadiuses[sortedRadiuses.length - 1];
      if (maxBand) {
        return { 
          fee: Number(maxBand.fee) || 14.00, 
          isFree: false, 
          distanceKm: finalDistanceKm,
          reason: `Acima de ${maxBand.maxKm} km (~${finalDistanceKm.toFixed(1)} km da loja)` 
        };
      }
    }

    // 5. TAXA PADRÃO BASE (Primeira faixa de raio cadastrada)
    const baseRadius = sortedRadiuses[0];
    const defaultFee = baseRadius ? Number(baseRadius.fee) : 5.00;
    return { fee: defaultFee, isFree: defaultFee === 0, reason: 'Taxa Padrão por Faixa de KM' };
  };

  // --- Cupons de Desconto ---
  const validateCoupon = (code, subtotal, deliveryFee = 0) => {
    if (!code) return { valid: false, message: 'Digite um cupom' };
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code.toUpperCase() === cleanCode && c.active);

    if (!coupon) {
      return { valid: false, message: 'Cupom inválido ou expirado' };
    }

    if (subtotal < coupon.minOrder) {
      return { valid: false, message: `Pedido mínimo de R$ ${coupon.minOrder.toFixed(2)} para este cupom` };
    }

    let discount = 0;
    const couponVal = Number(coupon.value ?? coupon.discount ?? 0);
    if (coupon.type === 'percent') {
      discount = (subtotal * couponVal) / 100;
    } else if (coupon.type === 'fixed') {
      discount = Math.min(couponVal, subtotal);
    } else if (coupon.type === 'free_delivery') {
      discount = deliveryFee;
    }

    return {
      valid: true,
      coupon,
      discount: parseFloat(discount.toFixed(2)),
      message: `Cupom ${coupon.code} aplicado com sucesso!`
    };
  };

  const upsertCoupon = (couponData) => {
    const upper = couponData.code.trim().toUpperCase();
    const numVal = parseFloat(couponData.value ?? couponData.discount ?? 0);
    const normalized = {
      ...couponData,
      id: couponData.id || ('cp-' + Date.now()),
      code: upper,
      value: numVal,
      discount: numVal
    };

    setCoupons(prev => {
      const existing = prev.findIndex(c => (c.id && c.id === normalized.id) || c.code.toUpperCase() === upper);
      if (existing > -1) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], ...normalized };
        return copy;
      }
      return [...prev, { ...normalized, usesCount: normalized.usesCount || 0 }];
    });

    const firestoreDb = getFirestoreDb();
    if (firestoreDb && normalized.code) {
      try {
        setDoc(doc(firestoreDb, 'coupons', normalized.code), {
          ...normalized,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}
    }
  };

  const deleteCoupon = (identifier) => {
    const upperId = String(identifier).toUpperCase();
    setCoupons(prev => prev.filter(c => c.id !== identifier && c.code.toUpperCase() !== upperId));
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        deleteDoc(doc(firestoreDb, 'coupons', upperId)).catch(() => {});
      } catch (err) {}
    }
  };

  // --- Gestão de Bairros de Entrega ---
  const upsertNeighborhood = (nbData) => {
    setDeliveryNeighborhoods(prev => {
      if (nbData.id) {
        return prev.map(n => n.id === nbData.id ? { ...n, ...nbData } : n);
      }
      return [...prev, { ...nbData, id: 'nb-' + Date.now() }];
    });
  };

  const deleteNeighborhood = (id) => {
    setDeliveryNeighborhoods(prev => prev.filter(n => n.id !== id));
  };

  const upsertRadius = (radData) => {
    setDeliveryRadiuses(prev => {
      if (radData.id) {
        return prev.map(r => r.id === radData.id ? { ...r, ...radData } : r);
      }
      return [...prev, { ...radData, id: 'rad-' + Date.now() }];
    });
  };

  const deleteRadius = (id) => {
    setDeliveryRadiuses(prev => prev.filter(r => r.id !== id));
  };

  // --- Gestão de Motoboys ---
  const upsertMotoboy = (mbData) => {
    setMotoboys(prev => {
      if (mbData.id) {
        return prev.map(m => m.id === mbData.id ? { ...m, ...mbData } : m);
      }
      return [...prev, { ...mbData, id: 'mb-' + Date.now() }];
    });
  };

  const deleteMotoboy = (id) => {
    setMotoboys(prev => prev.filter(m => m.id !== id));
  };

  const assignOrderMotoboy = (orderId, motoboyId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, motoboyId } : o));
    const db = getFirestoreDb();
    if (db) {
      try {
        updateDoc(doc(db, 'orders', String(orderId)), { motoboyId }).catch(() => {});
      } catch (err) {}
    }
  };

  const settleMotoboyPayments = ({ motoboyId, orderIds, totalAmount, notes = '' }) => {
    const mb = motoboys.find(m => m.id === motoboyId);
    if (!mb) return;

    // Registra despesa no fluxo de caixa
    const newTrans = {
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      type: 'expense',
      category: 'Logística / Motoboy',
      value: parseFloat(totalAmount.toFixed(2)),
      description: `Acerto Motoboy ${mb.name} (${orderIds.length} entregas)${notes ? ' - ' + notes : ''}`
    };
    setTransactions(t => [newTrans, ...t]);

    // Marca pedidos como quitados na entrega
    setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, motoboySettled: true } : o));
  };

  // --- Clientes & Programa Fidelidade ---
  const lookupCustomer = (phone) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    return customers.find(c => c.phone.replace(/\D/g, '') === clean) || null;
  };

  const saveCustomer = (customerData) => {
    if (!customerData.phone) return;
    const cleanPhone = customerData.phone.replace(/\D/g, '');
    let finalCustomer = null;
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.phone.replace(/\D/g, '') === cleanPhone);
      if (idx > -1) {
        const copy = [...prev];
        finalCustomer = { ...copy[idx], ...customerData, phone: cleanPhone };
        copy[idx] = finalCustomer;
        return copy;
      }
      finalCustomer = {
        name: 'Cliente',
        address: '',
        neighborhood: '',
        stampsCount: 0,
        loyaltyStamps: 0,
        totalOrders: 0,
        bonuses: [],
        ...customerData,
        phone: cleanPhone
      };
      return [...prev, finalCustomer];
    });

    // Sincroniza com Firebase se configurado
    const firestoreDb = getFirestoreDb();
    if (firestoreDb && finalCustomer) {
      try {
        setDoc(doc(firestoreDb, 'customers', cleanPhone), {
          ...finalCustomer,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}
    }
  };

  const updateCustomerStamps = (phone, deltaOrAmount, isAbsolute = false) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    let updatedCust = null;
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.phone.replace(/\D/g, '') === cleanPhone);
      if (idx > -1) {
        const current = prev[idx];
        const newStamps = isAbsolute 
          ? Math.max(0, parseInt(deltaOrAmount, 10) || 0) 
          : Math.max(0, (current.stampsCount || 0) + (parseInt(deltaOrAmount, 10) || 0));
        updatedCust = { ...current, stampsCount: newStamps, loyaltyStamps: newStamps };
        return prev.map((c, i) => i === idx ? updatedCust : c);
      }
      const newStamps = Math.max(0, parseInt(deltaOrAmount, 10) || 0);
      updatedCust = { phone: cleanPhone, name: 'Cliente', stampsCount: newStamps, loyaltyStamps: newStamps, totalOrders: 0, bonuses: [] };
      return [...prev, updatedCust];
    });

    const firestoreDb = getFirestoreDb();
    if (firestoreDb && updatedCust) {
      try {
        setDoc(doc(firestoreDb, 'customers', cleanPhone), {
          ...updatedCust,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}
    }
  };

  const grantCustomerBonus = (phone, bonusData) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const newBonus = {
      id: 'b-' + Date.now(),
      date: new Date().toISOString(),
      ...bonusData
    };
    let updatedCust = null;

    setCustomers(prev => {
      const idx = prev.findIndex(c => c.phone.replace(/\D/g, '') === cleanPhone);
      if (idx > -1) {
        const current = prev[idx];
        const bonuses = Array.isArray(current.bonuses) ? [newBonus, ...current.bonuses] : [newBonus];
        let newStamps = current.stampsCount || 0;
        if (bonusData.addStamps) {
          newStamps = Math.max(0, newStamps + (parseInt(bonusData.addStamps, 10) || 0));
        }
        updatedCust = { ...current, bonuses, stampsCount: newStamps, loyaltyStamps: newStamps };
        return prev.map((c, i) => i === idx ? updatedCust : c);
      }
      let newStamps = bonusData.addStamps ? (parseInt(bonusData.addStamps, 10) || 0) : 0;
      updatedCust = {
        phone: cleanPhone,
        name: bonusData.customerName || 'Cliente',
        bonuses: [newBonus],
        stampsCount: newStamps,
        loyaltyStamps: newStamps,
        totalOrders: 0
      };
      return [...prev, updatedCust];
    });

    const firestoreDb = getFirestoreDb();
    if (firestoreDb && updatedCust) {
      try {
        setDoc(doc(firestoreDb, 'customers', cleanPhone), {
          ...updatedCust,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}
    }
  };

  const redeemCustomerReward = (phone, rewardNotes = '') => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const redeemEntry = {
      id: 'rew-' + Date.now(),
      date: new Date().toISOString(),
      type: 'reward_redeem',
      title: 'Prensado Grátis Resgatado (10 Selos)',
      notes: rewardNotes || 'Resgate de 10 selos acumulados do Cartão Fidelidade'
    };
    let updatedCust = null;

    setCustomers(prev => {
      return prev.map(c => {
        if (c.phone.replace(/\D/g, '') === cleanPhone) {
          const currentStamps = c.stampsCount || 0;
          const nextStamps = Math.max(0, currentStamps - 10);
          const bonuses = Array.isArray(c.bonuses) ? [redeemEntry, ...c.bonuses] : [redeemEntry];
          updatedCust = { ...c, stampsCount: nextStamps, loyaltyStamps: nextStamps, bonuses };
          return updatedCust;
        }
        return c;
      });
    });

    const firestoreDb = getFirestoreDb();
    if (firestoreDb && updatedCust) {
      try {
        setDoc(doc(firestoreDb, 'customers', cleanPhone), {
          ...updatedCust,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}
    }
  };

  const deleteCustomer = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    setCustomers(prev => prev.filter(c => c.phone.replace(/\D/g, '') !== cleanPhone));
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        deleteDoc(doc(firestoreDb, 'customers', cleanPhone)).catch(() => {});
      } catch (err) {}
    }
  };

  // --- Gestão de Equipe & Operadores de Turno ---
  const loginOperator = (op) => {
    sessionStorage.setItem('nuu_current_operator', JSON.stringify(op));
    setCurrentOperator(op);
  };

  const logoutOperator = () => {
    sessionStorage.removeItem('nuu_current_operator');
    setCurrentOperator(null);
  };

  const upsertOperator = (opData) => {
    setOperators(prev => {
      if (opData.id) {
        return prev.map(o => o.id === opData.id ? { ...o, ...opData } : o);
      }
      return [...prev, { ...opData, id: 'op-' + Date.now(), active: true }];
    });
  };

  const deleteOperator = (id) => {
    setOperators(prev => prev.filter(o => o.id !== id));
  };

  // --- Turnos de Caixa (Abertura, Sangria, Fechamento) ---
  const openCashShift = (param = {}) => {
    let operatorName = currentOperator ? `${currentOperator.name} (${currentOperator.role})` : 'Operador';
    let initialFloat = 100.00;

    if (typeof param === 'number') {
      initialFloat = param;
    } else if (typeof param === 'object' && param !== null) {
      if (param.operatorName) operatorName = param.operatorName;
      if (param.initialFloat !== undefined) initialFloat = parseFloat(param.initialFloat) || 0;
    }

    const newShift = {
      id: 'shift-' + Date.now(),
      openedAt: new Date().toISOString(),
      closedAt: null,
      operatorName,
      initialFloat: parseFloat(initialFloat) || 0,
      bleedTotal: 0,
      supplyTotal: 0,
      bleeds: [],
      supplies: [],
      status: 'open'
    };
    setCashShifts(prev => [newShift, ...prev]);
    return newShift;
  };

  const addShiftBleed = (arg1, arg2) => {
    if (!activeShift) return;
    let val = 0;
    let reason = 'Sangria de caixa';
    if (typeof arg1 === 'object' && arg1 !== null) {
      val = parseFloat(arg1.amount) || 0;
      reason = arg1.reason || reason;
    } else {
      val = parseFloat(arg1) || 0;
      if (arg2) reason = arg2;
    }
    if (val <= 0) return;

    const bleedEntry = { id: 'bleed-' + Date.now(), amount: val, reason, date: new Date().toISOString() };
    
    setCashShifts(prev => prev.map(s => {
      if (s.id === activeShift.id) {
        return {
          ...s,
          bleedTotal: (s.bleedTotal || 0) + val,
          bleeds: [...(s.bleeds || []), bleedEntry]
        };
      }
      return s;
    }));

    // Registra no fluxo de caixa
    setTransactions(t => [{
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      type: 'expense',
      category: 'Sangria de Caixa',
      value: val,
      description: `Sangria: ${reason} (Turno #${activeShift.id})`
    }, ...t]);
  };

  const addShiftSupply = (arg1, arg2) => {
    if (!activeShift) return;
    let val = 0;
    let reason = 'Reforço de troco';
    if (typeof arg1 === 'object' && arg1 !== null) {
      val = parseFloat(arg1.amount) || 0;
      reason = arg1.reason || reason;
    } else {
      val = parseFloat(arg1) || 0;
      if (arg2) reason = arg2;
    }
    if (val <= 0) return;

    const supplyEntry = { id: 'supply-' + Date.now(), amount: val, reason, date: new Date().toISOString() };

    setCashShifts(prev => prev.map(s => {
      if (s.id === activeShift.id) {
        return {
          ...s,
          supplyTotal: (s.supplyTotal || 0) + val,
          supplies: [...(s.supplies || []), supplyEntry]
        };
      }
      return s;
    }));

    setTransactions(t => [{
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      type: 'income',
      category: 'Suprimento de Caixa',
      value: val,
      description: `Suprimento (Troco): ${reason} (Turno #${activeShift.id})`
    }, ...t]);
  };

  const closeCashShift = (counts = {}, notes = '') => {
    if (!activeShift) return;
    
    const countedCash = parseFloat(counts.cash ?? counts.countedCash ?? 0) || 0;
    const countedCard = parseFloat(counts.card ?? counts.countedCard ?? 0) || 0;
    const countedPix = parseFloat(counts.pix ?? counts.countedPix ?? 0) || 0;
    const finalNotes = notes || counts.notes || '';
    
    // Calcula vendas no turno
    const shiftOrders = orders.filter(o => 
      o.status === 'delivered' && 
      new Date(o.date) >= new Date(activeShift.openedAt)
    );

    const cashSales = shiftOrders.filter(o => o.paymentMethod?.toLowerCase().includes('dinheiro')).reduce((acc, o) => acc + o.total, 0);
    const pixSales = shiftOrders.filter(o => o.paymentMethod?.toLowerCase().includes('pix')).reduce((acc, o) => acc + o.total, 0);
    const cardSales = shiftOrders.filter(o => o.paymentMethod?.toLowerCase().includes('cartão') || o.paymentMethod?.toLowerCase().includes('cartao')).reduce((acc, o) => acc + o.total, 0);

    const expectedCash = activeShift.initialFloat + cashSales + (activeShift.supplyTotal || 0) - (activeShift.bleedTotal || 0);
    const diff = countedCash - expectedCash;

    let closedShiftSummary = null;

    setCashShifts(prev => prev.map(s => {
      if (s.id === activeShift.id) {
        closedShiftSummary = {
          ...s,
          status: 'closed',
          closedAt: new Date().toISOString(),
          cashSales,
          pixSales,
          cardSales,
          countedCash,
          countedCard,
          countedPix,
          expectedCash,
          difference: diff,
          notes: finalNotes
        };
        return closedShiftSummary;
      }
      return s;
    }));

    return closedShiftSummary;
  };

  // --- Criação de Pedidos e Baixa Automática de Insumos/Embalagens ---
  const createOrder = (orderData) => {
    const newId = (Math.max(...orders.map(o => parseInt(o.id) || 0), 1000) + 1).toString();
    const newOrder = {
      id: newId,
      status: 'pending',
      date: new Date().toISOString(),
      ...orderData
    };

    // 1. Baixa automática de ingredientes e embalagens
    const updatedInventory = [...inventory];

    // Dedução de sacola kraft por pedido (se entrega)
    if (newOrder.type === 'delivery' && storeSettings.autoPackagingDeduction) {
      const bag = updatedInventory.find(i => i.id === 103);
      if (bag) bag.quantity = Math.max(0, bag.quantity - 1);
    }

    newOrder.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.recipe) {
        prod.recipe.forEach(recipeItem => {
          const invItem = updatedInventory.find(i => i.id === recipeItem.ingredientId);
          if (invItem) {
            const requiredQty = recipeItem.quantity * item.quantity;
            invItem.quantity = Math.max(0, invItem.quantity - requiredQty);
          }
        });
      }
    });

    const nextOrders = [newOrder, ...orders];
    setInventory(updatedInventory);
    setOrders(nextOrders);

    // Incrementa cupom se foi usado
    if (newOrder.couponCode) {
      setCoupons(prev => prev.map(c => c.code.toUpperCase() === newOrder.couponCode.toUpperCase() ? { ...c, usesCount: (c.usesCount || 0) + 1 } : c));
    }

    // Grava/atualiza memória do cliente
    if (newOrder.phone) {
      const clean = newOrder.phone.replace(/\D/g, '');
      setCustomers(prev => {
        const found = prev.find(c => c.phone.replace(/\D/g, '') === clean);
        if (found) {
          return prev.map(c => c.phone.replace(/\D/g, '') === clean ? {
            ...c,
            name: newOrder.customerName || c.name,
            address: newOrder.address || c.address,
            neighborhood: newOrder.neighborhood || c.neighborhood,
            totalOrders: (c.totalOrders || 0) + 1,
            lastOrderAt: new Date().toISOString()
          } : c);
        } else {
          return [...prev, {
            phone: clean,
            name: newOrder.customerName,
            address: newOrder.address,
            neighborhood: newOrder.neighborhood,
            stampsCount: 0,
            totalOrders: 1,
            lastOrderAt: new Date().toISOString()
          }];
        }
      });
    }


    // Salva no Firebase Firestore com sanitização estrita e proteção absoluta contra sobrescrita
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      (async () => {
        let targetId = String(newOrder.id);
        try {
          const existingSnap = await getDoc(doc(firestoreDb, 'orders', targetId));
          if (existingSnap.exists()) {
            const collisionSafeId = `${targetId}-${Date.now().toString().slice(-4)}`;
            targetId = collisionSafeId;
            newOrder.id = targetId;
            setOrders(prev => prev.map(o => o.id === newId ? { ...o, id: targetId } : o));
          }
          const cleanPayload = cleanFirestoreData({
            ...newOrder,
            id: targetId,
            updatedAt: new Date().toISOString()
          });
          await setDoc(doc(firestoreDb, 'orders', targetId), cleanPayload);
          console.log(`[Firestore] Pedido #${targetId} gravado com sucesso!`);
        } catch (err) {
          console.error('[Firestore] Erro ao gravar pedido, executando retry seguro:', err);
          try {
            const fallbackPayload = cleanFirestoreData({
              id: targetId,
              customerName: newOrder.customerName || 'Cliente',
              phone: newOrder.phone || '',
              type: newOrder.type || 'delivery',
              address: newOrder.address || '',
              neighborhood: newOrder.neighborhood || '',
              distanceKm: newOrder.distanceKm || null,
              paymentMethod: newOrder.paymentMethod || 'Pix',
              paymentStatus: newOrder.paymentStatus || 'pending',
              paymentProvider: newOrder.paymentProvider || 'manual',
              paymentId: newOrder.paymentId || null,
              changeFor: newOrder.changeFor || null,
              items: newOrder.items || [],
              deliveryFee: Number(newOrder.deliveryFee) || 0,
              discount: Number(newOrder.discount) || 0,
              couponCode: newOrder.couponCode || null,
              total: Number(newOrder.total) || 0,
              status: newOrder.status || 'pending',
              date: newOrder.date || new Date().toISOString(),
              createdAt: newOrder.date || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await setDoc(doc(firestoreDb, 'orders', targetId), fallbackPayload);
            console.log(`[Firestore] Pedido #${targetId} gravado via fallback com sucesso!`);
          } catch (retryErr) {
            console.error('[Firestore CRÍTICO] Falha definitiva no retry do pedido:', retryErr);
          }
        }
      })();
    }

    // Dispara alerta sonoro e broadcast
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'ORDERS_SYNC', orders: nextOrders, isNewOrder: true });
        ch.close();
      }
    } catch (e) {}

    return newOrder;
  };

  // --- Atualização de Status do Pedido ---
  const updateOrderStatus = (orderId, newStatus) => {
    let nextOrders = [];
    setOrders(prev => {
      nextOrders = prev.map(order => {
        if (order.id === orderId) {
          const updated = { 
            ...order, 
            status: newStatus,
            shippedAt: newStatus === 'shipping' ? new Date().toISOString() : order.shippedAt,
            deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : order.deliveredAt
          };
          
          // Se entregue: gera receita e pontua fidelidade do cliente
          if (newStatus === 'delivered' && order.status !== 'delivered') {
            // Calcula dedução da taxa de cartão (se aplicável)
            let netValue = order.total;
            const payLower = (order.paymentMethod || '').toLowerCase();
            if (payLower.includes('débito') || payLower.includes('debito')) {
              netValue = order.total * (1 - (storeSettings.cardDebitFee / 100));
            } else if (payLower.includes('crédito') || payLower.includes('credito')) {
              netValue = order.total * (1 - (storeSettings.cardCreditFee / 100));
            }

            const transactionId = 't-' + Date.now();
            const newTransaction = {
              id: transactionId,
              orderId: String(order.id),
              date: new Date().toISOString(),
              type: 'income',
              category: 'Vendas',
              value: parseFloat(netValue.toFixed(2)),
              grossValue: order.total,
              description: `Pedido #${order.id} (${order.customerName}) - ${order.paymentMethod}`
            };
            setTransactions(t => [newTransaction, ...t]);

            // Emissão de Nota Fiscal
            const nfId = `NF-${order.id}`;
            const newNf = {
              id: nfId,
              type: 'saida',
              referenceId: order.id,
              customerName: order.customerName,
              customerCpf: '***.***.***-**',
              date: new Date().toISOString(),
              total: order.total,
              items: order.items,
              key: `352606` + Math.floor(100000000000000000 + Math.random() * 900000000000000000)
            };
            setInvoices(i => [newNf, ...i]);

            // --- CARTÃO FIDELIDADE NUU PRENSADO (100% AUTOMÁTICO) ---
            if (order.phone) {
              const cleanPhone = String(order.phone).replace(/\D/g, '');
              if (cleanPhone) {
                // Total de pedidos entregues para este cliente (incluindo o atual)
                const prevDeliveredCount = (nextOrders || []).filter(o => 
                  o.phone && 
                  String(o.phone).replace(/\D/g, '') === cleanPhone && 
                  o.status === 'delivered'
                ).length;

                setCustomers(custs => {
                  const existingIndex = custs.findIndex(c => c.phone && String(c.phone).replace(/\D/g, '') === cleanPhone);
                  const currentCust = existingIndex > -1 ? custs[existingIndex] : null;
                  const currentStamps = currentCust ? (currentCust.stampsCount || 0) : 0;
                  const newStamps = currentStamps + 1;

                  // Condição automática do 10º pedido: completou 10 selos ou total de pedidos entregues é múltiplo de 10
                  const isTenthOrder = (newStamps >= 10) || (prevDeliveredCount > 0 && prevDeliveredCount % 10 === 0);

                  let newBonuses = currentCust && Array.isArray(currentCust.bonuses) ? [...currentCust.bonuses] : [];
                  let finalStamps = newStamps;

                  if (isTenthOrder) {
                    // Gera o Voucher Único exclusivo (Ex: NUU10-9876)
                    const suffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : Math.floor(1000 + Math.random() * 9000);
                    const voucherCode = `NUU10-${suffix}`;

                    // Cadastra o cupom oficial no sistema com 1 Lanche Grátis (R$ 25,00)
                    const fidelityCoupon = {
                      id: `cp-fid-${Date.now()}`,
                      code: voucherCode,
                      type: 'fixed',
                      value: 25.00,
                      discount: 25.00,
                      minOrder: 0,
                      active: true,
                      usesCount: 0,
                      maxUses: 1,
                      isFidelityVoucher: true,
                      customerPhone: cleanPhone,
                      customerName: order.customerName || 'Cliente',
                      description: `Voucher Fidelidade: 10º Pedido Concluído - 1 Lanche Grátis (R$ 25,00) para ${order.customerName || 'Cliente'}`,
                      createdAt: new Date().toISOString()
                    };

                    upsertCoupon(fidelityCoupon);

                    // Registra o bônus no histórico do cliente
                    const bonusEntry = {
                      id: 'fid-10-' + Date.now(),
                      type: 'fidelity_10_voucher',
                      title: 'Voucher 10º Pedido Concluído (Lanche Grátis)',
                      code: voucherCode,
                      value: '1 Lanche Grátis (R$ 25,00)',
                      voucherCode: voucherCode,
                      grantedAt: new Date().toISOString(),
                      orderId: order.id,
                      notes: `Gerado automaticamente após a conclusão do ${prevDeliveredCount}º pedido no Nuu Prensado.`
                    };
                    newBonuses.unshift(bonusEntry);

                    // Reinicia o ciclo de selos (decrementa 10)
                    finalStamps = Math.max(0, newStamps - 10);

                    // Mensagem Oficial do WhatsApp com o Voucher
                    const custName = (order.customerName || 'Cliente').trim();
                    const whatsappMsg = `🎉 *PARABÉNS, ${custName.toUpperCase()}!* 🌭🎉\n\n` +
                      `Você acabou de completar seu *10º pedido* no *Nuu Prensado* e preencheu todo o seu *Cartão Fidelidade*! ⭐⭐⭐\n\n` +
                      `Como prometido, seu próximo lanche é *TOTALMENTE GRATUITO* por nossa conta! 🎁\n\n` +
                      `🎫 *SEU VOUCHER EXCLUSIVO:* *${voucherCode}*\n\n` +
                      `👉 Para resgatar, basta inserir este cupom no carrinho do nosso cardápio digital ou enviar aqui no WhatsApp no seu próximo pedido!\n\n` +
                      `Muito obrigado por ser nosso cliente fiel! ❤️🌭`;

                    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

                    // Notifica globalmente o alerta de celebração
                    setFidelityAlert({
                      customerName: custName,
                      phone: cleanPhone,
                      voucherCode,
                      whatsappUrl,
                      message: whatsappMsg,
                      orderId: order.id
                    });

                    // Toca som festivo
                    playNotificationChime();

                    // Tenta abrir o WhatsApp imediatamente
                    try {
                      if (typeof window !== 'undefined') {
                        window.open(whatsappUrl, '_blank');
                      }
                    } catch (e) {
                      console.warn('Popup WhatsApp:', e);
                    }
                  }

                  const updatedCustomer = {
                    ...(currentCust || { phone: cleanPhone, name: order.customerName || 'Cliente' }),
                    name: order.customerName && (!currentCust?.name || currentCust.name === 'Cliente') ? order.customerName : (currentCust?.name || 'Cliente'),
                    address: order.address || currentCust?.address || '',
                    neighborhood: order.neighborhood || currentCust?.neighborhood || '',
                    stampsCount: finalStamps,
                    loyaltyStamps: finalStamps,
                    totalOrders: (currentCust?.totalOrders || 0) + 1,
                    lastOrderAt: new Date().toISOString(),
                    bonuses: newBonuses
                  };

                  const db = getFirestoreDb();
                  if (db) {
                    try {
                      setDoc(doc(db, 'customers', cleanPhone), {
                        ...updatedCustomer,
                        updatedAt: new Date().toISOString()
                      }, { merge: true }).catch(() => {});
                    } catch (err) {}
                  }

                  if (existingIndex > -1) {
                    return custs.map((c, i) => i === existingIndex ? updatedCustomer : c);
                  } else {
                    return [...custs, updatedCustomer];
                  }
                });
              }
            }
          } else if (order.status === 'delivered' && newStatus !== 'delivered') {
            // Se saiu de entregue (ex: cancelado ou retornado à chapa): estorna e remove a receita do faturamento
            setTransactions(prev => prev.filter(t => t.orderId !== String(order.id) && !t.description?.includes(`Pedido #${order.id}`)));
          }
          return updated;
        }
        return order;
      });
      return nextOrders;
    });

    // Firebase update se configurado
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        const fbUpdate = { 
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        if (newStatus === 'shipping') fbUpdate.shippedAt = new Date().toISOString();
        if (newStatus === 'delivered') fbUpdate.deliveredAt = new Date().toISOString();
        updateDoc(doc(firestoreDb, 'orders', String(orderId)), fbUpdate).catch(() => {});
      } catch (err) {}
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'ORDERS_SYNC', orders: nextOrders, isNewOrder: false });
        ch.close();
      }
    } catch (e) {}
  };

  // --- Cancelamento de Pedido com Estorno Financeiro e Estoque ---
  const cancelOrder = (orderId, reason = 'Cancelado pela loja') => {
    const targetOrder = orders.find(o => String(o.id) === String(orderId));

    // 1. Atualizar status para 'canceled'
    let nextOrders = [];
    setOrders(prev => {
      nextOrders = prev.map(order => {
        if (String(order.id) === String(orderId)) {
          return {
            ...order,
            status: 'canceled',
            cancelReason: reason,
            canceledAt: new Date().toISOString()
          };
        }
        return order;
      });
      localStorage.setItem('hd_orders', JSON.stringify(nextOrders));
      return nextOrders;
    });

    // 2. Estorno financeiro: remove qualquer transação de faturamento/receita deste pedido
    setTransactions(prev => prev.filter(t => {
      const isOrderTrans = t.orderId === String(orderId) || 
        (t.description && t.description.includes(`Pedido #${orderId}`));
      return !isOrderTrans;
    }));

    // 3. Estorno de estoque: devolve os insumos ao inventário se o pedido não estava cancelado
    if (targetOrder && targetOrder.items && targetOrder.status !== 'canceled') {
      setInventory(prevInv => {
        const updated = [...prevInv];
        if (targetOrder.type === 'delivery' && storeSettings.autoPackagingDeduction) {
          const bag = updated.find(i => i.id === 103);
          if (bag) bag.quantity += 1;
        }
        targetOrder.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod && prod.recipe) {
            prod.recipe.forEach(recipeItem => {
              const invItem = updated.find(i => i.id === recipeItem.ingredientId);
              if (invItem) {
                invItem.quantity += (recipeItem.quantity * item.quantity);
              }
            });
          }
        });
        return updated;
      });
    }

    // 4. Estorno de fidelidade se havia sido pontuado
    if (targetOrder && targetOrder.status === 'delivered' && targetOrder.phone) {
      const cleanPhone = targetOrder.phone.replace(/\D/g, '');
      setCustomers(prev => prev.map(c => {
        if (c.phone.replace(/\D/g, '') === cleanPhone) {
          return {
            ...c,
            stampsCount: Math.max(0, (c.stampsCount || 0) - 1),
            totalOrders: Math.max(0, (c.totalOrders || 1) - 1)
          };
        }
        return c;
      }));
    }

    // 5. Atualizar Firebase Firestore para notificar o cliente em tempo real
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        updateDoc(doc(firestoreDb, 'orders', String(orderId)), {
          status: 'canceled',
          cancelReason: reason,
          canceledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      } catch (err) {}
    }

    // 6. BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ 
          type: 'ORDERS_SYNC', 
          orders: nextOrders, 
          canceledOrderId: orderId,
          cancelReason: reason 
        });
        ch.close();
      }
    } catch (e) {}
  };

  // --- Exclusão de Pedido com Estorno Financeiro e Notificação ---
  const deleteOrder = (orderId) => {
    const targetOrder = orders.find(o => String(o.id) === String(orderId));

    // 1. Estorno financeiro imediato: remove receita faturada em transactions
    setTransactions(prev => prev.filter(t => {
      const isOrderTrans = t.orderId === String(orderId) || 
        (t.description && t.description.includes(`Pedido #${orderId}`));
      return !isOrderTrans;
    }));

    // 2. Estorno de estoque se não estava cancelado
    if (targetOrder && targetOrder.items && targetOrder.status !== 'canceled') {
      setInventory(prevInv => {
        const updated = [...prevInv];
        if (targetOrder.type === 'delivery' && storeSettings.autoPackagingDeduction) {
          const bag = updated.find(i => i.id === 103);
          if (bag) bag.quantity += 1;
        }
        targetOrder.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod && prod.recipe) {
            prod.recipe.forEach(recipeItem => {
              const invItem = updated.find(i => i.id === recipeItem.ingredientId);
              if (invItem) {
                invItem.quantity += (recipeItem.quantity * item.quantity);
              }
            });
          }
        });
        return updated;
      });
    }

    // 3. Remover de orders
    let nextOrders = [];
    setOrders(prev => {
      nextOrders = prev.filter(o => String(o.id) !== String(orderId));
      localStorage.setItem('hd_orders', JSON.stringify(nextOrders));
      return nextOrders;
    });

    // 4. Firestore
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        deleteDoc(doc(firestoreDb, 'orders', String(orderId))).catch(() => {});
      } catch (err) {}
    }

    // 5. BroadcastChannel notificando exclusão
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ 
          type: 'ORDERS_SYNC', 
          orders: nextOrders, 
          deletedOrderId: orderId 
        });
        ch.close();
      }
    } catch (e) {}
  };

  // --- Estoque e Entradas ---
  const adjustStock = (ingredientId, amount, type = 'adjust') => {
    setInventory(prev => prev.map(item => {
      if (item.id === ingredientId) {
        let newQty = item.quantity;
        if (type === 'add') newQty += amount;
        else if (type === 'remove') newQty = Math.max(0, newQty - amount);
        else newQty = Math.max(0, amount);

        if (type === 'add' && amount > 0) {
          const cost = amount * 2.5;
          setTransactions(t => [{
            id: 't-' + Date.now(),
            date: new Date().toISOString(),
            type: 'expense',
            category: 'Estoque',
            value: parseFloat(cost.toFixed(2)),
            description: `Compra manual de ${amount} ${item.unit} de ${item.name}`
          }, ...t]);
        }

        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const registerInflowInvoice = (nfData) => {
    const nfId = `NF-${Math.floor(2000 + Math.random() * 5000)}`;
    const newNf = {
      id: nfId,
      type: 'entrada',
      date: new Date().toISOString(),
      key: `352606` + Math.floor(100000000000000000 + Math.random() * 900000000000000000),
      ...nfData
    };
    
    setInvoices(prev => [newNf, ...prev]);

    setTransactions(prev => [{
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      type: 'expense',
      category: 'Estoque',
      value: nfData.total,
      description: `Nota Fiscal Entrada #${newNf.id} - ${nfData.supplier}`
    }, ...prev]);

    if (nfData.items) {
      setInventory(prev => prev.map(invItem => {
        const itemInNf = nfData.items.find(i => i.name.toLowerCase().includes(invItem.name.toLowerCase()) || invItem.name.toLowerCase().includes(i.name.toLowerCase()));
        if (itemInNf) {
          return { ...invItem, quantity: invItem.quantity + itemInNf.quantity };
        }
        return invItem;
      }));
    }
  };

  const manualStockInflow = (data) => {
    if (data.mode === 'new') {
      const newId = Math.max(...inventory.map(i => i.id), 0) + 1;
      const newItem = {
        id: newId,
        name: data.name,
        quantity: parseFloat(data.quantity) || 0,
        minQuantity: parseFloat(data.minQuantity) || 10,
        unit: data.unit || 'un'
      };
      setInventory(prev => [...prev, newItem]);
    } else {
      adjustStock(parseInt(data.ingredientId), parseFloat(data.quantity) || 0, 'add');
    }

    if (data.cost && parseFloat(data.cost) > 0) {
      setTransactions(t => [{
        id: 't-' + Date.now(),
        date: new Date().toISOString(),
        type: 'expense',
        category: 'Estoque',
        value: parseFloat(data.cost),
        description: `Entrada manual: ${data.name || 'Insumo'} (${data.reason || 'Reposição'})`
      }, ...t]);
    }
  };

  // --- Produtos e Complementos ---
  const upsertProduct = (productData) => {
    let next;
    let savedItem;
    if (productData.id) {
      savedItem = productData;
      next = products.map(p => p.id === productData.id ? { ...p, ...productData } : p);
    } else {
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      savedItem = { ...productData, id: newId };
      next = [...products, savedItem];
    }
    setProducts(next);
    syncProductToRemote(savedItem);
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'PRODUCTS_SYNC', products: next });
        ch.close();
      }
    } catch (e) {}
  };

  const toggleProductStatus = (productId) => {
    let targetProduct = null;
    let nextProducts = [];
    setProducts(prev => {
      nextProducts = prev.map(p => {
        if (p.id === productId) {
          targetProduct = { ...p, active: !p.active };
          return targetProduct;
        }
        return p;
      });
      return nextProducts;
    });

    if (targetProduct) {
      syncProductToRemote(targetProduct);
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const ch = new BroadcastChannel('nuu_system_channel');
          ch.postMessage({ type: 'PRODUCT_STATUS_SYNC', productId, active: targetProduct.active });
          ch.close();
        }
      } catch (e) {}
    }
  };

  const deleteProduct = (id) => {
    let nextProducts = [];
    setProducts(prev => {
      nextProducts = prev.filter(p => p.id !== id);
      return nextProducts;
    });
    const db = getFirestoreDb();
    if (db) {
      deleteDoc(doc(db, 'products', String(id))).catch(() => {});
    }
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'PRODUCTS_SYNC', products: nextProducts });
        ch.close();
      }
    } catch (e) {}
  };

  const toggleComplementStatus = (id) => {
    let targetComp = null;
    let nextComplements = [];
    setComplements(prev => {
      nextComplements = prev.map(c => {
        if (c.id === id) {
          targetComp = { ...c, active: !c.active };
          return targetComp;
        }
        return c;
      });
      return nextComplements;
    });

    if (targetComp) {
      syncComplementToRemote(targetComp);
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const ch = new BroadcastChannel('nuu_system_channel');
          ch.postMessage({ type: 'COMPLEMENT_STATUS_SYNC', complementId: id, active: targetComp.active });
          ch.close();
        }
      } catch (e) {}
    }
  };

  const upsertComplement = (compData) => {
    let savedItem;
    let nextComplements = [];
    setComplements(prev => {
      if (compData.id) {
        savedItem = compData;
        nextComplements = prev.map(c => c.id === compData.id ? { ...c, ...compData } : c);
      } else {
        savedItem = { ...compData, id: 'comp-' + Date.now() };
        nextComplements = [...prev, savedItem];
      }
      return nextComplements;
    });
    if (savedItem) {
      syncComplementToRemote(savedItem);
    }
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'COMPLEMENTS_SYNC', complements: nextComplements });
        ch.close();
      }
    } catch (e) {}
  };

  const deleteComplement = (id) => {
    let nextComplements = [];
    setComplements(prev => {
      nextComplements = prev.filter(c => c.id !== id);
      return nextComplements;
    });
    const db = getFirestoreDb();
    if (db) {
      deleteDoc(doc(db, 'complements', String(id))).catch(() => {});
    }
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'COMPLEMENTS_SYNC', complements: nextComplements });
        ch.close();
      }
    } catch (e) {}
  };

  // --- Transações do Fluxo de Caixa ---
  const addTransaction = (tData) => {
    const newT = {
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      ...tData,
      value: parseFloat(tData.value) || 0
    };
    setTransactions(prev => [newT, ...prev]);
  };

  const updateTransaction = (id, updatedData) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData, value: parseFloat(updatedData.value) || 0 } : t));
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- Cotações ---
  const addQuotation = (quotData) => {
    setQuotations(prev => [{ id: 'q-' + Date.now(), lastUpdated: new Date().toISOString().split('T')[0], ...quotData }, ...prev]);
  };

  const updateQuotation = (id, updatedData) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : q));
  };

  const deleteQuotation = (id) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  const resetToOfficialMenu = () => {
    setProducts(INITIAL_PRODUCTS);
    setInventory(INITIAL_INVENTORY);
    setComplements(INITIAL_COMPLEMENTS);
    localStorage.setItem('nuu_products_v15', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('nuu_products_v14', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('hd_inventory_v6', JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem('hd_inventory_v5', JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem('nuu_complements_v7', JSON.stringify(INITIAL_COMPLEMENTS));
    localStorage.setItem('nuu_complements_v6', JSON.stringify(INITIAL_COMPLEMENTS));
    INITIAL_PRODUCTS.forEach(p => syncProductToRemote(p));
    INITIAL_COMPLEMENTS.forEach(c => syncComplementToRemote(c));
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'PRODUCTS_SYNC', products: INITIAL_PRODUCTS });
        ch.postMessage({ type: 'COMPLEMENTS_SYNC', complements: INITIAL_COMPLEMENTS });
        ch.close();
      }
    } catch (e) {}
  };

  return (
    <SystemContext.Provider value={{
      products,
      inventory,
      orders,
      transactions,
      invoices,
      quotations,
      complements,
      storeSettings,
      deliveryNeighborhoods,
      montesClarosNeighborhoods: MONTES_CLAROS_NEIGHBORHOODS,
      deliveryRadiuses,
      coupons,
      motoboys,
      customers,
      operators,
      currentOperator,
      loginOperator,
      logoutOperator,
      upsertOperator,
      deleteOperator,
      cashShifts,
      activeShift,
      currentShift: activeShift,
      supabaseActive: false,
      SUPABASE_SCHEMA_SQL: '',
      saveSupabaseConfig,
      firebaseActive,
      FIRESTORE_RULES_GUIDE,
      isStoreOpenNow,
      getStorePauseStatus,
      pauseStore,
      resumeStore,
      openStore,
      closeStore,
      updateStoreSettings,
      calculateDeliveryFee,
      validateCoupon,
      upsertCoupon,
      deleteCoupon,
      upsertNeighborhood,
      deleteNeighborhood,
      upsertRadius,
      deleteRadius,
      upsertMotoboy,
      deleteMotoboy,
      assignOrderMotoboy,
      settleMotoboyPayments,
      lookupCustomer,
      saveCustomer,
      updateCustomerStamps,
      grantCustomerBonus,
      redeemCustomerReward,
      deleteCustomer,
      openCashShift,
      closeCashShift,
      addShiftBleed,
      addShiftSupply,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      deleteOrder,
      adjustStock,
      manualStockInflow,
      registerInflowInvoice,
      upsertProduct,
      deleteProduct,
      toggleProductStatus,
      toggleComplementStatus,
      upsertComplement,
      deleteComplement,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      resetToOfficialMenu,
      playNotificationChime,
      fidelityAlert,
      setFidelityAlert,
      showAlert,
      showConfirm,
      closeSystemModal: () => setSystemModal(null)
    }}>
      {children}

      {/* MODAL OFICIAL DO SISTEMA NUU PRENSADO (Substitui alerts e confirms do navegador) */}
      {systemModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !systemModal.isConfirm) {
              setSystemModal(null);
            }
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '100%',
              maxWidth: '430px',
              padding: '1.75rem',
              borderRadius: '18px',
              backgroundColor: '#111827',
              border: `1px solid ${
                systemModal.type === 'success' ? 'rgba(34, 197, 94, 0.45)' :
                systemModal.type === 'warning' ? 'rgba(245, 158, 11, 0.45)' :
                systemModal.type === 'error' ? 'rgba(239, 68, 68, 0.45)' :
                'rgba(234, 179, 8, 0.45)'
              }`,
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Logo oficial no topo com glow e indicador de status */}
            <div style={{
              width: '78px',
              height: '78px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              border: `2px solid ${
                systemModal.type === 'success' ? 'rgba(34, 197, 94, 0.5)' :
                systemModal.type === 'warning' ? 'rgba(245, 158, 11, 0.5)' :
                systemModal.type === 'error' ? 'rgba(239, 68, 68, 0.5)' :
                'rgba(234, 179, 8, 0.5)'
              }`,
              boxShadow: `0 0 25px ${
                systemModal.type === 'success' ? 'rgba(34, 197, 94, 0.35)' :
                systemModal.type === 'warning' ? 'rgba(245, 158, 11, 0.35)' :
                systemModal.type === 'error' ? 'rgba(239, 68, 68, 0.35)' :
                'rgba(234, 179, 8, 0.35)'
              }`,
              padding: '10px',
              position: 'relative'
            }}>
              <img 
                src="/logoNuuPrensado-semfundo.png" 
                alt="Nuu Prensado" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {/* Indicador de status no cantinho da logo */}
              {systemModal.type === 'success' && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#111827',
                  borderRadius: '50%',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #22c55e'
                }}>
                  <CheckCircle size={15} color="#22c55e" />
                </div>
              )}
              {(systemModal.type === 'warning' || systemModal.type === 'error') && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#111827',
                  borderRadius: '50%',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: systemModal.type === 'error' ? '2px solid #ef4444' : '2px solid #f59e0b'
                }}>
                  <AlertCircle size={15} color={systemModal.type === 'error' ? '#ef4444' : '#f59e0b'} />
                </div>
              )}
              {systemModal.type === 'info' && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#111827',
                  borderRadius: '50%',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #eab308'
                }}>
                  <Info size={15} color="#eab308" />
                </div>
              )}
            </div>

            {/* Badge superior opcional */}
            {systemModal.badge && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--color-brand-yellow)',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  letterSpacing: '0.3px',
                  display: 'inline-block'
                }}>
                  {systemModal.badge}
                </span>
              </div>
            )}

            {/* Título */}
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 0.5rem 0'
            }}>
              {systemModal.title}
            </h3>

            {/* Mensagem */}
            <p style={{
              fontSize: '0.92rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
              margin: '0 0 1.5rem 0',
              whiteSpace: 'pre-line'
            }}>
              {systemModal.message}
            </p>

            {/* Ações: Confirmação dupla ou Alerta único */}
            {systemModal.isConfirm ? (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  onClick={systemModal.onCancel}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {systemModal.cancelText}
                </button>
                <button
                  type="button"
                  onClick={systemModal.onConfirm}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: systemModal.confirmColor || 'var(--color-brand)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {systemModal.confirmText}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={systemModal.onConfirm}
                autoFocus
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(184, 38, 27, 0.4)'
                }}
              >
                {systemModal.confirmText}
              </button>
            )}
          </div>
        </div>
      )}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
