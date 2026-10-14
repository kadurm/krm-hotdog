import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSystem } from '../../contexts/SystemContext';
import LoyaltyCard from '../../components/LoyaltyCard';
import MercadoPagoWhiteLabelCheckout from '../../components/MercadoPagoWhiteLabelCheckout';
import CheckoutErrorBoundary from '../../components/CheckoutErrorBoundary';
import { 
  ShoppingBag, Plus, Minus, Trash2, 
  Clock, Utensils, ChevronRight, X, Sparkles,
  ChevronUp, ChevronDown, CheckCircle,
  LayoutGrid, MonitorPlay, Copy, Check, Bike, Store, MessageCircle,
  Tag, Award, AlertCircle, MapPin, Search, Gift, Phone, Navigation, ZoomIn,
  User, ArrowLeft, ArrowRight, Edit2, CreditCard, DollarSign, CheckCircle2,
  ShieldCheck, Lock, Smartphone, XCircle, LogOut
} from 'lucide-react';
import { VIEW_CONFIG } from '../../config/viewConfig';

export default function DeliveryView({
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
  cart: propCart,
  setCart: propSetCart,
  isCartOpen: propIsCartOpen,
  setIsCartOpen: propSetIsCartOpen,
  checkoutStep: propCheckoutStep,
  setCheckoutStep: propSetCheckoutStep,
  isCustomerModalOpen: propIsCustomerModalOpen,
  setIsCustomerModalOpen: propSetIsCustomerModalOpen,
  loggedCustomer: propLoggedCustomer,
  setLoggedCustomer: propSetLoggedCustomer
}) {
  const { 
    products, 
    createOrder, 
    orders, 
    complements = [],
    storeSettings,
    deliveryNeighborhoods = [],
    montesClarosNeighborhoods = [],
    deliveryRadiuses = [],
    coupons = [],
    validateCoupon,
    lookupCustomer,
    saveCustomer,
    calculateDeliveryFee,
    isStoreOpenNow,
    getStorePauseStatus
  } = useSystem();
  
  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStoreTick(t => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const pauseStatus = typeof getStorePauseStatus === 'function' ? getStorePauseStatus() : { isPaused: false };
  const isStoreOpen = typeof isStoreOpenNow === 'function' ? isStoreOpenNow() : (storeSettings?.isOpen ?? true);
  const displayOpenTime = storeSettings?.openTime || '18:00';
  const displayCloseTime = (storeSettings?.closeTime === '23:59' || storeSettings?.closeTime === '00:00' || !storeSettings?.closeTime) ? '23:30' : storeSettings.closeTime;

  const [activeSlide, setActiveSlide] = useState(0);
  const [internalViewMode, setInternalViewMode] = useState(VIEW_CONFIG.DEFAULT_VIEW_MODE);
  const [internalCart, setInternalCart] = useState([]);
  const [internalIsCartOpen, setInternalIsCartOpen] = useState(false);
  const [internalCheckoutStep, setInternalCheckoutStep] = useState('menu');

  const isImmersiveEnabled = storeSettings?.enableImmersiveView ?? VIEW_CONFIG.ENABLE_IMMERSIVE_VIEW;
  const rawViewMode = propViewMode !== undefined ? propViewMode : internalViewMode;
  const viewMode = isImmersiveEnabled ? rawViewMode : 'grid';
  const setViewMode = propSetViewMode || setInternalViewMode;
  const cart = propCart !== undefined ? propCart : internalCart;
  const setCart = propSetCart || setInternalCart;
  const isCartOpen = propIsCartOpen !== undefined ? propIsCartOpen : internalIsCartOpen;
  const setIsCartOpen = propSetIsCartOpen || setInternalIsCartOpen;
  const checkoutStep = propCheckoutStep !== undefined ? propCheckoutStep : internalCheckoutStep;
  const setCheckoutStep = propSetCheckoutStep || setInternalCheckoutStep;

  // Categoria Selecionada no Cardápio (sem doces)
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, title }
  const [siteModal, setSiteModal] = useState(null); // { title, message, type: 'info' | 'success' | 'warning', badge?: string }
  const [productQty, setProductQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [closedNoticeDismissed, setClosedNoticeDismissed] = useState(false);

  const showSiteAlert = (title, message, type = 'info', badge = null) => {
    setSiteModal({ title, message, type, badge });
  };
  
  // Agrupamento dinâmico de complementos e adicionais
  const breadOptions = complements.filter(c => c.group === 'bread');
  const creamyOptions = complements.filter(c => c.group === 'creamy');
  const meltedOptions = complements.filter(c => c.group === 'melted');
  const sideOptions = complements.filter(c => c.group === 'side');
  const extraOptions = complements.filter(c => c.category === 'extra' || c.group === 'extras');

  // Estados dinâmicos de personalização do lanche
  const [selectedBread, setSelectedBread] = useState('Pão tradicional');
  const [selectedCreamy, setSelectedCreamy] = useState('Catupiry');
  const [selectedMelted, setSelectedMelted] = useState('Mussarela');
  const [selectedSide, setSelectedSide] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState([]);

  // Adicionais extras ativos selecionados
  const activeSelectedExtras = extraOptions.filter(e => selectedExtras.includes(e.id) && e.active);
  const extrasTotal = activeSelectedExtras.reduce((acc, e) => acc + (e.price || 0), 0);
  const currentUnitPrice = selectedProduct ? (selectedProduct.price + extrasTotal) : 0;
  const currentTotalPrice = currentUnitPrice * productQty;

  // Cupons e Descontos
  const [inputCoupon, setInputCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Memória do Cliente & Fidelidade
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [identifiedCustomer, setIdentifiedCustomer] = useState(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Checkout States
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [cep, setCep] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState(null);
  const [address, setAddress] = useState('');
  // Campos estruturados de endereço (uma caixa para cada informação)
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');

  // Voucher de Fidelidade disponível (10º Pedido Concluído)
  const activeFidelityVoucher = useMemo(() => {
    const rawClean = (phone || customerSearchPhone || '').replace(/\D/g, '');
    if (!rawClean) return null;
    return coupons.find(c => 
      c.active && 
      c.isFidelityVoucher && 
      c.customerPhone && 
      c.customerPhone.replace(/\D/g, '') === rawClean && 
      (c.usesCount || 0) === 0
    ) || null;
  }, [coupons, phone, customerSearchPhone]);

  // Validação com destaque em vermelho e scroll automático intuitivo
  const [formErrors, setFormErrors] = useState({});
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const streetInputRef = useRef(null);
  const numberInputRef = useRef(null);
  const neighborhoodInputRef = useRef(null);

  // Fluxo de Quiz Interativo do Checkout (1: Identificação, 2: Entrega, 3: Pagamento, 4: Confirmação)
  const [quizStep, setQuizStep] = useState(1);

  // Reseta o quiz para a etapa 1 sempre que voltar ao cardápio
  useEffect(() => {
    if (checkoutStep === 'menu') {
      setQuizStep(1);
    }
  }, [checkoutStep]);

  const handleNextQuizStep = () => {
    if (quizStep === 1) {
      const errors = {};
      let hasError = false;
      if (!customerName.trim()) {
        errors.name = true;
        hasError = true;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = true;
        hasError = true;
      }
      if (hasError) {
        setFormErrors(prev => ({ ...prev, ...errors }));
        showSiteAlert(
          'Identificação Necessária',
          'Por favor, informe seu Nome Completo e WhatsApp válido com DDD (mínimo 10 dígitos) para continuar.',
          'warning',
          'Etapa 1'
        );
        return;
      }
      setFormErrors(prev => ({ ...prev, name: false, phone: false }));
      setQuizStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (quizStep === 2) {
      if (deliveryType === 'delivery') {
        const errors = {};
        let hasError = false;
        if (!addressStreet.trim()) {
          errors.street = true;
          hasError = true;
        }
        if (!addressNumber.trim()) {
          errors.number = true;
          hasError = true;
        }
        if (!addressNeighborhood.trim()) {
          errors.neighborhood = true;
          hasError = true;
        }
        if (hasError) {
          setFormErrors(prev => ({ ...prev, ...errors }));
          showSiteAlert(
            'Endereço Incompleto',
            'Por favor, preencha a Rua/Av, Número e Bairro para calcularmos a entrega corretamente.',
            'warning',
            'Etapa 2'
          );
          return;
        }
        setFormErrors(prev => ({ ...prev, street: false, number: false, neighborhood: false }));
      }
      setQuizStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (quizStep === 3) {
      if (!paymentMethod) {
        showSiteAlert(
          'Forma de Pagamento',
          'Por favor, selecione como deseja realizar o pagamento.',
          'warning',
          'Etapa 3'
        );
        return;
      }
      setQuizStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevQuizStep = () => {
    if (quizStep > 1) {
      setQuizStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCheckoutStep('menu');
    }
  };

  // Auxiliar para extrair campos de endereços legados salvos
  const parseAddressString = (addrStr) => {
    if (!addrStr || typeof addrStr !== 'string') return {};
    let street = '';
    let number = '';
    let complement = '';
    let neighborhood = '';

    const clean = addrStr.replace(/\s*-\s*Montes Claros(\/MG)?/i, '').trim();
    const parts = clean.split(',').map(p => p.trim());

    if (parts.length >= 1) {
      street = parts[0];
    }
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (/^(n[ºo°]?\s*|\d+)/i.test(part) && !number) {
        number = part.replace(/^n[ºo°]?\s*/i, '').trim();
      } else if (/^bairro\s+/i.test(part) && !neighborhood) {
        neighborhood = part.replace(/^bairro\s+/i, '').trim();
      } else if (!complement) {
        complement = part;
      }
    }
    return { street, number, complement, neighborhood };
  };

  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [deliverySelectionMode, setDeliverySelectionMode] = useState('neighborhood'); // 'neighborhood' | 'radius'
  const [selectedDistanceKm, setSelectedDistanceKm] = useState(null);
  const [selectedRadiusId, setSelectedRadiusId] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccessMessage, setGpsSuccessMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Pix (Mercado Pago)');
  const [changeFor, setChangeFor] = useState('');
  const [pixCopied, setPixCopied] = useState(false);

  // Sessão persistente do cliente (Login por WhatsApp compartilhado com Header)
  const [internalLoggedCustomer, setInternalLoggedCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('nuu_customer_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const loggedCustomer = propLoggedCustomer !== undefined ? propLoggedCustomer : internalLoggedCustomer;
  const setLoggedCustomer = (val) => {
    if (typeof propSetLoggedCustomer === 'function') propSetLoggedCustomer(val);
    setInternalLoggedCustomer(val);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nuu_customer_session_changed'));
    }
  };

  const [internalIsCustomerModalOpen, setInternalIsCustomerModalOpen] = useState(false);
  const isCustomerModalOpen = propIsCustomerModalOpen !== undefined ? propIsCustomerModalOpen : internalIsCustomerModalOpen;
  const setIsCustomerModalOpen = propSetIsCustomerModalOpen || setInternalIsCustomerModalOpen;

  const [customerModalTab, setCustomerModalTab] = useState('orders'); // 'orders' | 'login'
  const [loginPhoneInput, setLoginPhoneInput] = useState('');
  const [trackingBannerDismissed, setTrackingBannerDismissed] = useState(false);

  const [activeTrackingOrder, setActiveTrackingOrder] = useState(() => {
    try {
      const savedId = localStorage.getItem('nuu_customer_last_order_id');
      if (savedId) {
        return orders.find(o => String(o.id) === String(savedId)) || null;
      }
    } catch (e) {}
    return null;
  });

  // Cálculo da distância pela fórmula de Haversine em km
  const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccessMessage(null);

    const storeLat = storeSettings?.storeLat || -16.7401;
    const storeLng = storeSettings?.storeLng || -43.8746;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const distance = calculateHaversineKm(storeLat, storeLng, pos.coords.latitude, pos.coords.longitude);
        const roundedKm = Math.round(distance * 10) / 10;
        setSelectedDistanceKm(roundedKm);
        setDeliverySelectionMode('radius');
        
        const radiusesList = (deliveryRadiuses && deliveryRadiuses.length > 0)
          ? deliveryRadiuses
          : (storeSettings?.deliveryRadius || []);
        const sorted = [...radiusesList].sort((a, b) => a.maxKm - b.maxKm);
        const match = sorted.find(r => roundedKm <= r.maxKm);
        if (match) {
          setSelectedRadiusId(match.id);
        }
        setGpsSuccessMessage(`📍 GPS Detectado: você está a ~${roundedKm} km da loja (Rua Agapanto, 264)`);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Permissão de GPS não concedida. Selecione o bairro ou faixa abaixo.');
        } else {
          setGpsError('Não foi possível obter a localização. Selecione o bairro ou faixa abaixo.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Efeito para sincronizar dados do cliente logado no formulário
  useEffect(() => {
    if (loggedCustomer) {
      if (!phone && loggedCustomer.phone) setPhone(loggedCustomer.phone);
      if (!customerName && loggedCustomer.name) setCustomerName(loggedCustomer.name);
      
      const clean = (loggedCustomer.phone || '').replace(/\D/g, '');
      if (clean && typeof lookupCustomer === 'function') {
        const found = lookupCustomer(clean);
        if (found) {
          setIdentifiedCustomer(found);
          if (found.name && !customerName) setCustomerName(found.name);
          if (found.addressStreet && !addressStreet) setAddressStreet(found.addressStreet);
          if (found.addressNumber && !addressNumber) setAddressNumber(found.addressNumber);
          if (found.addressComplement && !addressComplement) setAddressComplement(found.addressComplement);
          if (found.addressNeighborhood && !addressNeighborhood) {
            setAddressNeighborhood(found.addressNeighborhood);
            setSelectedNeighborhood(found.addressNeighborhood);
          }
        }
      }
    }
  }, [loggedCustomer]);

  // Sincronização em tempo real do pedido de rastreamento com alterações do chapeiro/admin (inclusive cancelamento e exclusão)
  useEffect(() => {
    if (!activeTrackingOrder?.id) return;

    if (Array.isArray(orders) && orders.length > 0) {
      const liveOrder = orders.find(o => String(o.id) === String(activeTrackingOrder.id));
      if (liveOrder) {
        if (liveOrder.status !== activeTrackingOrder.status || liveOrder.cancelReason !== activeTrackingOrder.cancelReason) {
          setActiveTrackingOrder(liveOrder);
        }
      } else {
        // Pedido não encontrado na lista: foi cancelado/excluído da operação
        if (activeTrackingOrder.status !== 'canceled') {
          setActiveTrackingOrder(prev => ({
            ...prev,
            status: 'canceled',
            cancelReason: prev.cancelReason || 'Este pedido foi cancelado ou removido pelo estabelecimento.'
          }));
        }
      }
    }
  }, [orders, activeTrackingOrder?.id, activeTrackingOrder?.status]);

  // BroadcastChannel para sincronização instantânea inter-abas (notifica cliente na mesma hora em que chapeiro cancela/exclui)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    try {
      const channel = new BroadcastChannel('nuu_orders_channel');
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'ORDER_CANCELED') {
          if (activeTrackingOrder?.id && String(data.orderId) === String(activeTrackingOrder.id)) {
            setActiveTrackingOrder(prev => ({
              ...prev,
              status: 'canceled',
              cancelReason: data.reason || 'Este pedido foi cancelado pelo estabelecimento.'
            }));
          }
        } else if (data.type === 'ORDER_DELETED') {
          if (activeTrackingOrder?.id && String(data.orderId) === String(activeTrackingOrder.id)) {
            setActiveTrackingOrder(prev => ({
              ...prev,
              status: 'canceled',
              cancelReason: 'Este pedido foi cancelado e removido do sistema pela loja.'
            }));
          }
        }
      };
      return () => channel.close();
    } catch (e) {}
  }, [activeTrackingOrder?.id]);

  // Lista de todos os pedidos do cliente atual (para histórico / Meus Pedidos)
  const customerOrdersList = useMemo(() => {
    const rawClean = (loggedCustomer?.phone || phone || customerSearchPhone || '').replace(/\D/g, '');
    if (!rawClean || !Array.isArray(orders)) return [];
    return orders
      .filter(o => o.phone && o.phone.replace(/\D/g, '') === rawClean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, loggedCustomer?.phone, phone, customerSearchPhone]);

  // Handlers de Login e Logout do Cliente (Exclusivo por Número de Telefone)
  const handleCustomerLogin = (e) => {
    e?.preventDefault();
    const clean = loginPhoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      showSiteAlert('Número Inválido', 'Digite seu WhatsApp com DDD (mínimo 10 dígitos).', 'warning');
      return;
    }
    const found = typeof lookupCustomer === 'function' ? lookupCustomer(clean) : null;
    const finalName = (found?.name || '').trim();
    const customerObj = {
      phone: clean,
      name: finalName || 'Cliente'
    };
    setLoggedCustomer(customerObj);
    try {
      localStorage.setItem('nuu_customer_session', JSON.stringify(customerObj));
    } catch (err) {}
    setPhone(clean);
    if (finalName) setCustomerName(finalName);

    if (found) {
      setIdentifiedCustomer(found);
      if (found.addressStreet) setAddressStreet(found.addressStreet);
      if (found.addressNumber) setAddressNumber(found.addressNumber);
      if (found.addressComplement) setAddressComplement(found.addressComplement);
      if (found.addressNeighborhood) {
        setAddressNeighborhood(found.addressNeighborhood);
        setSelectedNeighborhood(found.addressNeighborhood);
      }
    }

    // Se o cliente tem pedidos anteriores, localiza o último em andamento para tracking
    const userOrders = (orders || []).filter(o => o.phone && o.phone.replace(/\D/g, '') === clean);
    const pendingOrder = userOrders.find(o => ['pending', 'preparing', 'shipping'].includes(o.status)) || userOrders[0];
    if (pendingOrder) {
      setActiveTrackingOrder(pendingOrder);
      try {
        localStorage.setItem('nuu_customer_last_order_id', pendingOrder.id.toString());
      } catch (err) {}
    }
    setCustomerModalTab('orders');
    showSiteAlert('Login Concluído!', `Olá! Você agora está conectado com seu WhatsApp.`, 'success');
  };

  const handleCustomerLogout = () => {
    setLoggedCustomer(null);
    try {
      localStorage.removeItem('nuu_customer_session');
    } catch (err) {}
    setLoginPhoneInput('');
    setCustomerModalTab('login');
    showSiteAlert('Desconectado', 'Sua sessão foi encerrada com sucesso.', 'info');
  };

  // Lista consolidada de faixas de raio por quilometragem (KM)
  const availableRadiuses = React.useMemo(() => {
    const list = (deliveryRadiuses && deliveryRadiuses.length > 0)
      ? deliveryRadiuses
      : (storeSettings?.deliveryRadius || []);
    return list.filter(r => r.active !== false).sort((a, b) => a.maxKm - b.maxKm);
  }, [deliveryRadiuses, storeSettings?.deliveryRadius]);

  // Lista consolidada de bairros para entrega (Montes Claros) com prioridade para taxas específicas e cálculo por raio
  const availableNeighborhoods = React.useMemo(() => {
    const map = new Map();

    const baseList = (montesClarosNeighborhoods && montesClarosNeighborhoods.length > 0)
      ? montesClarosNeighborhoods
      : (deliveryNeighborhoods || []);

    // 1. Iniciar com a base de bairros de Montes Claros
    baseList.forEach(n => {
      const key = (n.name || '').trim().toLowerCase();
      if (!key) return;

      // Calcula taxa baseada na faixa de raio daquele bairro
      let calcFee = 5.00;
      if (n.distanceKm && availableRadiuses.length > 0) {
        const match = availableRadiuses.find(r => n.distanceKm <= r.maxKm);
        if (match) {
          calcFee = Number(match.fee) || 0;
        } else {
          calcFee = Number(availableRadiuses[availableRadiuses.length - 1]?.fee) || 14.00;
        }
      }

      map.set(key, { 
        name: n.name, 
        fee: n.fee !== undefined ? Number(n.fee) : calcFee,
        distanceKm: n.distanceKm || null
      });
    });

    // 2. Sobrepor / adicionar com storeSettings.deliveryFeesByNeighborhood (valores específicos que sobressaem)
    if (storeSettings?.deliveryFeesByNeighborhood) {
      Object.entries(storeSettings.deliveryFeesByNeighborhood).forEach(([name, fee]) => {
        const key = name.trim().toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          name: existing ? existing.name : name,
          fee: Number(fee) || 0,
          distanceKm: existing ? existing.distanceKm : null,
          hasCustomFee: true
        });
      });
    }

    // 3. Sagrada Família (bairro da loja): se ainda não configurado, taxa 0.00 (Grátis)
    const sagradaKey = 'sagrada família';
    if (!map.has(sagradaKey)) {
      map.set(sagradaKey, { name: 'Sagrada Família', fee: 0, distanceKm: 0.5 });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [montesClarosNeighborhoods, deliveryNeighborhoods, storeSettings?.deliveryFeesByNeighborhood, availableRadiuses]);

  // Busca e preenchimento automático de endereço via CEP (ViaCEP)
  const handleLookupCep = async (inputCep) => {
    const raw = (inputCep !== undefined ? inputCep : cep) || '';
    const cleanCep = raw.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepFeedback({ success: false, message: 'Digite um CEP válido com 8 números (ex: 39401-022).' });
      return;
    }
    setCepLoading(true);
    setCepFeedback(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepFeedback({ success: false, message: 'CEP não encontrado. Preencha o endereço normalmente abaixo.' });
        setCepLoading(false);
        return;
      }

      const rua = data.logradouro || '';
      const b = data.bairro || '';

      if (rua) {
        setAddressStreet(rua);
        setFormErrors(prev => ({ ...prev, street: false }));
      }
      if (b) {
        setAddressNeighborhood(b);
        setSelectedNeighborhood(b);
        setFormErrors(prev => ({ ...prev, neighborhood: false }));
        const match = availableNeighborhoods.find(n => n.name.toLowerCase() === b.toLowerCase());
        if (match && match.distanceKm) {
          setSelectedDistanceKm(match.distanceKm);
        } else {
          setSelectedDistanceKm(null);
        }
      }

      setCepFeedback({ success: true, message: `Endereço localizado: ${rua ? rua + ', ' : ''}${b || 'Montes Claros'}!` });

      // Foco suave no campo de número para o cliente completar de forma intuitiva
      setTimeout(() => {
        numberInputRef.current?.focus();
      }, 200);
    } catch (e) {
      setCepFeedback({ success: false, message: 'Não foi possível consultar o CEP. Preencha o endereço normalmente abaixo.' });
    } finally {
      setCepLoading(false);
    }
  };

  // Detecção automática de bairro ao digitar ou editar o endereço
  const handleAddressChange = (newAddressText) => {
    setAddress(newAddressText);
    if (newAddressText && availableNeighborhoods.length > 0) {
      const lower = newAddressText.toLowerCase();
      const match = [...availableNeighborhoods]
        .sort((a, b) => b.name.length - a.name.length)
        .find(n => lower.includes(n.name.toLowerCase()));
      if (match) {
        setSelectedNeighborhood(match.name);
        setSelectedDistanceKm(match.distanceKm || null);
      }
    }
  };

  // Metadados enriquecidos para as categorias do cardápio
  const CATEGORY_META = {
    prensados: {
      id: 'prensados',
      label: 'Lanches Prensados',
      shortLabel: 'Prensados',
      icon: '🌭',
      description: 'Nossos prensados artesanais com queijo derretido, bacon crocante e receitas exclusivas da casa.',
      accentColor: '#eab308',
      order: 1
    },
    bebidas: {
      id: 'bebidas',
      label: 'Bebidas Geladas',
      shortLabel: 'Bebidas',
      icon: '🥤',
      description: 'Refrigerantes em lata, garrafas para toda a família, sucos naturais e águas estupidamente geladas.',
      accentColor: '#3b82f6',
      order: 2
    },
    acompanhamentos: {
      id: 'acompanhamentos',
      label: 'Acompanhamentos & Porções',
      shortLabel: 'Acompanhamentos',
      icon: '🍟',
      description: 'Batatas crocantes e complementos especiais feitos na hora com o tempero Nuu Prensado.',
      accentColor: '#f97316',
      order: 3
    }
  };

  const getCategoryMeta = (catId) => {
    return CATEGORY_META[catId] || {
      id: catId || 'outros',
      label: catId ? (catId.charAt(0).toUpperCase() + catId.slice(1)) : 'Outros',
      shortLabel: catId || 'Outros',
      icon: '🍽️',
      description: 'Opções especiais disponíveis no nosso cardápio.',
      accentColor: 'var(--color-brand)',
      order: 99
    };
  };

  const categoriesList = [
    { id: 'todos', label: 'Todos os Itens', shortLabel: 'Todos', icon: '🍽️' },
    { id: 'prensados', label: 'Lanches Prensados', shortLabel: 'Prensados', icon: '🌭' },
    { id: 'bebidas', label: 'Bebidas Geladas', shortLabel: 'Bebidas', icon: '🥤' },
    { id: 'acompanhamentos', label: 'Acompanhamentos', shortLabel: 'Acompanhamentos', icon: '🍟' },
  ].filter(c => c.id === 'todos' || products.some(p => p.category === c.id));

  // Ordenação lógica dos produtos por categoria (prensados -> bebidas -> acompanhamentos)
  const orderedProducts = [...products].sort((a, b) => {
    const orderA = CATEGORY_META[a.category]?.order || 99;
    const orderB = CATEGORY_META[b.category]?.order || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.id - b.id;
  });

  // Filtro de produtos por categoria
  const filteredProducts = orderedProducts.filter(p => {
    if (selectedCategory === 'todos') return true;
    return p.category === selectedCategory;
  });

  // Contagem de produtos ativos por categoria
  const activeProductsTotal = orderedProducts.filter(p => p.active);
  const categoryActiveCounts = activeProductsTotal.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  // Contagem cumulativa por categoria para obter o rank (1 de 5, 2 de 5...)
  const catRanks = {};

  // Produtos visuais para o Slider (mantendo animações, cores e metadados de categoria)
  const visualProducts = filteredProducts.filter(p => p.active).map((p, index, arr) => {
    const meta = getCategoryMeta(p.category);
    catRanks[p.category] = (catRanks[p.category] || 0) + 1;
    const rank = catRanks[p.category];
    const totalInCat = categoryActiveCounts[p.category] || 1;
    const isFirstInCat = rank === 1;
    const isLastInCat = rank === totalInCat;

    const nextProd = arr[index + 1] || arr[0];
    const isNextDifferentCategory = nextProd && nextProd.category !== p.category;
    const nextCatMeta = isNextDifferentCategory ? getCategoryMeta(nextProd.category) : null;

    const themes = {
      1: { color: '#eab308', floaties: ['🥓', '🌭', '🧀'] },
      2: { color: '#f97316', floaties: ['🍗', '🧀', '🔥'] },
      3: { color: '#b91c1c', floaties: ['🥩', '🔥', '🥓'] },
      4: { color: '#84cc16', floaties: ['🍖', '🌿', '🔥'] },
      5: { color: '#a16207', floaties: ['🥩', '🧀', '🔥'] },
      6: { color: '#dc2626', floaties: ['🥤', '🧊', '✨'] },
      7: { color: '#16a34a', floaties: ['🥤', '🌿', '✨'] },
      8: { color: '#b91c1c', floaties: ['🥤', '🧊', '✨'] },
      9: { color: '#eab308', floaties: ['🍊', '🥤', '🧊'] },
      10: { color: '#2563eb', floaties: ['💧', '🧊', '✨'] },
      11: { color: '#ca8a04', floaties: ['🍟', '🔥', '🧂'] },
    };
    
    const theme = themes[p.id] || { color: meta.accentColor || '#333333', floaties: ['✨', meta.icon, '🍔'] };
    return { 
      ...p, 
      ...theme, 
      slideIndex: index,
      categoryMeta: meta,
      categoryRank: rank,
      categoryTotal: totalInCat,
      isFirstOfCategory: isFirstInCat,
      isLastOfCategory: isLastInCat,
      nextCategoryMeta: nextCatMeta
    };
  });

  // Agrupamento para a visualização em grade
  const availableCategoryKeys = ['prensados', 'bebidas', 'acompanhamentos'];
  products.forEach(p => {
    if (p.category && !availableCategoryKeys.includes(p.category)) {
      availableCategoryKeys.push(p.category);
    }
  });

  const gridCategorySections = availableCategoryKeys.map(catId => {
    const meta = getCategoryMeta(catId);
    const catProds = orderedProducts.filter(p => p.category === catId);
    return {
      ...meta,
      products: catProds
    };
  }).filter(sec => sec.products.length > 0);

  // Referência do container principal para scroll suave na grade
  const mainContainerRef = React.useRef(null);

  // Toast animado ao cruzar fronteiras de categoria no slider
  const [categoryToast, setCategoryToast] = useState(null);
  const [lastSlideCat, setLastSlideCat] = useState(null);

  useEffect(() => {
    if (visualProducts.length === 0) return;
    const current = visualProducts[activeSlide] || visualProducts[0];
    if (current && lastSlideCat && current.category !== lastSlideCat) {
      setCategoryToast(current.categoryMeta);
      const timer = setTimeout(() => setCategoryToast(null), 2800);
      return () => clearTimeout(timer);
    }
    if (current) {
      setLastSlideCat(current.category);
    }
  }, [activeSlide]);

  // Handler unificado de clique nas pills de categoria
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);

    if (viewMode === 'grid') {
      if (catId === 'todos') {
        mainContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetEl = document.getElementById(`secao-categoria-${catId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else {
      // Modo slider
      if (catId === 'todos') {
        setActiveSlide(0);
      } else {
        const targetIdx = visualProducts.findIndex(p => p.category === catId);
        if (targetIdx !== -1) {
          setActiveSlide(targetIdx);
        }
      }
    }
  };

  // Histórico falso para o botão voltar do celular fechar modais
  useEffect(() => {
    if (isCartOpen || selectedProduct) {
      window.history.pushState({ modalOpen: true }, '');
    }
  }, [isCartOpen, selectedProduct]);

  useEffect(() => {
    const handlePopState = () => {
      if (isCartOpen) {
        setIsCartOpen(false);
      } else if (selectedProduct) {
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCartOpen, selectedProduct]);

  // Sincronização do rastreamento em tempo real
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('nuu_customer_last_order_id');
      if (savedId) {
        const found = orders.find(o => String(o.id) === String(savedId));
        if (found) {
          if (!activeTrackingOrder || String(activeTrackingOrder.id) !== String(found.id) || activeTrackingOrder.status !== found.status) {
            setActiveTrackingOrder(found);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Se mudar de categoria, reinicia o slide ativo
  useEffect(() => {
    setActiveSlide(0);
  }, [selectedCategory]);

  const officialPixKey = storeSettings?.pixKey || 'pix@nuuprensado.com';

  const handleCopyPix = () => {
    try {
      navigator.clipboard.writeText(officialPixKey);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    } catch (e) {
      console.warn('Erro ao copiar chave pix', e);
    }
  };

  // Navegação do Slider
  const nextSlide = () => setActiveSlide((prev) => (prev === visualProducts.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? visualProducts.length - 1 : prev - 1));

  // Swipe Reels no Mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceY = touchStart.y - touchEnd.y;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(touchStart.x - touchEnd.x);

    if (isVerticalSwipe) {
      if (isUpSwipe) {
        nextSlide();
      } else if (isDownSwipe) {
        prevSlide();
      }
    }
  };

  // Lógica de Abertura do Produto
  const handleOpenProduct = (product) => {
    if (!product.active) return;
    setSelectedProduct(product);
    setProductQty(1);
    setItemNotes('');
    setSelectedExtras([]);
    setSelectedSide(false);

    const activeBread = breadOptions.find(b => b.active);
    setSelectedBread(activeBread ? activeBread.name : (breadOptions[0]?.name || 'Pão tradicional'));

    const activeCreamy = creamyOptions.find(c => c.active);
    setSelectedCreamy(activeCreamy ? activeCreamy.name : (creamyOptions[0]?.name || 'Catupiry'));

    const activeMelted = meltedOptions.find(c => c.active);
    setSelectedMelted(activeMelted ? activeMelted.name : (meltedOptions[0]?.name || 'Mussarela'));
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedProduct.active) return;

    let nameDetails = [];
    if (selectedProduct.hasCustomOptions) {
      if (selectedBread) nameDetails.push(selectedBread);
      if (selectedCreamy) nameDetails.push(selectedCreamy);
      if (selectedSide) {
        const sideName = sideOptions[0]?.name || 'Vinagrete';
        nameDetails.push(`+ ${sideName}`);
      }
    }

    activeSelectedExtras.forEach(extra => {
      nameDetails.push(`+ ${extra.name}`);
    });

    const itemName = selectedProduct.name + (nameDetails.length > 0 ? ` (${nameDetails.join(' | ')})` : '');
    const finalUnitPrice = currentUnitPrice;

    const existingIndex = cart.findIndex(item => item.name === itemName && item.notes === itemNotes);
    
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += productQty;
      setCart(updated);
    } else {
      setCart([...cart, { 
        productId: selectedProduct.id, 
        name: itemName, 
        price: finalUnitPrice, 
        quantity: productQty,
        notes: itemNotes.trim() || null
      }]);
    }
    
    setSelectedProduct(null);
    setItemNotes('');
    setIsCartOpen(true);
  };

  const updateCartQty = (index, amount) => {
    const updated = [...cart];
    updated[index].quantity += amount;
    if (updated[index].quantity <= 0) updated.splice(index, 1);
    setCart(updated);
  };

  // Cálculos de Totais
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // O preço da taxa de delivery só é calculado e exibido após o preenchimento real do endereço completo (Rua, Número e Bairro)
  const isDeliveryAddressProvided = Boolean(
    addressStreet.trim() && 
    addressNumber.trim() && 
    addressNeighborhood.trim()
  );

  const deliveryFeeResult = deliveryType === 'delivery' 
    ? (isDeliveryAddressProvided
        ? calculateDeliveryFee({ 
            neighborhoodName: addressNeighborhood || selectedNeighborhood, 
            distanceKm: selectedDistanceKm,
            subtotal: cartTotal 
          })
        : { fee: 0, isFree: false, pending: true, reason: 'Aguardando preenchimento do endereço' })
    : { fee: 0, isFree: true, pending: false, reason: 'Retirada no Balcão' };

  const deliveryFee = typeof deliveryFeeResult === 'number'
    ? deliveryFeeResult
    : (Number(deliveryFeeResult?.fee) || 0);

  // Cálculo de desconto por cupom
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'fixed') {
      couponDiscount = Math.min(cartTotal, appliedCoupon.discount || 0);
    } else if (appliedCoupon.type === 'percent') {
      couponDiscount = (cartTotal * (appliedCoupon.discount || 0)) / 100;
    }
  }

  const totalDiscount = couponDiscount + loyaltyDiscount;
  const grandTotal = Math.max(0, cartTotal + deliveryFee - totalDiscount);

  // Aplicação de Cupom
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = validateCoupon(inputCoupon.trim(), cartTotal);
    if (res.valid) {
      setAppliedCoupon(res.coupon);
      setCouponFeedback({ success: true, message: `Cupom ${res.coupon.code} aplicado com sucesso!` });
    } else {
      setAppliedCoupon(null);
      setCouponFeedback({ success: false, message: res.message });
    }
  };

  // Identificação do Cliente por WhatsApp
  const handleLookupPhone = (e) => {
    e?.preventDefault();
    const clean = (customerSearchPhone || phone).replace(/\D/g, '');
    if (clean.length < 10) {
      showSiteAlert(
        'Número Inválido',
        'Digite um número de telefone/WhatsApp válido com DDD (mínimo 10 dígitos, ex: 38 99999-8888).',
        'warning'
      );
      return;
    }
    const found = lookupCustomer(clean);
    if (found) {
      setIdentifiedCustomer(found);
      setCustomerName(found.name || '');
      setPhone(found.phone || clean);
      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: false }));
      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: false }));

      // Popula campos estruturados se existirem
      if (found.addressStreet) {
        setAddressStreet(found.addressStreet);
        setFormErrors(prev => ({ ...prev, street: false }));
      }
      if (found.addressNumber) {
        setAddressNumber(found.addressNumber);
        setFormErrors(prev => ({ ...prev, number: false }));
      }
      if (found.addressComplement) {
        setAddressComplement(found.addressComplement);
      }
      if (found.addressNeighborhood) {
        setAddressNeighborhood(found.addressNeighborhood);
        setSelectedNeighborhood(found.addressNeighborhood);
        setFormErrors(prev => ({ ...prev, neighborhood: false }));
      } else if (found.neighborhood) {
        setAddressNeighborhood(found.neighborhood);
        setSelectedNeighborhood(found.neighborhood);
        setFormErrors(prev => ({ ...prev, neighborhood: false }));
      }

      // Se tiver endereço em string única antiga, faz parse inteligente
      if (!found.addressStreet && found.address) {
        const parsed = parseAddressString(found.address);
        if (parsed.street) {
          setAddressStreet(parsed.street);
          setFormErrors(prev => ({ ...prev, street: false }));
        }
        if (parsed.number) {
          setAddressNumber(parsed.number);
          setFormErrors(prev => ({ ...prev, number: false }));
        }
        if (parsed.complement) {
          setAddressComplement(parsed.complement);
        }
        if (parsed.neighborhood) {
          setAddressNeighborhood(parsed.neighborhood);
          setSelectedNeighborhood(parsed.neighborhood);
          setFormErrors(prev => ({ ...prev, neighborhood: false }));
        }
      }

      // Salva sessão conectada do cliente
      const sessionObj = { phone: clean, name: (found.name || '').trim() || 'Cliente' };
      setLoggedCustomer(sessionObj);
      try {
        localStorage.setItem('nuu_customer_session', JSON.stringify(sessionObj));
      } catch (err) {}

      showSiteAlert(
        'Cliente Encontrado! 🎉',
        `Bem-vindo de volta, ${found.name || 'Cliente'}! Seus dados foram preenchidos automaticamente.`,
        'success',
        'Clube Fidelidade'
      );
    } else {
      setPhone(clean);
      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: false }));
      const sessionObj = { phone: clean, name: (customerName || '').trim() || 'Cliente' };
      setLoggedCustomer(sessionObj);
      try {
        localStorage.setItem('nuu_customer_session', JSON.stringify(sessionObj));
      } catch (err) {}

      showSiteAlert(
        'Novo Cadastro! 🌭',
        'Telefone registrado com sucesso! Finalize seu primeiro pedido para acumular selos no Cartão Fidelidade Nuu Prensado.',
        'info',
        'Clube Fidelidade'
      );
    }
  };

  // Resgate de Fidelidade
  const handleApplyLoyaltyReward = () => {
    const rewardVal = storeSettings?.loyalty?.rewardValue || 20;
    setLoyaltyDiscount(rewardVal);
    showSiteAlert(
      'Recompensa Aplicada! 🎉',
      `Parabéns! Recompensa fidelidade de R$ ${rewardVal.toFixed(2)} aplicada no seu pedido!`,
      'success',
      'Desconto Ativado'
    );
  };

  // Envio do Pedido
  const handleSubmitOrder = (e, onlinePaymentData = null) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!isStoreOpen) {
      if (pauseStatus.isPaused) {
        showSiteAlert(
          'Cozinha em Pausa Temporária',
          `⏸️ A cozinha está em pausa temporária para dar vazão aos pedidos em preparo (retornamos em cerca de ${pauseStatus.remainingMinutes} minutos). Por favor, aguarde alguns instantes para concluir!`,
          'warning'
        );
      } else {
        showSiteAlert(
          'Loja Fechada',
          storeSettings?.closedNotice || 'No momento a loja está fechada para novos pedidos.',
          'warning'
        );
      }
      return;
    }

    if (cart.length === 0) {
      showSiteAlert(
        'Carrinho Vazio',
        'Seu carrinho está vazio. Adicione itens antes de finalizar o pedido!',
        'warning'
      );
      return;
    }

    // Validação com destaque em vermelho e direcionamento para a etapa correta do Quiz
    const errors = {};
    let firstErrorRef = null;
    let firstErrorMessage = '';

    if (!customerName.trim()) {
      errors.name = true;
      if (!firstErrorRef) {
        setQuizStep(1);
        firstErrorRef = nameInputRef;
        firstErrorMessage = 'Por favor, informe seu nome completo para identificação do pedido.';
      }
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.phone = true;
      if (!firstErrorRef) {
        setQuizStep(1);
        firstErrorRef = phoneInputRef;
        firstErrorMessage = 'Por favor, informe seu número de WhatsApp com DDD (mínimo 10 dígitos, ex: 38 99999-8888).';
      }
    }

    if (deliveryType === 'delivery') {
      if (!addressStreet.trim()) {
        errors.street = true;
        if (!firstErrorRef) {
          setQuizStep(2);
          firstErrorRef = streetInputRef;
          firstErrorMessage = 'Por favor, preencha o nome da sua Rua ou Avenida para entrega.';
        }
      }

      if (!addressNumber.trim()) {
        errors.number = true;
        if (!firstErrorRef) {
          setQuizStep(2);
          firstErrorRef = numberInputRef;
          firstErrorMessage = 'Por favor, preencha o número do local da entrega.';
        }
      }

      if (!addressNeighborhood.trim()) {
        errors.neighborhood = true;
        if (!firstErrorRef) {
          setQuizStep(2);
          firstErrorRef = neighborhoodInputRef;
          firstErrorMessage = 'Por favor, informe o bairro para entrega em Montes Claros.';
        }
      }
    }

    // Se houver algum campo obrigatório faltando, rola suavemente até ele e foca intuitivamente
    if (firstErrorRef) {
      setFormErrors(errors);
      firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        firstErrorRef.current?.focus();
      }, 250);
      showSiteAlert(
        'Informação Faltando',
        firstErrorMessage,
        'warning'
      );
      return;
    }

    // Monta o endereço formatado oficial de Montes Claros/MG
    const formattedAddress = deliveryType === 'delivery'
      ? `${addressStreet.trim()}, nº ${addressNumber.trim()}${addressComplement.trim() ? `, ${addressComplement.trim()}` : ''}, Bairro ${addressNeighborhood.trim()} - Montes Claros/MG`
      : 'Retirada no Balcão';

    const isOnlinePaid = Boolean(onlinePaymentData && onlinePaymentData.status === 'approved');
    const finalPayment = isOnlinePaid
      ? (onlinePaymentData.method || paymentMethod)
      : (paymentMethod === 'Dinheiro' && changeFor 
          ? `Dinheiro (Troco p/ R$ ${changeFor})` 
          : paymentMethod);

    const cleanCartItems = Array.isArray(cart) ? cart.map(it => ({
      productId: Number(it.productId) || it.productId || 1,
      name: it.name || 'Lanche',
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      notes: it.notes ? String(it.notes).trim() : null
    })) : [];

    const created = createOrder({
      customerName: (customerName || '').trim(), 
      phone: cleanPhone || '', 
      type: deliveryType || 'delivery', 
      address: formattedAddress,
      neighborhood: deliveryType === 'delivery' ? (addressNeighborhood ? addressNeighborhood.trim() : '') : null,
      distanceKm: deliveryType === 'delivery' ? (selectedDistanceKm || null) : null,
      paymentMethod: finalPayment || 'Pix',
      paymentStatus: isOnlinePaid ? 'paid' : 'pending',
      paymentProvider: isOnlinePaid ? 'mercadopago' : 'manual',
      paymentId: onlinePaymentData?.paymentId || null,
      paymentDetails: onlinePaymentData ? JSON.parse(JSON.stringify(onlinePaymentData, (k, v) => v === undefined ? null : v)) : null,
      paidAt: isOnlinePaid ? new Date().toISOString() : null,
      changeFor: (paymentMethod === 'Dinheiro' && changeFor) ? changeFor : null,
      items: cleanCartItems, 
      deliveryFee: parseFloat(Number(deliveryFee || 0).toFixed(2)),
      discount: parseFloat(Number(totalDiscount || 0).toFixed(2)),
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      total: parseFloat(Number(grandTotal || 0).toFixed(2))
    });

    // Salva ou atualiza a memória do cliente e adiciona selo de fidelidade
    saveCustomer({
      phone: cleanPhone,
      name: customerName.trim(),
      address: formattedAddress,
      addressStreet: addressStreet.trim(),
      addressNumber: addressNumber.trim(),
      addressComplement: addressComplement.trim(),
      addressNeighborhood: addressNeighborhood.trim(),
      neighborhood: deliveryType === 'delivery' ? addressNeighborhood.trim() : (identifiedCustomer?.neighborhood || '')
    });

    // Salva sessão persistente do cliente conectado
    const sessionObj = { phone: cleanPhone, name: customerName.trim() };
    setLoggedCustomer(sessionObj);
    try {
      localStorage.setItem('nuu_customer_session', JSON.stringify(sessionObj));
    } catch (err) {}

    setCart([]);
    setAppliedCoupon(null);
    setLoyaltyDiscount(0);
    setActiveTrackingOrder(created);
    setTrackingBannerDismissed(false);
    try {
      localStorage.setItem('nuu_customer_last_order_id', created.id.toString());
    } catch (e) {}
    setCheckoutStep('tracking');
    setIsCartOpen(false);
  };

  const getStatusStepClass = (currentStatus, targetStatus) => {
    const statusPriority = {
      'pending': 1,
      'preparing': 2,
      'shipping': 3,
      'delivered': 4
    };
    const currentLevel = statusPriority[currentStatus] || 1;
    const targetLevel = statusPriority[targetStatus];
    return currentLevel >= targetLevel ? 'step-active' : 'step-inactive';
  };

  if (!products || products.length === 0) {
    return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Carregando cardápio...</div>;
  }

  const activeProduct = visualProducts.length > 0 ? (visualProducts[activeSlide] || visualProducts[0]) : null;

  const backgroundColor = checkoutStep !== 'menu' ? 'var(--bg-primary)' 
                        : viewMode === 'grid' ? '#121212'
                        : (activeProduct ? activeProduct.color : '#121212');

  // Categoria ativa a ser destacada nas pills
  const activePillId = viewMode === 'slider'
    ? (selectedCategory === 'todos' ? (activeProduct?.category || 'todos') : selectedCategory)
    : selectedCategory;

  return (
    <div 
      className={`app-container ${viewMode === 'slider' ? 'is-slider-mode' : 'is-grid-mode'}`}
      ref={mainContainerRef}
      style={{ 
        backgroundColor: backgroundColor,
        transition: 'background-color 0.8s ease-in-out',
        scrollBehavior: 'smooth',
        height: (checkoutStep === 'menu' && viewMode === 'slider') ? '100dvh' : 'auto',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: (checkoutStep === 'menu' && viewMode === 'slider') ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: (isCartOpen || selectedProduct || previewImageModal || siteModal) ? 99999 : 1,
        overflowY: (checkoutStep === 'menu' && viewMode === 'slider') ? 'hidden' : 'visible', 
        overflowX: 'hidden'
      }}
    >
      {/* BANNER DE STATUS DA LOJA (DESKTOP - ABAIXO DA BARRA SUPERIOR OFICIAL) */}
      {pauseStatus.isPaused && checkoutStep === 'menu' ? (
        <div 
          className="desktop-only-banner"
          style={{
            backgroundColor: '#b45309',
            color: '#fff',
            padding: '10px 16px',
            fontSize: '0.84rem',
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 10,
            boxShadow: '0 2px 14px rgba(180, 83, 9, 0.5)'
          }}
        >
          <Clock size={17} />
          <span>
            ⏸️ <strong>Cozinha em Pausa Temporária:</strong> {pauseStatus.pauseReason || 'Muitos pedidos sendo preparados no momento'}. Retomamos os pedidos em aproximadamente <strong>{pauseStatus.remainingMinutes} min</strong>!
          </span>
        </div>
      ) : !isStoreOpen && checkoutStep === 'menu' ? (
        <div 
          className="desktop-only-banner"
          style={{
            background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.22) 0%, rgba(180, 83, 9, 0.26) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#fef08a',
            padding: '8px 16px',
            fontSize: '0.80rem',
            fontWeight: 600,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
          }}
        >
          <Clock size={15} color="#fbbf24" />
          <span>
            {storeSettings?.closedNotice || 'Loja fechada no momento para novos pedidos.'} 
            {` • Atendimento: Terça a Domingo das ${displayOpenTime} às ${displayCloseTime}`}
          </span>
        </div>
      ) : null}

      {/* BARRA DE CATEGORIAS EXCLUSIVA PARA DESKTOP (ESTÁTICA, NUNCA COBRE CONTEÚDO) */}
      {checkoutStep === 'menu' && (
        <div 
          className="desktop-category-bar"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            width: '100%',
            padding: '16px 1.5rem 0 1.5rem',
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
          {categoriesList.map(cat => {
            const isSelected = activePillId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '99px',
                  border: isSelected ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: isSelected ? '#eab308' : 'rgba(0,0,0,0.45)',
                  color: isSelected ? '#000' : '#fff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 14px rgba(234, 179, 8, 0.45)' : 'none'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* NOVO: CONTROLES FLUTUANTES PARA MOBILE (OCULTO NO DESKTOP) */}
      {checkoutStep === 'menu' && (
        <div 
          className="mobile-floating-header" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: viewMode === 'grid' ? '8px' : '12px', 
            padding: viewMode === 'grid' ? '10px 16px 8px 16px' : '12px 16px',
            backgroundColor: viewMode === 'grid' ? 'rgba(18, 18, 18, 0.95)' : 'transparent',
            backdropFilter: viewMode === 'grid' ? 'blur(12px)' : 'none',
            borderBottom: viewMode === 'grid' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
            transition: 'background-color 0.3s ease, border-color 0.3s ease'
          }}
        >
          <div 
            className="mobile-header-top-row"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/logoNuuPrensado-semfundo.png" 
                alt="Nuu Prensado Logo" 
                style={{ 
                  height: '42px', 
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
                }} 
              />
              {/* Badge de Horário / Status */}
              <div 
                onClick={() => {
                  if (!isStoreOpen && !pauseStatus.isPaused) {
                    setClosedNoticeDismissed(false);
                  }
                }}
                title={!isStoreOpen && !pauseStatus.isPaused ? "Clique para ver detalhes do horário" : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  backgroundColor: pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.18)' : isStoreOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.5)' : isStoreOpen ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  color: pauseStatus.isPaused ? '#fef08a' : isStoreOpen ? '#4ade80' : '#f87171',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: (!isStoreOpen && !pauseStatus.isPaused) ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: pauseStatus.isPaused ? '#f59e0b' : isStoreOpen ? '#22c55e' : '#ef4444'
                }} />
                <span>
                  {pauseStatus.isPaused 
                    ? `Pausada • Volta em ~${pauseStatus.remainingMinutes} min` 
                    : isStoreOpen 
                      ? 'Aberto' 
                      : (() => {
                          const openDays = storeSettings?.openDays || ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
                          const now = new Date();
                          const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
                          const currentDay = days[now.getDay()];
                          const [openH, openM] = (storeSettings?.openTime || '18:00').split(':').map(Number);
                          const nowMins = now.getHours() * 60 + now.getMinutes();
                          const openMins = openH * 60 + (openM || 0);

                          if (openDays.includes(currentDay) && nowMins < openMins) {
                            return `Fechado • Abre às ${storeSettings?.openTime || '18:00'}`;
                          }
                          if (currentDay === 'seg') {
                            return `Fechado • Abre Terça às ${storeSettings?.openTime || '18:00'}`;
                          }
                          if (currentDay === 'dom' && nowMins >= openMins) {
                            return `Fechado • Abre Terça às ${storeSettings?.openTime || '18:00'}`;
                          }
                          return `Fechado • Abre amanhã às ${storeSettings?.openTime || '18:00'}`;
                        })()}
                </span>
              </div>
            </div>
            
            {/* Controles da direita (Perfil/Login, Acompanhar Pedido, Grade e Carrinho) */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Botão de Perfil / Login / Meus Pedidos */}
              <button 
                onClick={() => {
                  if (loggedCustomer) {
                    setCustomerModalTab('orders');
                  } else {
                    setCustomerModalTab('login');
                  }
                  setIsCustomerModalOpen(true);
                }}
                style={{ 
                  background: loggedCustomer ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0,0,0,0.4)', 
                  border: loggedCustomer ? '1px solid rgba(234, 179, 8, 0.45)' : '1px solid rgba(255,255,255,0.15)', 
                  color: loggedCustomer ? '#facc15' : '#fff', 
                  borderRadius: '99px', 
                  padding: '6px 11px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  fontSize: '0.74rem', 
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(5px)'
                }}
                title={loggedCustomer ? `Conectado como ${loggedCustomer.name}` : "Entrar ou ver Meus Pedidos"}
              >
                <User size={14} color={loggedCustomer ? '#facc15' : '#fff'} />
                <span style={{ maxWidth: '95px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loggedCustomer ? (loggedCustomer.name?.split(' ')[0] || 'Conta') : 'Entrar'}
                </span>
              </button>

              {/* Botão de Pedido em Acompanhamento */}
              {activeTrackingOrder && (
                <button 
                  onClick={() => setCheckoutStep('tracking')}
                  style={{ 
                    background: activeTrackingOrder.status === 'canceled'
                      ? 'rgba(239, 68, 68, 0.25)'
                      : activeTrackingOrder.status === 'delivered'
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'rgba(234, 179, 8, 0.25)', 
                    border: activeTrackingOrder.status === 'canceled'
                      ? '1px solid #ef4444'
                      : activeTrackingOrder.status === 'delivered'
                        ? '1px solid #22c55e'
                        : '1px solid #eab308', 
                    color: activeTrackingOrder.status === 'canceled'
                      ? '#ef4444'
                      : activeTrackingOrder.status === 'delivered'
                        ? '#4ade80'
                        : '#eab308', 
                    borderRadius: '99px', 
                    padding: '6px 10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '0.74rem', 
                    fontWeight: 700,
                    cursor: 'pointer' 
                  }}
                  title={activeTrackingOrder.status === 'canceled' ? 'Pedido Cancelado' : 'Acompanhar Pedido ao Vivo'}
                >
                  {activeTrackingOrder.status === 'canceled' ? (
                    <XCircle size={13} color="#ef4444" />
                  ) : activeTrackingOrder.status === 'delivered' ? (
                    <CheckCircle2 size={13} color="#4ade80" />
                  ) : (
                    <Clock size={13} color="#eab308" />
                  )}
                  <span>#{activeTrackingOrder.id}</span>
                </button>
              )}

              {/* Botão de Alternar Slider / Grade (disponível quando isImmersiveEnabled = true) */}
              {isImmersiveEnabled && (
                <button 
                  onClick={() => setViewMode(prev => prev === 'slider' ? 'grid' : 'slider')}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer' }}
                  title={viewMode === 'slider' ? 'Visualizar em Grade' : 'Visualizar em Slider'}
                >
                  {viewMode === 'slider' ? <LayoutGrid size={18} /> : <MonitorPlay size={18} />}
                </button>
              )}
              
              {/* Botão Carrinho */}
              <button 
                onClick={() => setIsCartOpen(true)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer', position: 'relative' }}
              >
                <ShoppingBag size={18} />
                {cart.length > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#eab308', color: '#000', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* BANNER DE STATUS DA LOJA (MOBILE - ABAIXO DA LOGO / TOPO) */}
          {pauseStatus.isPaused ? (
            <div 
              className="mobile-only-banner"
              style={{
                backgroundColor: '#b45309',
                color: '#fff',
                padding: '8px 14px',
                fontSize: '0.80rem',
                fontWeight: 700,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(180, 83, 9, 0.4)'
              }}
            >
              <Clock size={16} />
              <span>
                ⏸️ <strong>Cozinha em Pausa Temporária:</strong> {pauseStatus.pauseReason || 'Muitos pedidos sendo preparados no momento'}. Retomamos em aproximadamente <strong>{pauseStatus.remainingMinutes} min</strong>!
              </span>
            </div>
          ) : !isStoreOpen ? (
            <div 
              className="mobile-only-banner"
              style={{
                background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.28) 0%, rgba(180, 83, 9, 0.32) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fef08a',
                padding: '8px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
              }}
            >
              <Clock size={14} color="#fbbf24" />
              <span>
                {storeSettings?.closedNotice || 'Loja fechada no momento para novos pedidos.'} 
                {` • Atendimento: Terça a Domingo das ${displayOpenTime} às ${displayCloseTime}`}
              </span>
            </div>
          ) : null}

          {/* BARRA DE CATEGORIAS (PILLS HORIZONTAIS) */}
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '6px',
            marginTop: '4px',
            width: '100%',
            scrollbarWidth: 'none'
          }}>
            {categoriesList.map(cat => {
              const isSelected = activePillId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    border: isSelected ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: isSelected ? '#eab308' : 'rgba(0,0,0,0.45)',
                    color: isSelected ? '#000' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 14px rgba(234, 179, 8, 0.45)' : 'none'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TOAST DE ENTRADA EM NOVA CATEGORIA */}
      {checkoutStep === 'menu' && categoryToast && (
        <div 
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 250,
            backgroundColor: 'rgba(15, 15, 15, 0.94)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${categoryToast.accentColor}`,
            boxShadow: `0 8px 30px rgba(0,0,0,0.7), 0 0 20px ${categoryToast.accentColor}40`,
            padding: '8px 20px',
            borderRadius: '99px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fff',
            animation: 'fadeInDown 0.35s ease'
          }}
        >
          <Sparkles size={16} color={categoryToast.accentColor} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
            Você entrou em: <strong style={{ color: categoryToast.accentColor }}>{categoryToast.icon} {categoryToast.label}</strong>
          </span>
        </div>
      )}

      {/* TELA PRINCIPAL (SLIDER IMERSIVO) */}
      {checkoutStep === 'menu' && viewMode === 'slider' && (
        visualProducts.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3>Nenhum item nesta categoria</h3>
            <button onClick={() => handleSelectCategory('todos')} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              Ver Todos os Produtos
            </button>
          </div>
        ) : activeProduct && (
          <div 
            className="immersive-slider" 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem 2rem 3rem', position: 'relative', height: 'calc(100vh - 110px)' }}
          >
            {/* Indicadores Laterais */}
            <div className="slider-indicator" style={{ position: 'absolute', bottom: '2rem', left: '3rem', color: 'rgba(255,255,255,0.85)', zIndex: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: activeProduct.categoryMeta.accentColor, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{activeProduct.categoryMeta.icon}</span>
                <span>{activeProduct.categoryMeta.shortLabel}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '2px' }}>
                00{activeProduct.categoryRank} / 00{activeProduct.categoryTotal}
              </div>
            </div>

            <div className="slider-nav-dots" style={{ position: 'absolute', left: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
              {visualProducts.map((_, i) => (
                <div key={i} onClick={() => setActiveSlide(i)} className={`dot ${i === activeSlide ? 'active' : ''}`} style={{ width: i === activeSlide ? '12px' : '8px', height: i === activeSlide ? '12px' : '8px', borderRadius: '50%', backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: '0.3s' }} />
              ))}
            </div>

            {/* Área Central: Imagem do Produto e Badge Superior */}
            <div className="slider-image-area" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {activeProduct.floaties.map((icon, i) => (
                <div 
                  key={i} 
                  className={`float-element delay-${i}`} 
                  style={{ 
                    position: 'absolute', 
                    fontSize: '3.5rem', 
                    opacity: 0.85, 
                    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))',
                    top: i === 0 ? '12%' : i === 1 ? '68%' : '22%', 
                    left: i === 0 ? '22%' : i === 1 ? '28%' : '68%' 
                  }}
                >
                  {icon}
                </div>
              ))}
              
              {/* IMAGEM PRINCIPAL DO PRODUTO (Proporção 4:3 mantida) */}
              <div className="product-image-container animate-product-enter" key={activeProduct.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* BADGE DE CATEGORIA NO TOPO DO SLIDE */}
                <div 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 14px',
                    borderRadius: '99px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${activeProduct.categoryMeta.accentColor}80`,
                    boxShadow: `0 4px 15px rgba(0,0,0,0.5), 0 0 12px ${activeProduct.categoryMeta.accentColor}30`,
                    marginBottom: '10px',
                    zIndex: 25
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{activeProduct.categoryMeta.icon}</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    color: activeProduct.categoryMeta.accentColor
                  }}>
                    {activeProduct.categoryMeta.label}
                  </span>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'rgba(255,255,255,0.75)', 
                    fontWeight: 700,
                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                    paddingLeft: '8px'
                  }}>
                    {activeProduct.categoryRank} de {activeProduct.categoryTotal}
                  </span>
                </div>

                <div 
                  className="product-circle product-mockup" 
                  style={{ 
                    width: '480px', 
                    maxWidth: '90vw',
                    aspectRatio: '4 / 3', 
                    height: 'auto', 
                    borderRadius: '24px', 
                    backgroundColor: '#0a0a0a', 
                    boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 35px ${activeProduct.color}35`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: 0, 
                    backdropFilter: 'blur(10px)', 
                    border: '3px solid rgba(255,255,255,0.25)', 
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <img 
                    src={activeProduct.image} 
                    alt={activeProduct.name} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Painel Direito: Informações e Pedido */}
            <div className="slider-info-panel animate-fade-in" key={`info-${activeProduct.id}`} style={{ width: '380px', color: '#fff', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', color: activeProduct.categoryMeta.accentColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{activeProduct.categoryMeta.icon}</span>
                <span>{activeProduct.categoryMeta.label}</span>
              </div>
              
              <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.05, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {activeProduct.name}
              </h1>

              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                {activeProduct.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>
                  R$ {activeProduct.price.toFixed(2)}
                </span>
                
                <button 
                  onClick={() => handleOpenProduct(activeProduct)}
                  className="btn-primary" 
                  style={{ 
                    padding: '12px 28px', 
                    fontSize: '1rem', 
                    backgroundColor: isStoreOpen ? '#fff' : 'rgba(255, 255, 255, 0.16)', 
                    color: isStoreOpen ? '#000' : '#fff', 
                    border: isStoreOpen ? 'none' : '1px solid rgba(255, 255, 255, 0.35)',
                    backdropFilter: isStoreOpen ? 'none' : 'blur(8px)',
                    WebkitBackdropFilter: isStoreOpen ? 'none' : 'blur(8px)',
                    fontWeight: 800,
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    opacity: 1
                  }}
                >
                  {isStoreOpen ? 'Pedir Agora' : pauseStatus.isPaused ? `Pausada (~${pauseStatus.remainingMinutes} min)` : 'Ver Ingredientes'}
                </button>
              </div>

              {/* AVISO DE PRÓXIMA CATEGORIA AO FIM DA LISTA */}
              {activeProduct.isLastOfCategory && activeProduct.nextCategoryMeta && (
                <button
                  onClick={nextSlide}
                  style={{
                    marginTop: '8px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    border: `1px solid ${activeProduct.nextCategoryMeta.accentColor}60`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${activeProduct.nextCategoryMeta.accentColor}25`;
                    e.currentTarget.style.borderColor = activeProduct.nextCategoryMeta.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.45)';
                    e.currentTarget.style.borderColor = `${activeProduct.nextCategoryMeta.accentColor}60`;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{activeProduct.nextCategoryMeta.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                      A seguir: <strong style={{ color: activeProduct.nextCategoryMeta.accentColor }}>{activeProduct.nextCategoryMeta.label}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: activeProduct.nextCategoryMeta.accentColor, fontWeight: 700 }}>
                    <span>Avançar</span>
                    <ChevronDown size={14} />
                  </div>
                </button>
              )}
            </div>

            {/* Setas para passar slide */}
            <div className="slider-nav-arrows" style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
              <button onClick={prevSlide} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(5px)' }}><ChevronUp size={24} /></button>
              <button onClick={nextSlide} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(5px)' }}><ChevronDown size={24} /></button>
            </div>
          </div>
        )
      )}

      {/* TELA DE GRADE (GRID VIEW ORGANIZADA POR SEÇÕES) */}
      {checkoutStep === 'menu' && viewMode === 'grid' && (
        <div 
          className="grid-view-container animate-fade-in-up" 
          style={{ 
            maxWidth: '1240px',
            margin: '0 auto',
            width: '100%',
            padding: '1.25rem 1.5rem 6rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem'
          }}
        >
          {gridCategorySections.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '3rem' }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3>Nenhum produto cadastrado nesta categoria</h3>
              <button 
                onClick={() => handleSelectCategory('todos')} 
                className="btn-primary" 
                style={{ marginTop: '1rem', fontSize: '0.85rem' }}
              >
                Ver Todas as Categorias
              </button>
            </div>
          ) : (
            (selectedCategory === 'todos' 
              ? gridCategorySections 
              : gridCategorySections.filter(s => s.id === selectedCategory)
            ).map((section) => (
              <section 
                key={section.id} 
                id={`secao-categoria-${section.id}`}
                style={{ 
                  scrollMarginTop: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                {/* Cabeçalho da Categoria na Grade */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '1rem 1.5rem',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderLeft: `5px solid ${section.accentColor}`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      fontSize: '1.8rem',
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: `${section.accentColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${section.accentColor}40`
                    }}>
                      {section.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                          {section.label}
                        </h2>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: section.accentColor,
                          backgroundColor: `${section.accentColor}20`,
                          padding: '3px 10px',
                          borderRadius: '99px',
                          border: `1px solid ${section.accentColor}40`
                        }}>
                          {section.products.length} {section.products.length === 1 ? 'opção' : 'opções'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                        {section.description}
                      </p>
                    </div>
                  </div>
                  {selectedCategory !== 'todos' && (
                    <button
                      onClick={() => handleSelectCategory('todos')}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '99px' }}
                    >
                      Ver todas as categorias
                    </button>
                  )}
                </div>

                {/* Grade de Cards da Categoria */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  alignItems: 'stretch'
                }}>
                  {section.products.map(product => {
                    const themes = {
                      1: { color: '#eab308', floaties: ['🥓', '🌭', '🧀'] },
                      2: { color: '#f97316', floaties: ['🍗', '🧀', '🔥'] },
                      3: { color: '#b91c1c', floaties: ['🥩', '🔥', '🥓'] },
                      4: { color: '#84cc16', floaties: ['🍖', '🌿', '🔥'] },
                      5: { color: '#a16207', floaties: ['🥩', '🧀', '🔥'] },
                      6: { color: '#dc2626', floaties: ['🥤', '🧊', '✨'] },
                      7: { color: '#16a34a', floaties: ['🥤', '🌿', '✨'] },
                      8: { color: '#b91c1c', floaties: ['🥤', '🧊', '✨'] },
                      9: { color: '#eab308', floaties: ['🍊', '🥤', '🧊'] },
                      10: { color: '#2563eb', floaties: ['💧', '🧊', '✨'] },
                      11: { color: '#ca8a04', floaties: ['🍟', '🔥', '🧂'] },
                    };
                    const theme = themes[product.id] || { color: section.accentColor, floaties: ['✨', section.icon, '🍔'] };
                    const isPaused = !product.active;

                    return (
                      <div 
                        key={product.id} 
                        className="grid-card"
                        style={{ 
                          background: 'rgba(255,255,255,0.03)', 
                          border: `1px solid rgba(255,255,255,0.1)`, 
                          borderTop: `4px solid ${isPaused ? '#6b7280' : theme.color}`,
                          borderRadius: '16px', 
                          padding: '1.5rem', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          textAlign: 'center', 
                          color: '#fff',
                          opacity: isPaused ? 0.65 : 1,
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Foto Real do Produto na Grade */}
                        <div 
                          className="grid-card-image"
                          onClick={() => {
                            if (product.image) {
                              setPreviewImageModal({ url: product.image, title: product.name });
                            }
                          }}
                          style={{ 
                            width: '100%', 
                            height: '200px', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            marginBottom: '1.25rem',
                            position: 'relative',
                            backgroundColor: 'transparent',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: product.image ? 'pointer' : 'default'
                          }}
                          title={product.image ? 'Clique para ampliar a foto' : ''}
                        >
                          {product.image ? (
                            <>
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                loading="lazy"
                                style={{ 
                                  width: '100%', 
                                  minWidth: '100%',
                                  maxWidth: '100%',
                                  height: '100%', 
                                  minHeight: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'cover', 
                                  objectPosition: 'center', 
                                  display: 'block',
                                  margin: 0,
                                  padding: 0,
                                  border: 'none',
                                  filter: isPaused ? 'grayscale(80%)' : 'none',
                                  transition: 'transform 0.4s ease'
                                }} 
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.85
                              }} title="Ampliar foto">
                                <ZoomIn size={14} />
                              </div>
                            </>
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                              {theme.floaties?.[0] || section.icon}
                            </div>
                          )}
                          
                          {isPaused && (
                            <span 
                              style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                background: 'rgba(239, 68, 68, 0.9)', 
                                backdropFilter: 'blur(6px)', 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                              }}
                            >
                              Esgotado
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
                          {product.name}
                        </h3>
                        
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', marginBottom: '1.25rem', flex: 1 }}>
                          {product.description}
                        </p>

                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '100%', 
                          borderTop: '1px solid rgba(255,255,255,0.08)', 
                          paddingTop: '1rem',
                          gap: '0.75rem'
                        }}>
                          <span style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 800, 
                            color: 'var(--color-brand)',
                            textAlign: 'center'
                          }}>
                            R$ {product.price.toFixed(2)}
                          </span>
                          
                          <button 
                            onClick={() => handleOpenProduct(product)}
                            disabled={isPaused}
                            className="btn-primary"
                            style={{ 
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              padding: '10px 18px', 
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                              cursor: isPaused ? 'not-allowed' : 'pointer',
                              opacity: isPaused ? 0.5 : 1,
                              backgroundColor: (!isStoreOpen && !isPaused) ? 'rgba(255, 255, 255, 0.12)' : undefined,
                              border: (!isStoreOpen && !isPaused) ? '1px solid rgba(255, 255, 255, 0.25)' : undefined,
                              color: (!isStoreOpen && !isPaused) ? '#f8fafc' : undefined,
                              backdropFilter: (!isStoreOpen && !isPaused) ? 'blur(8px)' : undefined,
                              WebkitBackdropFilter: (!isStoreOpen && !isPaused) ? 'blur(8px)' : undefined
                            }}
                          >
                            {isPaused ? 'Esgotado' : isStoreOpen ? 'Pedir' : pauseStatus.isPaused ? `Ver Detalhes (~${pauseStatus.remainingMinutes}m)` : 'Ver Detalhes'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* Rodapé Institucional ao final da rolagem do Cardápio */}
          <footer style={{ 
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-glass)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            <p style={{ margin: 0 }}>© 2026 Nuu Prensado!! - Todos os direitos reservados.</p>
          </footer>
        </div>
      )}

      {/* CHECKOUT EM FORMATO DE QUIZ INTERATIVO */}
      {checkoutStep === 'form' && (
        <div style={{ maxWidth: '540px', margin: '0.75rem auto 3.5rem auto', width: '100%', padding: '0 0.85rem' }} className="animate-fade-in">
          <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
            
            {/* CABEÇALHO DO QUIZ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>Finalizar Pedido</h2>
                <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fde047', fontWeight: 700, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                  Etapa {quizStep}/4
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setCheckoutStep('menu')} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s ease' }}
              >
                <ArrowLeft size={14} /> Voltar ao Cardápio
              </button>
            </div>

            {/* BARRA DE PROGRESSO & STEPPER GAMIFICADO */}
            <div style={{ marginBottom: '0.9rem' }}>
              {/* Barra de progresso contínua */}
              <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                <div style={{
                  height: '100%',
                  width: `${(quizStep / 4) * 100}%`,
                  background: 'linear-gradient(90deg, #eab308 0%, var(--color-brand) 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 8px rgba(234, 179, 8, 0.4)'
                }} />
              </div>

              {/* Indicadores das 4 Etapas do Quiz */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {[
                  { step: 1, label: 'Identificação', icon: User },
                  { step: 2, label: 'Entrega', icon: Bike },
                  { step: 3, label: 'Pagamento', icon: CreditCard },
                  { step: 4, label: 'Confirmação', icon: CheckCircle2 }
                ].map(({ step, label }) => {
                  const isCompleted = quizStep > step;
                  const isCurrent = quizStep === step;
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        if (step < quizStep) {
                          setQuizStep(step);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={step > quizStep}
                      style={{
                        background: isCurrent 
                          ? 'rgba(234, 179, 8, 0.12)' 
                          : isCompleted 
                            ? 'rgba(34, 197, 94, 0.08)' 
                            : 'rgba(255, 255, 255, 0.02)',
                        border: isCurrent 
                          ? '1px solid #eab308' 
                          : isCompleted 
                            ? '1px solid rgba(34, 197, 94, 0.3)' 
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '4px 2px',
                        cursor: step <= quizStep ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCurrent 
                          ? '#eab308' 
                          : isCompleted 
                            ? '#22c55e' 
                            : 'rgba(255, 255, 255, 0.1)',
                        color: isCurrent ? '#000' : '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 800
                      }}>
                        {isCompleted ? <Check size={11} strokeWidth={3} /> : step}
                      </div>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? '#fde047' : isCompleted ? '#4ade80' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTEÚDO DAS ETAPAS DO QUIZ */}
            <form onSubmit={handleSubmitOrder} noValidate>
              
              {/* ETAPA 1: QUEM É VOCÊ? (IDENTIFICAÇÃO & CLUBE FIDELIDADE) */}
              {quizStep === 1 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.15rem 0 0.35rem 0' }}>
                    <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#fff', margin: '0 0 2px 0' }}>
                      Quem é você? 🌭
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Identifique seu pedido e pontue no Clube Fidelidade.
                    </p>
                  </div>

                  {/* SEÇÃO DE LOGIN / MEMÓRIA DO CLIENTE VIA TELEFONE */}
                  <div style={{
                    backgroundColor: 'rgba(234,179,8,0.08)',
                    border: '1px solid rgba(234,179,8,0.25)',
                    borderRadius: '10px',
                    padding: '8px 10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#fde047', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Award size={13} /> Já comprou com a gente? Busque seus dados
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center' }}>
                      <input
                        type="tel"
                        placeholder="DDD + Seu WhatsApp"
                        value={customerSearchPhone}
                        onChange={(e) => setCustomerSearchPhone(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLookupPhone(e);
                          }
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleLookupPhone}
                        style={{
                          backgroundColor: '#eab308',
                          color: '#000',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        <Search size={13} /> Buscar
                      </button>
                    </div>

                    {/* Exibe o Cartão Fidelidade se o cliente for identificado */}
                    {identifiedCustomer && (
                      <div style={{ marginTop: '8px' }}>
                        <LoyaltyCard customer={identifiedCustomer} onApplyReward={handleApplyLoyaltyReward} />
                      </div>
                    )}
                  </div>

                  {/* Campos Principais: Nome e WhatsApp */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    {/* Nome Completo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: formErrors.name ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} color={formErrors.name ? '#ef4444' : 'var(--color-brand-yellow)'} />
                        Seu Nome Completo <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        ref={nameInputRef}
                        type="text" 
                        placeholder="Ex: Carlos Eduardo"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (formErrors.name) setFormErrors(prev => ({ ...prev, name: false }));
                        }}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: formErrors.name ? '2px solid #ef4444' : '1px solid var(--border-glass)',
                          backgroundColor: formErrors.name ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                          boxShadow: formErrors.name ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '0.88rem'
                        }}
                      />
                      {formErrors.name && (
                        <span style={{ color: '#ef4444', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Por favor, informe seu nome completo
                        </span>
                      )}
                    </div>

                    {/* Telefone / WhatsApp */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: formErrors.phone ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={13} color={formErrors.phone ? '#ef4444' : 'var(--color-brand-yellow)'} />
                        WhatsApp com DDD <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        ref={phoneInputRef}
                        type="tel" 
                        placeholder="Ex: (38) 98888-7777"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: false }));
                        }}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: formErrors.phone ? '2px solid #ef4444' : '1px solid var(--border-glass)',
                          backgroundColor: formErrors.phone ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                          boxShadow: formErrors.phone ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '0.88rem'
                        }}
                      />
                      {formErrors.phone && (
                        <span style={{ color: '#ef4444', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Informe seu WhatsApp com DDD (mínimo 10 dígitos)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação do Passo 1 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('menu')}
                      className="btn-secondary"
                      style={{ padding: '9px 14px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ArrowLeft size={14} /> Voltar ao Cardápio
                    </button>
                    <button
                      type="button"
                      onClick={handleNextQuizStep}
                      className="btn-primary"
                      style={{ padding: '10px 18px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 12px rgba(234, 179, 8, 0.25)' }}
                    >
                      Avançar para Entrega <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 2: COMO VOCÊ VAI RECEBER? (DELIVERY OU RETIRADA & ENDEREÇO) */}
              {quizStep === 2 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.15rem 0 0.35rem 0' }}>
                    <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#fff', margin: '0 0 2px 0' }}>
                      Como prefere receber seu lanche? 🛵
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Entrega no seu endereço ou retirada quentinha no nosso balcão.
                    </p>
                  </div>

                  {/* CARDS INTERATIVOS DE SELEÇÃO: DELIVERY VS RETIRADA (LADO A LADO) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Card Delivery */}
                    <div
                      onClick={() => setDeliveryType('delivery')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: deliveryType === 'delivery' ? '2px solid #eab308' : '1px solid var(--border-glass)',
                        backgroundColor: deliveryType === 'delivery' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: deliveryType === 'delivery' ? '#eab308' : 'rgba(255, 255, 255, 0.08)',
                        color: deliveryType === 'delivery' ? '#000' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Bike size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Delivery</span>
                          {deliveryType === 'delivery' && (
                            <Check size={13} color="#eab308" strokeWidth={3} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isDeliveryAddressProvided 
                            ? (deliveryFee === 0 ? '🎉 Grátis' : `R$ ${deliveryFee.toFixed(2)}`)
                            : 'Receba em casa'}
                        </p>
                      </div>
                    </div>

                    {/* Card Retirada no Balcão */}
                    <div
                      onClick={() => setDeliveryType('pickup')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: deliveryType === 'pickup' ? '2px solid #eab308' : '1px solid var(--border-glass)',
                        backgroundColor: deliveryType === 'pickup' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: deliveryType === 'pickup' ? '#eab308' : 'rgba(255, 255, 255, 0.08)',
                        color: deliveryType === 'pickup' ? '#000' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Store size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Retirada</span>
                          {deliveryType === 'pickup' && (
                            <Check size={13} color="#eab308" strokeWidth={3} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Sem taxa • Balcão
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Se for RETIRADA: Card explicativo com endereço da loja */}
                  {deliveryType === 'pickup' && (
                    <div style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }} className="animate-fade-in">
                      <MapPin size={22} color="#4ade80" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '1px' }}>
                          Retirada no Balcão Nuu Prensado:
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                          <strong>Rua Agapanto, 264</strong> - Bairro Sagrada Família, Montes Claros/MG
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '2px' }}>
                          Avisaremos você assim que o lanche estiver pronto na chapa!
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Se for DELIVERY: Formulário estruturado de endereço */}
                  {deliveryType === 'delivery' && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }} className="animate-fade-in">
                      
                      {/* Localização Rápida: GPS e CEP */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Botão de Detecção por GPS */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={handleDetectGPS}
                            disabled={gpsLoading}
                            style={{
                              flex: 1,
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38bdf8',
                              borderRadius: '7px',
                              padding: '8px 12px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <MapPin size={15} />
                            {gpsLoading ? 'Calculando raio pelo GPS...' : '📍 Usar Minha Localização (GPS Automático)'}
                          </button>
                        </div>

                        {gpsSuccessMessage && (
                          <div style={{ fontSize: '0.74rem', color: '#4ade80', backgroundColor: 'rgba(34, 197, 94, 0.08)', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Check size={12} /> {gpsSuccessMessage}
                          </div>
                        )}
                        {gpsError && (
                          <div style={{ fontSize: '0.74rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AlertCircle size={12} /> {gpsError}
                          </div>
                        )}

                        {/* Campo de CEP Opcional para preenchimento rápido */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              Ou busque pelo CEP <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Opcional)</span>
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Ex: 39401-022"
                              value={cep}
                              maxLength={9}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCep(val);
                                const clean = val.replace(/\D/g, '');
                                if (clean.length === 8) {
                                  handleLookupCep(clean);
                                }
                              }}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                color: '#fff',
                                fontSize: '0.84rem',
                                outline: 'none'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleLookupCep(cep)}
                              disabled={cepLoading}
                              style={{
                                backgroundColor: '#eab308',
                                color: '#000',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              {cepLoading ? '...' : <><Search size={12} /> Buscar CEP</>}
                            </button>
                          </div>

                          {cepFeedback && (
                            <div style={{
                              fontSize: '0.72rem',
                              marginTop: '2px',
                              color: cepFeedback.success ? '#4ade80' : '#f87171',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {cepFeedback.success ? <Check size={11} /> : <AlertCircle size={11} />}
                              <span>{cepFeedback.message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rua / Avenida e Número */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Rua */}
                        <div style={{ flex: '1 1 64%', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <label style={{ fontSize: '0.78rem', color: formErrors.street ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                            Rua / Avenida <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            ref={streetInputRef}
                            type="text"
                            placeholder="Ex: Rua Agapanto"
                            value={addressStreet}
                            onChange={(e) => {
                              setAddressStreet(e.target.value);
                              if (formErrors.street) setFormErrors(prev => ({ ...prev, street: false }));
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: formErrors.street ? '2px solid #ef4444' : '1px solid var(--border-glass)',
                              backgroundColor: formErrors.street ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                              color: '#fff',
                              fontSize: '0.86rem',
                              outline: 'none',
                              boxShadow: formErrors.street ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          {formErrors.street && (
                            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <AlertCircle size={11} /> Preencha a Rua/Av.
                            </span>
                          )}
                        </div>

                        {/* Número */}
                        <div style={{ flex: '1 1 28%', minWidth: '75px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <label style={{ fontSize: '0.78rem', color: formErrors.number ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                            Número <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            ref={numberInputRef}
                            type="text"
                            placeholder="Ex: 264"
                            value={addressNumber}
                            onChange={(e) => {
                              setAddressNumber(e.target.value);
                              if (formErrors.number) setFormErrors(prev => ({ ...prev, number: false }));
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: formErrors.number ? '2px solid #ef4444' : '1px solid var(--border-glass)',
                              backgroundColor: formErrors.number ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                              color: '#fff',
                              fontSize: '0.86rem',
                              outline: 'none',
                              boxShadow: formErrors.number ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          {formErrors.number && (
                            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <AlertCircle size={11} /> Preencha o número
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bairro e Complemento */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Bairro */}
                        <div style={{ flex: '1 1 54%', minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.78rem', color: formErrors.neighborhood ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                              Bairro (Montes Claros) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                          </div>
                          <input
                            ref={neighborhoodInputRef}
                            type="text"
                            list="delivery-neighborhoods-list"
                            placeholder="Ex: Sagrada Família, Centro, Major Prates..."
                            value={addressNeighborhood}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddressNeighborhood(val);
                              setSelectedNeighborhood(val);
                              if (formErrors.neighborhood) setFormErrors(prev => ({ ...prev, neighborhood: false }));
                              const clean = val.trim().toLowerCase();
                              if (clean) {
                                const match = availableNeighborhoods.find(n => {
                                  const nLow = n.name.toLowerCase();
                                  return nLow === clean || clean.includes(nLow) || nLow.includes(clean);
                                });
                                if (match && match.distanceKm) {
                                  setSelectedDistanceKm(match.distanceKm);
                                }
                              }
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: formErrors.neighborhood ? '2px solid #ef4444' : '1px solid var(--border-glass)',
                              backgroundColor: formErrors.neighborhood ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                              color: '#fff',
                              fontSize: '0.86rem',
                              outline: 'none',
                              boxShadow: formErrors.neighborhood ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          <datalist id="delivery-neighborhoods-list">
                            {availableNeighborhoods.map((n, i) => (
                              <option key={i} value={n.name}>
                                {n.fee === 0 ? 'Frete Grátis' : `Taxa: R$ ${Number(n.fee).toFixed(2)}${n.distanceKm ? ` (~${n.distanceKm} km)` : ''}`}
                              </option>
                            ))}
                          </datalist>
                          {formErrors.neighborhood && (
                            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <AlertCircle size={11} /> Preencha o bairro
                            </span>
                          )}
                        </div>

                        {/* Complemento */}
                        <div style={{ flex: '1 1 40%', minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Complemento <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Opcional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Apto 102, Casa 2..."
                            value={addressComplement}
                            onChange={(e) => setAddressComplement(e.target.value)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-glass)',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: '#fff',
                              fontSize: '0.86rem',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        </div>
                      </div>

                      {/* Card da Taxa de Entrega Calculada */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: isDeliveryAddressProvided ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: isDeliveryAddressProvided ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid var(--border-glass)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Bike size={18} color={isDeliveryAddressProvided ? '#4ade80' : 'var(--text-muted)'} />
                          <div>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.84rem' }}>
                              Taxa de Entrega:
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>
                              {isDeliveryAddressProvided 
                                ? (deliveryFeeResult?.reason || (deliveryFee === 0 ? '🎉 Frete Grátis no seu pedido!' : `Bairro ${addressNeighborhood.trim()}`))
                                : 'Preencha Rua, Número e Bairro para calcular'}
                            </div>
                          </div>
                        </div>
                        <strong style={{ 
                          color: !isDeliveryAddressProvided ? 'var(--text-muted)' : (deliveryFee === 0 ? '#4ade80' : 'var(--color-brand)'), 
                          fontSize: isDeliveryAddressProvided ? '1.05rem' : '0.82rem', 
                          fontWeight: 800 
                        }}>
                          {isDeliveryAddressProvided 
                            ? (deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`)
                            : 'A calcular'}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação do Passo 2 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={handlePrevQuizStep}
                      className="btn-secondary"
                      style={{ padding: '9px 14px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ArrowLeft size={14} /> Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleNextQuizStep}
                      className="btn-primary"
                      style={{ padding: '10px 18px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 12px rgba(234, 179, 8, 0.25)' }}
                    >
                      Avançar para Pagamento <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: COMO VAI PAGAR? (PAGAMENTO, TROCO & CUPOM) */}
              {quizStep === 3 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.15rem 0 0.35rem 0' }}>
                    <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#fff', margin: '0 0 2px 0' }}>
                      Como prefere pagar? 💳
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Selecione a forma de pagamento desejada.
                    </p>
                  </div>

                  {/* CARDS INTERATIVOS DE FORMAS DE PAGAMENTO */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'Pix (Mercado Pago)', label: 'Pix Online', desc: 'Aprovação instantânea', icon: '⚡', highlight: true },
                      { id: 'Cartão de Crédito Online', label: 'Crédito Online', desc: 'No site (Mercado Pago)', icon: '💳', highlight: true },
                      { id: 'Cartão de Débito Online', label: 'Débito Online', desc: 'No site (Mercado Pago)', icon: '💳', highlight: true },
                      { id: 'Dinheiro', label: 'Dinheiro', desc: 'Em espécie na entrega', icon: '💵', highlight: false }
                    ].map(pm => {
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          style={{
                            padding: '10px 10px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #eab308' : '1px solid var(--border-glass)',
                            backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1.2rem' }}>{pm.icon}</span>
                            {isSelected && <Check size={14} color="#eab308" strokeWidth={3} />}
                            {!isSelected && pm.highlight && (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                Online
                              </span>
                            )}
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)' }}>
                            {pm.label}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: isSelected ? '#fde047' : 'var(--text-muted)' }}>
                            {pm.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* INFO BANNER SOBRE PAGAMENTO ONLINE MERCADO PAGO */}
                  {['Pix (Mercado Pago)', 'Cartão de Crédito Online', 'Cartão de Débito Online'].includes(paymentMethod) && (
                    <div style={{
                      padding: '9px 12px',
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }} className="animate-fade-in">
                      <ShieldCheck size={18} color="#4ade80" />
                      <div style={{ fontSize: '0.75rem', color: '#fff' }}>
                        <strong style={{ color: '#4ade80' }}>Checkout Seguro:</strong>{' '}
                        {paymentMethod === 'Pix (Mercado Pago)' 
                          ? 'O QR Code Pix e o Copia e Cola serão gerados no próximo passo com verificação bancária em tempo real.'
                          : 'Você preencherá os dados do cartão de forma 100% segura e criptografada no próximo passo.'}
                      </div>
                    </div>
                  )}

                  {/* DINHEIRO COM TROCO */}
                  {paymentMethod === 'Dinheiro' && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }} className="animate-fade-in">
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Precisa de troco? Para quanto?
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: R$ 50,00 ou Não preciso de troco"
                        value={changeFor}
                        onChange={(e) => setChangeFor(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-glass)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: '#fff',
                          fontSize: '0.84rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* CAMPO DE CUPOM DE DESCONTO & VOUCHER DE FIDELIDADE */}
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)'
                  }}>
                    {/* Banner de Voucher de Fidelidade Disponível */}
                    {activeFidelityVoucher && !appliedCoupon && (
                      <div style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, rgba(168, 35, 25, 0.35) 0%, rgba(237, 177, 67, 0.2) 100%)',
                        border: '1px solid rgba(237, 177, 67, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-brand-yellow)', fontWeight: 800, fontSize: '0.76rem' }}>
                          <Gift size={13} />
                          <span>🎉 1 LANCHE GRÁTIS DE FIDELIDADE!</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#fff' }}>
                          Voucher do 10º pedido: <strong>{activeFidelityVoucher.code}</strong> (R$ 25 OFF)
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setInputCoupon(activeFidelityVoucher.code);
                            const res = validateCoupon(activeFidelityVoucher.code, cartTotal);
                            if (res.valid) {
                              setAppliedCoupon(res.coupon);
                              setCouponFeedback({ success: true, message: `Voucher ${activeFidelityVoucher.code} aplicado!` });
                            }
                          }}
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: '0.74rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px', borderRadius: '5px' }}
                        >
                          <Check size={12} />
                          <span>Aplicar Meu Lanche Grátis</span>
                        </button>
                      </div>
                    )}

                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Tem um Cupom de Desconto?
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Ex: NUU10"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          textTransform: 'uppercase',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="btn-secondary"
                        style={{ padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px' }}
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponFeedback && (
                      <div style={{
                        fontSize: '0.72rem',
                        marginTop: '4px',
                        color: couponFeedback.success ? '#4ade80' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {couponFeedback.success ? <Check size={11} /> : <AlertCircle size={11} />}
                        <span>{couponFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação do Passo 3 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={handlePrevQuizStep}
                      className="btn-secondary"
                      style={{ padding: '9px 14px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ArrowLeft size={14} /> Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleNextQuizStep}
                      className="btn-primary"
                      style={{ padding: '10px 18px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 12px rgba(234, 179, 8, 0.25)' }}
                    >
                      Revisar Pedido <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 4: REVISÃO & CONFIRMAÇÃO DO PEDIDO */}
              {quizStep === 4 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.15rem 0 0.35rem 0' }}>
                    <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#fff', margin: '0 0 2px 0' }}>
                      Confirmar Pedido 🔥
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Confira os dados antes de enviarmos para a chapa.
                    </p>
                  </div>

                  {/* CARDS RESUMO DO QUIZ */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    
                    {/* Resumo do Cliente */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} color="#eab308" /> Cliente
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuizStep(1)}
                          style={{ background: 'none', border: 'none', color: '#fde047', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Edit2 size={10} /> Editar
                        </button>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                        {customerName || 'Não informado'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        📱 {phone || 'Sem telefone'}
                      </div>
                    </div>

                    {/* Resumo da Entrega */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {deliveryType === 'delivery' ? <Bike size={12} color="#eab308" /> : <Store size={12} color="#eab308" />}
                          {deliveryType === 'delivery' ? 'Delivery' : 'Balcão'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuizStep(2)}
                          style={{ background: 'none', border: 'none', color: '#fde047', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Edit2 size={10} /> Editar
                        </button>
                      </div>
                      {deliveryType === 'delivery' ? (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#fff' }}>
                            {addressStreet}, nº {addressNumber} {addressComplement ? `(${addressComplement})` : ''}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Bairro {addressNeighborhood} - Montes Claros/MG
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#fff' }}>
                            Balcão Nuu Prensado
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Rua Agapanto, 264 - Sagrada Família
                          </div>
                        </>
                      )}
                    </div>

                    {/* Resumo do Pagamento */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={12} color="#eab308" /> Pagamento
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuizStep(3)}
                          style={{ background: 'none', border: 'none', color: '#fde047', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Edit2 size={10} /> Editar
                        </button>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#fff' }}>
                        {paymentMethod === 'Pix (Mercado Pago)' && '⚡ Pix Online (Mercado Pago)'}
                        {paymentMethod === 'Cartão de Crédito Online' && '💳 Cartão de Crédito Online'}
                        {paymentMethod === 'Cartão de Débito Online' && '💳 Cartão de Débito Online'}
                        {paymentMethod === 'Dinheiro' && '💵 Dinheiro (Na Entrega)'}
                        {!['Pix (Mercado Pago)', 'Cartão de Crédito Online', 'Cartão de Débito Online', 'Dinheiro'].includes(paymentMethod) && paymentMethod}
                      </div>
                      {paymentMethod === 'Dinheiro' && changeFor && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          Troco: <strong>{changeFor}</strong>
                        </div>
                      )}
                      {appliedCoupon && (
                        <div style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 600 }}>
                          Cupom {appliedCoupon.code}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ITENS DO PEDIDO EM FORMATO RESUMIDO */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Itens do Pedido ({cart.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                      {cart.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', paddingBottom: '4px', borderBottom: index < cart.length - 1 ? '1px dashed rgba(255,255,255,0.06)' : 'none' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{item.quantity}x {item.name}</span>
                            {item.selectedBread && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                                {item.selectedBread} • {item.selectedCreamy} • {item.selectedMelted}
                              </span>
                            )}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--color-brand-yellow)' }}>
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RESUMO FINANCEIRO FINAL */}
                  <div style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.05)',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    borderRadius: '10px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Subtotal dos Lanches:</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    {deliveryType === 'delivery' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Taxa de Entrega:</span>
                        <span>
                          {deliveryFee === 0 
                            ? <span style={{ color: '#4ade80', fontWeight: 700 }}>GRÁTIS</span> 
                            : <span style={{ color: '#fff', fontWeight: 600 }}>R$ {deliveryFee.toFixed(2)}</span>}
                        </span>
                      </div>
                    )}
                    {deliveryType === 'pickup' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Taxa de Entrega:</span>
                        <span style={{ color: '#4ade80', fontWeight: 700 }}>GRÁTIS (Balcão)</span>
                      </div>
                    )}
                    {totalDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>
                        <span>Desconto Aplicado:</span>
                        <span>- R$ {totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: '#fde047', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                      <span>Total do Pedido:</span>
                      <span>R$ {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* SELEÇÃO WHITE LABEL MERCADO PAGO OU CONFIRMAÇÃO PRESENCIAL */}
                  {['Pix (Mercado Pago)', 'Cartão de Crédito Online', 'Cartão de Débito Online'].includes(paymentMethod) ? (
                    <div style={{
                      marginTop: '0.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <CheckoutErrorBoundary onFallbackToOffline={() => setQuizStep(3)}>
                        <MercadoPagoWhiteLabelCheckout
                          mode={
                            paymentMethod === 'Cartão de Crédito Online' ? 'credit' :
                            paymentMethod === 'Cartão de Débito Online' ? 'debit' : 'pix'
                          }
                          amount={grandTotal}
                          description={`Pedido Nuu Prensado - ${customerName || 'Cliente'}`}
                          customerName={customerName}
                          customerPhone={phone ? phone.replace(/\D/g, '') : ''}
                          storeSettings={storeSettings}
                          onPaymentSuccess={(paymentInfo) => {
                            handleSubmitOrder(null, paymentInfo);
                          }}
                          onPaymentError={(errMsg) => {
                            showSiteAlert('Atenção no Pagamento', errMsg, 'warning');
                          }}
                        />
                      </CheckoutErrorBoundary>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handlePrevQuizStep}
                          className="btn-secondary"
                          style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <ArrowLeft size={14} /> Voltar
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizStep(3)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Mudar forma de pagamento
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* BOTÕES DE AÇÃO DO PASSO 4 PARA PAGAMENTOS NA ENTREGA / PRESENCIAL */
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={handlePrevQuizStep}
                        className="btn-secondary"
                        style={{ padding: '10px 14px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ArrowLeft size={14} /> Voltar
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ 
                          flex: 1,
                          justifyContent: 'center', 
                          padding: '11px 18px', 
                          fontSize: '0.98rem', 
                          fontWeight: 900,
                          borderRadius: '8px',
                          boxShadow: '0 3px 15px rgba(168, 35, 25, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Sparkles size={16} /> Confirmar e Enviar Pedido
                      </button>
                    </div>
                  )}
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* TELA DE RASTREAMENTO DO PEDIDO */}
      {checkoutStep === 'tracking' && activeTrackingOrder && (() => {
        const isPickup = activeTrackingOrder.type === 'pickup';
        const trackingSteps = isPickup ? [
          { key: 'pending', name: 'Recebido' },
          { key: 'preparing', name: 'Na Chapa' },
          { key: 'shipping', name: 'No Balcão' },
          { key: 'delivered', name: 'Retirado' }
        ] : [
          { key: 'pending', name: 'Recebido' },
          { key: 'preparing', name: 'Na Chapa' },
          { key: 'shipping', name: 'A Caminho' },
          { key: 'delivered', name: 'Entregue' }
        ];

        const progressPercent = 
          activeTrackingOrder.status === 'pending' ? '12%' :
          activeTrackingOrder.status === 'preparing' ? '38%' :
          activeTrackingOrder.status === 'shipping' ? '68%' : '100%';

        return (
          <div style={{ maxWidth: '620px', margin: 'clamp(2rem, 8vh, 5.5rem) auto 4rem auto', width: '100%', padding: '0 1.5rem' }} className="animate-fade-in">
            {/* Barra de Navegação Superior do Rastreamento */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCheckoutStep('menu')}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} /> Voltar ao Cardápio
              </button>
              <button
                type="button"
                onClick={() => setCheckoutStep('menu')}
                style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.45)',
                  color: '#facc15',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🍔 Fazer Outro Pedido
              </button>
            </div>

            {/* CASO 1: PEDIDO CANCELADO OU EXCLUÍDO */}
            {activeTrackingOrder.status === 'canceled' ? (
              <div className="glass-panel" style={{ padding: '2rem 1.75rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.06)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                  <XCircle size={36} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.25rem' }}>Pedido Cancelado</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                  Código do Pedido: <strong style={{ color: '#fff' }}>#{activeTrackingOrder.id}</strong> • Cliente: <strong>{activeTrackingOrder.customerName}</strong>
                </p>

                {/* Motivo do Cancelamento */}
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '8px',
                  textAlign: 'left',
                  marginBottom: '1.75rem'
                }}>
                  <h4 style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '0.4rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#ef4444" /> Motivo do Cancelamento:
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.5, margin: 0 }}>
                    {activeTrackingOrder.cancelReason || 'Este pedido foi cancelado ou removido pelo estabelecimento.'}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                    Caso você já tenha feito o pagamento via Pix ou queira tirar qualquer dúvida, entre em contato diretamente com nossa equipe pelo WhatsApp abaixo.
                  </p>
                </div>

                {/* Resumo dos Itens do Pedido Cancelado */}
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Itens que estavam no Pedido
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {activeTrackingOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}><strong>{item.quantity}x</strong> {item.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-glass)', paddingTop: '8px' }}>
                    <span>Valor:</span>
                    <span>R$ {activeTrackingOrder.total?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botões de Ação para Pedido Cancelado */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={() => setCheckoutStep('menu')} 
                    className="btn-primary"
                  >
                    🍔 Fazer Outro Pedido
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const text = `*Olá, Nuu Prensado! Meu pedido #${activeTrackingOrder.id} apareceu como cancelado no site.*\n\n` +
                        `*Cliente:* ${activeTrackingOrder.customerName}\n` +
                        `*Telefone:* ${activeTrackingOrder.phone || ''}\n` +
                        `*Motivo exibido:* ${activeTrackingOrder.cancelReason || 'Cancelado pelo estabelecimento'}\n\n` +
                        `Gostaria de falar com vocês sobre esse cancelamento. Obrigado!`;

                      const storeNumber = (storeSettings?.whatsapp || storeSettings?.phone || '31999999999').replace(/\D/g, '');
                      const phoneWithDDI = storeNumber.startsWith('55') ? storeNumber : `55${storeNumber}`;
                      window.open(`https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <MessageCircle size={18} color="#25D366" />
                    Falar com a Cozinha no WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              /* CASO 2: PEDIDO ATIVO NORMAL */
              <div className="glass-panel" style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                  <Clock size={30} color="var(--color-brand)" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Acompanhe seu Pedido</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Código do Pedido: <strong style={{ color: '#eab308' }}>#{activeTrackingOrder.id}</strong> • Cliente: <strong>{activeTrackingOrder.customerName}</strong>
                </p>

                {/* Status Visual Tracker */}
                <div className="status-tracker-container" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '2.5rem', padding: '0 10px' }}>
                  <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '3px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}></div>
                  
                  <div style={{ 
                    position: 'absolute', 
                    top: '15px', 
                    left: '10%', 
                    width: progressPercent, 
                    height: '3px', 
                    backgroundColor: 'var(--color-brand)', 
                    transition: 'all 0.5s',
                    zIndex: 2 
                  }}></div>

                  {trackingSteps.map(step => {
                    const isActive = getStatusStepClass(activeTrackingOrder.status, step.key) === 'step-active';
                    return (
                      <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '70px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: isActive ? 'var(--color-brand)' : 'var(--bg-tertiary)', 
                          border: '3px solid var(--bg-secondary)', 
                          color: isActive ? '#fff' : 'var(--text-muted)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s'
                        }}>
                          {isActive ? <CheckCircle size={16} /> : ''}
                        </div>
                        <span style={{ fontSize: '0.75rem', marginTop: '8px', color: isActive ? '#fff' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}>
                          {step.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mensagem descritiva do status atual */}
                <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'left', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-brand)' }}>
                  <h4 style={{ fontWeight: 700, color: '#fff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                    <Sparkles size={18} color="#eab308" /> 
                    {activeTrackingOrder.status === 'pending' && 'Aguardando Confirmação da Cozinha'}
                    {activeTrackingOrder.status === 'preparing' && 'Seu Prensado já está na Chapa! 🔥'}
                    {activeTrackingOrder.status === 'shipping' && (isPickup ? '🏪 Pronto para Retirada no Balcão!' : '🛵 Saiu para Entrega!')}
                    {activeTrackingOrder.status === 'delivered' && (isPickup ? '🎉 Pedido Retirado com Sucesso!' : '🎉 Pedido Entregue!')}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {activeTrackingOrder.status === 'pending' && 'Seu pedido foi registrado no sistema e já está aguardando na fila da chapa.'}
                    {activeTrackingOrder.status === 'preparing' && 'Nosso chapeiro está preparando e prensando seus lanches com todo o capricho.'}
                    {activeTrackingOrder.status === 'shipping' && (isPickup 
                      ? 'Seu lanche prensado está prontinho e quentinho no balcão! Você já pode vir retirar.' 
                      : `O entregador já está a caminho do seu endereço: ${activeTrackingOrder.address}.`)}
                    {activeTrackingOrder.status === 'delivered' && 'Agradecemos muito por escolher o Nuu Prensado! Esperamos que saboreie seu pedido.'}
                  </p>
                </div>

                {/* Status de Pagamento Online Aprovado */}
                {activeTrackingOrder.paymentStatus === 'paid' && (
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <ShieldCheck size={22} color="#4ade80" />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: '#4ade80', display: 'block' }}>
                        Pagamento Confirmado no Mercado Pago!
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: '#fff' }}>
                        {activeTrackingOrder.paymentMethod} • ID: {activeTrackingOrder.paymentId || activeTrackingOrder.id}
                      </span>
                    </div>
                  </div>
                )}

                {/* Chave Pix se Pendente (Pix Manual ou aguardando) */}
                {activeTrackingOrder.paymentStatus !== 'paid' && activeTrackingOrder.paymentMethod.includes('Pix') && activeTrackingOrder.status === 'pending' && (
                  <div style={{ 
                    padding: '1rem', 
                    background: 'rgba(234, 179, 8, 0.1)', 
                    border: '1px solid rgba(234, 179, 8, 0.35)', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '1.5rem',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#eab308' }}>⚡ Chave Pix para Pagamento:</strong>
                      <button 
                        type="button" 
                        onClick={handleCopyPix}
                        style={{ 
                          background: pixCopied ? 'var(--color-success)' : '#eab308', 
                          color: '#000', 
                          border: 'none', 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px' 
                        }}
                      >
                        {pixCopied ? <Check size={12} /> : <Copy size={12} />}
                        {pixCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {officialPixKey}
                    </div>
                  </div>
                )}

                {/* Resumo dos Itens */}
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Resumo dos Itens
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {activeTrackingOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: '#fff' }}><strong>{item.quantity}x</strong> {item.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Modalidade:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{isPickup ? '🏪 Retirada no Balcão' : '🛵 Delivery'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pagamento:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{activeTrackingOrder.paymentMethod}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand)', marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '8px' }}>
                    <span>Total:</span>
                    <span>R$ {activeTrackingOrder.total?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botões de Ação para Pedido Normal */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={() => setCheckoutStep('menu')} 
                    className="btn-primary"
                  >
                    🍔 Fazer Outro Pedido
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const itemsSummary = activeTrackingOrder.items?.map(it => {
                        let line = `• ${it.quantity}x ${it.name}`;
                        if (it.notes) line += ` (Obs: ${it.notes})`;
                        return line;
                      }).join('\n') || '';

                      const text = `*Olá, Nuu Prensado! Acabei de fazer um pedido pelo site!*\n\n` +
                        `*Pedido:* #${activeTrackingOrder.id}\n` +
                        `*Cliente:* ${activeTrackingOrder.customerName}\n` +
                        `*Telefone:* ${activeTrackingOrder.phone || ''}\n` +
                        `*Modalidade:* ${isPickup ? 'Retirada no Balcão' : 'Delivery'}\n` +
                        (!isPickup && activeTrackingOrder.address ? `*Endereço:* ${activeTrackingOrder.address}${activeTrackingOrder.neighborhood ? ` (${activeTrackingOrder.neighborhood})` : ''}\n` : '') +
                        `*Pagamento:* ${activeTrackingOrder.paymentMethod}\n\n` +
                        `*Itens:*\n${itemsSummary}\n\n` +
                        (activeTrackingOrder.deliveryFee > 0 ? `*Taxa de Entrega:* R$ ${activeTrackingOrder.deliveryFee.toFixed(2)}\n` : '') +
                        (activeTrackingOrder.discount > 0 ? `*Desconto:* - R$ ${activeTrackingOrder.discount.toFixed(2)}\n` : '') +
                        `*TOTAL:* R$ ${activeTrackingOrder.total?.toFixed(2)}\n\n` +
                        `Poderiam confirmar se receberam meu pedido? Obrigado!`;

                      const storeNumber = (storeSettings?.whatsapp || storeSettings?.phone || '31999999999').replace(/\D/g, '');
                      const phoneWithDDI = storeNumber.startsWith('55') ? storeNumber : `55${storeNumber}`;
                      window.open(`https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <MessageCircle size={18} color="#25D366" />
                    Confirmar no WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL DETALHE DO PRODUTO / CUSTOMIZAÇÃO */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div 
            className="modal-content animate-fade-in" 
            style={{ 
              maxWidth: '540px',
              maxHeight: 'min(88vh, 88dvh, 740px)',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', padding: '1rem 1.25rem', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>Personalizar Item</h3>
              <button onClick={() => setSelectedProduct(null)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div 
              className="modal-body custom-scrollbar" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.15rem',
                overflowY: 'auto',
                flex: '1 1 auto',
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
                padding: '1.25rem'
              }}
            >
              {selectedProduct.image && (
                <div 
                  onClick={() => setPreviewImageModal({ url: selectedProduct.image, title: selectedProduct.name })}
                  style={{ 
                    width: '100%', 
                    height: '140px', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)', 
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title="Clique para ampliar a foto"
                >
                  <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ZoomIn size={13} />
                  </div>
                </div>
              )}
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {selectedProduct.name}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedProduct.description}
                </p>
              </div>

              {/* Opções de Queijo e Vinagrete se tiver customOptions */}
              {selectedProduct.hasCustomOptions && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ marginBottom: '12px', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                    Personalize seu Prensado:
                  </h4>
                  
                  {/* Tipo de Pão */}
                  {breadOptions.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipo de Pão:</strong>
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {breadOptions.map(opt => {
                          const isPaused = !opt.active;
                          return (
                            <label 
                              key={opt.id} 
                              style={{ 
                                cursor: isPaused ? 'not-allowed' : 'pointer', 
                                fontSize: '0.9rem', 
                                color: isPaused ? 'var(--text-muted)' : '#fff',
                                opacity: isPaused ? 0.5 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: selectedBread === opt.name && !isPaused ? 'rgba(255,255,255,0.06)' : 'transparent',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: selectedBread === opt.name && !isPaused ? '1px solid var(--border-glass)' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="radio" 
                                name="bread" 
                                disabled={isPaused}
                                checked={selectedBread === opt.name && !isPaused} 
                                onChange={() => !isPaused && setSelectedBread(opt.name)} 
                                style={{ accentColor: 'var(--color-brand)' }} 
                              />
                              <span>{opt.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Queijo Cremoso */}
                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Queijo Cremoso:</strong>
                    <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {creamyOptions.map(opt => {
                        const isPaused = !opt.active;
                        return (
                          <label 
                            key={opt.id} 
                            style={{ 
                              cursor: isPaused ? 'not-allowed' : 'pointer', 
                              fontSize: '0.9rem', 
                              color: isPaused ? 'var(--text-muted)' : '#fff',
                              opacity: isPaused ? 0.5 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: selectedCreamy === opt.name && !isPaused ? 'rgba(255,255,255,0.06)' : 'transparent',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: selectedCreamy === opt.name && !isPaused ? '1px solid var(--border-glass)' : '1px solid transparent'
                            }}
                          >
                            <input 
                              type="radio" 
                              name="creamy" 
                              disabled={isPaused}
                              checked={selectedCreamy === opt.name && !isPaused} 
                              onChange={() => !isPaused && setSelectedCreamy(opt.name)} 
                              style={{ accentColor: 'var(--color-brand)' }} 
                            />
                            <span>{opt.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vinagrete */}
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Acompanhamento:</strong>
                    <div style={{ marginTop: '6px' }}>
                      {sideOptions.length > 0 ? (
                        sideOptions.map(opt => (
                          <label 
                            key={opt.id} 
                            style={{ 
                              cursor: !opt.active ? 'not-allowed' : 'pointer', 
                              fontSize: '0.9rem', 
                              color: !opt.active ? 'var(--text-muted)' : '#fff',
                              opacity: !opt.active ? 0.5 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              disabled={!opt.active}
                              checked={selectedSide && opt.active} 
                              onChange={(e) => opt.active && setSelectedSide(e.target.checked)} 
                              style={{ accentColor: 'var(--color-brand)' }} 
                            />
                            <span>Adicionar {opt.name} (Opcional)</span>
                          </label>
                        ))
                      ) : (
                        <label style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#fff' }}>
                          <input type="checkbox" checked={selectedSide} onChange={(e) => setSelectedSide(e.target.checked)} style={{ accentColor: 'var(--color-brand)' }} /> Adicionar Vinagrete Fresco
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Adicionais Extras */}
              {extraOptions.length > 0 && selectedProduct.category === 'prensados' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                    Adicionais Extras:
                  </h5>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {extraOptions.map(extra => {
                      const isPaused = !extra.active;
                      const isChecked = selectedExtras.includes(extra.id) && !isPaused;

                      return (
                        <label 
                          key={extra.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '8px 10px', 
                            border: '1px solid',
                            borderColor: isChecked ? 'var(--color-brand)' : 'var(--border-glass)', 
                            borderRadius: 'var(--radius-sm)', 
                            cursor: isPaused ? 'not-allowed' : 'pointer',
                            opacity: isPaused ? 0.5 : 1,
                            backgroundColor: isChecked ? 'rgba(234, 179, 8, 0.08)' : 'transparent',
                            transition: 'all 0.2s',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox" 
                              disabled={isPaused}
                              checked={isChecked}
                              onChange={(e) => {
                                if (isPaused) return;
                                if (e.target.checked) {
                                  setSelectedExtras(prev => [...prev, extra.id]);
                                } else {
                                  setSelectedExtras(prev => prev.filter(id => id !== extra.id));
                                }
                              }}
                              style={{ accentColor: 'var(--color-brand)' }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 600 : 400 }}>{extra.name}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: isPaused ? 'var(--text-muted)' : 'var(--color-brand)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {isPaused ? 'Indisponível' : `+ R$ ${extra.price.toFixed(2)}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Campo de Observações do Item (ex: sem cebola, bem tostadinho) */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Observações para a Cozinha (Opcional)
                </label>
                <textarea
                  placeholder="Ex: Sem cebola, pão bem prensadinho, mandar maionese à parte..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Quantidade */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Quantidade:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '99px' }}>
                  <button onClick={() => setProductQty(Math.max(1, productQty - 1))} style={{ color: 'var(--text-secondary)' }}>
                    <Minus size={16} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '1rem', width: '20px', textAlign: 'center' }}>{productQty}</span>
                  <button onClick={() => setProductQty(productQty + 1)} style={{ color: 'var(--text-secondary)' }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div 
              className="modal-footer" 
              style={{ 
                borderTop: '1px solid var(--border-glass)', 
                padding: '0.85rem 1.25rem',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexShrink: 0,
                boxShadow: '0 -4px 16px rgba(0,0,0,0.5)'
              }}
            >
              <button onClick={() => setSelectedProduct(null)} className="btn-secondary" style={{ flex: '0 0 auto', padding: '10px 16px' }}>
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (!isStoreOpen) {
                    if (pauseStatus.isPaused) {
                      showSiteAlert(
                        'Cozinha em Pausa',
                        `A cozinha está em pausa temporária para preparar os pedidos em andamento. Retomamos os novos pedidos em aproximadamente ${pauseStatus.remainingMinutes} min!`,
                        'warning',
                        'Pausa'
                      );
                      return;
                    }
                    showSiteAlert(
                      'Loja Fechada',
                      `Nosso horário de atendimento é de Terça a Domingo das ${displayOpenTime} às ${displayCloseTime}. Fique à vontade para conferir todos os ingredientes e escolher seus itens favoritos!`,
                      'warning',
                      'Horário'
                    );
                    return;
                  }
                  handleAddToCart();
                }} 
                className="btn-primary" 
                style={{ 
                  flex: '1 1 auto', 
                  justifyContent: 'center', 
                  padding: '10px 18px',
                  backgroundColor: !isStoreOpen ? 'rgba(245, 158, 11, 0.22)' : undefined,
                  border: !isStoreOpen ? '1px solid rgba(245, 158, 11, 0.45)' : undefined,
                  color: !isStoreOpen ? '#fef08a' : undefined
                }}
              >
                {isStoreOpen 
                  ? `Adicionar • R$ ${currentTotalPrice.toFixed(2)}` 
                  : pauseStatus.isPaused 
                    ? `Cozinha Pausada (~${pauseStatus.remainingMinutes}m)` 
                    : `Fechado • Abre às ${storeSettings?.openTime || '18:00'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARRINHO DE COMPRAS FLUTUANTE (SIDE PANEL) */}
      {isCartOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={() => setIsCartOpen(false)}>
          <div 
            className="cart-panel animate-slide-in-right" 
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              width: '100%', 
              maxWidth: '420px', 
              height: '100dvh', 
              maxHeight: '100dvh',
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '-4px 0 25px rgba(0,0,0,0.7)',
              borderLeft: '1px solid var(--border-glass)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', flexShrink: 0, borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <ShoppingBag size={20} color="var(--color-brand)" /> Carrinho
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)} 
                style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none', padding: '6px', display: 'flex', alignItems: 'center' }}
                title="Fechar carrinho"
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '240px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{item.name}</span>
                    {item.notes && (
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                        Obs: {item.notes}
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-brand)', fontWeight: 700 }}>
                      R$ {item.price.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '99px' }}>
                      <button onClick={() => updateCartQty(index, -1)} style={{ color: 'var(--text-secondary)' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(index, 1)} style={{ color: 'var(--text-secondary)' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => updateCartQty(index, -item.quantity)} style={{ color: 'var(--color-danger)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)', gap: '10px' }}>
                  <ShoppingBag size={48} style={{ opacity: 0.3 }} />
                  <p>Seu carrinho está vazio.</p>
                  <button onClick={() => setIsCartOpen(false)} className="btn-primary" style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                    Escolher Lanches
                  </button>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1.25rem 1.5rem', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-primary)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal dos Itens:</span>
                  <span style={{ fontWeight: 600 }}>R$ {cartTotal.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Taxa de entrega calculada por bairro no próximo passo.
                </p>
                <button 
                  onClick={() => {
                    setQuizStep(1);
                    setCheckoutStep('form');
                    setIsCartOpen(false);
                  }}
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1.05rem' }}
                >
                  Finalizar compra <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM / AMPLIAÇÃO DA FOTO DO PRODUTO */}
      {previewImageModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewImageModal(null)}
          style={{ zIndex: 9999999, backgroundColor: 'rgba(0, 0, 0, 0.94)' }}
        >
          <div 
            className="animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#0a0a0a',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
            }}
          >
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              color: '#fff'
            }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {previewImageModal.title}
              </h4>
              <button
                onClick={() => setPreviewImageModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <img 
              src={previewImageModal.url} 
              alt={previewImageModal.title} 
              style={{
                maxWidth: '85vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL OFICIAL DE AVISOS / FEEDBACK DO SITE (SUBSTITUI O ALERT DO NAVEGADOR) */}
      {siteModal && (
        <div 
          className="modal-overlay animate-fade-in" 
          onClick={() => setSiteModal(null)}
          style={{ zIndex: 9999999, padding: '16px' }}
        >
          <div 
            className="animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#111827',
              backgroundImage: 'linear-gradient(145deg, #161f33 0%, #0d1322 100%)',
              border: `1px solid ${
                siteModal.type === 'success' ? 'rgba(34, 197, 94, 0.45)' :
                siteModal.type === 'warning' ? 'rgba(245, 158, 11, 0.45)' :
                siteModal.type === 'error' ? 'rgba(239, 68, 68, 0.45)' :
                'rgba(234, 179, 8, 0.45)'
              }`,
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.92), 0 0 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Logo oficial no topo com máximo destaque e glow (substitui a estrela) */}
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
                siteModal.type === 'success' ? 'rgba(34, 197, 94, 0.5)' :
                siteModal.type === 'warning' ? 'rgba(245, 158, 11, 0.5)' :
                siteModal.type === 'error' ? 'rgba(239, 68, 68, 0.5)' :
                'rgba(234, 179, 8, 0.5)'
              }`,
              boxShadow: `0 0 25px ${
                siteModal.type === 'success' ? 'rgba(34, 197, 94, 0.3)' :
                siteModal.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                siteModal.type === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                'rgba(234, 179, 8, 0.3)'
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
              {siteModal.type === 'success' && (
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
              {(siteModal.type === 'warning' || siteModal.type === 'error') && (
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
                  border: siteModal.type === 'error' ? '2px solid #ef4444' : '2px solid #f59e0b'
                }}>
                  <AlertCircle size={15} color={siteModal.type === 'error' ? '#ef4444' : '#f59e0b'} />
                </div>
              )}
            </div>

            {/* Tag / Badge de identificação se houver */}
            {siteModal.badge && (
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
                  {siteModal.badge}
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
              {siteModal.title}
            </h3>

            {/* Mensagem */}
            <p style={{
              fontSize: '0.92rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
              margin: '0 0 1.5rem 0'
            }}>
              {siteModal.message}
            </p>

            {/* Botão de confirmação */}
            <button
              type="button"
              onClick={() => setSiteModal(null)}
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
              OK, Entendi
            </button>
          </div>
        </div>
      )}

      {/* FLOAT ACTION BUTTON CARRINHO (FIXED BOTTOM) */}
      {cart.length > 0 && !isCartOpen && checkoutStep === 'menu' && (
        <button 
          onClick={() => setIsCartOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--color-brand)',
            color: '#fff',
            borderRadius: '99px',
            padding: '12px 20px',
            boxShadow: '0 8px 30px rgba(168, 35, 25, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 40,
            fontSize: '1rem',
            fontWeight: 700
          }}
          className="animate-fade-in"
        >
          <ShoppingBag size={20} />
          <span>{cart.reduce((a, b) => a + b.quantity, 0)} itens • R$ {grandTotal.toFixed(2)}</span>
        </button>
      )}

      {/* AVISO SUTIL VITRIFICADO DE LOJA FECHADA / PAUSADA (CENTRALIZADO NO CENTRO DA TELA) */}
      {!isStoreOpen && !closedNoticeDismissed && checkoutStep === 'menu' && (
        <div 
          className="animate-fade-in"
          onClick={() => setClosedNoticeDismissed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            cursor: 'pointer'
          }}
        >
          <div 
            className="animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: 'default',
              width: '100%',
              maxWidth: '460px',
              background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.88) 0%, rgba(15, 23, 42, 0.94) 100%)',
              backdropFilter: 'blur(18px) saturate(180%)',
              WebkitBackdropFilter: 'blur(18px) saturate(180%)',
              border: `1px solid ${pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.45)' : 'rgba(245, 158, 11, 0.4)'}`,
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(245, 158, 11, 0.15)',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Cabeçalho do Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  border: `1px solid ${pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.45)' : 'rgba(245, 158, 11, 0.4)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  flexShrink: 0
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {pauseStatus.isPaused ? 'Cozinha em Pausa Temporária' : 'Loja Fechada no Momento'}
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 700 }}>
                    {pauseStatus.isPaused 
                      ? `Retomamos em aproximadamente ~${pauseStatus.remainingMinutes} min` 
                      : `Abrimos às ${storeSettings?.openTime || '18:00'} (Terça a Domingo)`}
                  </span>
                </div>
              </div>
              
              {/* Botão de Fechar [X] */}
              <button 
                type="button"
                onClick={() => setClosedNoticeDismissed(true)}
                aria-label="Dispensar aviso de loja fechada"
                title="Fechar aviso e explorar cardápio"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mensagem Acolhedora */}
            <div style={{
              margin: 0,
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.5
            }}>
              {pauseStatus.isPaused ? (
                <>
                  {pauseStatus.pauseReason || 'Estamos com muitos pedidos sendo preparados no momento'}.
                  <br />
                  Você pode <strong>navegar pelo cardápio e conferir os lanches</strong> enquanto preparamos os pedidos da fila!
                </>
              ) : (
                <>
                  {storeSettings?.closedNotice ? (
                    storeSettings.closedNotice
                  ) : (
                    <>
                      Nosso atendimento é de <strong>Terça a Domingo das {displayOpenTime} às {displayCloseTime}</strong>.
                      <br />
                      Sinta-se à vontade para <strong>olhar todo o cardápio</strong>, conferir os ingredientes e escolher seus prensados favoritos!
                    </>
                  )}
                </>
              )}
            </div>

            {/* Dica sutil de toque */}
            <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              Toque fora do card ou clique abaixo para explorar
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setClosedNoticeDismissed(true)}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fef08a',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)'
                }}
              >
                👀 Explorar Cardápio Livremente
              </button>

              <a
                href={`https://wa.me/55${(storeSettings?.whatsapp || '38991611378').replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Estava dando uma olhada no cardápio do Nuu Prensado.')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#86efac',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}



      {/* MODAL DE MEUS PEDIDOS & LOGIN DE CLIENTE POR WHATSAPP */}
      {isCustomerModalOpen && (
        <div 
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div 
            className="modal-content animate-fade-in custom-scrollbar"
            style={{
              backgroundColor: '#18181b',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              position: 'sticky',
              top: 0,
              backgroundColor: '#18181b',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={18} color="#eab308" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    {loggedCustomer ? 'Minha Conta & Pedidos' : 'Identificação por WhatsApp'}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {loggedCustomer ? 'Acompanhe seus pedidos ao vivo' : 'Conecte-se para histórico e fidelidade'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Se o cliente NÃO está logado ou quer trocar de número */}
              {!loggedCustomer || customerModalTab === 'login' ? (
                <form onSubmit={handleCustomerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '0.84rem',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.5
                  }}>
                    ✨ <strong>Acompanhe tudo em tempo real!</strong> Conecte-se com seu WhatsApp para ver o andamento dos seus pedidos, histórico completo e pontos de fidelidade.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                      Seu WhatsApp (com DDD) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="tel"
                        value={loginPhoneInput}
                        onChange={(e) => setLoginPhoneInput(e.target.value)}
                        placeholder="(38) 99999-9999"
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 38px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '0.92rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ flex: 1, padding: '12px', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                      Acessar Meus Pedidos
                    </button>
                    {loggedCustomer && (
                      <button
                        type="button"
                        onClick={() => setCustomerModalTab('orders')}
                        className="btn-secondary"
                        style={{ padding: '12px 16px' }}
                      >
                        Voltar
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                /* Cliente Conectado: Perfil, Fidelidade e Histórico de Pedidos */
                <>
                  {/* Card do Cliente Logado */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fff' }}>
                        {loggedCustomer.name || 'Cliente Nuu'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        WhatsApp: <strong>{loggedCustomer.phone}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomerLogout}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Sair ou usar outro número"
                    >
                      <LogOut size={13} /> Sair
                    </button>
                  </div>

                  {/* Cartão de Fidelidade do Cliente */}
                  {identifiedCustomer && (
                    <div style={{ marginTop: '2px' }}>
                      <LoyaltyCard customer={identifiedCustomer} />
                    </div>
                  )}

                  {/* Lista de Pedidos Realizados */}
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#eab308" /> Meus Pedidos ({customerOrdersList.length})
                    </h4>

                    {customerOrdersList.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem 1rem',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255,255,255,0.1)'
                      }}>
                        <ShoppingBag size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                          Você ainda não possui pedidos registrados com este WhatsApp.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomerModalOpen(false);
                            setCheckoutStep('menu');
                          }}
                          className="btn-primary"
                          style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.8rem' }}
                        >
                          Ver Cardápio e Pedir
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {customerOrdersList.map(order => {
                          const isLive = ['pending', 'preparing', 'shipping'].includes(order.status);
                          const isCanceled = order.status === 'canceled';
                          const isDelivered = order.status === 'delivered';

                          return (
                            <div 
                              key={order.id}
                              style={{
                                backgroundColor: isCanceled ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.03)',
                                border: isCanceled 
                                  ? '1px solid rgba(239, 68, 68, 0.3)' 
                                  : isLive 
                                    ? '1px solid rgba(234, 179, 8, 0.4)' 
                                    : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ color: '#fff', fontSize: '0.88rem' }}>#{order.id}</strong>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isCanceled 
                                    ? 'rgba(239, 68, 68, 0.2)' 
                                    : isDelivered 
                                      ? 'rgba(34, 197, 94, 0.2)' 
                                      : 'rgba(234, 179, 8, 0.2)',
                                  color: isCanceled 
                                    ? '#f87171' 
                                    : isDelivered 
                                      ? '#4ade80' 
                                      : '#facc15'
                                }}>
                                  {order.status === 'pending' && 'Recebido'}
                                  {order.status === 'preparing' && 'Na Chapa 🔥'}
                                  {order.status === 'shipping' && (order.type === 'pickup' ? 'No Balcão 🏪' : 'A Caminho 🛵')}
                                  {order.status === 'delivered' && 'Entregue 🎉'}
                                  {order.status === 'canceled' && 'Cancelado ❌'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {order.items?.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                              </div>

                              {isCanceled && order.cancelReason && (
                                <div style={{ fontSize: '0.74rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 8px', borderRadius: '6px' }}>
                                  Motivo: {order.cancelReason}
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#eab308' }}>
                                  R$ {Number(order.total || 0).toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTrackingOrder(order);
                                    setTrackingBannerDismissed(false);
                                    try {
                                      localStorage.setItem('nuu_customer_last_order_id', order.id.toString());
                                    } catch (e) {}
                                    setIsCustomerModalOpen(false);
                                    setCheckoutStep('tracking');
                                  }}
                                  style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  Acompanhar Pedido <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
