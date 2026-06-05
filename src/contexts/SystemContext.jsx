import React, { createContext, useContext, useState, useEffect } from 'react';

const SystemContext = createContext(null);

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Hot Dog Tradicional',
    price: 15.90,
    description: 'Salsicha premium na chapa, molho artesanal, batata palha, milho, vinagrete e maionese da casa.',
    category: 'hotdogs',
    active: true,
    recipe: [
      { ingredientId: 1, quantity: 1 }, // 1 pão
      { ingredientId: 2, quantity: 1 }  // 1 salsicha
    ]
  },
  {
    id: 2,
    name: 'Double Bacon Cheddar',
    price: 22.90,
    description: 'Duas salsichas na chapa, bacon crocante, cheddar cremoso derretido, milho e batata palha.',
    category: 'hotdogs',
    active: true,
    recipe: [
      { ingredientId: 1, quantity: 1 }, // 1 pão
      { ingredientId: 2, quantity: 2 }, // 2 salsichas
      { ingredientId: 3, quantity: 1 }  // 1 porção de bacon
    ]
  },
  {
    id: 3,
    name: 'Suco de Laranja (Natural)',
    price: 8.50,
    description: 'Suco de laranja natural prensado na hora, gelado. 400ml.',
    category: 'drinks',
    active: true,
    recipe: [
      { ingredientId: 4, quantity: 4 }  // 4 laranjas
    ]
  },
  {
    id: 4,
    name: 'Suco Verde Detox',
    price: 10.00,
    description: 'Couve fresca, limão, maçã e gengibre batidos na hora. 400ml.',
    category: 'drinks',
    active: true,
    recipe: [
      { ingredientId: 5, quantity: 1 }  // 1 polpa detox
    ]
  },
  {
    id: 5,
    name: 'Batata Frita Canoa',
    price: 13.90,
    description: 'Porção individual de batatas fritas crocantes com tempero especial da casa.',
    category: 'sides',
    active: true,
    recipe: [
      { ingredientId: 6, quantity: 1 }  // 1 porção de batata
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

export const SystemProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('hd_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
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
              stockValid = false; // We could block, but for high-fidelity demos we allow it and trigger alerts
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
          // Add income
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
        else newQty = Math.max(0, amount); // absolute adjust

        // If manual input purchase, log expense
        if (type === 'add' && amount > 0) {
          const cost = amount * 2.5; // Simulated cost per unit
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
        const itemInNf = nfData.items.find(i => i.name.toLowerCase() === invItem.name.toLowerCase());
        if (itemInNf) {
          return { ...invItem, quantity: invItem.quantity + itemInNf.quantity };
        }
        return invItem;
      }));
    }
  };

  // Product actions
  const upsertProduct = (productData) => {
    if (productData.id) {
      // Update
      setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    } else {
      // Create
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
      createOrder,
      updateOrderStatus,
      adjustStock,
      registerInflowInvoice,
      upsertProduct,
      deleteProduct,
      addTransaction
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
