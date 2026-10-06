import React, { useState, useEffect } from 'react';
import { useSystem, playNotificationChime } from '../../contexts/SystemContext';
import { 
  LayoutDashboard, ChefHat, Package, BadgeDollarSign, 
  FileText, PlusCircle, Trash2, AlertTriangle, 
  TrendingUp, Check, RotateCcw, Printer, Download,
  Utensils, X, Plus, Edit, PlusSquare, LogOut,
  ChevronLeft, ChevronRight, Menu, ShoppingBag, Sparkles,
  Search, CheckCircle2, Building2, Bike, Store, Clock, Phone,
  Volume2, VolumeX, Upload, Image, Pause, Play
} from 'lucide-react';

export default function AdminView({ onLogout }) {
  const { 
    products, inventory, orders, transactions, invoices, quotations,
    complements = [],
    updateOrderStatus, deleteOrder, adjustStock, manualStockInflow, registerInflowInvoice, 
    upsertProduct, deleteProduct, toggleProductStatus,
    toggleComplementStatus, upsertComplement, deleteComplement,
    addTransaction, updateTransaction, deleteTransaction,
    addQuotation, updateQuotation, deleteQuotation 
  } = useSystem();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getTabFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#admin/')) {
      const tab = hash.replace('#admin/', '');
      if (['dashboard', 'orders', 'inventory', 'products', 'cotacao', 'finance', 'nfe'].includes(tab)) {
        return tab;
      }
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = `admin/${tab}`;
  };

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Modal states for forms
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product form states
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('prensados');
  const [prodActive, setProdActive] = useState(true);
  const [prodImage, setProdImage] = useState('/images/prensadinho.png');
  const [prodRecipe, setProdRecipe] = useState([]);

  // Menu Sub-tab & Complement states
  const [menuSubTab, setMenuSubTab] = useState('products'); // 'products' | 'complements'
  const [isComplementModalOpen, setIsComplementModalOpen] = useState(false);
  const [editingComplement, setEditingComplement] = useState(null);
  const [compName, setCompName] = useState('');
  const [compCategory, setCompCategory] = useState('extra'); // 'extra' | 'complement'
  const [compGroup, setCompGroup] = useState('extras'); // 'extras' | 'creamy' | 'melted' | 'side' | 'other'
  const [compPrice, setCompPrice] = useState('0');
  const [compActive, setCompActive] = useState(true);

  // Manual Stock Entry Modal states
  const [isManualStockModalOpen, setIsManualStockModalOpen] = useState(false);
  const [manualEntryMode, setManualEntryMode] = useState('existing'); // 'existing' | 'new'
  const [manualIngredientId, setManualIngredientId] = useState('');
  const [manualNewName, setManualNewName] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualUnit, setManualUnit] = useState('un');
  const [manualMinQty, setManualMinQty] = useState('10');
  const [manualCost, setManualCost] = useState('');
  const [manualReason, setManualReason] = useState('');

  // Inflow NF form states
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierCnpj, setSupplierCnpj] = useState('');
  const [inflowTotal, setInflowTotal] = useState('');
  const [inflowItems, setInflowItems] = useState([]);
  
  // Finance & Transaction state
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [editingTrans, setEditingTrans] = useState(null);
  const [transType, setTransType] = useState('expense');
  const [transDesc, setTransDesc] = useState('');
  const [transVal, setTransVal] = useState('');
  const [transCat, setTransCat] = useState('Geral');
  const [transDate, setTransDate] = useState('');
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeFilterType, setFinanceFilterType] = useState('all');

  // Quotation form & filter states
  const [isQuotModalOpen, setIsQuotModalOpen] = useState(false);
  const [editingQuot, setEditingQuot] = useState(null);
  const [quotProductName, setQuotProductName] = useState('');
  const [quotSupplier, setQuotSupplier] = useState('Supermercado BH');
  const [quotBrand, setQuotBrand] = useState('');
  const [quotPackage, setQuotPackage] = useState('');
  const [quotPackagePrice, setQuotPackagePrice] = useState('');
  const [quotUnitPrice, setQuotUnitPrice] = useState('');
  const [quotUnitType, setQuotUnitType] = useState('kg');
  
  const [quotFilterSupplier, setQuotFilterSupplier] = useState('todos');
  const [quotSearchTerm, setQuotSearchTerm] = useState('');

  const handleOpenQuotModal = (quot = null) => {
    if (quot) {
      setEditingQuot(quot);
      setQuotProductName(quot.productName);
      setQuotSupplier(quot.supplier);
      setQuotBrand(quot.brand);
      setQuotPackage(quot.package);
      setQuotPackagePrice(quot.packagePrice.toString());
      setQuotUnitPrice(quot.unitPrice.toString());
      setQuotUnitType(quot.unitType || 'kg');
    } else {
      setEditingQuot(null);
      setQuotProductName('');
      setQuotSupplier('Supermercado BH');
      setQuotBrand('');
      setQuotPackage('');
      setQuotPackagePrice('');
      setQuotUnitPrice('');
      setQuotUnitType('kg');
    }
    setIsQuotModalOpen(true);
  };

  const handleSaveQuotation = (e) => {
    e.preventDefault();
    const pkgPrice = parseFloat(quotPackagePrice) || 0;
    const calcUnit = parseFloat(quotUnitPrice) || pkgPrice;

    const quotData = {
      productName: quotProductName,
      supplier: quotSupplier,
      brand: quotBrand,
      package: quotPackage,
      packagePrice: pkgPrice,
      unitPrice: calcUnit,
      unitType: quotUnitType
    };

    if (editingQuot) {
      updateQuotation(editingQuot.id, quotData);
    } else {
      addQuotation(quotData);
    }
    setIsQuotModalOpen(false);
  };

  // Dashboard calculations
  const totalFaturamento = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const totalDespesas = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const saldoLiquido = totalFaturamento - totalDespesas;
  
  const filteredTransactions = transactions.filter(t => {
    if (financeFilterType !== 'all' && t.type !== financeFilterType) return false;
    if (financeSearch) {
      const q = financeSearch.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      const matchVal = t.value?.toString().includes(q);
      if (!matchDesc && !matchCat && !matchVal) return false;
    }
    return true;
  });

  const totalPedidos = orders.length;
  const pedidosHoje = orders.filter(o => {
    const orderDate = new Date(o.date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const criticalStockCount = inventory.filter(item => item.quantity <= item.minQuantity).length;

  // Chart data simulation (last 7 days sales)
  const chartDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const chartSales = [420, 310, 580, 490, 710, 890, 1120];
  const maxSale = Math.max(...chartSales);

  // KDS Orders filter
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const shippingOrders = orders.filter(o => o.status === 'shipping');
  const finishedOrders = orders.filter(o => o.status === 'delivered');

  // Notificação sonora quando um novo pedido cai em Pendentes
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [prevPendingCount, setPrevPendingCount] = useState(pendingOrders.length);
  useEffect(() => {
    if (pendingOrders.length > prevPendingCount) {
      if (isSoundEnabled) {
        playNotificationChime();
      }
    }
    setPrevPendingCount(pendingOrders.length);
  }, [pendingOrders.length, isSoundEnabled, prevPendingCount]);

  // Product CRUD Handlers
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdPrice(product.price.toString());
      setProdDesc(product.description);
      setProdCat(product.category);
      setProdActive(product.active);
      setProdImage(product.image || '/logoNuuPrensado-semfundo.png');
      setProdRecipe(product.recipe || []);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdCat('prensados');
      setProdActive(true);
      setProdImage('/logoNuuPrensado-semfundo.png');
      setProdRecipe(inventory.map(i => ({ ingredientId: i.id, quantity: 0 })));
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const recipeClean = prodRecipe.filter(r => r.quantity > 0);
    const productData = {
      name: prodName,
      price: parseFloat(prodPrice),
      description: prodDesc,
      category: prodCat,
      active: prodActive,
      image: prodImage || '/images/prensadinho.png',
      recipe: recipeClean
    };
    if (editingProduct) {
      productData.id = editingProduct.id;
    }
    upsertProduct(productData);
    setIsProductModalOpen(false);
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setProdImage(loadEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Complement Handlers
  const handleOpenComplementModal = (comp = null, defaultCategory = 'extra') => {
    if (comp) {
      setEditingComplement(comp);
      setCompName(comp.name);
      setCompCategory(comp.category || 'extra');
      setCompGroup(comp.group || 'extras');
      setCompPrice(comp.price !== undefined ? comp.price.toString() : '0');
      setCompActive(comp.active !== false);
    } else {
      setEditingComplement(null);
      setCompName('');
      setCompCategory(defaultCategory);
      setCompGroup(defaultCategory === 'extra' ? 'extras' : 'creamy');
      setCompPrice(defaultCategory === 'extra' ? '4.00' : '0');
      setCompActive(true);
    }
    setIsComplementModalOpen(true);
  };

  const handleSaveComplement = (e) => {
    e.preventDefault();
    if (!compName.trim()) return;

    let groupName = 'Adicionais Extras';
    if (compGroup === 'creamy') groupName = 'Queijo Cremoso';
    else if (compGroup === 'melted') groupName = 'Queijo Fatiado';
    else if (compGroup === 'side') groupName = 'Acompanhamento';
    else if (compGroup === 'other') groupName = 'Outros Complementos';

    const payload = {
      name: compName.trim(),
      category: compCategory,
      group: compGroup,
      groupName,
      price: parseFloat(compPrice) || 0,
      active: compActive
    };

    if (editingComplement) {
      upsertComplement({ ...payload, id: editingComplement.id });
    } else {
      upsertComplement(payload);
    }
    setIsComplementModalOpen(false);
    setEditingComplement(null);
  };

  // Manual Stock Entry Handler
  const handleSaveManualStock = (e) => {
    e.preventDefault();
    const qty = parseFloat(manualQty);
    if (!qty || qty <= 0) {
      alert('Por favor, informe uma quantidade válida maior que zero.');
      return;
    }

    if (manualEntryMode === 'existing') {
      const selected = inventory.find(i => i.id === parseInt(manualIngredientId));
      if (!selected) {
        alert('Selecione um insumo da lista.');
        return;
      }
      manualStockInflow({
        ingredientId: selected.id,
        name: selected.name,
        quantity: qty,
        unit: selected.unit,
        cost: parseFloat(manualCost) || 0,
        reason: manualReason
      });
    } else {
      if (!manualNewName.trim()) {
        alert('Informe o nome do novo insumo.');
        return;
      }
      manualStockInflow({
        name: manualNewName.trim(),
        quantity: qty,
        minQuantity: parseFloat(manualMinQty) || 10,
        unit: manualUnit,
        cost: parseFloat(manualCost) || 0,
        reason: manualReason
      });
    }

    setIsManualStockModalOpen(false);
    setManualQty('');
    setManualCost('');
    setManualReason('');
    setManualNewName('');
  };

  const handleRecipeQtyChange = (ingredientId, qty) => {
    const numericQty = parseFloat(qty) || 0;
    setProdRecipe(prev => {
      const idx = prev.findIndex(r => r.ingredientId === ingredientId);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity = numericQty;
        return updated;
      } else {
        return [...prev, { ingredientId, quantity: numericQty }];
      }
    });
  };

  // Finance Handlers
  const formatDateTimeForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const handleOpenTransactionModal = (trans = null, defaultType = 'expense') => {
    if (trans) {
      setEditingTrans(trans);
      setTransType(trans.type || 'expense');
      setTransDesc(trans.description || '');
      setTransVal(trans.value !== undefined ? String(trans.value) : '');
      setTransCat(trans.category || 'Geral');
      setTransDate(formatDateTimeForInput(trans.date));
    } else {
      setEditingTrans(null);
      setTransType(defaultType);
      setTransDesc('');
      setTransVal('');
      setTransCat(defaultType === 'income' ? 'Vendas' : 'Geral');
      setTransDate(formatDateTimeForInput(new Date().toISOString()));
    }
    setIsTransModalOpen(true);
  };

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    if (!transDesc || !transVal) return;
    const numVal = parseFloat(transVal);
    if (isNaN(numVal) || numVal < 0) {
      alert('Por favor, informe um valor válido.');
      return;
    }

    const payload = {
      type: transType,
      category: transCat || 'Geral',
      value: numVal,
      description: transDesc,
      date: transDate ? new Date(transDate).toISOString() : new Date().toISOString()
    };

    if (editingTrans) {
      updateTransaction(editingTrans.id, payload);
    } else {
      addTransaction(payload);
    }

    setIsTransModalOpen(false);
    setEditingTrans(null);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento financeiro? Essa ação recalculará o faturamento e as despesas imediatamente.')) {
      deleteTransaction(id);
    }
  };

  // Inflow NF Handlers
  const handleAddInflowItem = (name, quantity, unitPrice) => {
    setInflowItems(prev => [
      ...prev,
      { name, quantity: parseFloat(quantity), price: parseFloat(unitPrice) }
    ]);
  };

  const handleSaveInflowInvoice = (e) => {
    e.preventDefault();
    if (inflowItems.length === 0) return;

    const calcTotal = inflowItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    registerInflowInvoice({
      supplier: supplierName,
      supplierCnpj: supplierCnpj || '00.000.000/0001-00',
      total: calcTotal,
      items: inflowItems
    });

    setIsInflowModalOpen(false);
    setSupplierName('');
    setSupplierCnpj('');
    setInflowItems([]);
  };

  const tabDetails = {
    dashboard: { label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    orders: { 
      label: 'Cozinha & Pedidos', 
      icon: <ChefHat size={20} />, 
      badge: (pendingOrders.length + preparingOrders.length + shippingOrders.length) > 0 ? (pendingOrders.length + preparingOrders.length + shippingOrders.length) : null,
      badgeColor: 'var(--color-brand)' 
    },
    inventory: { 
      label: 'Controle de Estoque', 
      icon: <Package size={20} />, 
      badge: criticalStockCount > 0 ? criticalStockCount : null,
      badgeColor: 'var(--color-danger)' 
    },
    products: { label: 'Cardápio / Produtos', icon: <Utensils size={20} /> },
    cotacao: { label: 'Cotações', icon: <ShoppingBag size={20} /> },
    finance: { label: 'Financeiro', icon: <BadgeDollarSign size={20} /> },
    nfe: { label: 'Notas Fiscais (NF-e)', icon: <FileText size={20} /> }
  };

  return (
    <div className="admin-view animate-fade-in" style={{ flex: 1, padding: '1rem 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Mobile Header Menu (Pizza / Dropdown) */}
        <div className="mobile-admin-header glass-panel" style={{ padding: '12px 16px', marginBottom: '1.25rem', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
              <span style={{ color: 'var(--color-brand-yellow)' }}>{tabDetails[activeTab]?.icon}</span>
              <span>{tabDetails[activeTab]?.label}</span>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="btn-primary" 
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span>Menu Gestão</span>
            </button>
          </div>

          {/* Menu Dropdown de Opções Selecionáveis em Mobile */}
          {isMobileMenuOpen && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
              {Object.entries(tabDetails).map(([key, tab]) => (
                <button
                  key={key}
                  onClick={() => {
                    changeTab(key);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`nav-link ${activeTab === key ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span style={{ 
                      backgroundColor: tab.badgeColor, 
                      color: '#fff', 
                      fontSize: '0.75rem', 
                      padding: '2px 6px', 
                      borderRadius: '99px',
                      fontWeight: 'bold'
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}

              <button 
                onClick={onLogout} 
                className="nav-link"
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', padding: '10px 14px', marginTop: '4px' }}
              >
                <LogOut size={18} />
                <span>Sair do Painel</span>
              </button>
            </div>
          )}

        </div>

        <div 
          className="admin-layout" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isSidebarCollapsed ? '72px 1fr' : '220px 1fr', 
            gap: '1.5rem',
            transition: 'grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          
          {/* Desktop-Only Sidebar Navigation */}
          <aside className="desktop-only-sidebar admin-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Botão para Minimizar / Expandir */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="nav-link"
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'space-between', 
                padding: '8px 12px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '6px',
                border: '1px solid var(--border-glass)'
              }}
              title={isSidebarCollapsed ? "Expandir Menu Lateral" : "Minimizar Menu Lateral"}
            >
              {!isSidebarCollapsed && <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Navegação Gestão</span>}
              {isSidebarCollapsed ? <ChevronRight size={18} color="var(--color-brand-yellow)" /> : <ChevronLeft size={18} />}
            </button>

            {/* Dashboard */}
            <button 
              onClick={() => changeTab('dashboard')} 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Dashboard"
            >
              <LayoutDashboard size={20} />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>
            
            {/* Cozinha & Pedidos */}
            <button 
              onClick={() => changeTab('orders')} 
              className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
                position: 'relative',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Cozinha & Pedidos"
            >
              <ChefHat size={20} />
              {!isSidebarCollapsed && <span>Cozinha & Pedidos</span>}
              {(pendingOrders.length + preparingOrders.length) > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: isSidebarCollapsed ? '2px' : '50%',
                  right: isSidebarCollapsed ? '2px' : '12px',
                  transform: isSidebarCollapsed ? 'none' : 'translateY(-50%)',
                  backgroundColor: 'var(--color-brand)', 
                  color: '#fff', 
                  fontSize: '0.7rem', 
                  padding: '2px 5px', 
                  borderRadius: '99px',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {pendingOrders.length + preparingOrders.length}
                </span>
              )}
            </button>

            {/* Controle de Estoque */}
            <button 
              onClick={() => changeTab('inventory')} 
              className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
                position: 'relative',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Controle de Estoque"
            >
              <Package size={20} />
              {!isSidebarCollapsed && <span>Controle de Estoque</span>}
              {criticalStockCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: isSidebarCollapsed ? '2px' : '50%',
                  right: isSidebarCollapsed ? '2px' : '12px',
                  transform: isSidebarCollapsed ? 'none' : 'translateY(-50%)',
                  backgroundColor: 'var(--color-danger)', 
                  color: '#fff', 
                  fontSize: '0.7rem', 
                  padding: '2px 5px', 
                  borderRadius: '99px',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {criticalStockCount}
                </span>
              )}
            </button>

            {/* Cardápio / Produtos */}
            <button 
              onClick={() => changeTab('products')} 
              className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Cardápio / Produtos"
            >
              <Utensils size={20} />
              {!isSidebarCollapsed && <span>Cardápio / Produtos</span>}
            </button>

            {/* Cotações */}
            <button 
              onClick={() => changeTab('cotacao')} 
              className={`nav-link ${activeTab === 'cotacao' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px',
                whiteSpace: 'nowrap'
              }}
              title="Cotações"
            >
              <ShoppingBag size={20} />
              {!isSidebarCollapsed && <span>Cotações</span>}
            </button>

            {/* Financeiro */}
            <button 
              onClick={() => changeTab('finance')} 
              className={`nav-link ${activeTab === 'finance' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Financeiro"
            >
              <BadgeDollarSign size={20} />
              {!isSidebarCollapsed && <span>Financeiro</span>}
            </button>

            {/* Notas Fiscais (NF-e) */}
            <button 
              onClick={() => changeTab('nfe')} 
              className={`nav-link ${activeTab === 'nfe' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Notas Fiscais (NF-e)"
            >
              <FileText size={20} />
              {!isSidebarCollapsed && <span>Notas Fiscais (NF-e)</span>}
            </button>

            {/* Sair do Painel */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button 
                onClick={onLogout} 
                className="nav-link"
                style={{ 
                  width: '100%', 
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
                  color: '#ef4444',
                  padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
                }}
                title="Sair do Painel"
              >
                <LogOut size={20} />
                {!isSidebarCollapsed && <span>Sair do Painel</span>}
              </button>
            </div>
          </aside>

        {/* Main Content Area */}
        <main className="glass-panel" style={{ padding: '2rem', minHeight: '60vh' }}>
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>Visão Geral do Negócio</h2>
              
              {/* KPIs */}
              <div className="kpi-grid">
                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="kpi-info">
                    <h4>Faturamento Total</h4>
                    <p>R$ {totalFaturamento.toFixed(2)}</p>
                  </div>
                </div>

                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: 'var(--color-danger-glow)', color: 'var(--color-danger)' }}>
                    <BadgeDollarSign size={24} />
                  </div>
                  <div className="kpi-info">
                    <h4>Despesas Gerais</h4>
                    <p>R$ {totalDespesas.toFixed(2)}</p>
                  </div>
                </div>

                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: saldoLiquido >= 0 ? 'rgba(16,185,129,0.15)' : 'var(--color-danger-glow)', color: saldoLiquido >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    <TrendingUp size={24} style={{ transform: saldoLiquido < 0 ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  <div className="kpi-info">
                    <h4>Lucro Líquido</h4>
                    <p>R$ {saldoLiquido.toFixed(2)}</p>
                  </div>
                </div>

                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--color-info)' }}>
                    <ChefHat size={24} />
                  </div>
                  <div className="kpi-info">
                    <h4>Pedidos Hoje</h4>
                    <p>{pedidosHoje} / {totalPedidos}</p>
                  </div>
                </div>
              </div>

              {/* Alert for critical stock */}
              {criticalStockCount > 0 && (
                <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'var(--color-danger-glow)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                  <AlertTriangle color="var(--color-danger)" size={20} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>Alerta de Estoque Crítico!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Existem <strong>{criticalStockCount}</strong> insumos com quantidades abaixo do mínimo recomendado. Acesse a aba "Controle de Estoque" para abastecer.
                    </p>
                  </div>
                </div>
              )}

              {/* Chart SVG */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>Desempenho de Vendas Semanais (Simulado)</h3>
                
                {/* SVG Line Chart Representation */}
                <div style={{ position: 'relative', height: '220px', width: '100%', marginTop: '1rem' }}>
                  <svg viewBox="0 0 700 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="700" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="0" y1="150" x2="700" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="0" y1="190" x2="700" y2="190" stroke="rgba(255,255,255,0.1)" />

                    {/* Chart Gradient fill */}
                    <path
                      d="M 50 190 L 50 110 L 150 140 L 250 80 L 350 100 L 450 60 L 550 40 L 650 20 L 650 190 Z"
                      fill="url(#gradientSales)"
                      opacity="0.2"
                    />

                    {/* Chart Line */}
                    <path
                      d="M 50 110 L 150 140 L 250 80 L 350 100 L 450 60 L 550 40 L 650 20"
                      fill="none"
                      stroke="var(--color-brand)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Dots */}
                    {[
                      {x: 50, y: 110, val: 420},
                      {x: 150, y: 140, val: 310},
                      {x: 250, y: 80, val: 580},
                      {x: 350, y: 100, val: 490},
                      {x: 450, y: 60, val: 710},
                      {x: 550, y: 40, val: 890},
                      {x: 650, y: 20, val: 1120}
                    ].map((dot, i) => (
                      <g key={i}>
                        <circle cx={dot.x} cy={dot.y} r="6" fill="var(--color-brand)" stroke="#090d16" strokeWidth="2" />
                        <text x={dot.x} y={dot.y - 12} textAnchor="middle" fill="var(--text-secondary)" fontSize="10px" fontWeight="bold">
                          R$ {dot.val}
                        </text>
                      </g>
                    ))}

                    {/* Axis Labels */}
                    {chartDays.map((day, idx) => (
                      <text key={idx} x={50 + idx * 100} y="215" textAnchor="middle" fill="var(--text-muted)" fontSize="12px">
                        {day}
                      </text>
                    ))}

                    <defs>
                      <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS & KITCHEN */}
          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              {/* Header do KDS com status em tempo real e controle de som */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Monitor de Pedidos & Cozinha (KDS)</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                    <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 500 }}>Sincronização em tempo real ativa</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      const next = !isSoundEnabled;
                      setIsSoundEnabled(next);
                      if (next) playNotificationChime();
                    }}
                    style={{
                      background: isSoundEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      border: `1px solid ${isSoundEnabled ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      color: isSoundEnabled ? '#34d399' : '#ef4444',
                      padding: '6px 14px',
                      borderRadius: '99px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: '0.2s'
                    }}
                    title="Ativar ou silenciar alerta sonoro de novos pedidos"
                  >
                    {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span>{isSoundEnabled ? 'Campainha Ativa' : 'Campainha Muta'}</span>
                  </button>
                </div>
              </div>
              
              {/* Grid das 3 Colunas: Pendentes > Em Preparo > Entrega/Retirada */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                
                {/* 1. COLUNA: PENDENTES */}
                <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-danger)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></span>
                      Pendentes
                    </span>
                    <span className="badge badge-pending" style={{ fontSize: '0.8rem', padding: '3px 10px' }}>{pendingOrders.length}</span>
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingOrders.map(order => {
                      const cleanPhone = order.phone ? order.phone.replace(/\D/g, '') : '';
                      return (
                        <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {/* Cabeçalho do Card */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.05rem' }}>#{order.id}</span>
                              <button 
                                onClick={() => { if (confirm(`Deseja excluir o pedido #${order.id}?`)) deleteOrder(order.id); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Excluir este pedido"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} />
                              {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>

                          {/* Cliente e WhatsApp */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>{order.customerName}</span>
                            {cleanPhone && (
                              <a 
                                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${order.customerName}! Aqui é do Nuu Prensado sobre seu pedido #${order.id}.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#25D366', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(37,211,102,0.1)', padding: '2px 8px', borderRadius: '4px' }}
                                title="Falar no WhatsApp"
                              >
                                <Phone size={12} /> WhatsApp
                              </a>
                            )}
                          </div>

                          {/* Badges de Tipo e Pagamento */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontWeight: 600,
                              backgroundColor: order.type === 'delivery' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                              color: order.type === 'delivery' ? '#60a5fa' : '#34d399',
                              border: order.type === 'delivery' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(16,185,129,0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {order.type === 'delivery' ? <Bike size={13} /> : <Store size={13} />}
                              {order.type === 'delivery' ? 'Delivery' : 'Balcão'}
                            </span>

                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontWeight: 600,
                              backgroundColor: 'rgba(251,191,36,0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251,191,36,0.3)'
                            }}>
                              {order.paymentMethod} {order.changeFor ? `(Troco p/ ${order.changeFor})` : ''}
                            </span>
                          </div>

                          {/* Endereço de entrega se for delivery */}
                          {order.type === 'delivery' && order.address && (
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '10px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '4px', lineHeight: '1.3' }}>
                              📍 {order.address}
                            </div>
                          )}

                          {/* Itens do Pedido */}
                          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', margin: '8px 0' }}>
                            <ul style={{ paddingLeft: '15px', fontSize: '0.82rem', color: '#e2e8f0', margin: 0 }}>
                              {order.items.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '4px' }}>
                                  <strong>{item.quantity}x</strong> {item.name}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Rodapé: Total e Ação */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand)' }}>R$ {order.total.toFixed(2)}</span>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <ChefHat size={14} /> Mover p/ Chapa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pendingOrders.length === 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        Nenhum pedido pendente no momento.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. COLUNA: EM PREPARO */}
                <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-warning)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></span>
                      Em Preparo (Na Chapa)
                    </span>
                    <span className="badge badge-preparing" style={{ fontSize: '0.8rem', padding: '3px 10px' }}>{preparingOrders.length}</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {preparingOrders.map(order => {
                      const cleanPhone = order.phone ? order.phone.replace(/\D/g, '') : '';
                      return (
                        <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {/* Cabeçalho do Card */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.05rem' }}>#{order.id}</span>
                              <button 
                                onClick={() => { if (confirm(`Deseja excluir o pedido #${order.id}?`)) deleteOrder(order.id); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Excluir este pedido"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} />
                              {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>

                          {/* Cliente e WhatsApp */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>{order.customerName}</span>
                            {cleanPhone && (
                              <a 
                                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${order.customerName}! Seu pedido #${order.id} já está sendo preparado pelo chapeiro.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#25D366', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(37,211,102,0.1)', padding: '2px 8px', borderRadius: '4px' }}
                                title="Falar no WhatsApp"
                              >
                                <Phone size={12} /> WhatsApp
                              </a>
                            )}
                          </div>

                          {/* Badges */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontWeight: 600,
                              backgroundColor: order.type === 'delivery' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                              color: order.type === 'delivery' ? '#60a5fa' : '#34d399',
                              border: order.type === 'delivery' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(16,185,129,0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {order.type === 'delivery' ? <Bike size={13} /> : <Store size={13} />}
                              {order.type === 'delivery' ? 'Delivery' : 'Balcão'}
                            </span>

                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontWeight: 600,
                              backgroundColor: 'rgba(251,191,36,0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251,191,36,0.3)'
                            }}>
                              {order.paymentMethod}
                            </span>
                          </div>

                          {/* Itens do Pedido */}
                          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', margin: '8px 0' }}>
                            <ul style={{ paddingLeft: '15px', fontSize: '0.82rem', color: '#e2e8f0', margin: 0 }}>
                              {order.items.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '4px' }}>
                                  <strong>{item.quantity}x</strong> {item.name}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Rodapé: Total e Ação (SEMPRE move para Entrega/Retirada) */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand)' }}>R$ {order.total.toFixed(2)}</span>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'shipping')}
                              className="btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', backgroundColor: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              {order.type === 'delivery' ? <Bike size={14} /> : <Store size={14} />}
                              {order.type === 'delivery' ? 'Pronto p/ Entrega' : 'Pronto no Balcão'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {preparingOrders.length === 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        Nenhum lanche na chapa agora.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. COLUNA: ENTREGA / RETIRADA */}
                <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-info)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-info)' }}></span>
                      Entrega / Retirada
                    </span>
                    <span className="badge badge-shipping" style={{ fontSize: '0.8rem', padding: '3px 10px' }}>{shippingOrders.length}</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {shippingOrders.map(order => {
                      const cleanPhone = order.phone ? order.phone.replace(/\D/g, '') : '';
                      return (
                        <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {/* Cabeçalho do Card */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.05rem' }}>#{order.id}</span>
                              <button 
                                onClick={() => { if (confirm(`Deseja excluir o pedido #${order.id}?`)) deleteOrder(order.id); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Excluir este pedido"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} />
                              {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>

                          {/* Cliente e WhatsApp */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>{order.customerName}</span>
                            {cleanPhone && (
                              <a 
                                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${order.customerName}! Seu pedido #${order.id} ${order.type === 'delivery' ? 'já saiu para entrega!' : 'está pronto para retirada no balcão!'}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#25D366', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(37,211,102,0.1)', padding: '2px 8px', borderRadius: '4px' }}
                                title="Avisar no WhatsApp"
                              >
                                <Phone size={12} /> Avisar Cliente
                              </a>
                            )}
                          </div>

                          {/* Status de Destino */}
                          {order.type === 'delivery' ? (
                            <div style={{ fontSize: '0.78rem', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '10px', lineHeight: '1.4' }}>
                              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                <Bike size={14} /> Saiu para Entrega
                              </div>
                              <div>📍 {order.address}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.78rem', color: '#6ee7b7', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                <Store size={14} /> Pronto no Balcão
                              </div>
                              <div>Aguardando cliente retirar presencialmente</div>
                            </div>
                          )}

                          {/* Resumo breve dos itens */}
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {order.items.map((i, idx) => `${i.quantity}x ${i.name}`).join(' | ')}
                          </div>

                          {/* Rodapé: Total e Ação de Finalizar */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand)' }}>R$ {order.total.toFixed(2)}</span>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', backgroundColor: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <Check size={14} />
                              {order.type === 'delivery' ? 'Concluir Entrega' : 'Confirmar Retirada'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {shippingOrders.length === 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        Nenhum pedido em rota ou aguardando retirada.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Seção inferior: Pedidos Finalizados Hoje */}
              {finishedOrders.length > 0 && (
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="var(--color-success)" />
                    Pedidos Concluídos Hoje ({finishedOrders.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {finishedOrders.slice(0, 6).map(order => (
                      <div key={order.id} className="glass-panel" style={{ padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>#{order.id} - {order.customerName}</span>
                            <button 
                              onClick={() => { if (confirm(`Deseja excluir o pedido #${order.id}?`)) deleteOrder(order.id); }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                              title="Excluir este pedido"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {order.type === 'delivery' ? '🛵 Delivery' : '🏪 Balcão'} • {order.paymentMethod}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.9rem' }}>R$ {order.total.toFixed(2)}</div>
                          <span className="badge badge-delivered" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Finalizado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Controle de Estoque (Insumos)</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      setManualIngredientId(inventory[0]?.id?.toString() || '');
                      setManualEntryMode('existing');
                      setManualQty('');
                      setManualCost('');
                      setManualReason('');
                      setManualNewName('');
                      setIsManualStockModalOpen(true);
                    }} 
                    className="btn-primary" 
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <PlusCircle size={16} /> Entrada Manual de Estoque
                  </button>
                  <button 
                    onClick={() => setIsInflowModalOpen(true)} 
                    className="btn-secondary" 
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <PlusSquare size={16} /> Nota Fiscal de Entrada
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Qtd. Atual</th>
                      <th>Qtd. Mínima</th>
                      <th>Unidade</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => {
                      const isCritical = item.quantity <= item.minQuantity;
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td style={{ color: isCritical ? 'var(--color-danger)' : '#fff', fontWeight: 700 }}>
                            {item.quantity}
                          </td>
                          <td>{item.minQuantity}</td>
                          <td>{item.unit}</td>
                          <td>
                            {isCritical ? (
                              <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Abastecer</span>
                            ) : (
                              <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Ok</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => adjustStock(item.id, 10, 'add')}
                                style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-success)', border: '1px solid var(--border-glass)' }}
                              >
                                +10
                              </button>
                              <button 
                                onClick={() => adjustStock(item.id, 1, 'remove')}
                                style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-danger)', border: '1px solid var(--border-glass)' }}
                              >
                                -1
                              </button>
                              <button 
                                onClick={() => {
                                  const val = prompt(`Ajustar quantidade de ${item.name}:`, item.quantity);
                                  if (val !== null && !isNaN(val)) {
                                    adjustStock(item.id, parseFloat(val), 'adjust');
                                  }
                                }}
                                style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)' }}
                              >
                                Ajustar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS & COMPLEMENTS */}
          {activeTab === 'products' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Gestão de Cardápio & Itens</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Pause ou ative produtos, queijos e adicionais com 1 clique para controlar a disponibilidade no cardápio do cliente.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {menuSubTab === 'products' ? (
                    <button onClick={() => handleOpenProductModal(null)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                      <Plus size={16} /> Cadastrar Produto
                    </button>
                  ) : (
                    <button onClick={() => handleOpenComplementModal(null)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                      <Plus size={16} /> Novo Adicional / Complemento
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-abas de Navegação */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMenuSubTab('products')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    backgroundColor: menuSubTab === 'products' ? 'var(--color-brand)' : 'var(--bg-secondary)',
                    color: '#fff',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <Utensils size={16} />
                  <span>Lanches & Bebidas</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '2px 7px', 
                    borderRadius: '99px', 
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    fontWeight: 800
                  }}>
                    {products.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuSubTab('complements')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    backgroundColor: menuSubTab === 'complements' ? 'var(--color-brand)' : 'var(--bg-secondary)',
                    color: '#fff',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <Sparkles size={16} />
                  <span>Adicionais & Complementos</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '2px 7px', 
                    borderRadius: '99px', 
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    fontWeight: 800
                  }}>
                    {complements.length}
                  </span>
                </button>
              </div>

              {/* SUBTAB 1: PRODUTOS PRINCIPAIS */}
              {menuSubTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total: <strong>{products.length}</strong> produtos • <span style={{ color: '#4ade80' }}>{products.filter(p => p.active).length} ativos</span> • <span style={{ color: '#f87171' }}>{products.filter(p => !p.active).length} pausados</span>
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}>Foto</th>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Preço</th>
                          <th style={{ textAlign: 'center' }}>Disponibilidade (1-Clique)</th>
                          <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(prod => (
                          <tr key={prod.id} style={{ opacity: prod.active ? 1 : 0.75, transition: 'opacity 0.2s' }}>
                            <td>
                              <img 
                                src={prod.image || '/logoNuuPrensado-semfundo.png'} 
                                alt={prod.name} 
                                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '2px' }}
                                onError={(e) => { 
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/logoNuuPrensado-semfundo.png'; 
                                }}
                              />
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {prod.name}
                                {!prod.active && (
                                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                                    PAUSADO
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.description}</div>
                            </td>
                            <td>
                              <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{prod.category}</span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-brand)' }}>
                              R$ {prod.price.toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => toggleProductStatus(prod.id)}
                                title={prod.active ? "Clique para pausar no cardápio" : "Clique para reativar no cardápio"}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '99px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: '1px solid',
                                  transition: 'all 0.2s',
                                  backgroundColor: prod.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: prod.active ? '#4ade80' : '#f87171',
                                  borderColor: prod.active ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'
                                }}
                              >
                                {prod.active ? (
                                  <>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                                    <span>Ativo (Liberado)</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause size={12} />
                                    <span>Pausado (Esgotado)</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => toggleProductStatus(prod.id)}
                                  style={{ 
                                    padding: '6px 8px', 
                                    borderRadius: '4px', 
                                    backgroundColor: 'var(--bg-tertiary)', 
                                    color: prod.active ? '#f59e0b' : '#22c55e', 
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                  title={prod.active ? "Pausar Produto" : "Ativar Produto"}
                                >
                                  {prod.active ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                                <button 
                                  onClick={() => handleOpenProductModal(prod)}
                                  style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-info)', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                  title="Editar Produto e Foto"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Excluir produto ${prod.name}?`)) {
                                      deleteProduct(prod.id);
                                    }
                                  }}
                                  style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-danger)', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                  title="Excluir Produto"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: ADICIONAIS & COMPLEMENTOS */}
              {menuSubTab === 'complements' && (
                <div>
                  <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderLeft: '4px solid var(--color-brand)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      💡 <strong>Dica da Cozinha:</strong> Se faltar bacon, catupiry ou cheddar na chapa, basta pausar o item aqui. O cliente verá como <strong>"Esgotado / Indisponível"</strong> no cardápio na hora!
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                      <strong>{complements.filter(c => c.active).length}</strong> ativos • <strong style={{ color: '#f87171' }}>{complements.filter(c => !c.active).length}</strong> pausados
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Item / Adicional</th>
                          <th>Grupo / Categoria</th>
                          <th>Valor Adicional</th>
                          <th style={{ textAlign: 'center' }}>Disponibilidade (1-Clique)</th>
                          <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complements.map(comp => (
                          <tr key={comp.id} style={{ opacity: comp.active ? 1 : 0.75, transition: 'opacity 0.2s' }}>
                            <td>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{comp.name}</span>
                                {!comp.active && (
                                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                                    ESGOTADO
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span style={{ 
                                fontSize: '0.78rem', 
                                padding: '3px 8px', 
                                borderRadius: '4px', 
                                backgroundColor: 'var(--bg-secondary)', 
                                border: '1px solid var(--border-glass)',
                                color: comp.group === 'extras' ? '#f59e0b' : comp.group === 'creamy' ? '#60a5fa' : comp.group === 'melted' ? '#fbbf24' : '#a3e635'
                              }}>
                                {comp.groupName || comp.group || comp.category}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: comp.price > 0 ? 'var(--color-brand)' : 'var(--text-secondary)' }}>
                              {comp.price > 0 ? `+ R$ ${comp.price.toFixed(2)}` : 'Incluso (R$ 0,00)'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => toggleComplementStatus(comp.id)}
                                title={comp.active ? "Clique para pausar no cardápio" : "Clique para reativar no cardápio"}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '99px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: '1px solid',
                                  transition: 'all 0.2s',
                                  backgroundColor: comp.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: comp.active ? '#4ade80' : '#f87171',
                                  borderColor: comp.active ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'
                                }}
                              >
                                {comp.active ? (
                                  <>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                                    <span>Ativo (Disponível)</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause size={12} />
                                    <span>Pausado (Esgotado)</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => toggleComplementStatus(comp.id)}
                                  style={{ 
                                    padding: '6px 8px', 
                                    borderRadius: '4px', 
                                    backgroundColor: 'var(--bg-tertiary)', 
                                    color: comp.active ? '#f59e0b' : '#22c55e', 
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                  title={comp.active ? "Pausar Complemento" : "Ativar Complemento"}
                                >
                                  {comp.active ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                                <button 
                                  onClick={() => handleOpenComplementModal(comp)}
                                  style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-info)', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                  title="Editar Complemento"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Excluir complemento "${comp.name}"?`)) {
                                      deleteComplement(comp.id);
                                    }
                                  }}
                                  style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-danger)', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                  title="Excluir Complemento"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: COTAÇÃO & MENOR PREÇO */}
          {activeTab === 'cotacao' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>Cotação & Menor Preço</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Comparador de custo-benefício (R$/kg, R$/un) sincronizado com o estoque e notas fiscais.
                  </p>
                </div>

                <button 
                  onClick={() => handleOpenQuotModal()} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  <PlusCircle size={15} /> Nova Cotação
                </button>
              </div>

              {/* RECOMENDADOR DE REPOSIÇÃO DE ESTOQUE (CUSTO-BENEFÍCIO CAMPEÃO) */}
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', borderLeft: '4px solid var(--color-brand-yellow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <Sparkles size={18} color="var(--color-brand-yellow)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                    Sugestão de Reposição (Estoque Crítico x Menor Custo)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inventory.filter(item => item.quantity <= item.minQuantity).map(critItem => {
                    const matches = quotations.filter(q => 
                      q.productName.toLowerCase().includes(critItem.name.toLowerCase()) || 
                      critItem.name.toLowerCase().includes(q.productName.toLowerCase())
                    );
                    
                    const cheapest = matches.length > 0 ? [...matches].sort((a, b) => a.unitPrice - b.unitPrice)[0] : null;
                    const qtyNeeded = Math.max(1, critItem.minQuantity * 2 - critItem.quantity);

                    return (
                      <div 
                        key={critItem.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '8px 12px', 
                          backgroundColor: 'var(--bg-secondary)', 
                          borderRadius: '6px',
                          border: '1px solid var(--border-glass)',
                          gap: '12px',
                          whiteSpace: 'nowrap',
                          overflowX: 'auto'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem' }}>{critItem.name}</span>
                          <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--color-danger-glow)', color: 'var(--color-danger)', padding: '1px 6px', borderRadius: '99px', fontWeight: 600 }}>
                            Estoque: {critItem.quantity} {critItem.unit} (Mín: {critItem.minQuantity})
                          </span>
                        </div>

                        {cheapest ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            🏆 <strong>Melhor Custo:</strong> {cheapest.supplier} — <strong>{cheapest.brand}</strong> ({cheapest.package}) a R$ {cheapest.packagePrice.toFixed(2)} (<strong>R$ {cheapest.unitPrice.toFixed(2)}/{cheapest.unitType}</strong>)
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            Sem cotação cadastrada
                          </div>
                        )}

                        {cheapest && (
                          <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-yellow)', fontWeight: 700 }}>
                              Total Est.: R$ {(cheapest.unitPrice * qtyNeeded).toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                              ({qtyNeeded} {critItem.unit})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {inventory.filter(item => item.quantity <= item.minQuantity).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--color-success)', fontSize: '0.8rem' }}>
                      <CheckCircle2 size={16} style={{ margin: '0 auto 4px auto', display: 'block' }} />
                      <span>Todos os insumos estão acima do nível mínimo de estoque!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* FILTROS E PESQUISA DE COTAÇÕES */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'nowrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '480px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Buscar produto ou marca..." 
                      value={quotSearchTerm} 
                      onChange={e => setQuotSearchTerm(e.target.value)} 
                      style={{ paddingLeft: '32px', width: '100%', fontSize: '0.78rem', padding: '5px 10px 5px 32px' }}
                    />
                  </div>

                  <select 
                    value={quotFilterSupplier} 
                    onChange={e => setQuotFilterSupplier(e.target.value)}
                    style={{ minWidth: '140px', fontSize: '0.78rem', padding: '5px 10px' }}
                  >
                    <option value="todos">Todos Fornecedores</option>
                    {Array.from(new Set(quotations.map(q => q.supplier))).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TABELA DE COTAÇÕES */}
              <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '8px 12px' }}>Produto / Insumo</th>
                      <th style={{ padding: '8px 12px' }}>Fornecedor</th>
                      <th style={{ padding: '8px 12px' }}>Marca</th>
                      <th style={{ padding: '8px 12px' }}>Embalagem</th>
                      <th style={{ padding: '8px 12px' }}>Preço Emb.</th>
                      <th style={{ padding: '8px 12px' }}>Custo Unitário</th>
                      <th style={{ padding: '8px 12px' }}>Custo-Benefício</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations
                      .filter(q => {
                        const matchSearch = q.productName.toLowerCase().includes(quotSearchTerm.toLowerCase()) || q.brand.toLowerCase().includes(quotSearchTerm.toLowerCase());
                        const matchSupplier = quotFilterSupplier === 'todos' || q.supplier === quotFilterSupplier;
                        return matchSearch && matchSupplier;
                      })
                      .map(quot => {
                        const sameCategoryQuotations = quotations.filter(item => item.productName.toLowerCase() === quot.productName.toLowerCase());
                        const lowestPrice = Math.min(...sameCategoryQuotations.map(item => item.unitPrice));
                        const isCheapest = quot.unitPrice === lowestPrice;

                        return (
                          <tr key={quot.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#fff' }}>
                              {quot.productName}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                              {quot.supplier}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#fff' }}>
                              {quot.brand}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                              {quot.package}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                              R$ {quot.packagePrice.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: isCheapest ? 'var(--color-brand-yellow)' : '#fff' }}>
                              R$ {quot.unitPrice.toFixed(2)} / {quot.unitType}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {isCheapest ? (
                                <span style={{ backgroundColor: 'var(--color-brand-yellow-glow)', color: 'var(--color-brand-yellow)', border: '1px solid var(--color-brand-yellow)', padding: '2px 7px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700 }}>
                                  ⭐ Menor Preço
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                  Concorrente
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => handleOpenQuotModal(quot)}
                                  className="btn-secondary" 
                                  style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                                  title="Editar"
                                >
                                  <Edit size={13} />
                                </button>
                                <button 
                                  onClick={() => deleteQuotation(quot.id)}
                                  className="btn-secondary" 
                                  style={{ padding: '3px 6px', fontSize: '0.72rem', color: '#ef4444' }}
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FINANCE */}
          {activeTab === 'finance' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Fluxo de Caixa / Financeiro</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Faturamento: <strong style={{ color: 'var(--color-success)' }}>R$ {totalFaturamento.toFixed(2)}</strong> | 
                    Despesas: <strong style={{ color: 'var(--color-danger)' }}>R$ {totalDespesas.toFixed(2)}</strong> | 
                    Saldo Líquido: <strong style={{ color: saldoLiquido >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>R$ {saldoLiquido.toFixed(2)}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleOpenTransactionModal(null, 'income')} 
                    className="btn-primary" 
                    style={{ fontSize: '0.85rem', backgroundColor: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Lançar Receita
                  </button>
                  <button 
                    onClick={() => handleOpenTransactionModal(null, 'expense')} 
                    className="btn-primary" 
                    style={{ fontSize: '0.85rem', backgroundColor: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Lançar Despesa
                  </button>
                </div>
              </div>

              {/* Barra de Filtros e Busca */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '1rem', 
                flexWrap: 'wrap', 
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <Search size={16} color="var(--text-secondary)" />
                  <input 
                    type="text" 
                    placeholder="Buscar por descrição, categoria ou valor..."
                    value={financeSearch}
                    onChange={e => setFinanceSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  {financeSearch && (
                    <button 
                      onClick={() => setFinanceSearch('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                      title="Limpar busca"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setFinanceFilterType('all')}
                    className={financeFilterType === 'all' ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Todos ({transactions.length})
                  </button>
                  <button
                    onClick={() => setFinanceFilterType('income')}
                    className={financeFilterType === 'income' ? 'btn-primary' : 'btn-secondary'}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 12px',
                      backgroundColor: financeFilterType === 'income' ? 'var(--color-success)' : undefined
                    }}
                  >
                    Receitas ({transactions.filter(t => t.type === 'income').length})
                  </button>
                  <button
                    onClick={() => setFinanceFilterType('expense')}
                    className={financeFilterType === 'expense' ? 'btn-primary' : 'btn-secondary'}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 12px',
                      backgroundColor: financeFilterType === 'expense' ? 'var(--color-danger)' : undefined
                    }}
                  >
                    Despesas ({transactions.filter(t => t.type === 'expense').length})
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Tipo</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          Nenhum lançamento financeiro encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(t => (
                        <tr key={t.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                            {new Date(t.date).toLocaleDateString()} <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td>
                            {t.type === 'income' ? (
                              <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Receita</span>
                            ) : (
                              <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Despesa</span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              backgroundColor: 'var(--bg-tertiary)', 
                              fontSize: '0.75rem',
                              border: '1px solid var(--border-glass)'
                            }}>
                              {t.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{t.description}</td>
                          <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                            {t.type === 'income' ? '+' : '-'} R$ {Number(t.value || 0).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenTransactionModal(t)}
                                className="btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Editar Lançamento"
                              >
                                <Edit size={13} /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '0.75rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                title="Excluir Lançamento"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NF-E / NOTES FISCAIS */}
          {activeTab === 'nfe' && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>Histórico de Notas Fiscais (NF-e / NFC-e)</h2>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Parceiro / Cliente</th>
                      <th>Valor Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(nf => (
                      <tr key={nf.id}>
                        <td style={{ fontWeight: 600 }}>{nf.id}</td>
                        <td>{new Date(nf.date).toLocaleDateString()}</td>
                        <td>
                          {nf.type === 'saida' ? (
                            <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Saída (Venda)</span>
                          ) : (
                            <span className="badge badge-preparing" style={{ fontSize: '0.7rem' }}>Entrada (Compra)</span>
                          )}
                        </td>
                        <td>{nf.customerName || nf.supplier}</td>
                        <td style={{ fontWeight: 700 }}>R$ {nf.total.toFixed(2)}</td>
                        <td>
                          <button 
                            onClick={() => setSelectedInvoice(nf)}
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={12} /> Ver DANFE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: DANFE PREVIEW (NF-E SIMULATOR) */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '460px', backgroundColor: '#fff', color: '#000' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderColor: '#ddd' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000' }}>Visualização do Documento Fiscal</h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ color: '#666' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1rem 0.5rem' }}>
              
              {/* Receipt / Invoice Mock Box */}
              <div className="danfe-box">
                <div className="danfe-header">
                  <div className="danfe-title">NUU PRENSADO E SUCOS LTDA</div>
                  <div>CNPJ: 12.345.678/0001-90</div>
                  <div>Rua das Chapa, 10 - Centro</div>
                  <div className="danfe-divider"></div>
                  <strong>DANFE Simplificado de Nota Fiscal Eletrônica</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div><strong>Nº NOTA:</strong> {selectedInvoice.id}</div>
                  <div><strong>DATA EMISSÃO:</strong> {new Date(selectedInvoice.date).toLocaleString()}</div>
                  <div><strong>TIPO:</strong> {selectedInvoice.type === 'saida' ? 'SAÍDA (VENDA)' : 'ENTRADA (ESTOQUE)'}</div>
                  <div><strong>DOC REFERÊNCIA:</strong> #{selectedInvoice.referenceId || 'Estoque'}</div>
                </div>

                <div className="danfe-divider"></div>

                <div style={{ marginBottom: '8px' }}>
                  <strong>{selectedInvoice.type === 'saida' ? 'DESTINATÁRIO (CLIENTE):' : 'EMISSOR (FORNECEDOR):'}</strong>
                  <div>Nome: {selectedInvoice.customerName || selectedInvoice.supplier}</div>
                  <div>CPF/CNPJ: {selectedInvoice.customerCpf || selectedInvoice.supplierCnpj || '***.***.***-**'}</div>
                </div>

                <div className="danfe-divider"></div>

                <strong>ITENS DA NOTA:</strong>
                <div className="danfe-grid" style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
                  <span>Item</span>
                  <span>Qtd x Preço</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                </div>

                {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                  <div className="danfe-grid" key={idx} style={{ padding: '2px 0' }}>
                    <span>{item.name}</span>
                    <span>{item.quantity} x R$ {(item.price || 0).toFixed(2)}</span>
                    <span style={{ textAlign: 'right' }}>R$ {(item.quantity * (item.price || 0)).toFixed(2)}</span>
                  </div>
                ))}

                <div className="danfe-divider"></div>
                <div className="danfe-total">
                  VALOR TOTAL: R$ {selectedInvoice.total.toFixed(2)}
                </div>

                <div className="danfe-divider"></div>
                <div style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '10px' }}>
                  <strong>CHAVE DE ACESSO NF-E:</strong><br/>
                  {selectedInvoice.key}
                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #ddd', padding: '1rem' }}>
              <button 
                onClick={() => {
                  window.print();
                }} 
                className="btn-primary" 
                style={{ backgroundColor: '#000' }}
              >
                <Printer size={16} /> Imprimir Nota
              </button>
              <button onClick={() => setSelectedInvoice(null)} className="btn-secondary" style={{ color: '#000', borderColor: '#ccc' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO/EDIÇÃO DE PRODUTO */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button type="button" onClick={() => setIsProductModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nome do Produto</label>
                  <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Ex: X-Salada Premium" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preço (R$)</label>
                    <input type="number" step="0.01" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Categoria</label>
                    <select value={prodCat} onChange={e => setProdCat(e.target.value)}>
                      <option value="prensados">Lanches Prensados</option>
                      <option value="drinks">Sucos & Bebidas</option>
                      <option value="sides">Acompanhamentos</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descrição</label>
                  <textarea rows="2" value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Descrição dos ingredientes no cardápio" />
                </div>

                {/* Foto do Produto */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image size={16} color="var(--color-brand-yellow)" /> Foto do Produto (Cardápio)
                  </label>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Prévia da Imagem */}
                    <div style={{ 
                      width: '76px', 
                      height: '76px', 
                      borderRadius: '10px', 
                      backgroundColor: 'rgba(0,0,0,0.3)', 
                      border: '2px dashed var(--border-glass)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {prodImage ? (
                        <img 
                          src={prodImage} 
                          alt="Prévia" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                          onError={(e) => { 
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/logoNuuPrensado-semfundo.png'; 
                          }}
                        />
                      ) : (
                        <Image size={24} color="var(--text-muted)" />
                      )}
                    </div>

                    {/* Controles de Upload e URL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label 
                        className="btn-secondary" 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          cursor: 'pointer', 
                          fontSize: '0.78rem', 
                          padding: '6px 12px',
                          width: 'fit-content'
                        }}
                      >
                        <Upload size={14} /> Enviar Foto do Dispositivo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageFileUpload} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      
                      <input 
                        type="text" 
                        value={prodImage} 
                        onChange={e => setProdImage(e.target.value)} 
                        placeholder="Ou digite a URL/caminho da foto (ex: /Produtos/Prensadão de Costela.jpeg)" 
                        style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  {/* Sugestões de Fotos Existentes */}
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fotos Prontas no Sistema (Clique para selecionar):</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {[
                        { name: 'Costela', path: '/Produtos/Prensadão de Costela.jpeg' },
                        { name: 'Frango', path: '/Produtos/Prensadão de Frango.jpeg' },
                        { name: 'Pernil', path: '/Produtos/Prensadão de Pernil.jpeg' },
                        { name: 'Logo Nuu', path: '/logoNuuPrensado-semfundo.png' },
                      ].map(preset => (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => setProdImage(preset.path)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: prodImage === preset.path ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                            color: '#fff',
                            border: '1px solid var(--border-glass)',
                            cursor: 'pointer'
                          }}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recipe Mapping to Inventory */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                    Ficha Técnica (Associação com Insumos do Estoque)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Indique a quantidade de cada insumo necessária para produzir 1 unidade deste produto. A baixa do estoque é realizada automaticamente.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                    {inventory.map(invItem => {
                      const recipeItem = prodRecipe.find(r => r.ingredientId === invItem.id);
                      const currentVal = recipeItem ? recipeItem.quantity : 0;
                      return (
                        <div key={invItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem' }}>{invItem.name} ({invItem.unit})</span>
                          <input 
                            type="number" 
                            step="0.1"
                            value={currentVal === 0 ? '' : currentVal}
                            onChange={(e) => handleRecipeQtyChange(invItem.id, e.target.value)}
                            placeholder="0" 
                            style={{ width: '80px', padding: '4px 8px', fontSize: '0.8rem' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status de Disponibilidade do Produto */}
                <div style={{ 
                  borderTop: '1px solid var(--border-glass)', 
                  paddingTop: '14px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}>
                  <div style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid',
                    borderColor: prodActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: prodActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: prodActive ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {prodActive ? (
                          <>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                            <span>Produto Ativo (Liberado p/ Venda)</span>
                          </>
                        ) : (
                          <>
                            <Pause size={14} />
                            <span>Produto Pausado (Esgotado / Indisponível)</span>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {prodActive 
                          ? 'Visível e liberado para pedidos no cardápio dos clientes.' 
                          : 'Ocultado temporariamente das vendas até ser reativado.'}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setProdActive(!prodActive)}
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid var(--border-glass)',
                        backgroundColor: prodActive ? 'var(--bg-tertiary)' : 'var(--color-brand)',
                        color: prodActive ? 'var(--text-secondary)' : '#fff'
                      }}
                    >
                      {prodActive ? 'Pausar Venda' : 'Ativar Venda'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO/EDIÇÃO DE ADICIONAL OU COMPLEMENTO */}
      {isComplementModalOpen && (
        <div className="modal-overlay" onClick={() => setIsComplementModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-brand-yellow)" />
                {editingComplement ? 'Editar Adicional / Complemento' : 'Novo Adicional / Complemento'}
              </h3>
              <button type="button" onClick={() => setIsComplementModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveComplement}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Nome do Item / Adicional *
                  </label>
                  <input 
                    type="text" 
                    value={compName} 
                    onChange={e => setCompName(e.target.value)} 
                    placeholder="Ex: Bacon Crocante, Catupiry Original, Cheddar Fatiado..." 
                    required 
                    style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Grupo / Categoria *
                    </label>
                    <select 
                      value={compGroup} 
                      onChange={e => {
                        const val = e.target.value;
                        setCompGroup(val);
                        if (val === 'extras') {
                          setCompCategory('extra');
                          if (compPrice === '0' || compPrice === '0.00') setCompPrice('4.00');
                        } else {
                          setCompCategory('choice');
                        }
                      }}
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
                    >
                      <option value="extras">🥓 Adicional Extra (+ R$)</option>
                      <option value="creamy">🧀 Queijo Cremoso (Escolha)</option>
                      <option value="melted">🥪 Queijo Fatiado (Escolha)</option>
                      <option value="side">🥗 Acompanhamento (Escolha)</option>
                      <option value="other">✨ Outro Complemento</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Preço Adicional (R$)
                    </label>
                    <input 
                      type="number" 
                      step="0.50" 
                      min="0"
                      value={compPrice} 
                      onChange={e => setCompPrice(e.target.value)} 
                      placeholder="0.00" 
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {compGroup === 'extras' ? 'Cobrado a mais no lanche' : 'Deixe 0 se já for incluso'}
                    </span>
                  </div>
                </div>

                {/* Disponibilidade do Adicional */}
                <div style={{ 
                  padding: '12px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid',
                  borderColor: compActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  backgroundColor: compActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: compActive ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {compActive ? (
                        <>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                          <span>Item Ativo (Disponível p/ Escolha)</span>
                        </>
                      ) : (
                        <>
                          <Pause size={14} />
                          <span>Item Pausado (Esgotado na Cozinha)</span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {compActive 
                        ? 'Clientes podem selecionar este item ao montar o lanche.' 
                        : 'Aparecerá desabilitado como "Esgotado" no cardápio.'}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setCompActive(!compActive)}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--border-glass)',
                      backgroundColor: compActive ? 'var(--bg-tertiary)' : 'var(--color-brand)',
                      color: compActive ? 'var(--text-secondary)' : '#fff'
                    }}
                  >
                    {compActive ? 'Pausar' : 'Ativar'}
                  </button>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsComplementModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingComplement ? 'Salvar Alterações' : 'Cadastrar Complemento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRADA MANUAL DE PRODUTOS NO ESTOQUE */}
      {isManualStockModalOpen && (
        <div className="modal-overlay" onClick={() => setIsManualStockModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--color-brand)" /> Entrada Manual no Estoque
              </h3>
              <button onClick={() => setIsManualStockModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveManualStock}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* Seletor de Modo: Existente ou Novo */}
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setManualEntryMode('existing')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: manualEntryMode === 'existing' ? 'var(--color-brand)' : 'transparent',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    Insumo Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEntryMode('new')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: manualEntryMode === 'new' ? 'var(--color-brand)' : 'transparent',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    + Cadastrar Novo Insumo
                  </button>
                </div>

                {manualEntryMode === 'existing' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Selecione o Insumo</label>
                    <select 
                      value={manualIngredientId} 
                      onChange={e => setManualIngredientId(e.target.value)}
                      style={{ padding: '8px', fontSize: '0.9rem' }}
                      required
                    >
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Atual: {item.quantity} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nome do Insumo</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Queijo Catupiry Bisnaga" 
                        value={manualNewName} 
                        onChange={e => setManualNewName(e.target.value)} 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Unidade de Medida</label>
                        <select value={manualUnit} onChange={e => setManualUnit(e.target.value)}>
                          <option value="un">un (Unidades)</option>
                          <option value="kg">kg (Quilos)</option>
                          <option value="g">g (Gramas)</option>
                          <option value="porção">porção</option>
                          <option value="lata">lata</option>
                          <option value="sachê">sachê</option>
                          <option value="pacote">pacote</option>
                          <option value="litro">litro</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estoque Mínimo</label>
                        <input 
                          type="number" 
                          value={manualMinQty} 
                          onChange={e => setManualMinQty(e.target.value)} 
                          placeholder="10" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantidade a dar entrada */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Quantidade de Entrada *
                    </label>
                    <input 
                      type="number" 
                      step="any" 
                      required 
                      placeholder="Ex: 25" 
                      value={manualQty} 
                      onChange={e => setManualQty(e.target.value)} 
                      style={{ fontSize: '1rem', fontWeight: 700 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Custo Total R$ (Opcional)
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={manualCost} 
                      onChange={e => setManualCost(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Motivo / Observação
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Compra avulsa de emergência no Atacado" 
                    value={manualReason} 
                    onChange={e => setManualReason(e.target.value)} 
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Se o Custo Total for informado, será lançado automaticamente como despesa de Estoque no financeiro.
                  </span>
                </div>

              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-glass)', padding: '1rem 1.5rem' }}>
                <button type="button" onClick={() => setIsManualStockModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NOTA FISCAL DE ENTRADA (COMPRA DE INSUMOS) */}
      {isInflowModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Registrar Nota Fiscal de Entrada</h3>
              <button onClick={() => setIsInflowModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveInflowInvoice}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fornecedor (Razão Social)</label>
                  <input type="text" required value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Ex: Distribuidora de Pães Estrela" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CNPJ Fornecedor</label>
                  <input type="text" value={supplierCnpj} onChange={e => setSupplierCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
                </div>

                {/* Add items table */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Itens da Nota (Adicionar ao Estoque)</h4>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <select id="inflow-item-select" style={{ flex: 1, padding: '4px' }}>
                      {inventory.map(i => (
                        <option key={i.id} value={i.name}>{i.name}</option>
                      ))}
                    </select>
                    <input id="inflow-item-qty" type="number" placeholder="Qtd" style={{ width: '70px', padding: '4px' }} />
                    <input id="inflow-item-price" type="number" step="0.01" placeholder="R$ Unit" style={{ width: '80px', padding: '4px' }} />
                    <button 
                      type="button" 
                      onClick={() => {
                        const sel = document.getElementById('inflow-item-select');
                        const qty = document.getElementById('inflow-item-qty');
                        const prc = document.getElementById('inflow-item-price');
                        if (sel.value && qty.value && prc.value) {
                          handleAddInflowItem(sel.value, qty.value, prc.value);
                          qty.value = '';
                          prc.value = '';
                        }
                      }}
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Add
                    </button>
                  </div>

                  {/* List items added to NF */}
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {inflowItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                        <span>{item.quantity}x {item.name}</span>
                        <span>R$ {(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                    {inflowItems.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum item adicionado à NF ainda.</p>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsInflowModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={inflowItems.length === 0}>Lançar NF e Abastecer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAMENTO / EDIÇÃO FINANCEIRA */}
      {isTransModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BadgeDollarSign size={20} color={transType === 'income' ? 'var(--color-success)' : 'var(--color-danger)'} />
                {editingTrans ? 'Editar Lançamento' : (transType === 'income' ? 'Lançar Receita' : 'Lançar Despesa')}
              </h3>
              <button onClick={() => setIsTransModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTransaction}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Tipo de Lançamento (Toggle Receita / Despesa) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tipo de Movimentação</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTransType('income');
                        if (!editingTrans && transCat === 'Geral') setTransCat('Vendas');
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: transType === 'income' ? '2px solid var(--color-success)' : '1px solid var(--border-glass)',
                        backgroundColor: transType === 'income' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)',
                        color: transType === 'income' ? 'var(--color-success)' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      + Receita (Entrada)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransType('expense');
                        if (!editingTrans && transCat === 'Vendas') setTransCat('Geral');
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: transType === 'expense' ? '2px solid var(--color-danger)' : '1px solid var(--border-glass)',
                        backgroundColor: transType === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)',
                        color: transType === 'expense' ? 'var(--color-danger)' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      - Despesa (Saída)
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descrição / Fornecedor / Origem</label>
                  <input 
                    type="text" 
                    required 
                    value={transDesc} 
                    onChange={e => setTransDesc(e.target.value)} 
                    placeholder={transType === 'income' ? "Ex: Venda de Balcão, Evento, Pedido #..." : "Ex: Compra de embalagens, Energia Elétrica, Gás..."} 
                  />
                </div>

                {/* Valor e Categoria */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      required 
                      value={transVal} 
                      onChange={e => setTransVal(e.target.value)} 
                      placeholder="0.00" 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Categoria</label>
                    <select value={transCat} onChange={e => setTransCat(e.target.value)}>
                      {transType === 'income' ? (
                        <>
                          <option value="Vendas">Vendas / Pedidos</option>
                          <option value="Balcão">Venda Balcão / Presencial</option>
                          <option value="Delivery">Delivery / Encomendas</option>
                          <option value="Eventos">Eventos / Feiras</option>
                          <option value="Aporte">Aporte / Capital</option>
                          <option value="Outros">Outras Receitas</option>
                        </>
                      ) : (
                        <>
                          <option value="Geral">Geral / Diversos</option>
                          <option value="Estoque">Estoque / Insumos</option>
                          <option value="Embalagens">Embalagens / Descartáveis</option>
                          <option value="Serviços">Água / Luz / Internet / Gás</option>
                          <option value="Manutenção">Manutenção de Equipamentos</option>
                          <option value="Pessoal">Pessoal / Pró-labore</option>
                          <option value="Marketing">Marketing / Divulgação</option>
                          <option value="Taxas">Taxas / Impostos</option>
                          <option value="Outros">Outras Despesas</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Data e Hora */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data e Hora do Lançamento</label>
                  <input 
                    type="datetime-local" 
                    value={transDate} 
                    onChange={e => setTransDate(e.target.value)} 
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Permite retroagir ou antecipar a data do fluxo financeiro.
                  </span>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsTransModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ backgroundColor: transType === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {editingTrans ? 'Salvar Alterações' : (transType === 'income' ? 'Confirmar Receita' : 'Confirmar Despesa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE COTAÇÃO */}
      {isQuotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {editingQuot ? 'Editar Cotação' : 'Cadastrar Nova Cotação'}
              </h3>
              <button onClick={() => setIsQuotModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveQuotation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Produto / Insumo</label>
                  <input type="text" required value={quotProductName} onChange={e => setQuotProductName(e.target.value)} placeholder="Ex: Queijo Mussarela Fatiado" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fornecedor</label>
                    <input type="text" required value={quotSupplier} onChange={e => setQuotSupplier(e.target.value)} placeholder="Ex: Supermercado BH" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Marca</label>
                    <input type="text" required value={quotBrand} onChange={e => setQuotBrand(e.target.value)} placeholder="Ex: Saboroso / Seara" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Formato Embalagem</label>
                    <input type="text" required value={quotPackage} onChange={e => setQuotPackage(e.target.value)} placeholder="Ex: Bisnaga 1,5 kg / Fardo c/ 6" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preço Embalagem (R$)</label>
                    <input type="number" step="0.01" required value={quotPackagePrice} onChange={e => setQuotPackagePrice(e.target.value)} placeholder="0.00" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custo Unitário (R$)</label>
                    <input type="number" step="0.001" required value={quotUnitPrice} onChange={e => setQuotUnitPrice(e.target.value)} placeholder="Ex: 8.78" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Unidade de Medida</label>
                    <select value={quotUnitType} onChange={e => setQuotUnitType(e.target.value)}>
                      <option value="kg">por Quilo (kg)</option>
                      <option value="un">por Unidade (un)</option>
                      <option value="sachê">por Sachê</option>
                      <option value="L">por Litro (L)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsQuotModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Cotação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
