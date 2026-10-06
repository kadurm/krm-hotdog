import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getSupabaseClient, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  isSupabaseConfigured,
  SUPABASE_SCHEMA_SQL 
} from '../services/supabase';

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
  // --- Prensados ---
  { 
    id: 1, 
    name: 'Prensadinho', 
    description: 'Pão, molho de tomate artesanal, milho, batata, salsicha, mussarela, bacon e molhos da casa.', 
    price: 18.00, 
    image: '/images/prensadinho.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: false,
    recipe: [
      { ingredientId: 1, quantity: 1 }, // Pão
      { ingredientId: 2, quantity: 1 }, // Salsicha
      { ingredientId: 3, quantity: 1 }, // Bacon
      { ingredientId: 101, quantity: 1 }, // Embalagem Térmica
      { ingredientId: 102, quantity: 2 }  // Guardanapos
    ]
  },
  { 
    id: 2, 
    name: 'Prensado', 
    description: 'Pão, molho de tomate artesanal, milho, batata, salsicha, mussarela, bacon, molhos da casa e Frango desfiado bem temperado.', 
    price: 20.00, 
    image: '/images/prensado.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: false,
    recipe: [
      { ingredientId: 1, quantity: 1 },
      { ingredientId: 2, quantity: 1 },
      { ingredientId: 3, quantity: 1 },
      { ingredientId: 101, quantity: 1 },
      { ingredientId: 102, quantity: 2 }
    ]
  },
  { 
    id: 3, 
    name: 'Prensadão de Costela', 
    description: 'Pão, molho de tomate artesanal, milho, batata, salsicha, mussarela, bacon, molhos da casa e Costela suculenta que derrete na boca.', 
    price: 26.00, 
    image: '/images/costela.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },
      { ingredientId: 2, quantity: 1 },
      { ingredientId: 3, quantity: 1 },
      { ingredientId: 101, quantity: 1 },
      { ingredientId: 102, quantity: 2 }
    ]
  },
  { 
    id: 4, 
    name: 'Prensadão de Pernil', 
    description: 'Pão, molho de tomate artesanal, milho, batata, salsicha, mussarela, bacon, molhos da casa e Pernil desfiado super temperado.', 
    price: 24.00, 
    image: '/images/pernil.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },
      { ingredientId: 2, quantity: 1 },
      { ingredientId: 3, quantity: 1 },
      { ingredientId: 101, quantity: 1 },
      { ingredientId: 102, quantity: 2 }
    ]
  },
  { 
    id: 5, 
    name: 'Prensadão de Carne Seca', 
    description: 'Pão, molho de tomate artesanal, milho, batata, salsicha, mussarela, bacon, molhos da casa e o autêntico sabor da Carne Seca.', 
    price: 28.00, 
    image: '/images/carne-seca.png',
    active: true, 
    category: 'prensados', 
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 },
      { ingredientId: 2, quantity: 1 },
      { ingredientId: 3, quantity: 1 },
      { ingredientId: 101, quantity: 1 },
      { ingredientId: 102, quantity: 2 }
    ]
  },
  // --- Bebidas Geladas ---
  {
    id: 6,
    name: 'Coca-Cola Lata 350ml',
    description: 'Refrigerante Coca-Cola original estupidamente gelada.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 104, quantity: 1 }]
  },
  {
    id: 7,
    name: 'Guaraná Antarctica Lata 350ml',
    description: 'Refrigerante Guaraná Antarctica bem gelado.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 105, quantity: 1 }]
  },
  {
    id: 8,
    name: 'Coca-Cola 2 Litros',
    description: 'Garrafa pet 2 litros para toda a família.',
    price: 14.00,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=60',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: []
  },
  {
    id: 9,
    name: 'Suco Natural de Laranja 500ml',
    description: 'Suco de laranja natural feito na hora, 100% fruta.',
    price: 9.00,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=60',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 4, quantity: 4 }] // 4 laranjas
  },
  {
    id: 10,
    name: 'Água Mineral sem Gás 500ml',
    description: 'Água mineral natural sem gás gelada.',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=500&auto=format&fit=crop&q=60',
    active: true,
    category: 'bebidas',
    hasCustomOptions: false,
    recipe: []
  },
  // --- Acompanhamentos & Porções ---
  {
    id: 11,
    name: 'Batata Frita Canoa Especial',
    description: 'Porção de batata canoa crocante com toque de páprica e molho especial da casa.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    active: true,
    category: 'acompanhamentos',
    hasCustomOptions: false,
    recipe: [{ ingredientId: 6, quantity: 1 }]
  }
];

