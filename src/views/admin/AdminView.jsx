import React, { useState, useEffect, useMemo } from 'react';
import { useSystem, playNotificationChime } from '../../contexts/SystemContext';
import ThermalPrintReceipt from '../../components/ThermalPrintReceipt';
import SupabaseConfigModal from '../../components/SupabaseConfigModal';
import FirebaseConfigModal from '../../components/FirebaseConfigModal';
import CashShiftModal from '../../components/CashShiftModal';
import DeliveryMap from '../../components/DeliveryMap';
import OrderTimerBadge from '../../components/OrderTimerBadge';
import FidelityCelebrationModal from '../../components/FidelityCelebrationModal';
import { isSupabaseConfigured } from '../../services/supabase';
import { isFirebaseConfigured } from '../../services/firebase';
import { 
  LayoutDashboard, ChefHat, Package, BadgeDollarSign, 
  FileText, PlusCircle, Trash2, AlertTriangle, 
  TrendingUp, Check, RotateCcw, Printer, Download,
  Utensils, X, Plus, Edit, PlusSquare, LogOut,
  ChevronLeft, ChevronRight, Menu, ShoppingBag, Sparkles,
  Search, CheckCircle2, Building2, Bike, Store, Clock, Phone,
  Volume2, VolumeX, Upload, Image, Pause, Play,
  MapPin, CreditCard, Percent, ShieldCheck, Award, Sliders, Database, DollarSign, ArrowDownRight, ArrowUpRight, Tag,
  User, LayoutGrid, MonitorPlay, Flame, Navigation,
  Calendar, Users, Star, Crown, Gift, Heart, MessageCircle, Trophy
} from 'lucide-react';

