import React, { createContext, useContext, useState, useEffect } from 'react';

const SystemContext = createContext(null);

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Prensadinho',
    price: 18.00,
    description: 'Nossa base tradicional perfeitamente prensada com muito Bacon.',
    category: 'prensados',
    active: true,
    hasCustomOptions: false,
    recipe: [
      { ingredientId: 1, quantity: 1 },
      { ingredientId: 3, quantity: 1 }
    ]
  },
  {
    id: 2,
    name: 'Prensado',
    price: 20.00,
    description: 'A base clássica recheada com Frango desfiado e bem temperado.',
    category: 'prensados',
    active: true,
    hasCustomOptions: false,
    recipe: [
      { ingredientId: 1, quantity: 1 }
    ]
  },
  {
    id: 3,
    name: 'Prensadão de Costela',
    price: 26.00,
    description: 'Base generosa com Costela suculenta que derrete na boca.',
    category: 'prensados',
    active: true,
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 }
    ]
  },
  {
    id: 4,
    name: 'Prensadão de Pernil',
    price: 24.00,
    description: 'Base deliciosa com Pernil desfiado super temperado.',
    category: 'prensados',
    active: true,
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 }
    ]
  },
  {
    id: 5,
    name: 'Prensadão de Carne Seca',
    price: 28.00,
    description: 'O autêntico sabor da Carne Seca na nossa base perfeita.',
    category: 'prensados',
    active: true,
    hasCustomOptions: true,
    recipe: [
      { ingredientId: 1, quantity: 1 }
    ]
  }
];

const INITIAL_INVENTORY = [
  { id: 1, name: 'Pão de Hot Dog', quantity: 42, minQuantity: 15, unit: 'un' },
  { id: 2, name: 'Salsicha Premium', quantity: 38, minQuantity: 15, unit: 'un' },
  { id: 3, name: 'Bacon Fatiado', quantity: 25, minQuantity: 8, unit: 'porção' },
  { id: 4, name: 'Laranja (Fruta)', quantity: 95, minQuantity: 30, unit: 'un' },
  { id: 5, name: 'Polpa Verde Detox', quantity: 12, minQuantity: 5, unit: 'un' },
  { id: 6, name: 'Batata Canoa Congelada', quantity: 18, minQuantity: 6, unit: 'porção' }
];

const INITIAL_ORDERS = [
  {
    id: '1001',
    customerName: 'Carlos Eduardo',
    phone: '(11) 98888-7777',
    type: 'delivery',
    address: 'Rua das Flores, 123 - Apt 42',
    paymentMethod: 'Pix',
    items: [
      { productId: 2, name: 'Double Bacon Cheddar', quantity: 2, price: 22.90 },
      { productId: 3, name: 'Suco de Laranja (Natural)', quantity: 2, price: 8.50 }
    ],
    status: 'delivered',
    total: 62.80,
    date: new Date(Date.now() - 3600000 * 4).toISOString() // 4h atrás
  },
  {
    id: '1002',
    customerName: 'Mariana Santos',
    phone: '(11) 97777-6666',
    type: 'pickup',
    address: 'Retirada no Balcão',
    paymentMethod: 'Cartão de Crédito',
    items: [
      { productId: 1, name: 'Hot Dog Tradicional', quantity: 1, price: 15.90 },
      { productId: 5, name: 'Batata Frita Canoa', quantity: 1, price: 13.90 }
    ],
    status: 'preparing',
    total: 29.80,
    date: new Date(Date.now() - 1800000).toISOString() // 30min atrás
  }
];

const INITIAL_TRANSACTIONS = [
  {
    id: 't-1',
    date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    type: 'expense',
    category: 'Estoque',
    value: 150.00,
    description: 'Compra de pães e salsichas do distribuidor'
  },
  {
    id: 't-2',
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'expense',
    category: 'Infraestrutura',
    value: 85.00,
    description: 'Gás de cozinha reserva'
  },
  {
    id: 't-3',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'income',
    category: 'Vendas',
    value: 62.80,
    description: 'Pedido #1001'
  }
];

const INITIAL_INVOICES = [
  {
    id: 'NF-1001',
    type: 'saida',
    referenceId: '1001',
    customerName: 'Carlos Eduardo',
    customerCpf: '123.456.789-00',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    total: 62.80,
    items: [
      { name: 'Double Bacon Cheddar', quantity: 2, price: 22.90 },
      { name: 'Suco de Laranja (Natural)', quantity: 2, price: 8.50 }
    ],
    key: '35260612345678901234550010000010011234567890'
  }
];