// 2. COMPLEMENTOS E ADICIONAIS
const INITIAL_COMPLEMENTS = [
  { id: 'extra-bacon', name: 'Extra Bacon Crocante', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 4.00, active: true },
  { id: 'extra-cheese', name: 'Extra Queijo Derretido', category: 'extra', group: 'extras', groupName: 'Adicionais Extras', price: 3.00, active: true },
  { id: 'creamy-catupiry', name: 'Catupiry Original', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },
  { id: 'creamy-requeijao', name: 'Requeijão Cremoso', category: 'complement', group: 'creamy', groupName: 'Queijo Cremoso', price: 0, active: true },
  { id: 'melted-mussarela', name: 'Queijo Mussarela', category: 'complement', group: 'melted', groupName: 'Queijo Fatiado', price: 0, active: true },
  { id: 'melted-cheddar', name: 'Queijo Cheddar', category: 'complement', group: 'melted', groupName: 'Queijo Fatiado', price: 0, active: true },
  { id: 'side-vinagrete', name: 'Vinagrete Artesanal', category: 'complement', group: 'side', groupName: 'Acompanhamento', price: 0, active: true }
];

// 3. ESTOQUE & EMBALAGENS
const INITIAL_INVENTORY = [
  { id: 1, name: 'Pão de Hot Dog', quantity: 60, minQuantity: 20, unit: 'un' },
  { id: 2, name: 'Salsicha Premium', quantity: 50, minQuantity: 20, unit: 'un' },
  { id: 3, name: 'Bacon Fatiado', quantity: 30, minQuantity: 10, unit: 'porção' },
  { id: 4, name: 'Laranja (Fruta)', quantity: 80, minQuantity: 25, unit: 'un' },
  { id: 5, name: 'Polpa Verde Detox', quantity: 12, minQuantity: 5, unit: 'un' },
  { id: 6, name: 'Batata Canoa Congelada', quantity: 20, minQuantity: 6, unit: 'porção' },
  // Embalagens automáticas
  { id: 101, name: 'Embalagem Térmica Prensado', quantity: 150, minQuantity: 40, unit: 'un' },
  { id: 102, name: 'Guardanapo Sachê', quantity: 300, minQuantity: 100, unit: 'un' },
  { id: 103, name: 'Sacola Delivery Kraft', quantity: 80, minQuantity: 25, unit: 'un' },
  { id: 104, name: 'Lata Coca-Cola 350ml', quantity: 48, minQuantity: 12, unit: 'un' },
  { id: 105, name: 'Lata Guaraná 350ml', quantity: 36, minQuantity: 12, unit: 'un' }
];

// 4. CONFIGURAÇÕES DA LOJA, HORÁRIOS, TAXAS E FIDELIDADE
const INITIAL_STORE_SETTINGS = {
  isOpen: true,
  autoSchedule: true,
  openTime: '18:00',
  closeTime: '23:30',
  openDays: ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
  estimatedTime: '35 a 50 min',
  storeAddress: 'Rua Principal, 100 - Centro',
  storeLat: -19.916681,
  storeLng: -43.934493,
  deliveryMode: 'hybrid', // 'neighborhood' | 'radius' | 'hybrid'
  freeDeliveryThreshold: 65.00,
  cardDebitFee: 1.99,
  cardCreditFee: 3.49,
  pixFee: 0.00,
  loyaltyTargetStamps: 10,
  loyaltyMinOrder: 20.00,
  loyaltyRewardText: '1 Prensadinho Grátis ou R$ 20 OFF',
  autoPackagingDeduction: true,
  deliveryFeesByNeighborhood: {
    'Centro': 5.00,
    'Bela Vista': 7.00,
    'São José': 8.00,
    'Industrial': 10.00,
    'Planalto': 12.00
  },
  deliveryRadius: [
    { id: 'rad-1', maxKm: 3, fee: 5.00, active: true },
    { id: 'rad-2', maxKm: 6, fee: 8.00, active: true },
    { id: 'rad-3', maxKm: 10, fee: 12.00, active: true }
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
  }
};

// 5. BAIRROS DE ENTREGA
const INITIAL_NEIGHBORHOODS = [
  { id: 'nb-1', name: 'Centro', fee: 5.00, active: true },
  { id: 'nb-2', name: 'Bela Vista', fee: 7.00, active: true },
  { id: 'nb-3', name: 'São José', fee: 8.00, active: true },
  { id: 'nb-4', name: 'Industrial', fee: 10.00, active: true },
  { id: 'nb-5', name: 'Planalto', fee: 12.00, active: true }
];

