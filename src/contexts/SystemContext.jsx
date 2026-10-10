import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getSupabaseClient, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  isSupabaseConfigured,
  mapSupabaseOrderToApp,
  mapAppOrderToSupabase,
  SUPABASE_SCHEMA_SQL 
} from '../services/supabase';
import { 
  getFirestoreDb, 
  isFirebaseConfigured, 
  saveFirebaseConfig,
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
  limit 
} from 'firebase/firestore';

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
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Requeijão / Creme Cheese, mussarela, bacon, milho, batata e molhos da casa.', 
    price: 17.50, 
    image: '/images/lanches/Prensadinho.jpg',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 11, quantity: 1 }, // Catupiry / Requeijão / Creme Cheese
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
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Requeijão / Creme Cheese, 150g de frango desfiado, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 22.00, 
    image: '/images/lanches/prensado de frango.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 7, quantity: 1 },  // 150g Frango desfiado
      { ingredientId: 11, quantity: 1 }, // Catupiry / Requeijão / Creme Cheese
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
    description: 'Pão, molho de tomate artesanal, 2 salsichas, Catupiry / Requeijão / Creme Cheese, 150g de pernil desfiado, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 22.00, 
    image: '/images/lanches/prensado de pernil.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 8, quantity: 1 },  // 150g Pernil desfiado
      { ingredientId: 11, quantity: 1 }, // Catupiry / Requeijão / Creme Cheese
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
    description: 'Pão, 2 salsichas, molho de tomate artesanal, Catupiry / Requeijão / Creme Cheese, 150g de costela desfiada, queijo / cheddar, bacon, batata, milho e molhos da casa.', 
    price: 25.00, 
    image: '/images/lanches/prensado de costela.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },  // Pão
      { ingredientId: 2, quantity: 2 },  // 2 Salsichas
      { ingredientId: 15, quantity: 1 }, // Molho de tomate artesanal
      { ingredientId: 9, quantity: 1 },  // 150g Costela desfiada
      { ingredientId: 11, quantity: 1 }, // Catupiry / Requeijão / Creme Cheese
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
  { id: 'bread-3-queijos', name: 'Pão 3 Queijos', category: 'complement', group: 'bread', groupName: 'Tipo de Pão', price: 0, active: true },
  { id: 'bread-parmesao', name: 'Pão Queijo Parmesão', category: 'complement', group: 'bread', groupName: 'Tipo de Pão', price: 0, active: true },

  // --- Opções Inclusas de Queijo Cremoso (Escolha 1) ---
  { id: 'creamy-catupiry', name: 'Catupiry Original', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },
  { id: 'creamy-requeijao', name: 'Requeijão Cremoso', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },
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
  { id: 1, name: 'Pão 3 Queijos', quantity: 60, minQuantity: 20, unit: 'un', unitCost: 1.00 },
  { id: 21, name: 'Pão Queijo Parmesão', quantity: 60, minQuantity: 20, unit: 'un', unitCost: 1.00 },
  { id: 2, name: 'Salsicha Premium', quantity: 150, minQuantity: 30, unit: 'un', unitCost: 0.60 },
  { id: 3, name: 'Bacon Fatiado / Crocante', quantity: 50, minQuantity: 15, unit: 'porção', unitCost: 1.50 },
  { id: 7, name: 'Frango Desfiado Temperado (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 3.50 },
  { id: 8, name: 'Pernil Desfiado Especial (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 4.50 },
  { id: 9, name: 'Costela Desfiada Suculenta (150g)', quantity: 30, minQuantity: 10, unit: 'porção (150g)', unitCost: 6.00 },
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
  openTime: '19:00',
  closeTime: '00:00',
  openDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
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
    'Sagrada Família': 5.00,
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
  // Experiência do Cardápio (Delivery)
  enableImmersiveView: false,
  defaultViewMode: 'grid'
};

// 5. BAIRROS DE ENTREGA (Montes Claros)
const INITIAL_NEIGHBORHOODS = [
  { id: 'nb-1', name: 'Sagrada Família', fee: 5.00, distanceKm: 1, active: true },
  { id: 'nb-2', name: 'Centro', fee: 5.00, distanceKm: 2.5, active: true },
  { id: 'nb-3', name: 'Cândida Câmara', fee: 5.00, distanceKm: 2, active: true },
  { id: 'nb-4', name: 'Todos os Santos', fee: 5.00, distanceKm: 2.5, active: true },
  { id: 'nb-5', name: 'Santa Rita', fee: 5.00, distanceKm: 2, active: true },
  { id: 'nb-6', name: 'Alice Maia', fee: 7.50, distanceKm: 3.5, active: true },
  { id: 'nb-7', name: 'Morada do Sol', fee: 7.50, distanceKm: 4, active: true },
  { id: 'nb-8', name: 'Major Prates', fee: 7.50, distanceKm: 4.5, active: true },
  { id: 'nb-9', name: 'Ibituruna', fee: 8.00, distanceKm: 5, active: true },
  { id: 'nb-10', name: 'São Luiz', fee: 7.50, distanceKm: 4, active: true },
  { id: 'nb-11', name: 'Maracanã', fee: 10.00, distanceKm: 6, active: true },
  { id: 'nb-12', name: 'Independência', fee: 10.00, distanceKm: 6.5, active: true },
  { id: 'nb-13', name: 'Renascença', fee: 10.00, distanceKm: 7, active: true },
  { id: 'nb-14', name: 'Delfino Magalhães', fee: 12.00, distanceKm: 8, active: true },
  { id: 'nb-15', name: 'Village do Lago', fee: 12.00, distanceKm: 9, active: true }
];

// 6. ZONAS DE RAIO POR QUILOMETRAGEM (KM)
const INITIAL_RADIUSES = [
  { id: 'rad-1', maxKm: 3, fee: 5.00, description: 'Até 3 km (Sagrada Família, Centro, Cândida Câmara...)', active: true },
  { id: 'rad-2', maxKm: 5, fee: 7.50, description: '3 km a 5 km (Major Prates, Morada do Sol, Ibituruna, Alice Maia...)', active: true },
  { id: 'rad-3', maxKm: 8, fee: 10.00, description: '5 km a 8 km (Renascença, Maracanã, Independência, Delfino...)', active: true },
  { id: 'rad-4', maxKm: 12, fee: 14.00, description: '8 km a 12 km (Outras regiões de Montes Claros)', active: true }
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
  { id: 'op-1', name: 'Kadu', role: 'Proprietário / Gerente', active: true, pin: '1234' },
  { id: 'op-2', name: 'Carlos', role: 'Atendente / Caixa', active: true, pin: '0000' },
  { id: 'op-3', name: 'Juliana', role: 'Atendente / Chapa', active: true, pin: '0000' }
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
  // --- Estados Principais ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('nuu_products_v14');
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
    const oldSaved = localStorage.getItem('nuu_products_v13') || localStorage.getItem('nuu_products_v12');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        const updated = parsed.map(p => {
          const initMatch = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
          if (initMatch) {
            return { ...p, image: initMatch.image };
          }
          return p;
        });
        const existingIds = new Set(updated.map(p => p.id));
        const missing = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id));
        return missing.length > 0 ? [...updated, ...missing] : updated;
      } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('hd_inventory_v5');
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
    return INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('hd_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('hd_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
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
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [complements, setComplements] = useState(() => {
    const saved = localStorage.getItem('nuu_complements_v6');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const oldV5 = localStorage.getItem('nuu_complements_v5');
    if (oldV5) {
      try {
        const parsed = JSON.parse(oldV5);
        return parsed.map(c => c.id === 'side-vinagrete' ? { ...c, name: 'Vinagrete' } : c);
      } catch (e) {}
    }
    return INITIAL_COMPLEMENTS;
  });

  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('nuu_store_settings_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeAddress && parsed.storeAddress.includes('Montes Claros')) {
          return { ...INITIAL_STORE_SETTINGS, ...parsed };
        }
      } catch (e) {}
    }
    const oldV2 = localStorage.getItem('nuu_store_settings_v2');
    if (oldV2) {
      try {
        const parsed = JSON.parse(oldV2);
        if (parsed.storeAddress && parsed.storeAddress.includes('Montes Claros')) {
          return { ...INITIAL_STORE_SETTINGS, ...parsed };
        }
      } catch (e) {}
    }
    return INITIAL_STORE_SETTINGS;
  });

  const [deliveryNeighborhoods, setDeliveryNeighborhoods] = useState(() => {
    const saved = localStorage.getItem('nuu_neighborhoods_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const old = localStorage.getItem('nuu_neighborhoods');
    if (old) {
      try {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed) && parsed.some(n => n.name === 'Sagrada Família')) {
          return parsed;
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
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [motoboys, setMotoboys] = useState(() => {
    const saved = localStorage.getItem('nuu_motoboys');
    return saved ? JSON.parse(saved) : INITIAL_MOTOBOYS;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('nuu_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [operators, setOperators] = useState(() => {
    const saved = localStorage.getItem('nuu_operators');
    return saved ? JSON.parse(saved) : INITIAL_OPERATORS;
  });

  const [currentOperator, setCurrentOperator] = useState(() => {
    const saved = sessionStorage.getItem('nuu_current_operator');
    if (saved) {
      try {
        return JSON.parse(saved);
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

  const [supabaseActive, setSupabaseActive] = useState(isSupabaseConfigured);
  const [firebaseActive, setFirebaseActive] = useState(isFirebaseConfigured);

  // Turno de caixa aberto ativo (se houver)
  const activeShift = cashShifts.find(s => s.status === 'open') || null;

  // --- Sincronização LocalStorage & BroadcastChannel ---
  useEffect(() => {
    localStorage.setItem('nuu_products_v14', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
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
    localStorage.setItem('nuu_complements_v6', JSON.stringify(complements));
  }, [complements]);

  useEffect(() => {
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
    localStorage.setItem('nuu_operators', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('nuu_cash_shifts', JSON.stringify(cashShifts));
  }, [cashShifts]);

  // Sincronização em tempo real entre abas (BroadcastChannel) e Supabase
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
    };

    if (channel) {
      channel.addEventListener('message', handleBroadcast);
    }

    // Se o Supabase estiver configurado, escuta mudanças no banco na nuvem!
    const supabase = getSupabaseClient();
    let supabaseSub = null;
    if (supabase) {
      try {
        supabaseSub = supabase
          .channel('public:orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.eventType === 'INSERT') {
              const mapped = mapSupabaseOrderToApp(payload.new);
              if (!mapped) return;
              setOrders(prev => {
                if (prev.some(o => String(o.id) === String(mapped.id))) {
                  return prev.map(o => String(o.id) === String(mapped.id) ? { ...o, ...mapped } : o);
                }
                playNotificationChime();
                return [mapped, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const mapped = mapSupabaseOrderToApp(payload.new);
              if (!mapped) return;
              setOrders(prev => prev.map(o => String(o.id) === String(mapped.id) ? { ...o, ...mapped } : o));
            } else if (payload.eventType === 'DELETE') {
              const deletedId = String(payload.old?.id || '');
              if (deletedId) {
                setOrders(prev => prev.filter(o => String(o.id) !== deletedId));
              }
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleBroadcast);
        channel.close();
      }
      if (supabase && supabaseSub) {
        supabase.removeChannel(supabaseSub);
      }
    };
  }, [supabaseActive]);

  // Busca inicial dos pedidos no Supabase quando conectado
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isMounted = true;
    const fetchRemoteOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('date', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data) && isMounted) {
          const remoteOrders = data.map(mapSupabaseOrderToApp).filter(Boolean);
          setOrders(prev => {
            const map = new Map(prev.map(o => [String(o.id), o]));
            remoteOrders.forEach(rem => {
              if (!map.has(String(rem.id))) {
                map.set(String(rem.id), rem);
              } else {
                map.set(String(rem.id), { ...map.get(String(rem.id)), ...rem });
              }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar pedidos remotos do Supabase:', err);
      }
    };

    fetchRemoteOrders();
    return () => {
      isMounted = false;
    };
  }, [supabaseActive]);

  // Sincronização em tempo real com Cloud Firestore (Firebase)
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
            const map = new Map(prev.map(o => [String(o.id), o]));
            remoteOrders.forEach(rem => {
              if (!map.has(String(rem.id))) {
                map.set(String(rem.id), rem);
              } else {
                map.set(String(rem.id), { ...map.get(String(rem.id)), ...rem });
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

  // --- Função para Salvar/Conectar Supabase ---
  const saveSupabaseConfig = (url, key) => {
    saveSupabaseCredentials(url, key);
    const configured = Boolean(url && key);
    setSupabaseActive(configured);
    return configured;
  };

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
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('nuu_system_channel');
        ch.postMessage({ type: 'SETTINGS_SYNC', settings: updated });
        ch.close();
      }
    } catch (e) {}
  };

  // Verifica se a loja está aberta considerando o toggle manual ou horário automático
  const isStoreOpenNow = () => {
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
      const [closeHour, closeMin] = (storeSettings.closeTime || '00:00').split(':').map(Number);

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

  // --- Cálculo Dinâmico de Frete (Bairro / Raio / Frete Grátis) ---
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

    const freeThreshold = Number(storeSettings?.freeDeliveryThreshold) || 70.00;
    if (freeThreshold > 0 && subtotal >= freeThreshold) {
      return { fee: 0, isFree: true, reason: `Frete Grátis acima de R$ ${freeThreshold.toFixed(2)}!` };
    }

    const radiusesList = (deliveryRadiuses && deliveryRadiuses.length > 0)
      ? deliveryRadiuses
      : (storeSettings?.deliveryRadius || INITIAL_RADIUSES);
    const sortedRadiuses = [...radiusesList].sort((a, b) => a.maxKm - b.maxKm);

    // 1. Se foi passada distância explicitamente (via GPS ou seleção de faixa em KM):
    if (distanceKm !== null && distanceKm !== undefined && !isNaN(distanceKm)) {
      const numKm = Number(distanceKm);
      const match = sortedRadiuses.find(r => numKm <= r.maxKm && r.active !== false);
      if (match) {
        return { 
          fee: Number(match.fee) || 0, 
          isFree: false, 
          distanceKm: numKm,
          reason: `Raio até ${match.maxKm} km (${match.description || 'da loja'})` 
        };
      }
      const maxBand = sortedRadiuses[sortedRadiuses.length - 1];
      if (maxBand) {
        return { 
          fee: Number(maxBand.fee) || 14.00, 
          isFree: false, 
          distanceKm: numKm,
          reason: `Acima de ${maxBand.maxKm} km (~${numKm.toFixed(1)} km da loja)` 
        };
      }
    }

    // 2. Se o cliente selecionou um bairro de Montes Claros:
    if (neighborhoodName) {
      const cleanName = (neighborhoodName || '').trim().toLowerCase();
      const found = (deliveryNeighborhoods || []).find(n => (n.name || '').trim().toLowerCase() === cleanName && n.active !== false);
      
      if (found) {
        // Se a loja estiver no modo de cálculo por raio e o bairro possuir km mapeado:
        if (storeSettings?.deliveryMode === 'radius' && found.distanceKm) {
          const matchRadius = sortedRadiuses.find(r => found.distanceKm <= r.maxKm && r.active !== false);
          if (matchRadius) {
            return { 
              fee: Number(matchRadius.fee) || Number(found.fee) || 0, 
              isFree: false, 
              distanceKm: found.distanceKm,
              reason: `Bairro ${found.name} (~${found.distanceKm} km da loja)` 
            };
          }
        }
        return { 
          fee: Number(found.fee) || 0, 
          isFree: false, 
          distanceKm: found.distanceKm || null,
          reason: `Bairro ${found.name}${found.distanceKm ? ` (~${found.distanceKm} km)` : ''}` 
        };
      }

      // Fallback para storeSettings.deliveryFeesByNeighborhood
      if (storeSettings?.deliveryFeesByNeighborhood) {
        const matchKey = Object.keys(storeSettings.deliveryFeesByNeighborhood).find(
          k => k.trim().toLowerCase() === cleanName
        );
        if (matchKey) {
          return { fee: Number(storeSettings.deliveryFeesByNeighborhood[matchKey]) || 0, isFree: false, reason: `Taxa do Bairro ${matchKey}` };
        }
      }
    }

    // 3. Taxa inicial base do primeiro raio (ou R$ 5,00)
    const baseRadius = sortedRadiuses[0];
    const defaultFee = baseRadius ? Number(baseRadius.fee) : 5.00;
    return { fee: defaultFee, isFree: false, reason: 'Taxa Padrão' };
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
    setCoupons(prev => {
      const upper = couponData.code.trim().toUpperCase();
      const numVal = parseFloat(couponData.value ?? couponData.discount ?? 0);
      const existing = prev.findIndex(c => (c.id && c.id === couponData.id) || c.code.toUpperCase() === upper);
      const normalized = {
        ...couponData,
        code: upper,
        value: numVal,
        discount: numVal
      };
      if (existing > -1) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], ...normalized };
        return copy;
      }
      return [...prev, { ...normalized, id: couponData.id || 'cp-' + Date.now(), usesCount: 0 }];
    });
  };

  const deleteCoupon = (identifier) => {
    setCoupons(prev => prev.filter(c => c.id !== identifier && c.code.toUpperCase() !== String(identifier).toUpperCase()));
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
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        supabase.from('orders').update({ motoboy_id: motoboyId }).eq('id', orderId).then();
      } catch (err) {}
    }
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
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.phone.replace(/\D/g, '') === cleanPhone);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...customerData, phone: cleanPhone };
        return copy;
      }
      return [...prev, { ...customerData, phone: cleanPhone, stampsCount: 0, totalOrders: 0 }];
    });
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

    // Salva no Supabase se configurado
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const dbPayload = mapAppOrderToSupabase(newOrder);
        supabase.from('orders').insert(dbPayload).then(({ error }) => {
          if (error) {
            console.warn('Supabase order insert error:', error);
            // Se ocorreu colisão de ID chave primária (23505), retenta com ID único
            if (error.code === '23505') {
              const uniqueId = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
              newOrder.id = uniqueId;
              supabase.from('orders').insert({ ...dbPayload, id: uniqueId }).then();
            }
          }
        });
      } catch (err) {
        console.warn('Supabase sync catch:', err);
      }
    }

    // Salva no Firebase Firestore se configurado
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        setDoc(doc(firestoreDb, 'orders', String(newOrder.id)), {
          ...newOrder,
          updatedAt: new Date().toISOString()
        }).catch(err => console.warn('Firebase order insert error:', err));
      } catch (err) {
        console.warn('Firebase sync catch:', err);
      }
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

            // Pontuação no Cartão Fidelidade
            if (order.phone && order.total >= storeSettings.loyaltyMinOrder) {
              const clean = order.phone.replace(/\D/g, '');
              setCustomers(custs => custs.map(c => {
                if (c.phone.replace(/\D/g, '') === clean) {
                  const newStamps = (c.stampsCount || 0) + 1;
                  return { ...c, stampsCount: newStamps };
                }
                return c;
              }));
            }
          }
          return updated;
        }
        return order;
      });
      return nextOrders;
    });

    // Supabase update se configurado
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const updatePayload = { status: newStatus };
        if (newStatus === 'shipping') updatePayload.shipped_at = new Date().toISOString();
        if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString();
        supabase.from('orders').update(updatePayload).eq('id', orderId).then();
      } catch (err) {}
    }

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

  const deleteOrder = (orderId) => {
    setOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      localStorage.setItem('hd_orders', JSON.stringify(next));
      return next;
    });
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        supabase.from('orders').delete().eq('id', orderId).then();
      } catch (err) {}
    }
    const firestoreDb = getFirestoreDb();
    if (firestoreDb) {
      try {
        deleteDoc(doc(firestoreDb, 'orders', String(orderId))).catch(() => {});
      } catch (err) {}
    }
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
    if (productData.id) {
      next = products.map(p => p.id === productData.id ? { ...p, ...productData } : p);
    } else {
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      next = [...products, { ...productData, id: newId }];
    }
    setProducts(next);
  };

  const toggleProductStatus = (productId) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, active: !p.active } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleComplementStatus = (id) => {
    setComplements(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const upsertComplement = (compData) => {
    setComplements(prev => {
      if (compData.id) {
        return prev.map(c => c.id === compData.id ? { ...c, ...compData } : c);
      }
      return [...prev, { ...compData, id: 'comp-' + Date.now() }];
    });
  };

  const deleteComplement = (id) => {
    setComplements(prev => prev.filter(c => c.id !== id));
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
    localStorage.setItem('nuu_products_v14', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('hd_inventory_v5', JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem('nuu_complements_v6', JSON.stringify(INITIAL_COMPLEMENTS));
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
      shiftHistory: cashShifts,
      supabaseActive,
      SUPABASE_SCHEMA_SQL,
      saveSupabaseConfig,
      firebaseActive,
      FIRESTORE_RULES_GUIDE,
      saveFirebaseConfig: handleSaveFirebaseConfig,
      isStoreOpenNow,
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
      openCashShift,
      closeCashShift,
      addShiftBleed,
      addShiftSupply,
      createOrder,
      updateOrderStatus,
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
      playNotificationChime
    }}>
      {children}
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