export default function AdminView({ onLogout, onGoOperation }) {
  const { 
    products, inventory, orders, transactions, invoices, quotations,
    complements = [],
    motoboys = [],
    upsertMotoboy,
    assignOrderMotoboy,
    settleMotoboyPayments,
    operators = [],
    upsertOperator,
    deleteOperator,
    storeSettings = {},
    updateStoreSettings,
    getStorePauseStatus,
    pauseStore,
    resumeStore,
    openStore,
    closeStore,
    deliveryRadiuses = [],
    upsertRadius,
    deleteRadius,
    coupons = [],
    upsertCoupon,
    deleteCoupon,
    currentShift,
    updateOrderStatus, deleteOrder, adjustStock, manualStockInflow, registerInflowInvoice, 
    upsertProduct, deleteProduct, toggleProductStatus,
    toggleComplementStatus, upsertComplement, deleteComplement,
    addTransaction, updateTransaction, deleteTransaction,
    addQuotation, updateQuotation, deleteQuotation, resetToOfficialMenu,
    customers = [],
    saveCustomer,
    updateCustomerStamps,
    grantCustomerBonus,
    redeemCustomerReward,
    deleteCustomer,
    fidelityAlert,
    setFidelityAlert,
    showAlert,
    showConfirm
  } = useSystem();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Estados dos novos modais
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);

  // Estados para Gestão de Operadores / Equipe
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [operatorName, setOperatorName] = useState('');
  const [operatorRole, setOperatorRole] = useState('Atendente');
  const [operatorPin, setOperatorPin] = useState('');
  const [operatorActive, setOperatorActive] = useState(true);

  const handleOpenOperatorModal = (op = null) => {
    if (op) {
      setEditingOperator(op);
      setOperatorName(op.name);
      setOperatorRole(op.role || 'Atendente');
      setOperatorPin(op.pin || '');
      setOperatorActive(op.active !== false);
    } else {
      setEditingOperator(null);
      setOperatorName('');
      setOperatorRole('Atendente');
      setOperatorPin('');
      setOperatorActive(true);
    }
    setIsOperatorModalOpen(true);
  };

  const handleSaveOperator = (e) => {
    e.preventDefault();
    if (!operatorName.trim()) return;
    upsertOperator({
      id: editingOperator?.id,
      name: operatorName.trim(),
      role: operatorRole,
      pin: operatorPin.trim() || '1234',
      active: operatorActive
    });
    setIsOperatorModalOpen(false);
  };

  // Estados para Gestão de Motoboy
  const [isMotoboyModalOpen, setIsMotoboyModalOpen] = useState(false);
  const [editingMotoboy, setEditingMotoboy] = useState(null);
  const [motoboyName, setMotoboyName] = useState('');
  const [motoboyPhone, setMotoboyPhone] = useState('');
  const [motoboyVehicle, setMotoboyVehicle] = useState('Moto Honda CG 160');
  const [motoboyPix, setMotoboyPix] = useState('');
  const [motoboyFee, setMotoboyFee] = useState('6.00');

  // Estados para Gestão de Cupons
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('fixed');
  const [couponDiscount, setCouponDiscount] = useState('10');
  const [couponMinOrder, setCouponMinOrder] = useState('30');

  // Estados para Bairros de Entrega
  const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
  const [newNeighborhoodFee, setNewNeighborhoodFee] = useState('7.00');

  // Estados para Faixas de Raio (Km)
  const [newRadiusKm, setNewRadiusKm] = useState('5');
  const [newRadiusFee, setNewRadiusFee] = useState('7.50');
  const [newRadiusDesc, setNewRadiusDesc] = useState('');

  // Helper para formatar data local no padrão YYYY-MM-DD para inputs de calendário
  const formatDateToInput = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Estados do Filtro de Data do Dashboard
  const [dashDatePreset, setDashDatePreset] = useState('7days');
  const [dashStartDate, setDashStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return formatDateToInput(d);
  });
  const [dashEndDate, setDashEndDate] = useState(() => {
    return formatDateToInput(new Date());
  });
  const [dashChartType, setDashChartType] = useState('line'); // 'line' | 'bar'
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  const handleSelectDatePreset = (preset) => {
    setDashDatePreset(preset);
    const today = new Date();

    if (preset === 'today') {
      const todayStr = formatDateToInput(today);
      setDashStartDate(todayStr);
      setDashEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(today.getDate() - 1);
      const yStr = formatDateToInput(y);
      setDashStartDate(yStr);
      setDashEndDate(yStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setDashStartDate(formatDateToInput(past));
      setDashEndDate(formatDateToInput(today));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setDashStartDate(formatDateToInput(past));
      setDashEndDate(formatDateToInput(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDashStartDate(formatDateToInput(firstDay));
      setDashEndDate(formatDateToInput(today));
    } else if (preset === 'lastMonth') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setDashStartDate(formatDateToInput(firstDayLastMonth));
      setDashEndDate(formatDateToInput(lastDayLastMonth));
    }
  };

  const getTabFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#admin/')) {
      const tab = hash.replace('#admin/', '');
      if (['dashboard', 'inventory', 'products', 'logistics', 'store', 'cotacao', 'finance', 'nfe', 'team', 'customers'].includes(tab)) {
        return tab;
      }
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  // Estados para Gestão de Clientes e Programa Fidelidade
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [bonusCustomer, setBonusCustomer] = useState(null);
  const [bonusType, setBonusType] = useState('coupon'); // 'coupon' | 'discount' | 'free_product' | 'stamps' | 'vip_message'
  const [bonusTitle, setBonusTitle] = useState('Desconto Especial de Fidelidade');
  const [bonusValue, setBonusValue] = useState('10');
  const [bonusNotes, setBonusNotes] = useState('');
  const [bonusAddStamps, setBonusAddStamps] = useState(1);
  const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormAddress, setCustFormAddress] = useState('');
  const [custFormNeighborhood, setCustFormNeighborhood] = useState('');
  const [custFormStamps, setCustFormStamps] = useState(0);

  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerTierFilter, setCustomerTierFilter] = useState('all');
  const [customerSortBy, setCustomerSortBy] = useState('score');

  // Consolidação completa de clientes reais, unindo base cadastrada + histórico de todos os pedidos
  const consolidatedCustomers = useMemo(() => {
    const map = new Map();

    // 1. Processa clientes da lista
    (customers || []).forEach(c => {
      const cleanPhone = (c.phone || '').replace(/\D/g, '');
      if (!cleanPhone) return;
      map.set(cleanPhone, {
        id: c.id || cleanPhone,
        phone: cleanPhone,
        rawPhone: c.phone,
        name: c.name || 'Cliente',
        address: c.address || '',
        neighborhood: c.neighborhood || '',
        stampsCount: c.stampsCount ?? c.loyaltyStamps ?? 0,
        bonuses: Array.isArray(c.bonuses) ? c.bonuses : [],
        orders: [],
        totalOrders: 0,
        totalSpent: 0,
        firstOrderAt: null,
        lastOrderAt: c.lastOrderAt || null
      });
    });

    // 2. Mescla e analisa histórico de todos os pedidos reais
    (orders || []).forEach(o => {
      if (!o.phone) return;
      const cleanPhone = String(o.phone).replace(/\D/g, '');
      if (!cleanPhone) return;

      if (!map.has(cleanPhone)) {
        map.set(cleanPhone, {
          id: cleanPhone,
          phone: cleanPhone,
          rawPhone: o.phone,
          name: o.customerName || 'Cliente',
          address: o.address || '',
          neighborhood: o.neighborhood || '',
          stampsCount: 0,
          bonuses: [],
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          firstOrderAt: null,
          lastOrderAt: null
        });
      }

      const client = map.get(cleanPhone);
      if (o.customerName && (!client.name || client.name === 'Cliente')) {
        client.name = o.customerName;
      }
      if (o.address && !client.address) {
        client.address = o.address;
      }
      if (o.neighborhood && !client.neighborhood) {
        client.neighborhood = o.neighborhood;
      }

      client.orders.push(o);

      if (o.status !== 'canceled') {
        client.totalOrders += 1;
        client.totalSpent += (parseFloat(o.total) || 0);

        const oDate = o.date || o.created_at || o.createdAt;
        if (oDate) {
          const dTime = new Date(oDate).getTime();
          if (!isNaN(dTime)) {
            if (!client.firstOrderAt || dTime < new Date(client.firstOrderAt).getTime()) {
              client.firstOrderAt = oDate;
            }
            if (!client.lastOrderAt || dTime > new Date(client.lastOrderAt).getTime()) {
              client.lastOrderAt = oDate;
            }
          }
        }
      }
    });

    // 3. Calcula Score (0 a 100), Tiers, Itens favoritos e Estatísticas
    const nowTime = Date.now();
    return Array.from(map.values()).map(client => {
      client.orders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      const daysSinceLastOrder = client.lastOrderAt
        ? Math.max(0, Math.floor((nowTime - new Date(client.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 999;

      // Itens favoritos mais pedidos
      const itemCounts = {};
      client.orders.forEach(ord => {
        if (Array.isArray(ord.items)) {
          ord.items.forEach(it => {
            const name = it.name || it.productName || 'Lanche';
            itemCounts[name] = (itemCounts[name] || 0) + (it.quantity || 1);
          });
        }
      });
      const favoriteItems = Object.entries(itemCounts)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      // Score de Fidelidade ponderado
      let freqScore = 0;
      if (client.totalOrders >= 10) freqScore = 100;
      else if (client.totalOrders >= 7) freqScore = 85;
      else if (client.totalOrders >= 4) freqScore = 70;
      else if (client.totalOrders >= 2) freqScore = 45;
      else if (client.totalOrders === 1) freqScore = 20;

      let ltvScore = 0;
      if (client.totalSpent >= 500) ltvScore = 100;
      else if (client.totalSpent >= 300) ltvScore = 85;
      else if (client.totalSpent >= 150) ltvScore = 65;
      else if (client.totalSpent >= 80) ltvScore = 45;
      else if (client.totalSpent > 0) ltvScore = 25;

      let recencyScore = 0;
      if (daysSinceLastOrder <= 7) recencyScore = 100;
      else if (daysSinceLastOrder <= 15) recencyScore = 85;
      else if (daysSinceLastOrder <= 30) recencyScore = 65;
      else if (daysSinceLastOrder <= 60) recencyScore = 40;
      else recencyScore = 15;

      const stampsScore = Math.min(100, Math.round(((client.stampsCount % 10) / 10) * 100) + (Math.floor(client.stampsCount / 10) * 20));

      const rawScore = Math.round(
        (freqScore * 0.35) +
        (ltvScore * 0.30) +
        (recencyScore * 0.20) +
        (stampsScore * 0.15)
      );
      const score = Math.max(0, Math.min(100, rawScore));

      let tier = 'novo';
      let tierLabel = 'Novo';
      let tierColor = '#94a3b8';
      let tierIcon = '🌱';

      if (score >= 80 || client.totalOrders >= 10) {
        tier = 'diamond';
        tierLabel = 'Diamante (VIP)';
        tierColor = '#38bdf8';
        tierIcon = '💎';
      } else if (score >= 60 || client.totalOrders >= 6) {
        tier = 'gold';
        tierLabel = 'Ouro';
        tierColor = '#edb143';
        tierIcon = '🥇';
      } else if (score >= 40 || client.totalOrders >= 3) {
        tier = 'silver';
        tierLabel = 'Prata';
        tierColor = '#cbd5e1';
        tierIcon = '🥈';
      } else if (score >= 20 || client.totalOrders >= 1) {
        tier = 'bronze';
        tierLabel = 'Bronze';
        tierColor = '#f97316';
        tierIcon = '🥉';
      }

      return {
        ...client,
        daysSinceLastOrder,
        favoriteItems,
        score,
        tier,
        tierLabel,
        tierColor,
        tierIcon,
        averageTicket: client.totalOrders > 0 ? (client.totalSpent / client.totalOrders) : 0,
        scoreBreakdown: { freqScore, ltvScore, recencyScore, stampsScore }
      };
    });
  }, [customers, orders]);

  // Ranking Top 10 Clientes Fiéis
  const topRankingCustomers = useMemo(() => {
    return [...consolidatedCustomers]
      .sort((a, b) => b.score - a.score || b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [consolidatedCustomers]);

  // Distribuição geral da base e métricas
  const customerTiersSummary = useMemo(() => {
    const summary = {
      diamond: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      novo: 0,
      rewardAvailable: 0,
      total: consolidatedCustomers.length,
      totalRevenue: consolidatedCustomers.reduce((acc, c) => acc + c.totalSpent, 0),
      recurringCount: consolidatedCustomers.filter(c => c.totalOrders >= 2).length
    };

    consolidatedCustomers.forEach(c => {
      if (summary[c.tier] !== undefined) summary[c.tier]++;
      if (c.stampsCount >= 10) summary.rewardAvailable++;
    });

    return summary;
  }, [consolidatedCustomers]);

  // Lista de clientes filtrada e ordenada para a tabela
  const filteredCustomersList = useMemo(() => {
    return consolidatedCustomers
      .filter(c => {
        if (customerTierFilter === 'diamond' && c.tier !== 'diamond') return false;
        if (customerTierFilter === 'gold' && c.tier !== 'gold') return false;
        if (customerTierFilter === 'silver' && c.tier !== 'silver') return false;
        if (customerTierFilter === 'bronze' && c.tier !== 'bronze') return false;
        if (customerTierFilter === 'novo' && c.tier !== 'novo') return false;
        if (customerTierFilter === 'reward_available' && c.stampsCount < 10) return false;
        if (customerTierFilter === 'at_risk' && c.daysSinceLastOrder < 30) return false;

        if (customerSearchTerm) {
          const q = customerSearchTerm.toLowerCase();
          const matchName = (c.name || '').toLowerCase().includes(q);
          const matchPhone = (c.phone || '').includes(q);
          const matchNeigh = (c.neighborhood || '').toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchNeigh) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (customerSortBy === 'score') return b.score - a.score;
        if (customerSortBy === 'orders') return b.totalOrders - a.totalOrders;
        if (customerSortBy === 'ltv') return b.totalSpent - a.totalSpent;
        if (customerSortBy === 'recent') {
          return new Date(b.lastOrderAt || 0) - new Date(a.lastOrderAt || 0);
        }
        return b.score - a.score;
      });
  }, [consolidatedCustomers, customerTierFilter, customerSearchTerm, customerSortBy]);

  const handleOpenCustomerDetails = (client) => {
    const updated = consolidatedCustomers.find(c => c.phone === client.phone) || client;
    setSelectedCustomer(updated);
    setIsCustomerModalOpen(true);
  };

  const handleOpenBonusModal = (client) => {
    setBonusCustomer(client);
    setBonusType('coupon');
    setBonusTitle('Desconto Especial de Fidelidade');
    setBonusValue('10');
    setBonusNotes(`Bônus concedido para ${client.name} em reconhecimento à sua fidelidade no Nuu Prensado.`);
    setBonusAddStamps(1);
    setIsBonusModalOpen(true);
  };

  const handleSaveBonus = (e) => {
    e.preventDefault();
    if (!bonusCustomer) return;

    grantCustomerBonus(bonusCustomer.phone, {
      customerName: bonusCustomer.name,
      type: bonusType,
      title: bonusTitle,
      value: bonusValue,
      notes: bonusNotes,
      addStamps: bonusType === 'stamps' ? bonusAddStamps : 0
    });

    setIsBonusModalOpen(false);

    setTimeout(() => {
      const refreshed = consolidatedCustomers.find(c => c.phone === bonusCustomer.phone);
      if (refreshed) setSelectedCustomer(refreshed);
    }, 100);
  };

  const handleOpenEditCustomer = (client = null) => {
    if (client) {
      setCustFormName(client.name || '');
      setCustFormPhone(client.phone || '');
      setCustFormAddress(client.address || '');
      setCustFormNeighborhood(client.neighborhood || '');
      setCustFormStamps(client.stampsCount || 0);
    } else {
      setCustFormName('');
      setCustFormPhone('');
      setCustFormAddress('');
      setCustFormNeighborhood('');
      setCustFormStamps(0);
    }
    setIsCustomerEditModalOpen(true);
  };

  const handleSaveCustomerForm = (e) => {
    e.preventDefault();
    if (!custFormPhone) return;

    saveCustomer({
      name: custFormName.trim() || 'Cliente',
      phone: custFormPhone.trim(),
      address: custFormAddress.trim(),
      neighborhood: custFormNeighborhood.trim(),
      stampsCount: parseInt(custFormStamps, 10) || 0,
      loyaltyStamps: parseInt(custFormStamps, 10) || 0
    });

    setIsCustomerEditModalOpen(false);
  };

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
  const [prodImage, setProdImage] = useState('/Produtos/Prensadinho.jfif');
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

  // Helper para conversão de limites de data (00:00:00 até 23:59:59.999)
  const parseDateBoundary = (dateStr, isEnd = false) => {
    if (!dateStr) return isEnd ? new Date(8640000000000000) : new Date(0);
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0])) return isEnd ? new Date(8640000000000000) : new Date(0);
    const [y, m, d] = parts;
    return isEnd 
      ? new Date(y, m - 1, d, 23, 59, 59, 999) 
      : new Date(y, m - 1, d, 0, 0, 0, 0);
  };

  const getItemDate = (item) => {
    const raw = item?.date || item?.created_at || item?.createdAt;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const dashStartBoundary = parseDateBoundary(dashStartDate, false);
  const dashEndBoundary = parseDateBoundary(dashEndDate, true);

  // Pedidos válidos dentro do período selecionado (exclui cancelados)
  const dashFilteredOrders = orders.filter(o => {
    if (o.status === 'canceled') return false;
    const d = getItemDate(o);
    if (!d) return false;
    return d >= dashStartBoundary && d <= dashEndBoundary;
  });

  // Transações dentro do período selecionado
  const dashFilteredTransactions = transactions.filter(t => {
    const d = getItemDate(t);
    if (!d) return false;
    return d >= dashStartBoundary && d <= dashEndBoundary;
  });

  // Faturamento apurado dos pedidos válidos no período
  const dashSalesFromOrders = dashFilteredOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

  // Receitas extras avulsas no período (que não venham do registro automático de pedidos)
  const dashExtraIncome = dashFilteredTransactions
    .filter(t => t.type === 'income' && !/pedido\s*#/i.test(t.description || ''))
    .reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

  // Histórico legado se não houver pedidos no período
  const dashLegacyIncome = dashFilteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

  const dashFaturamento = dashFilteredOrders.length > 0 
    ? (dashSalesFromOrders + dashExtraIncome) 
    : dashLegacyIncome;

  const dashDespesas = dashFilteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

  const dashSaldoLiquido = dashFaturamento - dashDespesas;
  const dashTotalPedidos = dashFilteredOrders.length;
  const dashTicketMedio = dashTotalPedidos > 0 ? (dashSalesFromOrders / dashTotalPedidos) : 0;

  // Cálculo dos pontos reais do gráfico conforme o período
  const dashDiffDays = Math.max(1, Math.round((dashEndBoundary - dashStartBoundary) / (1000 * 60 * 60 * 24)));

  let dashChartPoints = [];

  if (dashDiffDays <= 1) {
    // Visão Horária para 1 único dia (Hoje, Ontem ou 1 data específica)
    let minHour = 11;
    let maxHour = 23;
    dashFilteredOrders.forEach(o => {
      const d = getItemDate(o);
      if (d) {
        const h = d.getHours();
        if (h < minHour) minHour = Math.max(0, h);
        if (h > maxHour) maxHour = Math.min(23, h);
      }
    });

    for (let h = minHour; h <= maxHour; h++) {
      const matchedOrders = dashFilteredOrders.filter(o => {
        const d = getItemDate(o);
        return d && d.getHours() === h;
      });
      const hSales = matchedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      dashChartPoints.push({
        key: `h-${h}`,
        label: `${h}h`,
        fullLabel: `${String(h).padStart(2, '0')}:00 às ${String(h).padStart(2, '0')}:59`,
        value: parseFloat(hSales.toFixed(2)),
        ordersCount: matchedOrders.length
      });
    }
  } else {
    // Visão Diária para múltiplos dias (7 dias, 30 dias, este mês ou intervalo)
    const weekDaysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const curDate = new Date(dashStartBoundary);
    curDate.setHours(0, 0, 0, 0);
    const lastDate = new Date(dashEndBoundary);
    lastDate.setHours(0, 0, 0, 0);

    while (curDate <= lastDate) {
      const dateStr = formatDateToInput(curDate);
      const dw = weekDaysMap[curDate.getDay()];
      const dd = String(curDate.getDate()).padStart(2, '0');
      const mm = String(curDate.getMonth() + 1).padStart(2, '0');
      const shortDate = `${dd}/${mm}`;

      const dayOrders = dashFilteredOrders.filter(o => {
        const d = getItemDate(o);
        return d && formatDateToInput(d) === dateStr;
      });

      const daySales = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

      const dayExtra = dashFilteredTransactions
        .filter(t => {
          if (t.type !== 'income' || /pedido\s*#/i.test(t.description || '')) return false;
          const d = getItemDate(t);
          return d && formatDateToInput(d) === dateStr;
        })
        .reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);

      dashChartPoints.push({
        key: dateStr,
        label: dashDiffDays <= 7 ? `${dw} ${shortDate}` : shortDate,
        fullLabel: `${dw}, ${shortDate}/${curDate.getFullYear()}`,
        value: parseFloat((daySales + dayExtra).toFixed(2)),
        ordersCount: dayOrders.length
      });

      curDate.setDate(curDate.getDate() + 1);
    }
  }

  const chartMaxSale = Math.max(...dashChartPoints.map(p => p.value), 0);
  const chartNiceMax = chartMaxSale > 0 ? (Math.ceil(chartMaxSale / 50) * 50 || 100) : 100;

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
      image: prodImage || '/Produtos/Prensadinho.jfif',
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
    if (compGroup === 'bread') groupName = 'Tipo de Pão';
    else if (compGroup === 'creamy') groupName = 'Queijo Cremoso';
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
    showConfirm('Tem certeza que deseja excluir este lançamento financeiro? Essa ação recalculará o faturamento e as despesas imediatamente.', {
      title: 'Excluir Lançamento',
      badge: 'FINANCEIRO',
      type: 'error',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      confirmColor: '#ef4444',
      onConfirm: () => deleteTransaction(id)
    });
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
    inventory: { 
      label: 'Controle de Estoque', 
      icon: <Package size={20} />, 
      badge: criticalStockCount > 0 ? criticalStockCount : null,
      badgeColor: 'var(--color-danger)' 
    },
    products: { label: 'Cardápio & CMV', icon: <Utensils size={20} /> },
    logistics: { 
      label: 'Logística & Motoboys', 
      icon: <Bike size={20} />,
      badge: shippingOrders.length > 0 ? shippingOrders.length : null,
      badgeColor: 'var(--color-info)'
    },
    store: { 
      label: 'Loja & Entregas', 
      icon: <Store size={20} />,
      badge: !storeSettings?.isOpen ? 'Fechada' : null,
      badgeColor: 'var(--color-danger)'
    },
    team: { label: 'Equipe & Operadores', icon: <User size={20} /> },
    customers: { 
      label: 'Clientes & Fidelidade', 
      icon: <Award size={20} />,
      badge: customerTiersSummary.rewardAvailable > 0 ? `${customerTiersSummary.rewardAvailable} prêmio(s)` : null,
      badgeColor: '#10b981' 
    },
    cotacao: { label: 'Cotações', icon: <ShoppingBag size={20} /> },
    finance: { label: 'Financeiro', icon: <BadgeDollarSign size={20} /> },
    nfe: { label: 'Notas Fiscais (NF-e)', icon: <FileText size={20} /> }
  };

  return (
    <div className="admin-view animate-fade-in" style={{ flex: 1, padding: '0.75rem 0' }}>
      <div className="admin-container" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Mobile Header Menu (Pizza / Dropdown) */}
        <div className="mobile-admin-header glass-panel" style={{ padding: '12px 16px', marginBottom: '1rem', flexDirection: 'column', gap: '10px' }}>
          
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
              {/* Botão de Destaque Frente de Operação */}
              <button
                type="button"
                onClick={() => {
                  if (onGoOperation) onGoOperation();
                  else window.location.hash = 'operacao';
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}
              >
                <ChefHat size={18} />
                <span>🚀 Abrir Frente de Operação (Caixa & KDS)</span>
              </button>

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
            gridTemplateColumns: isSidebarCollapsed ? '64px minmax(0, 1fr)' : '210px minmax(0, 1fr)', 
            gap: '1rem',
            alignItems: 'start',
            transition: 'grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          
          {/* Desktop-Only Sidebar Navigation */}
          <aside className="desktop-only-sidebar admin-sidebar" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            position: 'sticky',
            top: '4rem',
            maxHeight: 'calc(100vh - 4.5rem)',
            overflowY: 'auto'
          }}>
            
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
                marginBottom: '4px',
                border: '1px solid var(--border-glass)'
              }}
              title={isSidebarCollapsed ? "Expandir Menu Lateral" : "Minimizar Menu Lateral"}
            >
              {!isSidebarCollapsed && <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Navegação Gestão</span>}
              {isSidebarCollapsed ? <ChevronRight size={18} color="var(--color-brand-yellow)" /> : <ChevronLeft size={18} />}
            </button>

            {/* BOTÃO EM DESTAQUE: IR PARA A FRENTE DE OPERAÇÃO */}
            <button 
              type="button"
              onClick={() => {
                if (onGoOperation) onGoOperation();
                else window.location.hash = 'operacao';
              }} 
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
                padding: isSidebarCollapsed ? '10px 6px' : '9px 12px',
                color: 'var(--color-brand-yellow)',
                backgroundColor: 'rgba(234, 179, 8, 0.16)',
                border: '1px solid var(--color-brand)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '6px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(234, 179, 8, 0.2)'
              }}
              title="Abrir Frente de Operação (Caixa & KDS)"
            >
              <ChefHat size={18} />
              {!isSidebarCollapsed && <span>Frente de Operação</span>}
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
              title="Cardápio & CMV"
            >
              <Utensils size={20} />
              {!isSidebarCollapsed && <span>Cardápio & CMV</span>}
            </button>

            {/* Logística & Motoboys */}
            <button 
              onClick={() => changeTab('logistics')} 
              className={`nav-link ${activeTab === 'logistics' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                position: 'relative',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Logística & Motoboys"
            >
              <Bike size={20} />
              {!isSidebarCollapsed && <span>Logística & Motoboys</span>}
              {shippingOrders.length > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: isSidebarCollapsed ? '2px' : '50%',
                  right: isSidebarCollapsed ? '2px' : '12px',
                  transform: isSidebarCollapsed ? 'none' : 'translateY(-50%)',
                  backgroundColor: 'var(--color-info)', 
                  color: '#fff', 
                  fontSize: '0.7rem', 
                  padding: '2px 5px', 
                  borderRadius: '99px',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {shippingOrders.length}
                </span>
              )}
            </button>

            {/* Loja & Entregas */}
            <button 
              onClick={() => changeTab('store')} 
              className={`nav-link ${activeTab === 'store' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Loja & Entregas"
            >
              <Store size={20} />
              {!isSidebarCollapsed && <span>Loja & Entregas</span>}
              {!storeSettings?.isOpen && (
                <span style={{ 
                  position: 'absolute', 
                  top: isSidebarCollapsed ? '2px' : '50%',
                  right: isSidebarCollapsed ? '2px' : '12px',
                  transform: isSidebarCollapsed ? 'none' : 'translateY(-50%)',
                  backgroundColor: 'var(--color-danger)', 
                  color: '#fff', 
                  fontSize: '0.65rem', 
                  padding: '1px 5px', 
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  OFF
                </span>
              )}
            </button>

            {/* Equipe & Operadores */}
            <button 
              onClick={() => changeTab('team')} 
              className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Equipe & Operadores"
            >
              <User size={20} />
              {!isSidebarCollapsed && <span>Equipe & Operadores</span>}
            </button>

            {/* Clientes & Fidelidade */}
            <button 
              onClick={() => changeTab('customers')} 
              className={`nav-link ${activeTab === 'customers' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                position: 'relative',
                padding: isSidebarCollapsed ? '12px 10px' : '8px 14px'
              }}
              title="Clientes & Fidelidade"
            >
              <Award size={20} />
              {!isSidebarCollapsed && <span>Clientes & Fidelidade</span>}
              {customerTiersSummary.rewardAvailable > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: isSidebarCollapsed ? '2px' : '50%',
                  right: isSidebarCollapsed ? '2px' : '12px',
                  transform: isSidebarCollapsed ? 'none' : 'translateY(-50%)',
                  backgroundColor: '#10b981', 
                  color: '#fff', 
                  fontSize: '0.65rem', 
                  padding: '2px 5px', 
                  borderRadius: '99px',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {customerTiersSummary.rewardAvailable}
                </span>
              )}
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

            {/* BOTÕES DE ATALHO RÁPIDO: CAIXA E SUPABASE */}
            <div style={{ marginTop: '1rem', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCashModalOpen(true)}
                className="btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '7px 10px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: currentShift ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  borderColor: currentShift ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                  color: currentShift ? '#4ade80' : '#f87171'
                }}
                title={currentShift ? "Caixa Aberto" : "Caixa Fechado"}
              >
                <DollarSign size={16} />
                {!isSidebarCollapsed && <span>{currentShift ? 'Caixa: Aberto' : 'Caixa: Fechado'}</span>}
              </button>
            </div>

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
        <main className="glass-panel admin-main-content">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Visão Geral do Negócio</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Acompanhamento em tempo real das vendas, pedidos e indicadores da operação.
                  </p>
                </div>
              </div>

              {/* BARRA DO FILTRO DE DATA */}
              <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="var(--color-brand-yellow)" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Filtrar Período de Vendas</span>
                  </div>

                  {/* Resumo do período ativo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                    <span style={{ 
                      backgroundColor: 'rgba(237, 177, 67, 0.15)', 
                      color: 'var(--color-brand-yellow)', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontWeight: 700,
                      border: '1px solid rgba(237, 177, 67, 0.3)'
                    }}>
                      {dashStartDate === dashEndDate 
                        ? `Data: ${dashStartDate.split('-').reverse().join('/')}` 
                        : `${dashStartDate.split('-').reverse().join('/')} até ${dashEndDate.split('-').reverse().join('/')}`}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      • <strong>{dashTotalPedidos}</strong> {dashTotalPedidos === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {/* Presets de Data */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { id: 'today', label: 'Hoje' },
                      { id: 'yesterday', label: 'Ontem' },
                      { id: '7days', label: 'Últimos 7 dias' },
                      { id: '30days', label: 'Últimos 30 dias' },
                      { id: 'thisMonth', label: 'Este Mês' },
                      { id: 'lastMonth', label: 'Mês Anterior' }
                    ].map(preset => {
                      const isSelected = dashDatePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectDatePreset(preset.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: isSelected ? '1px solid var(--color-brand-yellow)' : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: isSelected ? 'rgba(237, 177, 67, 0.22)' : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)'
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Inputs de Data Personalizada */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>De:</span>
                      <input
                        type="date"
                        value={dashStartDate}
                        onChange={(e) => {
                          setDashStartDate(e.target.value);
                          setDashDatePreset('custom');
                        }}
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '5px 8px',
                          fontSize: '0.82rem',
                          fontFamily: 'inherit',
                          colorScheme: 'dark'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Até:</span>
                      <input
                        type="date"
                        value={dashEndDate}
                        onChange={(e) => {
                          setDashEndDate(e.target.value);
                          setDashDatePreset('custom');
                        }}
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '5px 8px',
                          fontSize: '0.82rem',
                          fontFamily: 'inherit',
                          colorScheme: 'dark'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPIs (Atualizados conforme o período selecionado) */}
              <div className="kpi-grid">
                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="kpi-info">
                    <h4>Vendas no Período</h4>
                    <p>R$ {dashFaturamento.toFixed(2)}</p>
                    <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {dashTotalPedidos} {dashTotalPedidos === 1 ? 'pedido apurado' : 'pedidos apurados'}
                    </small>
                  </div>
                </div>

                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: 'var(--color-danger-glow)', color: 'var(--color-danger)' }}>
                    <BadgeDollarSign size={24} />
                  </div>
                  <div className="kpi-info">
                    <h4>Despesas no Período</h4>
                    <p>R$ {dashDespesas.toFixed(2)}</p>
                    <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Gastos lançados
                    </small>
                  </div>
                </div>

                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: dashSaldoLiquido >= 0 ? 'rgba(16,185,129,0.15)' : 'var(--color-danger-glow)', color: dashSaldoLiquido >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    <TrendingUp size={24} style={{ transform: dashSaldoLiquido < 0 ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  <div className="kpi-info">
                    <h4>Resultado Líquido</h4>
                    <p>R$ {dashSaldoLiquido.toFixed(2)}</p>
                    <small style={{ fontSize: '0.72rem', color: dashSaldoLiquido >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {dashFaturamento > 0 ? `Margem: ${((dashSaldoLiquido / dashFaturamento) * 100).toFixed(1)}%` : 'Sem faturamento'}
                    </small>
                  </div>
                </div>

                <div className="kpi-card glass-panel">
                  <div className="kpi-icon" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--color-info)' }}>
                    <ChefHat size={24} />
                  </div>
                  <div className="kpi-info">
                    <h4>Pedidos & Ticket Médio</h4>
                    <p>{dashTotalPedidos} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>pedidos</span></p>
                    <small style={{ fontSize: '0.72rem', color: 'var(--color-brand-yellow)' }}>
                      Ticket médio: R$ {dashTicketMedio.toFixed(2)}
                    </small>
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

              {/* GRÁFICO DINÂMICO DE VENDAS */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={20} color="var(--color-brand-yellow)" />
                      Desempenho de Vendas ({dashDiffDays <= 1 ? 'Horário' : (dashDatePreset === '7days' ? 'Últimos 7 dias' : `${dashDiffDays} dias`)})
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Total contabilizado no gráfico: <strong style={{ color: 'var(--color-brand-yellow)' }}>R$ {dashFaturamento.toFixed(2)}</strong> em <strong style={{ color: '#fff' }}>{dashTotalPedidos}</strong> pedido(s)
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {chartMaxSale > 0 && (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        Pico: R$ {chartMaxSale.toFixed(2)}
                      </span>
                    )}
                    {/* Alternador Linha / Barras */}
                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <button
                        type="button"
                        onClick={() => setDashChartType('line')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: dashChartType === 'line' ? 'var(--color-brand)' : 'transparent',
                          color: dashChartType === 'line' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        Linha
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashChartType('bar')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: dashChartType === 'bar' ? 'var(--color-brand)' : 'transparent',
                          color: dashChartType === 'bar' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        Barras
                      </button>
                    </div>
                  </div>
                </div>

                {/* SVG Chart Representation */}
                {(() => {
                  const svgWidth = 720;
                  const svgHeight = 220;
                  const pLeft = 55;
                  const pRight = 25;
                  const pTop = 25;
                  const pBottom = 45;
                  const plotW = svgWidth - pLeft - pRight;
                  const plotH = svgHeight - pTop - pBottom;
                  const bottomY = pTop + plotH;

                  const pointsWithCoords = dashChartPoints.map((pt, idx) => {
                    const x = pLeft + (dashChartPoints.length > 1 ? (idx / (dashChartPoints.length - 1)) * plotW : plotW / 2);
                    const y = pTop + plotH - (chartNiceMax > 0 ? (pt.value / chartNiceMax) * plotH : 0);
                    return { ...pt, x, y };
                  });

                  const linePathD = pointsWithCoords.length > 0
                    ? pointsWithCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')
                    : '';

                  const areaPathD = pointsWithCoords.length > 1
                    ? `M ${pointsWithCoords[0].x.toFixed(1)} ${bottomY} L ${pointsWithCoords.map(pt => `${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' L ')} L ${pointsWithCoords[pointsWithCoords.length - 1].x.toFixed(1)} ${bottomY} Z`
                    : '';

                  const labelStep = dashChartPoints.length > 20 ? 3 : (dashChartPoints.length > 12 ? 2 : 1);
                  const barWidth = Math.max(8, Math.min(32, (plotW / (dashChartPoints.length || 1)) * 0.65));

                  return (
                    <div style={{ position: 'relative', height: '230px', width: '100%', marginTop: '0.5rem' }}>
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="gradientSalesArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#edb143" stopOpacity="0.3" />
                            <stop offset="60%" stopColor="#a82319" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#a82319" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="gradientSalesBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#edb143" />
                            <stop offset="100%" stopColor="#a82319" />
                          </linearGradient>
                          <linearGradient id="gradientSalesStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#a82319" />
                            <stop offset="50%" stopColor="#edb143" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>

                        {/* Linhas de Grade e Eixo Y */}
                        {[1, 0.66, 0.33, 0].map((ratio, i) => {
                          const yVal = pTop + plotH * (1 - ratio);
                          const currencyVal = chartNiceMax * ratio;
                          return (
                            <g key={i}>
                              <line 
                                x1={pLeft} 
                                y1={yVal} 
                                x2={svgWidth - pRight} 
                                y2={yVal} 
                                stroke={ratio === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"} 
                                strokeDasharray={ratio === 0 ? "none" : "4 4"} 
                              />
                              <text 
                                x={pLeft - 8} 
                                y={yVal + 3} 
                                textAnchor="end" 
                                fill="var(--text-muted)" 
                                fontSize="10px" 
                                fontFamily="inherit"
                              >
                                R$ {currencyVal >= 1000 ? `${(currencyVal / 1000).toFixed(1)}k` : currencyVal.toFixed(0)}
                              </text>
                            </g>
                          );
                        })}

                        {/* MODO BARRAS */}
                        {dashChartType === 'bar' && pointsWithCoords.map((pt) => {
                          const h = Math.max(2, bottomY - pt.y);
                          const isHovered = hoveredChartPoint?.key === pt.key;
                          return (
                            <g key={pt.key}>
                              <rect
                                x={pt.x - barWidth / 2}
                                y={pt.value > 0 ? pt.y : bottomY - 2}
                                width={barWidth}
                                height={pt.value > 0 ? h : 2}
                                rx="4"
                                fill={isHovered ? "#f59e0b" : "url(#gradientSalesBar)"}
                                opacity={isHovered ? 1 : 0.85}
                                style={{ transition: 'all 0.2s' }}
                              />
                              {pt.value > 0 && dashChartPoints.length <= 15 && (
                                <text
                                  x={pt.x}
                                  y={pt.y - 6}
                                  textAnchor="middle"
                                  fill="#edb143"
                                  fontSize="9.5px"
                                  fontWeight="700"
                                >
                                  {pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}k` : pt.value.toFixed(0)}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* MODO LINHA */}
                        {dashChartType === 'line' && (
                          <>
                            {/* Preenchimento de Área */}
                            {areaPathD && (
                              <path
                                d={areaPathD}
                                fill="url(#gradientSalesArea)"
                              />
                            )}

                            {/* Linha da Curva */}
                            {linePathD && (
                              <path
                                d={linePathD}
                                fill="none"
                                stroke="url(#gradientSalesStroke)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Pontos da Linha */}
                            {pointsWithCoords.map((pt) => {
                              const isHovered = hoveredChartPoint?.key === pt.key;
                              return (
                                <g key={pt.key}>
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? 7 : (pt.value > 0 ? 5 : 3)}
                                    fill={pt.value > 0 ? "#edb143" : "rgba(255,255,255,0.3)"}
                                    stroke="#090d16"
                                    strokeWidth="2"
                                    style={{ transition: 'r 0.15s ease' }}
                                  />
                                  {pt.value > 0 && dashChartPoints.length <= 14 && (
                                    <text
                                      x={pt.x}
                                      y={pt.y - 9}
                                      textAnchor="middle"
                                      fill="var(--color-brand-yellow)"
                                      fontSize="9.5px"
                                      fontWeight="bold"
                                    >
                                      R$ {pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}k` : pt.value.toFixed(0)}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </>
                        )}

                        {/* Áreas de captura para Hover Interativo */}
                        {pointsWithCoords.map((pt) => {
                          const colW = plotW / (dashChartPoints.length || 1);
                          return (
                            <rect
                              key={`capture-${pt.key}`}
                              x={pt.x - colW / 2}
                              y={pTop}
                              width={colW}
                              height={plotH + 20}
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredChartPoint(pt)}
                              onMouseLeave={() => setHoveredChartPoint(null)}
                            />
                          );
                        })}

                        {/* Rótulos do Eixo X */}
                        {pointsWithCoords.map((pt, idx) => {
                          if (idx % labelStep !== 0 && idx !== pointsWithCoords.length - 1) return null;
                          return (
                            <text
                              key={`label-${pt.key}`}
                              x={pt.x}
                              y={bottomY + 22}
                              textAnchor="middle"
                              fill={hoveredChartPoint?.key === pt.key ? "#fff" : "var(--text-muted)"}
                              fontSize="11px"
                              fontWeight={hoveredChartPoint?.key === pt.key ? 700 : 500}
                              fontFamily="inherit"
                            >
                              {pt.label}
                            </text>
                          );
                        })}

                        {/* Floating Tooltip no Hover */}
                        {hoveredChartPoint && (
                          <g 
                            transform={`translate(${Math.min(svgWidth - 165, Math.max(pLeft, hoveredChartPoint.x - 75))}, ${Math.max(5, hoveredChartPoint.y - 58)})`}
                            style={{ pointerEvents: 'none' }}
                          >
                            <rect
                              width="150"
                              height="48"
                              rx="8"
                              fill="#0f172a"
                              stroke="var(--color-brand-yellow)"
                              strokeWidth="1.5"
                              filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"
                            />
                            <text x="75" y="18" textAnchor="middle" fill="#9ca3af" fontSize="10.5px" fontWeight="600">
                              {hoveredChartPoint.fullLabel || hoveredChartPoint.label}
                            </text>
                            <text x="75" y="37" textAnchor="middle" fill="#edb143" fontSize="13px" fontWeight="800">
                              R$ {hoveredChartPoint.value.toFixed(2)} • {hoveredChartPoint.ordersCount} ped
                            </text>
                          </g>
                        )}
                      </svg>
                    </div>
                  );
                })()}

                {/* Mensagem informativa quando o período estiver sem vendas */}
                {chartMaxSale === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1.25rem', 
                    marginTop: '0.75rem', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px', 
                    border: '1px dashed rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem'
                  }}>
                    ℹ️ Nenhuma venda registrada no período selecionado ({dashStartDate.split('-').reverse().join('/')} até {dashEndDate.split('-').reverse().join('/')}).
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Selecione outro período nos filtros acima ou realize novos pedidos para acompanhar o gráfico.
                    </div>
                  </div>
                )}
              </div>
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

                    <button
                      type="button"
                      onClick={() => {
                        showConfirm('Deseja sincronizar o cardápio com os 4 lanches oficiais (Prensadinho, Frango, Pernil e Costela) e suas fichas técnicas?', {
                          title: 'Sincronizar Cardápio',
                          badge: 'CARDÁPIO OFICIAL',
                          type: 'warning',
                          confirmText: 'Sim, Sincronizar',
                          cancelText: 'Cancelar',
                          onConfirm: () => {
                            resetToOfficialMenu();
                            showAlert('Cardápio sincronizado com sucesso com as fichas técnicas oficiais!', {
                              title: 'Sucesso',
                              type: 'success'
                            });
                          }
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-glass)',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Restaura os lanches oficiais do Nuu Prensado com suas fichas técnicas e insumos"
                    >
                      <RotateCcw size={14} />
                      <span>Sincronizar Lanches Oficiais</span>
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}>Foto</th>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Preço Venda</th>
                          <th>CMV & Margem</th>
                          <th style={{ textAlign: 'center' }}>Disponibilidade (1-Clique)</th>
                          <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(prod => {
                          const cmv = (prod.recipe || []).reduce((acc, r) => {
                            const ing = inventory.find(i => i.id === r.ingredientId);
                            return acc + ((ing?.unitCost || 0) * (r.quantity || 0));
                          }, 0);
                          const margem = prod.price > 0 ? (((prod.price - cmv) / prod.price) * 100).toFixed(0) : 0;

                          return (
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
                            <td>
                              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>CMV: R$ {cmv.toFixed(2)}</div>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: margem >= 50 ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                color: margem >= 50 ? '#4ade80' : '#fde047',
                                fontWeight: 700
                              }}>
                                Margem: {margem}%
                              </span>
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
                                    showConfirm(`Deseja realmente excluir o produto "${prod.name}"?`, {
                                      title: 'Excluir Produto',
                                      badge: 'PRODUTO',
                                      type: 'error',
                                      confirmText: 'Sim, Excluir',
                                      cancelText: 'Cancelar',
                                      confirmColor: '#ef4444',
                                      onConfirm: () => deleteProduct(prod.id)
                                    });
                                  }}
                                  style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-danger)', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                  title="Excluir Produto"
                                >
                                  <Trash2 size={14} />
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
                                color: comp.group === 'extras' ? '#f59e0b' : comp.group === 'bread' ? '#38bdf8' : comp.group === 'creamy' ? '#60a5fa' : comp.group === 'melted' ? '#fbbf24' : '#a3e635'
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
                                    showConfirm(`Deseja realmente excluir o complemento "${comp.name}"?`, {
                                      title: 'Excluir Complemento',
                                      badge: 'COMPLEMENTO',
                                      type: 'error',
                                      confirmText: 'Sim, Excluir',
                                      cancelText: 'Cancelar',
                                      confirmColor: '#ef4444',
                                      onConfirm: () => deleteComplement(comp.id)
                                    });
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

          {/* TAB: LOGÍSTICA & GESTÃO DE MOTOBOYS */}
          {activeTab === 'logistics' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bike size={24} color="var(--color-brand)" /> Logística & Gestão de Motoboys
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Controle de entregadores, taxas por corrida, acertos diários e rotas GPS em tempo real.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingMotoboy(null);
                    setMotoboyName('');
                    setMotoboyPhone('');
                    setMotoboyVehicle('Moto Honda CG 160');
                    setMotoboyPix('');
                    setMotoboyFee('6.00');
                    setIsMotoboyModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Cadastrar Entregador
                </button>
              </div>

              {/* Resumo Rápido de Logística */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '14px', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Entregadores Ativos</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{motoboys.filter(m => m.active).length}</div>
                </div>
                <div className="glass-panel" style={{ padding: '14px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Entregas em Rota Agora</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{shippingOrders.length}</div>
                </div>
                <div className="glass-panel" style={{ padding: '14px', borderLeft: '4px solid #4ade80' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total a Pagar aos Motoboys</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>
                    R$ {motoboys.reduce((acc, m) => acc + (m.pendingBalance || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tabela de Motoboys Cadastrados */}
              <div className="admin-table-container" style={{ marginBottom: '2rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Telefone / WhatsApp</th>
                      <th>Veículo</th>
                      <th>Chave Pix</th>
                      <th>Taxa/Corrida</th>
                      <th>Entregas</th>
                      <th>Saldo Pendente</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {motoboys.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          Nenhum entregador cadastrado ainda. Clique em "Cadastrar Entregador".
                        </td>
                      </tr>
                    ) : (
                      motoboys.map(mb => {
                        const cleanPhone = mb.phone ? mb.phone.replace(/\D/g, '') : '';
                        return (
                          <tr key={mb.id}>
                            <td style={{ fontWeight: 700, color: '#fff' }}>{mb.name}</td>
                            <td>
                              {cleanPhone ? (
                                <a 
                                  href={`https://wa.me/55${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                >
                                  <Phone size={13} /> {mb.phone}
                                </a>
                              ) : mb.phone}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>{mb.vehicle || 'Moto'}</td>
                            <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{mb.pixKey || 'Não informada'}</td>
                            <td style={{ fontWeight: 700 }}>R$ {Number(mb.feePerDelivery || 6).toFixed(2)}</td>
                            <td style={{ fontWeight: 700 }}>{mb.completedDeliveries || 0}</td>
                            <td style={{ fontWeight: 800, color: '#4ade80', fontSize: '0.95rem' }}>
                              R$ {Number(mb.pendingBalance || 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                {mb.pendingBalance > 0 && (
                                  <button
                                    onClick={() => {
                                      showConfirm(`Confirmar acerto financeiro de R$ ${Number(mb.pendingBalance).toFixed(2)} com o entregador ${mb.name}?`, {
                                        title: 'Acerto de Entregador',
                                        badge: 'FINANCEIRO',
                                        type: 'success',
                                        confirmText: 'Confirmar Acerto',
                                        cancelText: 'Cancelar',
                                        confirmColor: '#22c55e',
                                        onConfirm: () => settleMotoboyPayments(mb.id)
                                      });
                                    }}
                                    className="btn-primary"
                                    style={{ padding: '4px 8px', fontSize: '0.72rem', backgroundColor: '#22c55e' }}
                                    title="Realizar Acerto Financeiro"
                                  >
                                    Acertar R$
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingMotoboy(mb);
                                    setMotoboyName(mb.name);
                                    setMotoboyPhone(mb.phone);
                                    setMotoboyVehicle(mb.vehicle || '');
                                    setMotoboyPix(mb.pixKey || '');
                                    setMotoboyFee(String(mb.feePerDelivery || 6));
                                    setIsMotoboyModalOpen(true);
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  title="Editar"
                                >
                                  <Edit size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Entregas em Rota no Momento */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bike size={18} color="#38bdf8" /> Pedidos em Rota de Entrega ({shippingOrders.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {shippingOrders.map(order => {
                    const mb = motoboys.find(m => m.id === order.motoboyId);
                    return (
                      <div key={order.id} className="glass-panel" style={{ padding: '14px', borderLeft: '4px solid #38bdf8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand)' }}>#{order.id}</span>
                          <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                            {mb ? `🛵 ${mb.name}` : 'Aguardando Entregador'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '4px 0 8px 0' }}>📍 {order.address}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#fff' }}>R$ {order.total.toFixed(2)}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <MapPin size={12} /> Abrir GPS
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTROLE DE LOJA, TAXAS, MAPA & FIDELIDADE */}
          {activeTab === 'store' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={24} color="var(--color-brand)" /> Controle de Loja, Taxas & Fidelidade
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Defina o status da loja, horários, taxas por bairro com raio no mapa, cupons de desconto e regras de fidelidade.
                  </p>
                </div>
              </div>

              {/* Bloco 1: Controle Liga/Desliga da Loja & Horários */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="var(--color-brand)" /> Status de Atendimento & Horários
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
                  {/* Card de Status da Loja & Ações Rápidas */}
                  {(() => {
                    const pauseStatus = typeof getStorePauseStatus === 'function' ? getStorePauseStatus() : { isPaused: false };
                    return (
                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${pauseStatus.isPaused ? 'rgba(234,179,8,0.45)' : storeSettings?.isOpen ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: pauseStatus.isPaused ? '#facc15' : storeSettings?.isOpen ? '#4ade80' : '#f87171' }}>
                              {pauseStatus.isPaused ? `⏸️ LOJA PAUSADA (~${pauseStatus.remainingMinutes} min)` : storeSettings?.isOpen ? '🟢 LOJA ABERTA' : '🔴 LOJA FECHADA'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {pauseStatus.isPaused ? (pauseStatus.pauseReason || 'Pausa temporária na cozinha') : storeSettings?.isOpen ? 'Recebendo novos pedidos online' : 'Pedidos online suspensos'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {pauseStatus.isPaused ? (
                              <button
                                type="button"
                                onClick={() => resumeStore()}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  backgroundColor: '#16a34a',
                                  color: '#fff'
                                }}
                              >
                                Retomar Agora
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateStoreSettings({ isOpen: !storeSettings?.isOpen, pausedUntil: null, pauseReason: null })}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  backgroundColor: storeSettings?.isOpen ? '#ef4444' : '#22c55e',
                                  color: '#fff'
                                }}
                              >
                                {storeSettings?.isOpen ? 'Fechar Loja' : 'Abrir Loja'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Botões de Pausa Rápida */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                            Pausa Rápida de Cozinha (Cardápio Online):
                          </span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[15, 30, 45, 60].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => pauseStore(m, 'Muitos pedidos sendo preparados no momento')}
                                style={{
                                  flex: 1,
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(234,179,8,0.3)',
                                  backgroundColor: 'rgba(234,179,8,0.1)',
                                  color: '#fef08a',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {m} min
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tempo Estimado e Frete Grátis */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tempo Médio de Espera</label>
                    <input
                      type="text"
                      value={storeSettings?.estimatedTime || '30 - 50 min'}
                      onChange={(e) => updateStoreSettings({ estimatedTime: e.target.value })}
                      placeholder="Ex: 35 - 50 min"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Frete Grátis Acima de (R$)</label>
                    <input
                      type="number"
                      step="1"
                      value={storeSettings?.freeDeliveryThreshold || 70}
                      onChange={(e) => updateStoreSettings({ freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 70"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* WhatsApp Oficial da Loja */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={15} color="#22c55e" /> WhatsApp Oficial da Loja (com DDD)
                    </label>
                    <input
                      type="text"
                      value={storeSettings?.whatsapp || ''}
                      onChange={(e) => updateStoreSettings({ whatsapp: e.target.value })}
                      placeholder="Ex: (31) 98888-7777 ou 31988887777"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Chave Pix Oficial */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={15} color="#eab308" /> Chave Pix Oficial da Loja
                    </label>
                    <input
                      type="text"
                      value={storeSettings?.pixKey || ''}
                      onChange={(e) => updateStoreSettings({ pixKey: e.target.value })}
                      placeholder="Ex: Celular, CNPJ, E-mail ou Chave Aleatória"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Endereço Físico da Loja */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="#38bdf8" /> Endereço Físico da Loja
                    </label>
                    <input
                      type="text"
                      value={storeSettings?.storeAddress || ''}
                      onChange={(e) => updateStoreSettings({ storeAddress: e.target.value })}
                      placeholder="Ex: Rua Principal, 100 - Centro"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Horários de Funcionamento & Agendamento Automático */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color="#f97316" /> Horário de Funcionamento da Loja
                      </label>
                      
                      {/* Modo de Operação: Manual vs Automático */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: storeSettings?.autoSchedule ? '#4ade80' : '#eab308', fontWeight: 600 }}>
                          {storeSettings?.autoSchedule ? '⏰ Agendamento Automático Ativo' : '🖐️ Controle Manual Ativo'}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStoreSettings({ autoSchedule: !storeSettings?.autoSchedule })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-glass)',
                            backgroundColor: storeSettings?.autoSchedule ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                            color: storeSettings?.autoSchedule ? '#4ade80' : '#eab308',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {storeSettings?.autoSchedule ? 'Mudar p/ Controle Manual' : 'Ativar Agendamento Automático'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Horário de Abertura</span>
                        <input
                          type="time"
                          value={storeSettings?.openTime || '18:00'}
                          onChange={(e) => updateStoreSettings({ openTime: e.target.value })}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Horário de Fechamento</span>
                        <input
                          type="time"
                          value={storeSettings?.closeTime || '23:30'}
                          onChange={(e) => updateStoreSettings({ closeTime: e.target.value })}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    {/* Seletor de Dias de Funcionamento */}
                    <div style={{
                      marginTop: '4px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Dias de Atendimento da Semana:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const standardDays = ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
                            const isStandard = (storeSettings?.openDays || []).length === 6 && !(storeSettings?.openDays || []).includes('seg');
                            updateStoreSettings({ openDays: isStandard ? ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] : standardDays });
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {((storeSettings?.openDays || []).length === 6 && !(storeSettings?.openDays || []).includes('seg')) ? 'Marcar Todos os Dias' : 'Marcar Terça a Domingo'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'seg', label: 'Seg' },
                          { id: 'ter', label: 'Ter' },
                          { id: 'qua', label: 'Qua' },
                          { id: 'qui', label: 'Qui' },
                          { id: 'sex', label: 'Sex' },
                          { id: 'sab', label: 'Sáb' },
                          { id: 'dom', label: 'Dom' }
                        ].map(day => {
                          const isActive = (storeSettings?.openDays || ['ter', 'qua', 'qui', 'sex', 'sab', 'dom']).includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                const currentDays = storeSettings?.openDays || ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
                                const nextDays = isActive
                                  ? currentDays.filter(d => d !== day.id)
                                  : [...currentDays, day.id];
                                updateStoreSettings({ openDays: nextDays });
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: `1px solid ${isActive ? 'var(--color-brand)' : 'var(--border-glass)'}`,
                                backgroundColor: isActive ? 'rgba(234, 179, 8, 0.25)' : 'var(--bg-tertiary)',
                                color: isActive ? 'var(--color-brand)' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {storeSettings?.autoSchedule ? (
                          <span>💡 <strong>Agendamento Automático Ativo:</strong> A loja abre às <strong>{storeSettings?.openTime || '18:00'}</strong> e fecha às <strong>{storeSettings?.closeTime || '23:30'}</strong> nos dias marcados.</span>
                        ) : (
                          <span>💡 <strong>Controle Manual Ativo:</strong> Você pode abrir ou fechar a loja a qualquer momento com 1 clique no botão superior.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco: Experiência do Cardápio (Visualização Imersiva vs Grade) */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MonitorPlay size={20} color="var(--color-brand)" /> Modo de Visualização do Cardápio (Clientes)
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
                      Controle a experiência visual do catálogo no delivery. Ative a visualização imersiva quando quiser surpreender os clientes com animações e slider interativo.
                    </p>
                  </div>

                  {/* Botão de Ação: Ativar / Desativar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        const current = storeSettings?.enableImmersiveView ?? false;
                        updateStoreSettings({ enableImmersiveView: !current });
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: storeSettings?.enableImmersiveView ? '#22c55e' : 'rgba(255,255,255,0.12)',
                        color: '#fff',
                        boxShadow: storeSettings?.enableImmersiveView ? '0 0 20px rgba(34, 197, 94, 0.35)' : 'none',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {storeSettings?.enableImmersiveView ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>✨ Modo Imersivo Ativado</span>
                        </>
                      ) : (
                        <>
                          <LayoutGrid size={18} />
                          <span>Ativar Modo Imersivo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status e Configurações de Abertura */}
                <div style={{
                  marginTop: '1.25rem',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: storeSettings?.enableImmersiveView ? 'rgba(34, 197, 94, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                  border: `1px solid ${storeSettings?.enableImmersiveView ? 'rgba(34, 197, 94, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{storeSettings?.enableImmersiveView ? '🚀' : '🛡️'}</span>
                    <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                      <strong>Status Operacional: </strong>
                      {storeSettings?.enableImmersiveView ? (
                        <span style={{ color: '#4ade80', fontWeight: 700 }}>Modo Imersivo liberado! Clientes podem alternar entre Slider e Grade.</span>
                      ) : (
                        <span style={{ color: '#facc15', fontWeight: 700 }}>Desativado. Cardápio operando 100% em formato de grade tradicional para fácil adaptação dos clientes.</span>
                      )}
                    </div>
                  </div>

                  {storeSettings?.enableImmersiveView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Abertura padrão do cliente:</span>
                      <select
                        value={storeSettings?.defaultViewMode || 'grid'}
                        onChange={(e) => updateStoreSettings({ defaultViewMode: e.target.value })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: '#fff',
                          border: '1px solid var(--border-glass)',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="grid">Grade (Tradicional)</option>
                        <option value="slider">Slider (Imersivo)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloco 2: Modo de Cobrança & Gestão de Raio / Bairros */}
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bike size={18} color="var(--color-brand)" /> Modo de Cobrança de Frete
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Defina se a taxa de entrega deve ser calculada por raio de quilometragem da loja ou por lista fixa de bairros.
                  </p>
                </div>
                <select
                  value={storeSettings?.deliveryMode || 'radius'}
                  onChange={(e) => updateStoreSettings({ deliveryMode: e.target.value })}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: '#fff',
                    border: '1px solid var(--border-glass)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="radius">📏 Raio por Quilometragem (KM) [Recomendado]</option>
                  <option value="neighborhood">🏙️ Bairros Fixos</option>
                </select>
              </div>

              {/* Grid: Faixas de Raio (Km), Bairros e Mapa */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Tabela de Faixas de Raio (Km) */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={18} color="var(--color-brand)" /> Faixas de Raio (Km)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Taxas progressivas cobradas conforme a distância da Rua Agapanto, 264.
                  </p>

                  {/* Formulário para adicionar faixa de raio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Até Km (ex: 5)"
                        value={newRadiusKm}
                        onChange={(e) => setNewRadiusKm(e.target.value)}
                        style={{ width: '110px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.82rem' }}
                      />
                      <input
                        type="number"
                        step="0.50"
                        placeholder="Taxa R$"
                        value={newRadiusFee}
                        onChange={(e) => setNewRadiusFee(e.target.value)}
                        style={{ width: '100px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.82rem' }}
                      />
                      <button
                        onClick={() => {
                          const km = parseFloat(newRadiusKm);
                          const fee = parseFloat(newRadiusFee);
                          if (!km || km <= 0) return alert('Digite a quilometragem máxima da faixa');
                          if (fee === undefined || isNaN(fee)) return alert('Digite o valor da taxa');
                          upsertRadius({
                            maxKm: km,
                            fee: fee,
                            description: newRadiusDesc.trim() || `Até ${km} km da loja`,
                            active: true
                          });
                          setNewRadiusKm('');
                          setNewRadiusFee('7.50');
                          setNewRadiusDesc('');
                        }}
                        className="btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        + Adicionar
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Descrição (ex: Bairros atendidos nesta faixa...)"
                      value={newRadiusDesc}
                      onChange={(e) => setNewRadiusDesc(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {(deliveryRadiuses || []).map((rad) => (
                      <div key={rad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                            Até {rad.maxKm} km
                          </div>
                          {rad.description && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {rad.description}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-brand)', fontSize: '0.85rem' }}>
                            R$ {Number(rad.fee || 0).toFixed(2)}
                          </span>
                          <button
                            onClick={() => deleteRadius(rad.id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                            title="Remover Faixa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabela de Taxas por Bairro */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#38bdf8" /> Bairros (Montes Claros)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Taxas personalizadas para cada bairro da cidade.
                  </p>

                  {/* Formulário para adicionar bairro */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Nome do Bairro"
                      value={newNeighborhoodName}
                      onChange={(e) => setNewNeighborhoodName(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <input
                      type="number"
                      step="0.50"
                      placeholder="Taxa R$"
                      value={newNeighborhoodFee}
                      onChange={(e) => setNewNeighborhoodFee(e.target.value)}
                      style={{ width: '90px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <button
                      onClick={() => {
                        if (!newNeighborhoodName.trim()) return alert('Digite o nome do bairro');
                        const fees = { ...(storeSettings?.deliveryFeesByNeighborhood || {}) };
                        fees[newNeighborhoodName.trim()] = parseFloat(newNeighborhoodFee) || 0;
                        updateStoreSettings({ deliveryFeesByNeighborhood: fees });
                        setNewNeighborhoodName('');
                      }}
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    >
                      Adicionar
                    </button>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {Object.entries(storeSettings?.deliveryFeesByNeighborhood || {}).map(([bairro, fee]) => (
                      <div key={bairro} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{bairro}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-brand)' }}>R$ {Number(fee || 0).toFixed(2)}</span>
                          <button
                            onClick={() => {
                              const fees = { ...(storeSettings?.deliveryFeesByNeighborhood || {}) };
                              delete fees[bairro];
                              updateStoreSettings({ deliveryFeesByNeighborhood: fees });
                            }}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                            title="Remover Bairro"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mapa Interativo de Raios de Entrega */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="var(--color-brand)" /> Mapa do Raio de Entrega
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Centro da loja em Montes Claros (Rua Agapanto, 264) com os círculos concêntricos de entrega.
                  </p>
                  <DeliveryMap 
                    storeLat={storeSettings?.storeLat || -16.7401}
                    storeLng={storeSettings?.storeLng || -43.8746}
                    radiuses={deliveryRadiuses.length > 0 ? deliveryRadiuses : (storeSettings?.deliveryRadius || [
                      { id: 'rad-1', maxKm: 3, fee: 5.00, active: true },
                      { id: 'rad-2', maxKm: 5, fee: 7.50, active: true },
                      { id: 'rad-3', maxKm: 8, fee: 10.00, active: true },
                      { id: 'rad-4', maxKm: 12, fee: 14.00, active: true }
                    ])}
                    onLocationChange={(lat, lng) => updateStoreSettings({ storeLat: lat, storeLng: lng })}
                  />
                </div>
              </div>

              {/* Bloco 3: Cupons de Desconto & Regras de Fidelidade */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {/* Cupons de Desconto */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={18} color="#f59e0b" /> Cupons de Desconto
                    </h3>
                    <button
                      onClick={() => {
                        setEditingCoupon(null);
                        setCouponCode('');
                        setCouponType('fixed');
                        setCouponDiscount('10');
                        setCouponMinOrder('30');
                        setIsCouponModalOpen(true);
                      }}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      + Criar Cupom
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {coupons.map(cp => {
                      const discountVal = Number(cp.discount ?? cp.value ?? 0);
                      const minVal = Number(cp.minOrder || 0);
                      return (
                        <div key={cp.id || cp.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fde047', letterSpacing: '0.5px' }}>{cp.code}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {cp.type === 'fixed' ? `R$ ${discountVal.toFixed(2)} OFF` : `${discountVal}% OFF`} • Mínimo: R$ {minVal.toFixed(2)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cp.usesCount || 0} usos</span>
                            <button
                              onClick={() => {
                                showConfirm(`Deseja realmente excluir o cupom "${cp.code}"?`, {
                                  title: 'Excluir Cupom',
                                  badge: 'CUPOM',
                                  type: 'error',
                                  confirmText: 'Sim, Excluir',
                                  cancelText: 'Cancelar',
                                  confirmColor: '#ef4444',
                                  onConfirm: () => deleteCoupon(cp.code || cp.id)
                                });
                              }}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Regras de Fidelidade Virtual */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="#eab308" /> Regras do Cartão Fidelidade Virtual
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Os selos são carimbados automaticamente a cada pedido concluído vinculado ao telefone do cliente.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Quantidade de Pedidos para Recompensa
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={storeSettings?.loyalty?.requiredOrders || 10}
                        onChange={(e) => updateStoreSettings({
                          loyalty: { ...storeSettings?.loyalty, requiredOrders: parseInt(e.target.value) || 10 }
                        })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Valor do Desconto ao Completar os Selos (R$)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={storeSettings?.loyalty?.rewardValue || 20}
                        onChange={(e) => updateStoreSettings({
                          loyalty: { ...storeSettings?.loyalty, rewardValue: parseFloat(e.target.value) || 20 }
                        })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-tertiary)', color: '#fff', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>
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
                    onClick={() => setIsCashModalOpen(true)}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', backgroundColor: '#38bdf8', color: '#000', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <DollarSign size={16} /> {currentShift?.isOpen ? 'Frente de Caixa (Aberto)' : 'Abrir Caixa'}
                  </button>
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

              {/* Painel de Turno de Caixa & Taxas de Maquininha */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* 1. Turno de Caixa */}
                <div className="glass-panel" style={{ padding: '16px', borderLeft: `4px solid ${currentShift?.isOpen ? '#22c55e' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Frente de Caixa</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: currentShift?.isOpen ? '#4ade80' : '#f87171' }}>
                        {currentShift?.isOpen ? '🟢 Turno Aberto' : '🔴 Caixa Fechado'}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCashModalOpen(true)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      {currentShift?.isOpen ? 'Sangria / Fechar' : 'Abrir Turno'}
                    </button>
                  </div>
                  {currentShift?.isOpen ? (
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Operador: <strong>{currentShift.operatorName}</strong></div>
                      <div>Fundo de Troco: <strong>R$ {Number(currentShift.initialCash || 0).toFixed(2)}</strong></div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#ef4444' }}>
                          Sangrias: R$ {(currentShift.bleeds || []).reduce((acc, b) => acc + (b.value || 0), 0).toFixed(2)}
                        </span>
                        <span style={{ color: '#38bdf8' }}>
                          Suprimentos: R$ {(currentShift.supplies || []).reduce((acc, s) => acc + (s.value || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Inicie um turno com operador e troco inicial para registrar sangrias e conferência de fechamento cego.
                    </div>
                  )}
                </div>

                {/* 2. Taxas de Cartão & Adquirentes */}
                <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Taxas de Maquininha</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Desconto de Cartão</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(251,191,36,0.3)' }}>
                      Configurável
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Taxa Crédito (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={storeSettings?.paymentFeeRates?.credit || 3.5}
                        onChange={(e) => updateStoreSettings({
                          paymentFeeRates: { ...(storeSettings?.paymentFeeRates || {}), credit: parseFloat(e.target.value) || 0 }
                        })}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: '#fff', border: '1px solid var(--border-glass)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Taxa Débito (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={storeSettings?.paymentFeeRates?.debit || 1.5}
                        onChange={(e) => updateStoreSettings({
                          paymentFeeRates: { ...(storeSettings?.paymentFeeRates || {}), debit: parseFloat(e.target.value) || 0 }
                        })}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: '#fff', border: '1px solid var(--border-glass)' }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Aplicado nas vendas em cartão para obter o faturamento líquido real.
                  </div>
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

          {/* TAB: EQUIPE & OPERADORES DO TURNO */}
          {activeTab === 'team' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>
                    Equipe & Operadores de Turno
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Cadastre os atendentes, caixas e chapeiros que podem ser selecionados na Frente de Operação diária.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOperatorModal()}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 700 }}
                >
                  <PlusCircle size={18} />
                  <span>+ Cadastrar Operador</span>
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome do Atendente</th>
                      <th>Função / Cargo</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map(op => (
                      <tr key={op.id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(234, 179, 8, 0.2)',
                              color: 'var(--color-brand-yellow)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.9rem'
                            }}>
                              {op.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{op.name}</span>
                          </div>
                        </td>
                        <td>{op.role}</td>
                        <td>
                          <span className={`badge ${op.active ? 'badge-delivered' : 'badge-pending'}`} style={{ fontSize: '0.72rem' }}>
                            {op.active ? 'Ativo no Turno' : 'Inativo'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenOperatorModal(op)}
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Editar"
                            >
                              <Edit size={13} /> Editar
                            </button>
                            <button
                              onClick={() => {
                                showConfirm(`Deseja realmente remover o operador "${op.name}"?`, {
                                  title: 'Remover Operador',
                                  badge: 'EQUIPE',
                                  type: 'error',
                                  confirmText: 'Sim, Remover',
                                  cancelText: 'Cancelar',
                                  confirmColor: '#ef4444',
                                  onConfirm: () => deleteOperator(op.id)
                                });
                              }}
                              className="btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.75rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              title="Excluir"
                            >
                              <Trash2 size={13} />
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

          {/* TAB: CLIENTES & HISTÓRICO DE FIDELIDADE */}
          {activeTab === 'customers' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Header da Aba */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(237, 177, 67, 0.15)',
                      border: '1px solid rgba(237, 177, 67, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-brand-yellow)'
                    }}>
                      <Award size={24} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Clientes & Fidelidade Inteligente
                      </h2>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Monitore a rotina real de pedidos de cada cliente, acompanhe o ranking de fidelidade com score preditivo e conceda bônus personalizados.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditCustomer()}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 700 }}
                  >
                    <PlusCircle size={18} />
                    <span>+ Cadastrar Cliente</span>
                  </button>
                </div>
              </div>

              {/* 5 Cards de KPIs Gerais da Base */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>Base Total de Clientes</span>
                    <Users size={18} color="var(--color-brand-yellow)" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                    {customerTiersSummary.total}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Mapeados com histórico e contato
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>Clientes VIP (Diamante + Ouro)</span>
                    <Crown size={18} color="#38bdf8" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                    {customerTiersSummary.diamond + customerTiersSummary.gold}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {customerTiersSummary.diamond} Diamantes 💎 e {customerTiersSummary.gold} Ouro 🥇
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>Faturamento Total (LTV)</span>
                    <BadgeDollarSign size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                    R$ {customerTiersSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Valor gerado por toda a base de clientes
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>Taxa de Recorrência</span>
                    <RotateCcw size={18} color="#a855f7" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>
                    {customerTiersSummary.total > 0 ? Math.round((customerTiersSummary.recurringCount / customerTiersSummary.total) * 100) : 0}%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {customerTiersSummary.recurringCount} clientes já pediram 2+ vezes
                  </span>
                </div>

                <div className="glass-panel" style={{ 
                  padding: '14px 18px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  border: customerTiersSummary.rewardAvailable > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                  background: customerTiersSummary.rewardAvailable > 0 ? 'rgba(16, 185, 129, 0.08)' : undefined
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>Prêmios Prontos (10 Selos)</span>
                    <Gift size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                    {customerTiersSummary.rewardAvailable}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {customerTiersSummary.rewardAvailable > 0 ? 'Clientes aguardando resgate de fidelidade!' : 'Nenhum prêmio pendente no momento'}
                  </span>
                </div>
              </div>

              {/* Seção 2: Gráficos de Ranking de Fidelidade e Quadro Geral da Base */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '1rem',
                alignItems: 'stretch'
              }}>
                
                {/* Painel 1: Ranking dos Melhores Clientes (Leaderboard de Score) */}
                <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trophy size={20} color="var(--color-brand-yellow)" />
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                        Ranking de Fidelidade (Top Clientes)
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Top 10 por Score
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Clientes com maior frequência, valor acumulado e engajamento no programa.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    {topRankingCustomers.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum cliente registrado ou com pedidos ainda.
                      </div>
                    ) : (
                      topRankingCustomers.map((c, idx) => {
                        const rankMedals = ['🥇', '🥈', '🥉'];
                        const rankColor = idx === 0 ? '#edb143' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f97316' : '#94a3b8';

                        return (
                          <div 
                            key={c.phone || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-glass)',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: rankColor
                              }}>
                                {idx < 3 ? rankMedals[idx] : `#${idx + 1}`}
                              </div>

                              <div>
                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{c.name}</span>
                                  <span title={c.tierLabel} style={{ fontSize: '0.85rem' }}>{c.tierIcon}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                  {c.rawPhone || c.phone} • {c.neighborhood || 'Delivery'}
                                </div>
                              </div>
                            </div>

                            {/* Barra de Progresso do Score */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '160px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Score</span>
                                <span style={{ fontWeight: 800, color: c.tierColor }}>{c.score}/100</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${c.score}%`,
                                  height: '100%',
                                  backgroundColor: c.tierColor,
                                  borderRadius: '99px',
                                  transition: 'width 0.4s ease'
                                }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                <span>{c.totalOrders} ped.</span>
                                <span>R$ {c.totalSpent.toFixed(0)}</span>
                                <span>{c.stampsCount % 10}/10 selos</span>
                              </div>
                            </div>

                            {/* Ações Rápidas */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenBonusModal(c)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-brand-yellow)' }}
                                title="Conceder Bônus Individual"
                              >
                                <Gift size={13} />
                                <span className="mobile-hidden">Bônus</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenCustomerDetails(c)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                title="Ver Rotina e Histórico de Pedidos"
                              >
                                Detalhes
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Painel 2: Quadro Geral da Base (Distribuição por Níveis) e Metodologia de Score */}
                <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={20} color="#38bdf8" />
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                        Quadro Geral da Base de Clientes
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Distribuição & Potencial
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Segmentação automática dos clientes por nível de engajamento para direcionar campanhas e bônus.
                  </p>

                  {/* Barras de Distribuição dos Tiers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                    {[
                      { key: 'diamond', label: 'Diamante (VIP)', count: customerTiersSummary.diamond, icon: '💎', color: '#38bdf8', minScore: '80+' },
                      { key: 'gold', label: 'Ouro', count: customerTiersSummary.gold, icon: '🥇', color: '#edb143', minScore: '60 - 79' },
                      { key: 'silver', label: 'Prata', count: customerTiersSummary.silver, icon: '🥈', color: '#cbd5e1', minScore: '40 - 59' },
                      { key: 'bronze', label: 'Bronze', count: customerTiersSummary.bronze, icon: '🥉', color: '#f97316', minScore: '20 - 39' },
                      { key: 'novo', label: 'Novo / Entrada', count: customerTiersSummary.novo, icon: '🌱', color: '#94a3b8', minScore: '0 - 19' }
                    ].map(tier => {
                      const pct = customerTiersSummary.total > 0
                        ? Math.round((tier.count / customerTiersSummary.total) * 100)
                        : 0;

                      return (
                        <div key={tier.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#fff' }}>
                              <span>{tier.icon}</span>
                              <span>{tier.label}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>({tier.minScore} pts)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: tier.color }}>{tier.count} clientes</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({pct}%)</span>
                            </div>
                          </div>
                          
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.max(pct, tier.count > 0 ? 4 : 0)}%`,
                              height: '100%',
                              backgroundColor: tier.color,
                              borderRadius: '99px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Box Explicativo de Score e Bônus */}
                  <div style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(237, 177, 67, 0.06)',
                    border: '1px dashed rgba(237, 177, 67, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand-yellow)', fontWeight: 700, fontSize: '0.82rem' }}>
                      <Sparkles size={16} />
                      <span>Como o Score de Fidelidade é Calculado?</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      O algoritmo analisa 4 pilares ponderados: <strong>Frequência de Pedidos (35%)</strong>, <strong>Volume Gasto / LTV (30%)</strong>, <strong>Recência da Compra (20%)</strong> e <strong>Selos Acumulados (15%)</strong>.
                      Utilize a nota para definir quem merece bônus exclusivos, promoções relâmpago ou mimos de agradecimento!
                    </div>
                  </div>

                </div>

              </div>

              {/* Seção 3: Barra de Filtros e Busca */}
              <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  
                  {/* Busca por Texto */}
                  <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar por nome, WhatsApp ou bairro..."
                      value={customerSearchTerm}
                      onChange={e => setCustomerSearchTerm(e.target.value)}
                      style={{ paddingLeft: '38px', width: '100%' }}
                    />
                  </div>

                  {/* Filtro por Nível / Condição */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nível:</span>
                    <select
                      value={customerTierFilter}
                      onChange={e => setCustomerTierFilter(e.target.value)}
                      style={{ padding: '8px 12px', minWidth: '160px' }}
                    >
                      <option value="all">Todos os Níveis ({consolidatedCustomers.length})</option>
                      <option value="diamond">💎 Diamante / VIP ({customerTiersSummary.diamond})</option>
                      <option value="gold">🥇 Ouro ({customerTiersSummary.gold})</option>
                      <option value="silver">🥈 Prata ({customerTiersSummary.silver})</option>
                      <option value="bronze">🥉 Bronze ({customerTiersSummary.bronze})</option>
                      <option value="novo">🌱 Novos ({customerTiersSummary.novo})</option>
                      <option value="reward_available">🎁 Com Prêmio Pronto ({customerTiersSummary.rewardAvailable})</option>
                      <option value="at_risk">⚠️ Inativos (+30 dias sem pedir)</option>
                    </select>

                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginLeft: '8px' }}>Ordenar por:</span>
                    <select
                      value={customerSortBy}
                      onChange={e => setCustomerSortBy(e.target.value)}
                      style={{ padding: '8px 12px', minWidth: '150px' }}
                    >
                      <option value="score">Maior Score</option>
                      <option value="orders">Mais Pedidos</option>
                      <option value="ltv">Maior Faturamento (LTV)</option>
                      <option value="recent">Mais Recentes</option>
                    </select>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '4px' }}>
                  <span>Exibindo <strong>{filteredCustomersList.length}</strong> de <strong>{consolidatedCustomers.length}</strong> clientes</span>
                  {(customerSearchTerm || customerTierFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchTerm('');
                        setCustomerTierFilter('all');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-brand-yellow)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Seção 4: Tabela Completa de Clientes */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cliente / Contato</th>
                      <th>Nível & Score</th>
                      <th>Cartão Fidelidade</th>
                      <th>Consumo (LTV)</th>
                      <th>Último Pedido</th>
                      <th style={{ textAlign: 'center' }}>Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomersList.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          Nenhum cliente encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomersList.map(c => {
                        const stampsLeft = Math.max(0, 10 - (c.stampsCount % 10));
                        const hasReward = c.stampsCount >= 10;
                        const isAtRisk = c.daysSinceLastOrder >= 30;

                        return (
                          <tr key={c.phone}>
                            
                            {/* Cliente e Contato */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(237, 177, 67, 0.15)',
                                  border: `1px solid ${c.tierColor}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: c.tierColor,
                                  fontWeight: 800,
                                  fontSize: '0.95rem'
                                }}>
                                  {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{c.name}</span>
                                    {c.tier === 'diamond' && <Crown size={14} color="#38bdf8" />}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Phone size={12} />
                                    <span>{c.rawPhone || c.phone}</span>
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {c.neighborhood ? `${c.neighborhood}` : (c.address ? `${c.address.slice(0, 22)}...` : 'Balcão / Delivery')}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Nível e Score */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: `${c.tierColor}20`,
                                    border: `1px solid ${c.tierColor}60`,
                                    color: c.tierColor,
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span>{c.tierIcon}</span>
                                    <span>{c.tierLabel}</span>
                                  </span>
                                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
                                    {c.score} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pts</span>
                                  </span>
                                </div>

                                <div style={{ width: '120px', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${c.score}%`,
                                    height: '100%',
                                    backgroundColor: c.tierColor,
                                    borderRadius: '99px'
                                  }} />
                                </div>
                              </div>
                            </td>

                            {/* Cartão Fidelidade (Selos) */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Award size={15} color={hasReward ? '#10b981' : 'var(--color-brand-yellow)'} />
                                  <span style={{ fontWeight: 700, color: hasReward ? '#10b981' : '#fff', fontSize: '0.88rem' }}>
                                    {c.stampsCount % 10} / 10 selos
                                  </span>
                                  {hasReward && (
                                    <span style={{
                                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                      color: '#10b981',
                                      fontSize: '0.68rem',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 800
                                    }}>
                                      🎁 Prêmio Pronto!
                                    </span>
                                  )}
                                </div>

                                {/* Mini visualização de bolinhas de selos */}
                                <div style={{ display: 'flex', gap: '3px' }}>
                                  {Array.from({ length: 10 }).map((_, sIdx) => {
                                    const isFilled = sIdx < (c.stampsCount % 10);
                                    return (
                                      <div
                                        key={sIdx}
                                        style={{
                                          width: '7px',
                                          height: '7px',
                                          borderRadius: '50%',
                                          backgroundColor: isFilled ? 'var(--color-brand-yellow)' : 'rgba(255, 255, 255, 0.1)',
                                          border: isFilled ? '1px solid #edb143' : '1px solid rgba(255, 255, 255, 0.05)'
                                        }}
                                      />
                                    );
                                  })}
                                </div>

                                {c.bonuses && c.bonuses.length > 0 && (
                                  <span style={{ fontSize: '0.7rem', color: '#a855f7' }}>
                                    {c.bonuses.length} bônus registrado(s)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Consumo / LTV */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.92rem' }}>
                                  R$ {c.totalSpent.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {c.totalOrders} pedido{c.totalOrders === 1 ? '' : 's'}
                                </span>
                                {c.totalOrders > 0 && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Méd. R$ {c.averageTicket.toFixed(2)} / ped
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Último Pedido e Recência */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {c.lastOrderAt ? (
                                  <>
                                    <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                                      {new Date(c.lastOrderAt).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span style={{
                                      fontSize: '0.72rem',
                                      color: isAtRisk ? '#f97316' : 'var(--text-muted)',
                                      fontWeight: isAtRisk ? 700 : 400
                                    }}>
                                      {c.daysSinceLastOrder === 0 ? 'Hoje' : c.daysSinceLastOrder === 1 ? 'Ontem' : `há ${c.daysSinceLastOrder} dias`}
                                      {isAtRisk && ' ⚠️'}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem pedidos</span>
                                )}
                              </div>
                            </td>

                            {/* Ações */}
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                
                                {/* WhatsApp */}
                                <a
                                  href={`https://wa.me/55${c.phone}?text=${encodeURIComponent(`Olá, ${c.name}! Tudo bem? Passando para agradecer sua preferência no Nuu Prensado! 🌭❤️`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary"
                                  style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)' }}
                                  title="Conversar no WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                </a>

                                {/* Bônus */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenBonusModal(c)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--color-brand-yellow)', borderColor: 'rgba(237, 177, 67, 0.3)' }}
                                  title="Conceder Bônus Individual"
                                >
                                  <Gift size={14} /> Bônus
                                </button>

                                {/* Rotina / Detalhes */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCustomerDetails(c)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                  title="Ver Rotina e Histórico de Pedidos"
                                >
                                  Rotina
                                </button>

                                {/* Editar */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCustomer(c)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                                  title="Editar Cliente"
                                >
                                  <Edit size={14} />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
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
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', maxHeight: 'calc(100vh - 3rem)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button type="button" onClick={() => setIsProductModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.1rem 1.25rem', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
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
                      width: '62px', 
                      height: '62px', 
                      borderRadius: '8px', 
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
                        placeholder="Ou digite a URL/caminho da foto (ex: /Produtos/Prensado de Costela.jpeg)" 
                        style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  {/* Sugestões de Fotos Existentes */}
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fotos Prontas no Sistema (Clique para selecionar):</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {[
                        { name: 'Prensadinho', path: '/Produtos/Prensadinho.jfif' },
                        { name: 'Frango', path: '/Produtos/Prensado de Frango.jpeg' },
                        { name: 'Pernil', path: '/Produtos/Prensado de Pernil.jpeg' },
                        { name: 'Costela', path: '/Produtos/Prensado de Costela.jpeg' },
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
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
                  paddingTop: '10px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px' 
                }}>
                  <div style={{ 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid',
                    borderColor: prodActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: prodActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: prodActive ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {prodActive 
                          ? 'Visível e liberado para pedidos no cardápio dos clientes.' 
                          : 'Ocultado temporariamente das vendas até ser reativado.'}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setProdActive(!prodActive)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid var(--border-glass)',
                        backgroundColor: prodActive ? 'var(--bg-tertiary)' : 'var(--color-brand)',
                        color: prodActive ? 'var(--text-secondary)' : '#fff',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {prodActive ? 'Pausar Venda' : 'Ativar Venda'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.85rem 1.25rem' }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Salvar Produto</button>
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
                      <option value="bread">🥖 Tipo de Pão (Escolha)</option>
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

      {/* MODAL: IMPRESSÃO DE COMANDA TÉRMICA */}
      {receiptOrder && (
        <ThermalPrintReceipt 
          order={receiptOrder} 
          onClose={() => setReceiptOrder(null)} 
        />
      )}

      {/* MODAL: CONFIGURAÇÃO / SINCRONIZAÇÃO SUPABASE */}
      {isSupabaseModalOpen && (
        <SupabaseConfigModal 
          onClose={() => setIsSupabaseModalOpen(false)} 
        />
      )}

      {/* MODAL: CONFIGURAÇÃO / SINCRONIZAÇÃO FIREBASE */}
      {isFirebaseModalOpen && (
        <FirebaseConfigModal 
          onClose={() => setIsFirebaseModalOpen(false)} 
        />
      )}

      {/* MODAL: TURNO DE CAIXA (ABERTURA, SANGRIA, FECHAMENTO) */}
      {isCashModalOpen && (
        <CashShiftModal 
          onClose={() => setIsCashModalOpen(false)} 
        />
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE MOTOBOY */}
      {isMotoboyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={20} color="var(--color-brand)" />
                {editingMotoboy ? 'Editar Entregador' : 'Cadastrar Novo Entregador'}
              </h3>
              <button onClick={() => setIsMotoboyModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!motoboyName.trim()) return alert('Informe o nome do entregador');
              upsertMotoboy({
                id: editingMotoboy?.id,
                name: motoboyName.trim(),
                phone: motoboyPhone.trim(),
                vehicle: motoboyVehicle.trim(),
                pixKey: motoboyPix.trim(),
                feePerDelivery: parseFloat(motoboyFee) || 6.00
              });
              setIsMotoboyModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira"
                    value={motoboyName}
                    onChange={e => setMotoboyName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>WhatsApp / Telefone</label>
                    <input
                      type="text"
                      placeholder="(31) 99999-9999"
                      value={motoboyPhone}
                      onChange={e => setMotoboyPhone(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Veículo</label>
                    <input
                      type="text"
                      placeholder="Ex: Honda CG 160"
                      value={motoboyVehicle}
                      onChange={e => setMotoboyVehicle(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Taxa por Corrida (R$)</label>
                    <input
                      type="number"
                      step="0.50"
                      required
                      placeholder="6.00"
                      value={motoboyFee}
                      onChange={e => setMotoboyFee(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chave Pix</label>
                    <input
                      type="text"
                      placeholder="CPF / Tel / Chave"
                      value={motoboyPix}
                      onChange={e => setMotoboyPix(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsMotoboyModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Entregador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE CUPOM */}
      {isCouponModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} color="#f59e0b" />
                {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom de Desconto'}
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!couponCode.trim()) return alert('Informe o código do cupom');
              upsertCoupon({
                id: editingCoupon?.id,
                code: couponCode.trim().toUpperCase(),
                type: couponType,
                discount: parseFloat(couponDiscount) || 0,
                minOrder: parseFloat(couponMinOrder) || 0,
                active: true
              });
              setIsCouponModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Código do Cupom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NUU10, BEMVINDO, VIP"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipo de Desconto</label>
                    <select value={couponType} onChange={e => setCouponType(e.target.value)}>
                      <option value="fixed">Valor Fixo (R$)</option>
                      <option value="percent">Porcentagem (%)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor do Desconto *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder={couponType === 'fixed' ? '10.00' : '10'}
                      value={couponDiscount}
                      onChange={e => setCouponDiscount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="30.00"
                    value={couponMinOrder}
                    onChange={e => setCouponMinOrder(e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    O cliente só poderá aplicar este cupom se o carrinho atingir este valor.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsCouponModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Cupom</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE OPERADOR DE TURNO */}
      {isOperatorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsOperatorModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="var(--color-brand-yellow)" />
                {editingOperator ? 'Editar Operador' : 'Novo Operador de Turno'}
              </h3>
              <button onClick={() => setIsOperatorModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveOperator}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Santos"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Função / Cargo</label>
                  <select value={operatorRole} onChange={e => setOperatorRole(e.target.value)}>
                    <option value="Atendente">Atendente</option>
                    <option value="Caixa">Caixa</option>
                    <option value="Chapa / Cozinha">Chapa / Cozinha</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Proprietário">Proprietário</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Senha de Acesso (PIN) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ex: 1234"
                    value={operatorPin}
                    onChange={e => setOperatorPin(e.target.value)}
                    style={{ letterSpacing: '2px' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Senha que o atendente digitará para entrar no turno na Frente de Operação.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="opActiveCheck"
                    checked={operatorActive}
                    onChange={e => setOperatorActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="opActiveCheck" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                    Operador Ativo (visível na tela de turno)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsOperatorModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Operador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ROTINA E HISTÓRICO COMPLETO DO CLIENTE */}
      {isCustomerModalOpen && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setIsCustomerModalOpen(false)}>
          <div 
            className="modal-content animate-fade-in" 
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(237, 177, 67, 0.15)',
                  border: `2px solid ${selectedCustomer.tierColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedCustomer.tierColor,
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}>
                  {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {selectedCustomer.name}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: `${selectedCustomer.tierColor}20`,
                      border: `1px solid ${selectedCustomer.tierColor}60`,
                      color: selectedCustomer.tierColor,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{selectedCustomer.tierIcon}</span>
                      <span>{selectedCustomer.tierLabel}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Phone size={13} />
                    <span>{selectedCustomer.rawPhone || selectedCustomer.phone}</span>
                    {selectedCustomer.neighborhood && (
                      <>
                        <span>•</span>
                        <MapPin size={13} />
                        <span>{selectedCustomer.neighborhood}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsCustomerModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* DADOS DE CONTATO E CONSUMO */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px'
              }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score de Fidelidade</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: selectedCustomer.tierColor }}>
                    {selectedCustomer.score} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ 100</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total de Pedidos</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                    {selectedCustomer.totalOrders}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gasto Total (LTV)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    R$ {selectedCustomer.totalSpent.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ticket Médio</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#edb143' }}>
                    R$ {selectedCustomer.averageTicket.toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedCustomer.address && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Endereço de Entrega:</strong> {selectedCustomer.address} {selectedCustomer.neighborhood ? `(${selectedCustomer.neighborhood})` : ''}
                </div>
              )}

              {/* STATUS DO CARTÃO FIDELIDADE NUU PRENSADO (100% AUTOMÁTICO) */}
              {(() => {
                const currentCycleStamps = selectedCustomer.stampsCount % 10;
                const stampsNeeded = 10 - currentCycleStamps;
                
                // Encontra vouchers de fidelidade gerados para este cliente
                const customerFidelityCoupons = (coupons || []).filter(cp => 
                  cp.isFidelityVoucher && 
                  cp.customerPhone && 
                  cp.customerPhone.replace(/\D/g, '') === selectedCustomer.phone
                );

                return (
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(168, 35, 25, 0.25) 0%, rgba(237, 177, 67, 0.15) 100%)',
                    border: '1px solid rgba(237, 177, 67, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={20} color="var(--color-brand-yellow)" />
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                          CARTÃO FIDELIDADE • NUU PRENSADO
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '99px',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          border: '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                          ⚡ 100% Automático
                        </span>
                      </div>
                      
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-yellow)' }}>
                        {currentCycleStamps} de 10 pedidos concluídos
                      </span>
                    </div>

                    {/* Barra de Progresso Visual dos 10 Pedidos (Informativo, não interativo) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '6px',
                        padding: '6px 0'
                      }}>
                        {Array.from({ length: 10 }).map((_, sIdx) => {
                          const isFilled = sIdx < currentCycleStamps;
                          return (
                            <div
                              key={sIdx}
                              style={{
                                aspectRatio: '1',
                                borderRadius: '50%',
                                backgroundColor: isFilled ? 'var(--color-brand-yellow)' : 'rgba(255, 255, 255, 0.05)',
                                border: isFilled ? '2px solid #fff' : '2px dashed rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isFilled ? '#a82319' : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                boxShadow: isFilled ? '0 0 10px rgba(237, 177, 67, 0.5)' : 'none'
                              }}
                              title={isFilled ? `Pedido ${sIdx + 1} concluído` : `Falta ${sIdx + 1} pedidos`}
                            >
                              {isFilled ? '🌭' : `${sIdx + 1}`}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        <span>
                          {stampsNeeded === 1 
                            ? 'Falta apenas 1 pedido para o cliente ganhar 1 Lanche Grátis!' 
                            : `Faltam ${stampsNeeded} pedidos para o próximo voucher de Lanche Grátis.`}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Total histórico: {selectedCustomer.totalOrders} pedido{selectedCustomer.totalOrders === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Vouchers de Fidelidade Gerados para o Cliente */}
                    {customerFidelityCoupons.length > 0 ? (
                      <div style={{
                        marginTop: '4px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(237, 177, 67, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Gift size={15} color="#10b981" />
                          <span>Vouchers de Lanche Grátis Emitidos ({customerFidelityCoupons.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {customerFidelityCoupons.map((voucher) => {
                            const isAvailable = (voucher.usesCount || 0) === 0 && voucher.active;
                            const whatsappResendMsg = `🎉 *PARABÉNS, ${selectedCustomer.name.toUpperCase()}!* 🌭🎉\n\n` +
                              `Seu voucher de *1 LANCHE GRÁTIS* do seu *Cartão Fidelidade* continua disponível: *${voucher.code}*! 🎁\n\n` +
                              `👉 Basta inserir este cupom no carrinho do nosso cardápio digital ou enviar aqui no WhatsApp no seu próximo pedido!\n\n` +
                              `Muito obrigado pela sua preferência! ❤️🌭`;

                            return (
                              <div
                                key={voucher.code}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 10px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                  borderRadius: '6px',
                                  gap: '8px',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 900, color: 'var(--color-brand-yellow)', fontSize: '0.92rem', letterSpacing: '1px' }}>
                                    {voucher.code}
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    color: isAvailable ? '#10b981' : 'var(--text-muted)'
                                  }}>
                                    {isAvailable ? 'Disponível (1 Lanche Grátis)' : 'Já Utilizado'}
                                  </span>
                                </div>

                                {isAvailable && (
                                  <a
                                    href={`https://wa.me/55${selectedCustomer.phone}?text=${encodeURIComponent(whatsappResendMsg)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary"
                                    style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="Reenviar Voucher no WhatsApp"
                                  >
                                    <MessageCircle size={13} /> Reenviar WhatsApp
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Sparkles size={14} color="var(--color-brand-yellow)" />
                        <span>O cliente acumula 1 selo por pedido automaticamente. No 10º pedido concluído, o voucher de lanche gratuito é gerado e enviado no WhatsApp.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ITENS MAIS PEDIDOS (FAVORITOS) */}
              {selectedCustomer.favoriteItems && selectedCustomer.favoriteItems.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={16} color="#ef4444" />
                    <span>Lanches Favoritos do Cliente</span>
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedCustomer.favoriteItems.map((fav, fIdx) => (
                      <div
                        key={fIdx}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#fff' }}>{fav.name}</span>
                        <span style={{ color: 'var(--color-brand-yellow)', fontWeight: 800 }}>({fav.qty}x)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BÔNUS CONCEDIDOS ANTERIORMENTE */}
              {selectedCustomer.bonuses && selectedCustomer.bonuses.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gift size={16} color="#a855f7" />
                    <span>Bônus e Recompensas Concedidas ({selectedCustomer.bonuses.length})</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedCustomer.bonuses.map((b, bIdx) => (
                      <div
                        key={bIdx}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#fff' }}>{b.title}</strong>
                          {b.value && <span style={{ marginLeft: '6px', color: '#a855f7', fontWeight: 800 }}>({b.value})</span>}
                          {b.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{b.notes}</div>}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {b.grantedAt ? new Date(b.grantedAt).toLocaleDateString('pt-BR') : 'Registrado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HISTÓRICO REAL DE PEDIDOS DO CLIENTE */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="var(--color-brand-yellow)" />
                  <span>Histórico Cronológico de Pedidos ({selectedCustomer.orders.length})</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {selectedCustomer.orders.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Nenhum pedido registrado no sistema para este número ainda.
                    </div>
                  ) : (
                    selectedCustomer.orders.map((ord, oIdx) => {
                      const orderDate = ord.date || ord.created_at || ord.createdAt;
                      const orderStatusMap = {
                        pending: { label: 'Pendente', color: '#f59e0b' },
                        preparing: { label: 'Na Chapa', color: '#3b82f6' },
                        shipping: { label: 'Em Entrega', color: '#a855f7' },
                        delivered: { label: 'Concluído', color: '#10b981' },
                        canceled: { label: 'Cancelado', color: '#ef4444' }
                      };
                      const statusInfo = orderStatusMap[ord.status] || { label: ord.status, color: '#94a3b8' };

                      return (
                        <div
                          key={ord.id || oIdx}
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-glass)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>
                                #{ord.id ? String(ord.id).slice(-6) : 'S/N'}
                              </span>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: `${statusInfo.color}20`,
                                color: statusInfo.color,
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}>
                                {statusInfo.label}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {orderDate ? new Date(orderDate).toLocaleString('pt-BR') : 'Data não informada'}
                              </span>
                            </div>

                            {/* Itens do pedido */}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {Array.isArray(ord.items)
                                ? ord.items.map(it => `${it.quantity || 1}x ${it.name || it.productName || 'Item'}`).join(', ')
                                : 'Itens do lanche'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.92rem' }}>
                              R$ {(parseFloat(ord.total) || 0).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {ord.paymentMethod || 'Dinheiro/PIX'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`https://wa.me/55${selectedCustomer.phone}?text=${encodeURIComponent(`Olá, ${selectedCustomer.name}! Passando para agradecer sua fidelidade no Nuu Prensado! 🌭❤️`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenBonusModal(selectedCustomer);
                  }}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Gift size={16} /> Conceder Bônus
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONCESSÃO DE BÔNUS INDIVIDUAL */}
      {isBonusModalOpen && bonusCustomer && (
        <div className="modal-overlay" onClick={() => setIsBonusModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Gift size={20} color="var(--color-brand-yellow)" />
                  <span>Conceder Bônus Individual</span>
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Para: <strong>{bonusCustomer.name}</strong> • Score: <strong>{bonusCustomer.score} pts ({bonusCustomer.tierLabel})</strong>
                </p>
              </div>
              <button onClick={() => setIsBonusModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBonus}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Tipo de Bônus */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tipo de Benefício *</label>
                  <select
                    value={bonusType}
                    onChange={e => {
                      const t = e.target.value;
                      setBonusType(t);
                      if (t === 'coupon') {
                        setBonusTitle('Desconto Especial de Fidelidade');
                        setBonusValue('10%');
                      } else if (t === 'stamps') {
                        setBonusTitle('Selos Extras de Fidelidade');
                        setBonusValue('+2 Selos');
                      } else if (t === 'free_product') {
                        setBonusTitle('Cortesia de Lanche Nuu');
                        setBonusValue('1 Nuu Prensado Clássico');
                      } else {
                        setBonusTitle('Agradecimento e Reconhecimento VIP');
                        setBonusValue('Status VIP');
                      }
                    }}
                  >
                    <option value="coupon">Cupom / Desconto (%)</option>
                    <option value="discount">Desconto em Dinheiro (R$)</option>
                    <option value="stamps">Selos Extras no Cartão Fidelidade</option>
                    <option value="free_product">Produto / Lanche Cortesia</option>
                    <option value="vip_message">Reconhecimento / Mensagem VIP</option>
                  </select>
                </div>

                {/* Título do Bônus */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Título do Bônus *</label>
                  <input
                    type="text"
                    required
                    value={bonusTitle}
                    onChange={e => setBonusTitle(e.target.value)}
                    placeholder="Ex: Desconto Especial de Fidelidade"
                  />
                </div>

                {/* Valor ou Quantidade */}
                {bonusType === 'stamps' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quantidade de Selos Extras *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={bonusAddStamps}
                      onChange={e => setBonusAddStamps(parseInt(e.target.value, 10) || 1)}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Serão creditados imediatamente no cartão de fidelidade do cliente.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Valor / Descrição do Benefício *</label>
                    <input
                      type="text"
                      required
                      value={bonusValue}
                      onChange={e => setBonusValue(e.target.value)}
                      placeholder="Ex: 15% OFF, R$ 10,00 ou 1 Hot Dog Nuu Prensado"
                    />
                  </div>
                )}

                {/* Justificativa / Motivo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Motivo / Justificativa</label>
                  <textarea
                    rows="2"
                    value={bonusNotes}
                    onChange={e => setBonusNotes(e.target.value)}
                    placeholder="Ex: Cliente VIP bateu 10 pedidos este mês e ganhou benefício especial."
                  />
                </div>

                {/* Mensagem Pronta de WhatsApp */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(37, 211, 102, 0.08)',
                  border: '1px dashed rgba(37, 211, 102, 0.4)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#25D366', fontWeight: 700, fontSize: '0.78rem' }}>
                    <MessageCircle size={14} />
                    <span>Mensagem Pronta para WhatsApp:</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "Olá {bonusCustomer.name}! Passando para te avisar que você ganhou um bônus especial no Nuu Prensado: <strong>{bonusTitle} ({bonusType === 'stamps' ? `+${bonusAddStamps} selos` : bonusValue})</strong>! Muito obrigado pela sua preferência! 🌭❤️"
                  </div>
                  <a
                    href={`https://wa.me/55${bonusCustomer.phone}?text=${encodeURIComponent(`Olá, ${bonusCustomer.name}! Passando para te avisar que você ganhou um bônus especial no Nuu Prensado: ${bonusTitle} (${bonusType === 'stamps' ? `+${bonusAddStamps} selos` : bonusValue})! Muito obrigado pela sua preferência! 🌭❤️`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.72rem', color: '#25D366', fontWeight: 700, textDecoration: 'underline', alignSelf: 'flex-start' }}
                  >
                    Abrir conversa no WhatsApp com esta mensagem
                  </a>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsBonusModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" style={{ fontWeight: 800 }}>Conceder Bônus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CADASTRO / EDIÇÃO DE CLIENTE */}
      {isCustomerEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCustomerEditModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Users size={20} color="var(--color-brand-yellow)" />
                <span>Salvar Dados do Cliente</span>
              </h3>
              <button onClick={() => setIsCustomerEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerForm}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={custFormName}
                    onChange={e => setCustFormName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>WhatsApp / Telefone (com DDD) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: (31) 99999-9999"
                    value={custFormPhone}
                    onChange={e => setCustFormPhone(e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    O número do telefone é o identificador único para rastreamento de fidelidade e pedidos.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Centro"
                    value={custFormNeighborhood}
                    onChange={e => setCustFormNeighborhood(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Endereço Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua das Flores, 123 - Apto 101"
                    value={custFormAddress}
                    onChange={e => setCustFormAddress(e.target.value)}
                  />
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(237, 177, 67, 0.08)',
                  border: '1px solid rgba(237, 177, 67, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}>
                  <Award size={18} color="var(--color-brand-yellow)" />
                  <span>
                    <strong>Fidelidade 100% Automática:</strong> Os selos e pedidos são acumulados e monitorados pelo sistema a cada entrega concluída.
                  </span>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsCustomerEditModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" style={{ fontWeight: 800 }}>Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CELEBRAÇÃO DE VOUCHER DE FIDELIDADE (10º PEDIDO CONCLUÍDO) */}
      <FidelityCelebrationModal 
        alert={fidelityAlert} 
        onClose={() => setFidelityAlert(null)} 
      />

      </div>
    </div>
  );
}