// 6. ZONAS DE RAIO (KM)
const INITIAL_RADIUSES = [
  { id: 'rad-1', maxKm: 3, fee: 5.00, active: true },
  { id: 'rad-2', maxKm: 6, fee: 8.00, active: true },
  { id: 'rad-3', maxKm: 10, fee: 12.00, active: true }
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
    const saved = localStorage.getItem('nuu_products_v6');
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
    return INITIAL_PRODUCTS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('hd_inventory_v2');
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
    const saved = localStorage.getItem('nuu_complements_v2');
    return saved ? JSON.parse(saved) : INITIAL_COMPLEMENTS;
  });

  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('nuu_store_settings_v2');
    return saved ? { ...INITIAL_STORE_SETTINGS, ...JSON.parse(saved) } : INITIAL_STORE_SETTINGS;
  });

  const [deliveryNeighborhoods, setDeliveryNeighborhoods] = useState(() => {
    const saved = localStorage.getItem('nuu_neighborhoods');
    return saved ? JSON.parse(saved) : INITIAL_NEIGHBORHOODS;
  });

  const [deliveryRadiuses, setDeliveryRadiuses] = useState(() => {
    const saved = localStorage.getItem('nuu_radiuses');
    return saved ? JSON.parse(saved) : INITIAL_RADIUSES;
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

  // Turno de caixa aberto ativo (se houver)
  const activeShift = cashShifts.find(s => s.status === 'open') || null;

  // --- Sincronização LocalStorage & BroadcastChannel ---
  useEffect(() => {
    localStorage.setItem('nuu_products_v6', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('hd_inventory_v2', JSON.stringify(inventory));
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
    localStorage.setItem('nuu_complements_v2', JSON.stringify(complements));
  }, [complements]);

  useEffect(() => {
    localStorage.setItem('nuu_store_settings_v2', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('nuu_neighborhoods', JSON.stringify(deliveryNeighborhoods));
  }, [deliveryNeighborhoods]);

  useEffect(() => {
    localStorage.setItem('nuu_radiuses', JSON.stringify(deliveryRadiuses));
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
              setOrders(prev => {
                if (prev.some(o => o.id === payload.new.id)) return prev;
                playNotificationChime();
                return [payload.new, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
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

  // --- Função para Salvar/Conectar Supabase ---
  const saveSupabaseConfig = (url, key) => {
    saveSupabaseCredentials(url, key);
    const configured = Boolean(url && key);
    setSupabaseActive(configured);
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
    if (!storeSettings.isOpen) return false;
    if (!storeSettings.autoSchedule) return true;

    try {
      const now = new Date();
      const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const currentDay = days[now.getDay()];
      if (!storeSettings.openDays.includes(currentDay)) return false;

      const [openHour, openMin] = storeSettings.openTime.split(':').map(Number);
      const [closeHour, closeMin] = storeSettings.closeTime.split(':').map(Number);

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      if (closeMinutes >= openMinutes) {
        return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
      } else {
        // Passa da meia-noite (ex: 18:00 às 01:00)
        return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
      }
    } catch (e) {
      return storeSettings.isOpen;
    }
  };

  // --- Cálculo Dinâmico de Frete (Bairro / Raio / Frete Grátis) ---
  const calculateDeliveryFee = ({ neighborhoodName, distanceKm, subtotal = 0 }) => {
    if (subtotal >= storeSettings.freeDeliveryThreshold) {
      return { fee: 0, isFree: true, reason: 'Frete Grátis por valor atingido!' };
    }

    if (storeSettings.deliveryMode === 'neighborhood' || (!distanceKm && neighborhoodName)) {
      const found = deliveryNeighborhoods.find(n => n.name.toLowerCase() === (neighborhoodName || '').toLowerCase() && n.active);
      if (found) return { fee: found.fee, isFree: false, reason: `Taxa do Bairro ${found.name}` };
    }

    if (distanceKm !== undefined && distanceKm !== null) {
      const sortedRadiuses = [...deliveryRadiuses].sort((a, b) => a.maxKm - b.maxKm);
      const match = sortedRadiuses.find(r => distanceKm <= r.maxKm && r.active);
      if (match) {
        return { fee: match.fee, isFree: false, reason: `Até ${match.maxKm} km da loja` };
      }
    }

    // Padrão fallback
    return { fee: 7.00, isFree: false, reason: 'Taxa Padrão' };
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
        supabase.from('orders').insert({
          id: newOrder.id,
          customer_name: newOrder.customerName,
          phone: newOrder.phone,
          type: newOrder.type,
          address: newOrder.address,
          neighborhood: newOrder.neighborhood,
          payment_method: newOrder.paymentMethod,
          change_for: newOrder.changeFor,
          items: newOrder.items,
          total: newOrder.total,
          status: 'pending',
          notes: newOrder.notes || ''
        }).then(({ error }) => {
          if (error) console.warn('Supabase order insert error:', error);
        });
      } catch (err) {
        console.warn('Supabase sync catch:', err);
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
        supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then();
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
