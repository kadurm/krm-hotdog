import React, { useState, useEffect } from 'react';
import { useSystem } from '../../contexts/SystemContext';
import { 
  LayoutDashboard, ChefHat, Package, BadgeDollarSign, 
  FileText, PlusCircle, Trash2, AlertTriangle, 
  TrendingUp, Check, RotateCcw, Printer, Download,
  Utensils, X, Plus, Edit, PlusSquare, LogOut,
  ChevronLeft, ChevronRight, Menu, ShoppingBag, Sparkles,
  Search, CheckCircle2, Building2
} from 'lucide-react';

export default function AdminView({ onLogout }) {
  const { 
    products, inventory, orders, transactions, invoices, quotations,
    updateOrderStatus, adjustStock, registerInflowInvoice, 
    upsertProduct, deleteProduct, addTransaction,
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
  const [prodCat, setProdCat] = useState('hotdogs');
  const [prodActive, setProdActive] = useState(true);
  const [prodRecipe, setProdRecipe] = useState([]);

  // Inflow NF form states
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierCnpj, setSupplierCnpj] = useState('');
  const [inflowTotal, setInflowTotal] = useState('');
  const [inflowItems, setInflowItems] = useState([]);
  
  // Custom transaction state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseVal, setExpenseVal] = useState('');
  const [expenseCat, setExpenseCat] = useState('Geral');

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

  // Product CRUD Handlers
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdPrice(product.price.toString());
      setProdDesc(product.description);
      setProdCat(product.category);
      setProdActive(product.active);
      setProdRecipe(product.recipe || []);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdCat('hotdogs');
      setProdActive(true);
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
      recipe: recipeClean
    };
    if (editingProduct) {
      productData.id = editingProduct.id;
    }
    upsertProduct(productData);
    setIsProductModalOpen(false);
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
  const handleSaveExpense = (e) => {
    e.preventDefault();
    addTransaction({
      type: 'expense',
      category: expenseCat,
      value: parseFloat(expenseVal),
      description: expenseDesc
    });
    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    setExpenseVal('');
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
      badge: (pendingOrders.length + preparingOrders.length) > 0 ? (pendingOrders.length + preparingOrders.length) : null,
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>Monitor de Pedidos & Cozinha (KDS)</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                
                {/* COLUMN: PENDENTE */}
                <div className="glass-panel" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '4px solid var(--color-danger)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pendentes</span>
                    <span className="badge badge-pending">{pendingOrders.length}</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingOrders.map(order => (
                      <div key={order.id} className="glass-panel" style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>#{order.id}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{order.customerName}</div>
                        <ul style={{ paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '6px 0' }}>
                          {order.items.map((item, idx) => (
                            <li key={idx}>{item.quantity}x {item.name}</li>
                          ))}
                        </ul>
                        <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginTop: '10px', pt: '8px', borderTop: '1px solid var(--border-glass)' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand)' }}>R$ {order.total.toFixed(2)}</span>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Preparar
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingOrders.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Fila limpa.</div>}
                  </div>
                </div>

                {/* COLUMN: PREPARANDO */}
                <div className="glass-panel" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '4px solid var(--color-warning)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Em Preparo</span>
                    <span className="badge badge-preparing">{preparingOrders.length}</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {preparingOrders.map(order => (
                      <div key={order.id} className="glass-panel" style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>#{order.id}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{order.customerName}</div>
                        <ul style={{ paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '6px 0' }}>
                          {order.items.map((item, idx) => (
                            <li key={idx}>{item.quantity}x {item.name}</li>
                          ))}
                        </ul>
                        <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginTop: '10px', pt: '8px', borderTop: '1px solid var(--border-glass)' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand)' }}>R$ {order.total.toFixed(2)}</span>
                          <button 
                            onClick={() => updateOrderStatus(order.id, order.type === 'delivery' ? 'shipping' : 'delivered')}
                            className="btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: 'var(--color-info)' }}
                          >
                            {order.type === 'delivery' ? 'Despachar' : 'Entregar'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {preparingOrders.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Nenhum na chapa.</div>}
                  </div>
                </div>

                {/* COLUMN: A CAMINHO / PRONTO */}
                <div className="glass-panel" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '4px solid var(--color-info)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Entrega/Retirada</span>
                    <span className="badge badge-shipping">{shippingOrders.length}</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {shippingOrders.map(order => (
                      <div key={order.id} className="glass-panel" style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>#{order.id}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.address}
                        </div>
                        <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginTop: '10px', pt: '8px', borderTop: '1px solid var(--border-glass)' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand)' }}>R$ {order.total.toFixed(2)}</span>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: 'var(--color-success)' }}
                          >
                            Finalizar
                          </button>
                        </div>
                      </div>
                    ))}
                    {shippingOrders.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Fila vazia.</div>}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Controle de Estoque (Insumos)</h2>
                <button onClick={() => setIsInflowModalOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  <PlusSquare size={16} /> Nota Fiscal de Entrada
                </button>
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

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Cadastro de Produtos (Cardápio)</h2>
                <button onClick={() => handleOpenProductModal(null)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  <Plus size={16} /> Cadastrar Produto
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{prod.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.description}</div>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{prod.category}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-brand)' }}>
                          R$ {prod.price.toFixed(2)}
                        </td>
                        <td>
                          {prod.active ? (
                            <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Ativo</span>
                          ) : (
                            <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Inativo</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleOpenProductModal(prod)}
                              style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-info)', border: '1px solid var(--border-glass)' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Excluir produto ${prod.name}?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-danger)', border: '1px solid var(--border-glass)' }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Fluxo de Caixa / Financeiro</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Faturamento: <strong style={{ color: 'var(--color-success)' }}>R$ {totalFaturamento.toFixed(2)}</strong> | 
                    Despesas: <strong style={{ color: 'var(--color-danger)' }}>R$ {totalDespesas.toFixed(2)}</strong>
                  </p>
                </div>
                <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={{ fontSize: '0.85rem', backgroundColor: 'var(--color-danger)' }}>
                  <Plus size={16} /> Lançar Despesa
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td>{new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>
                          {t.type === 'income' ? (
                            <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Receita</span>
                          ) : (
                            <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Despesa</span>
                          )}
                        </td>
                        <td>{t.category}</td>
                        <td>{t.description}</td>
                        <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.value.toFixed(2)}
                        </td>
                      </tr>
                    ))}
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
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
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
                      <option value="hotdogs">Hotdogs na Chapa</option>
                      <option value="drinks">Sucos & Bebidas</option>
                      <option value="sides">Acompanhamentos</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descrição</label>
                  <textarea rows="2" value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Descrição dos ingredientes no cardápio" />
                </div>

                {/* Recipe Mapping to Inventory */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                    Ficha Técnica (Associação com Insumos do Estoque)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Indique a quantidade de cada insumo necessária para produzir 1 unidade deste produto. A baixa do estoque é realizada automaticamente.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
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

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prodActive} onChange={e => setProdActive(e.target.checked)} style={{ accentColor: 'var(--color-brand)' }} />
                  <span style={{ fontSize: '0.85rem' }}>Produto Ativo (Visível no Delivery)</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Produto</button>
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

      {/* MODAL: LANÇAMENTO DE DESPESA */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Lançar Nova Despesa</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveExpense}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descrição / Fornecedor</label>
                  <input type="text" required value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} placeholder="Ex: Consumo de Energia Elétrica Coelba" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Pago (R$)</label>
                    <input type="number" step="0.01" required value={expenseVal} onChange={e => setExpenseVal(e.target.value)} placeholder="0.00" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Categoria</label>
                    <select value={expenseCat} onChange={e => setExpenseCat(e.target.value)}>
                      <option value="Geral">Outros / Geral</option>
                      <option value="Infraestrutura">Infraestrutura / Contas</option>
                      <option value="Marketing">Marketing / Tráfego</option>
                      <option value="Estoque">Compras e Insumos</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--color-danger)' }}>Confirmar Despesa</button>
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