const INITIAL_QUOTATIONS = [
  { id: 'q-1', productName: 'Molho Barbecue', supplier: 'Supermercado BH', brand: 'Saboroso', package: 'Balde 3,5 kg', packagePrice: 32.90, unitPrice: 9.40, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-2', productName: 'Molho de Tomate', supplier: 'Supermercado BH', brand: 'Colonial', package: 'Sachê 2 kg', packagePrice: 15.98, unitPrice: 7.99, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-3', productName: 'Molho de Tomate', supplier: 'Supermercado BH', brand: 'Colonial', package: 'Caixa c/ 6 (12 kg)', packagePrice: 89.88, unitPrice: 7.49, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-4', productName: 'Óleo PET 900ml', supplier: 'Supermercado BH', brand: 'Veleiro', package: 'Fardo c/ 6 un', packagePrice: 41.28, unitPrice: 6.88, unitType: 'un', lastUpdated: '2026-08-25' },
  { id: 'q-5', productName: 'Óleo PET 900ml', supplier: 'Supermercado BH', brand: 'ABC', package: 'Fardo c/ 30 un', packagePrice: 137.60, unitPrice: 4.586, unitType: 'un', lastUpdated: '2026-08-25' },
  { id: 'q-6', productName: 'Queijo Mussarela Fatiado', supplier: 'Supermercado BH', brand: 'Saboroso', package: 'Quilo (kg)', packagePrice: 51.80, unitPrice: 51.80, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-7', productName: 'Queijo Mussarela Fatiado', supplier: 'Supermercado BH', brand: 'Porto Alegre', package: 'Quilo (kg)', packagePrice: 52.00, unitPrice: 52.00, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-8', productName: 'Queijo Mussarela Fatiado', supplier: 'Supermercado BH', brand: 'Presidente', package: 'Quilo (kg)', packagePrice: 54.90, unitPrice: 54.90, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-9', productName: 'Cheddar Fatiado', supplier: 'Supermercado BH', brand: 'Polenghi', package: 'Quilo (kg)', packagePrice: 57.80, unitPrice: 57.80, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-10', productName: 'Cheddar Fatiado', supplier: 'Supermercado BH', brand: 'Vigor', package: 'Quilo (kg)', packagePrice: 59.88, unitPrice: 59.88, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-11', productName: 'Costela Suína', supplier: 'Supermercado BH', brand: 'In Natura', package: 'Quilo (kg)', packagePrice: 30.80, unitPrice: 30.80, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-12', productName: 'Pernil Suíno', supplier: 'Supermercado BH', brand: 'In Natura', package: 'Quilo (kg)', packagePrice: 18.00, unitPrice: 18.00, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-13', productName: 'Salsicha Premium', supplier: 'Supermercado BH', brand: 'Seara', package: 'Quilo (kg)', packagePrice: 8.78, unitPrice: 8.78, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-14', productName: 'Salsicha Premium', supplier: 'Supermercado BH', brand: 'Pif Paf', package: 'Quilo (kg)', packagePrice: 8.98, unitPrice: 8.98, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-15', productName: 'Salsicha Premium', supplier: 'Supermercado BH', brand: 'Perdigão', package: 'Quilo (kg)', packagePrice: 9.98, unitPrice: 9.98, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-16', productName: 'Salsicha Premium', supplier: 'Supermercado BH', brand: 'Sadia', package: 'Quilo (kg)', packagePrice: 10.98, unitPrice: 10.98, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-17', productName: 'Bacon Fatiado', supplier: 'Supermercado BH', brand: 'Dona Carne', package: 'Quilo (kg)', packagePrice: 33.38, unitPrice: 33.38, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-18', productName: 'Bacon Fatiado', supplier: 'Supermercado BH', brand: 'Saudali', package: 'Quilo (kg)', packagePrice: 34.78, unitPrice: 34.78, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-19', productName: 'Requeijão Bisnaga', supplier: 'Supermercado BH', brand: 'Roseli', package: 'Bisnaga 1,5 kg', packagePrice: 52.80, unitPrice: 35.20, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-20', productName: 'Requeijão Bisnaga', supplier: 'Supermercado BH', brand: 'Allora', package: 'Bisnaga 1,5 kg', packagePrice: 59.90, unitPrice: 39.93, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-21', productName: 'Requeijão Bisnaga', supplier: 'Supermercado BH', brand: 'Vigor', package: 'Bisnaga 1,5 kg', packagePrice: 64.98, unitPrice: 43.32, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-22', productName: 'Catupiry Bisnaga', supplier: 'Supermercado BH', brand: 'Catupiry Original', package: 'Bisnaga 1,5 kg', packagePrice: 63.71, unitPrice: 42.47, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-23', productName: 'Cream Cheese', supplier: 'Supermercado BH', brand: 'Porto Alegre', package: 'Pote 1,0 kg', packagePrice: 38.99, unitPrice: 38.99, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-24', productName: 'Cream Cheese', supplier: 'Supermercado BH', brand: 'Polenghi', package: 'Balde 1,5 kg', packagePrice: 72.98, unitPrice: 48.65, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-25', productName: 'Cheddar Bisnaga', supplier: 'Supermercado BH', brand: 'Polenghi', package: 'Bisnaga 1,5 kg', packagePrice: 62.98, unitPrice: 41.98, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-26', productName: 'Cheddar Bisnaga', supplier: 'Supermercado BH', brand: 'Scala', package: 'Bisnaga 1,5 kg', packagePrice: 68.90, unitPrice: 45.93, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-27', productName: 'Cheddar Bisnaga', supplier: 'Supermercado BH', brand: 'Vigor', package: 'Bisnaga 1,5 kg', packagePrice: 78.98, unitPrice: 52.65, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-28', productName: 'Milho Verde', supplier: 'Villefort', brand: 'Villefort', package: 'Lata 1,7 kg', packagePrice: 18.90, unitPrice: 11.11, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-29', productName: 'Milho Verde', supplier: 'Supermercado BH', brand: 'Minas', package: 'Lata 1,5 kg', packagePrice: 21.90, unitPrice: 14.60, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-30', productName: 'Batata Palha', supplier: 'Supermercado BH', brand: 'Raízes de Minas', package: 'Pacote 800 g', packagePrice: 20.90, unitPrice: 26.13, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-31', productName: 'Batata Palha', supplier: 'Villefort', brand: 'Villefort', package: 'Pacote 800 g', packagePrice: 23.90, unitPrice: 29.88, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-32', productName: 'Batata Palha', supplier: 'Supermercado BH', brand: 'Aliança', package: 'Pacote 800 g', packagePrice: 29.90, unitPrice: 37.38, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-33', productName: 'Batata Palha', supplier: 'Supermercado BH', brand: 'Aliança', package: 'Pacote 300 g', packagePrice: 13.48, unitPrice: 44.93, unitType: 'kg', lastUpdated: '2026-08-25' },
  { id: 'q-34', productName: 'Ketchup Sachê', supplier: 'Supermercado BH', brand: 'Predileta', package: 'Caixa c/ 144 un', packagePrice: 10.90, unitPrice: 0.075, unitType: 'sachê', lastUpdated: '2026-08-25' },
  { id: 'q-35', productName: 'Ketchup Sachê', supplier: 'Supermercado BH', brand: 'Colonial', package: 'Caixa c/ 144 un', packagePrice: 11.98, unitPrice: 0.083, unitType: 'sachê', lastUpdated: '2026-08-25' },
  { id: 'q-36', productName: 'Ketchup Sachê', supplier: 'Supermercado BH', brand: 'Heinz', package: 'Caixa c/ 144 un', packagePrice: 23.90, unitPrice: 0.166, unitType: 'sachê', lastUpdated: '2026-08-25' },
  { id: 'q-37', productName: 'Mostarda Sachê', supplier: 'Supermercado BH', brand: 'Predileta', package: 'Caixa c/ 144 un', packagePrice: 13.90, unitPrice: 0.096, unitType: 'sachê', lastUpdated: '2026-08-25' },
  { id: 'q-38', productName: 'Mostarda Sachê', supplier: 'Supermercado BH', brand: 'Heinz', package: 'Caixa c/ 144 un', packagePrice: 28.90, unitPrice: 0.200, unitType: 'sachê', lastUpdated: '2026-08-25' },
  // Cotação Astral
  { id: 'q-39', productName: 'Queijo Mussarela Fatiado', supplier: 'Astral', brand: 'Saboroso', package: 'Quilo (kg) - Varejo', packagePrice: 49.90, unitPrice: 49.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-40', productName: 'Queijo Mussarela Fatiado', supplier: 'Astral', brand: 'Saboroso', package: 'Quilo (kg) - Atacado', packagePrice: 48.90, unitPrice: 48.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-41', productName: 'Queijo Mussarela Fatiado', supplier: 'Astral', brand: 'Nova Esperança', package: 'Quilo (kg) - Varejo', packagePrice: 46.90, unitPrice: 46.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-42', productName: 'Queijo Mussarela Fatiado', supplier: 'Astral', brand: 'Nova Esperança', package: 'Quilo (kg) - Atacado', packagePrice: 42.90, unitPrice: 42.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-43', productName: 'Cheddar Fatiado', supplier: 'Astral', brand: 'Vigor', package: 'Quilo (kg)', packagePrice: 108.88, unitPrice: 108.88, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-44', productName: 'Cheddar Fatiado', supplier: 'Astral', brand: 'Polenghi', package: 'Quilo (kg)', packagePrice: 110.90, unitPrice: 110.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-45', productName: 'Salsicha Premium', supplier: 'Astral', brand: 'Pif Paf', package: 'Quilo (kg) - Varejo', packagePrice: 31.90, unitPrice: 31.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-46', productName: 'Salsicha Premium', supplier: 'Astral', brand: 'Pif Paf', package: 'Quilo (kg) - Atacado', packagePrice: 29.90, unitPrice: 29.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-47', productName: 'Salsicha Premium', supplier: 'Astral', brand: 'Seara', package: 'Pacote 3 kg', packagePrice: 29.90, unitPrice: 9.97, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-48', productName: 'Salsicha Premium', supplier: 'Astral', brand: 'Perdigão', package: 'Pacote 5 kg - Varejo', packagePrice: 52.90, unitPrice: 10.58, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-49', productName: 'Salsicha Premium', supplier: 'Astral', brand: 'Perdigão', package: 'Pacote 5 kg - Atacado', packagePrice: 49.90, unitPrice: 9.98, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-50', productName: 'Bacon Fatiado', supplier: 'Astral', brand: 'Santiere', package: 'Quilo (kg) - Varejo', packagePrice: 26.90, unitPrice: 26.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-51', productName: 'Bacon Fatiado', supplier: 'Astral', brand: 'Santiere', package: 'Quilo (kg) - Atacado', packagePrice: 23.90, unitPrice: 23.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-52', productName: 'Bacon Fatiado', supplier: 'Astral', brand: 'Matoso', package: 'Quilo (kg) - Varejo', packagePrice: 26.90, unitPrice: 26.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-53', productName: 'Bacon Fatiado', supplier: 'Astral', brand: 'Matoso', package: 'Quilo (kg) - Atacado', packagePrice: 23.90, unitPrice: 23.90, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-54', productName: 'Requeijão Bisnaga', supplier: 'Astral', brand: 'Dallora', package: 'Bisnaga 1,5 kg - Varejo', packagePrice: 26.98, unitPrice: 17.99, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-55', productName: 'Requeijão Bisnaga', supplier: 'Astral', brand: 'Dallora', package: 'Bisnaga 1,5 kg - Atacado', packagePrice: 25.98, unitPrice: 17.32, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-56', productName: 'Requeijão Bisnaga', supplier: 'Astral', brand: 'Saboroso', package: 'Bisnaga 1,5 kg - Varejo', packagePrice: 38.90, unitPrice: 25.93, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-57', productName: 'Requeijão Bisnaga', supplier: 'Astral', brand: 'Saboroso', package: 'Bisnaga 1,5 kg - Atacado', packagePrice: 37.90, unitPrice: 25.27, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-58', productName: 'Requeijão Bisnaga', supplier: 'Astral', brand: 'Amarilis', package: 'Bisnaga 1,8 kg', packagePrice: 12.98, unitPrice: 7.21, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-59', productName: 'Cream Cheese', supplier: 'Astral', brand: 'Scala', package: 'Pote 1,2 kg', packagePrice: 46.98, unitPrice: 39.15, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-60', productName: 'Cream Cheese', supplier: 'Astral', brand: 'Santa Maria', package: 'Pote 1,0 kg', packagePrice: 40.98, unitPrice: 40.98, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-61', productName: 'Milho Verde', supplier: 'Astral', brand: 'Minas', package: 'Lata 1,5 kg - Varejo', packagePrice: 22.45, unitPrice: 14.97, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-62', productName: 'Milho Verde', supplier: 'Astral', brand: 'Minas', package: 'Lata 1,5 kg - Atacado', packagePrice: 19.90, unitPrice: 13.27, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-63', productName: 'Batata Palha', supplier: 'Astral', brand: 'Aliança', package: 'Pacote 300 g', packagePrice: 15.90, unitPrice: 53.00, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-64', productName: 'Batata Palha', supplier: 'Astral', brand: 'Aliança', package: 'Pacote 800 g', packagePrice: 32.90, unitPrice: 41.13, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-65', productName: 'Batata Palha', supplier: 'Astral', brand: 'Astro', package: 'Pacote 800 g', packagePrice: 26.90, unitPrice: 33.63, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-66', productName: 'Batata Palha', supplier: 'Astral', brand: 'Kigostosa', package: 'Pacote 800 g', packagePrice: 17.90, unitPrice: 22.38, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-67', productName: 'Batata Palha', supplier: 'Astral', brand: 'Raízes de Minas', package: 'Pacote 800 g - Varejo', packagePrice: 21.90, unitPrice: 27.38, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-68', productName: 'Batata Palha', supplier: 'Astral', brand: 'Raízes de Minas', package: 'Pacote 800 g - Atacado', packagePrice: 19.90, unitPrice: 24.88, unitType: 'kg', lastUpdated: '2026-08-26' },
  { id: 'q-69', productName: 'Ketchup Sachê', supplier: 'Astral', brand: 'Heinz', package: 'Caixa c/ 144 un', packagePrice: 29.90, unitPrice: 0.208, unitType: 'sachê', lastUpdated: '2026-08-26' },
  { id: 'q-70', productName: 'Ketchup Sachê', supplier: 'Astral', brand: 'Predileta', package: 'Caixa c/ 144 un - Varejo', packagePrice: 13.49, unitPrice: 0.094, unitType: 'sachê', lastUpdated: '2026-08-26' },
  { id: 'q-71', productName: 'Ketchup Sachê', supplier: 'Astral', brand: 'Predileta', package: 'Caixa c/ 144 un - Atacado', packagePrice: 11.99, unitPrice: 0.083, unitType: 'sachê', lastUpdated: '2026-08-26' },
  { id: 'q-72', productName: 'Ketchup Sachê', supplier: 'Astral', brand: 'Colonial', package: 'Caixa c/ 144 un', packagePrice: 10.90, unitPrice: 0.076, unitType: 'sachê', lastUpdated: '2026-08-26' },
  { id: 'q-73', productName: 'Mostarda Sachê', supplier: 'Astral', brand: 'Colonial', package: 'Caixa c/ 144 un', packagePrice: 14.90, unitPrice: 0.103, unitType: 'sachê', lastUpdated: '2026-08-26' }
];

export const SystemProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('hd_products');
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed = JSON.parse(saved);
      const isPrensados = parsed.some(p => p.name === 'Prensadinho' || p.category === 'prensados');
      return isPrensados ? parsed : INITIAL_PRODUCTS;
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('hd_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('hd_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('hd_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('hd_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [quotations, setQuotations] = useState(() => {
    const saved = localStorage.getItem('hd_quotations');
    if (!saved) return INITIAL_QUOTATIONS;
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map(q => q.id));
      const missingDefaults = INITIAL_QUOTATIONS.filter(q => !existingIds.has(q.id));
      return missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
    } catch (e) {
      return INITIAL_QUOTATIONS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hd_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('hd_inventory', JSON.stringify(inventory));
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

  // Actions
  const createOrder = (orderData) => {
    const newId = (Math.max(...orders.map(o => parseInt(o.id)), 1000) + 1).toString();
    const newOrder = {
      id: newId,
      status: 'pending',
      date: new Date().toISOString(),
      ...orderData
    };

    // 1. Deduct inventory (Check if stock is sufficient first)
    let stockValid = true;
    const updatedInventory = [...inventory];

    newOrder.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.recipe) {
        prod.recipe.forEach(recipeItem => {
          const invItem = updatedInventory.find(i => i.id === recipeItem.ingredientId);
          if (invItem) {
            const requiredQty = recipeItem.quantity * item.quantity;
            if (invItem.quantity < requiredQty) {
              stockValid = false;
            }
            invItem.quantity = Math.max(0, invItem.quantity - requiredQty);
          }
        });
      }
    });

    setInventory(updatedInventory);
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updated = { ...order, status: newStatus };
        
        // If status turns to delivered, add to finance and auto-generate invoice
        if (newStatus === 'delivered' && order.status !== 'delivered') {
          const transactionId = 't-' + Date.now();
          const newTransaction = {
            id: transactionId,
            date: new Date().toISOString(),
            type: 'income',
            category: 'Vendas',
            value: order.total,
            description: `Pedido #${order.id}`
          };
          setTransactions(t => [newTransaction, ...t]);

          // Emit NF
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
        }
        return updated;
      }
      return order;
    }));
  };

  // Inventory actions
  const adjustStock = (ingredientId, amount, type = 'adjust') => {
    setInventory(prev => prev.map(item => {
      if (item.id === ingredientId) {
        let newQty = item.quantity;
        if (type === 'add') newQty += amount;
        else if (type === 'remove') newQty = Math.max(0, newQty - amount);
        else newQty = Math.max(0, amount);

        if (type === 'add' && amount > 0) {
          const cost = amount * 2.5;
          const newTransaction = {
            id: 't-' + Date.now(),
            date: new Date().toISOString(),
            type: 'expense',
            category: 'Estoque',
            value: parseFloat(cost.toFixed(2)),
            description: `Compra manual de ${amount} ${item.unit} de ${item.name}`
          };
          setTransactions(t => [newTransaction, ...t]);
        }

        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const registerInflowInvoice = (nfData) => {
    const nfId = `NF-${Math.floor(2000 + Math.random() * 5000)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newNf = {
      id: nfId,
      type: 'entrada',
      date: new Date().toISOString(),
      key: `352606` + Math.floor(100000000000000000 + Math.random() * 900000000000000000),
      ...nfData
    };
    
    // Add to invoices list
    setInvoices(prev => [newNf, ...prev]);

    // Record expense
    const newTransaction = {
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      type: 'expense',
      category: 'Estoque',
      value: nfData.total,
      description: `Nota Fiscal Entrada #${newNf.id} - ${nfData.supplier}`
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // Update stock for ingredients
    if (nfData.items) {
      setInventory(prev => prev.map(invItem => {
        const itemInNf = nfData.items.find(i => i.name.toLowerCase().includes(invItem.name.toLowerCase()) || invItem.name.toLowerCase().includes(i.name.toLowerCase()));
        if (itemInNf) {
          return { ...invItem, quantity: invItem.quantity + itemInNf.quantity };
        }
        return invItem;
      }));

      // Auto-update or insert Quotation in real-time from Inflow NF!
      setQuotations(prev => {
        let updatedList = [...prev];
        nfData.items.forEach(nfItem => {
          const supplierName = nfData.supplier || 'Fornecedor NF-e';
          const existingIdx = updatedList.findIndex(q => 
            q.productName.toLowerCase() === nfItem.name.toLowerCase() && 
            q.supplier.toLowerCase() === supplierName.toLowerCase()
          );

          const pkgPrice = parseFloat(nfItem.price) || 0;
          const pkgQty = parseFloat(nfItem.quantity) || 1;
          const calculatedUnit = parseFloat((pkgPrice / pkgQty).toFixed(2));

          if (existingIdx > -1) {
            updatedList[existingIdx] = {
              ...updatedList[existingIdx],
              packagePrice: pkgPrice,
              unitPrice: calculatedUnit,
              lastUpdated: todayStr
            };
          } else {
            updatedList.unshift({
              id: 'q-' + Date.now() + Math.floor(Math.random() * 1000),
              productName: nfItem.name,
              supplier: supplierName,
              brand: 'NF-e Entrada',
              package: `${pkgQty} un`,
              packagePrice: pkgPrice,
              unitPrice: calculatedUnit,
              unitType: 'un',
              lastUpdated: todayStr
            });
          }
        });
        return updatedList;
      });
    }
  };

  // Quotation actions
  const addQuotation = (quotData) => {
    const newQuot = {
      id: 'q-' + Date.now(),
      lastUpdated: new Date().toISOString().split('T')[0],
      ...quotData
    };
    setQuotations(prev => [newQuot, ...prev]);
  };

  const updateQuotation = (id, updatedData) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : q));
  };

  const deleteQuotation = (id) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  // Product actions
  const upsertProduct = (productData) => {
    if (productData.id) {
      setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    } else {
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      setProducts(prev => [...prev, { ...productData, id: newId }]);
    }
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Financial actions
  const addTransaction = (transData) => {
    const newTrans = {
      id: 't-' + Date.now(),
      date: new Date().toISOString(),
      ...transData
    };
    setTransactions(prev => [newTrans, ...prev]);
  };

  return (
    <SystemContext.Provider value={{
      products,
      inventory,
      orders,
      transactions,
      invoices,
      quotations,
      createOrder,
      updateOrderStatus,
      adjustStock,
      registerInflowInvoice,
      upsertProduct,
      deleteProduct,
      addTransaction,
      addQuotation,
      updateQuotation,
      deleteQuotation
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
