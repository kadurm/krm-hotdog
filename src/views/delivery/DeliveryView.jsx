import React, { useState, useEffect } from 'react';
import { useSystem } from '../../contexts/SystemContext';
import LoyaltyCard from '../../components/LoyaltyCard';
import { 
  ShoppingBag, Plus, Minus, Trash2, 
  Clock, Utensils, ChevronRight, X, Sparkles,
  ChevronUp, ChevronDown, CheckCircle,
  LayoutGrid, MonitorPlay, Copy, Check, Bike, Store, MessageCircle,
  Tag, Award, AlertCircle, MapPin, Search, Gift, Phone, Navigation
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
  setCheckoutStep: propSetCheckoutStep
}) {
  const { 
    products, 
    createOrder, 
    orders, 
    complements = [],
    storeSettings,
    deliveryNeighborhoods = [],
    deliveryRadiuses = [],
    validateCoupon,
    lookupCustomer,
    saveCustomer,
    calculateDeliveryFee,
    isStoreOpenNow
  } = useSystem();
  
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
  const [productQty, setProductQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  
  // Agrupamento dinâmico de complementos e adicionais
  const breadOptions = complements.filter(c => c.group === 'bread');
  const creamyOptions = complements.filter(c => c.group === 'creamy');
  const meltedOptions = complements.filter(c => c.group === 'melted');
  const sideOptions = complements.filter(c => c.group === 'side');
  const extraOptions = complements.filter(c => c.category === 'extra' || c.group === 'extras');

  // Estados dinâmicos de personalização do lanche
  const [selectedBread, setSelectedBread] = useState('Pão 3 Queijos');
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
  const [address, setAddress] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [deliverySelectionMode, setDeliverySelectionMode] = useState('neighborhood'); // 'neighborhood' | 'radius'
  const [selectedDistanceKm, setSelectedDistanceKm] = useState(null);
  const [selectedRadiusId, setSelectedRadiusId] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccessMessage, setGpsSuccessMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [changeFor, setChangeFor] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
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
        setSelectedDistanceKm(distance);
        setDeliverySelectionMode('radius');
        
        const radiusesList = (deliveryRadiuses && deliveryRadiuses.length > 0)
          ? deliveryRadiuses
          : (storeSettings?.deliveryRadius || []);
        const sorted = [...radiusesList].sort((a, b) => a.maxKm - b.maxKm);
        const match = sorted.find(r => distance <= r.maxKm);
        if (match) {
          setSelectedRadiusId(match.id);
          setSelectedNeighborhood(`Raio até ${match.maxKm} km (${match.description || 'Montes Claros'})`);
        } else {
          setSelectedNeighborhood(`Acima de 12 km (~${distance} km)`);
        }
        setGpsSuccessMessage(`📍 GPS Detectado: você está a ~${distance} km da loja (Rua Agapanto, 264)`);
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

  // Sincronização em tempo real do pedido de rastreamento com alterações do chapeiro/admin
  useEffect(() => {
    if (activeTrackingOrder?.id && orders?.length > 0) {
      const liveOrder = orders.find(o => String(o.id) === String(activeTrackingOrder.id));
      if (liveOrder && liveOrder.status !== activeTrackingOrder.status) {
        setActiveTrackingOrder(liveOrder);
      }
    }
  }, [orders, activeTrackingOrder?.id, activeTrackingOrder?.status]);

  // Lista consolidada de bairros para entrega (Montes Claros) com quilometragem
  const availableNeighborhoods = React.useMemo(() => {
    if (deliveryNeighborhoods && deliveryNeighborhoods.length > 0) {
      const activeList = deliveryNeighborhoods.filter(n => n.active !== false);
      if (activeList.length > 0) {
        return activeList.map(n => ({ 
          name: n.name, 
          fee: Number(n.fee) || 0,
          distanceKm: n.distanceKm || null
        }));
      }
    }
    if (storeSettings?.deliveryFeesByNeighborhood) {
      return Object.entries(storeSettings.deliveryFeesByNeighborhood).map(([name, fee]) => ({
        name,
        fee: Number(fee) || 0,
        distanceKm: null
      }));
    }
    return [];
  }, [deliveryNeighborhoods, storeSettings?.deliveryFeesByNeighborhood]);

  // Lista consolidada de faixas de raio por quilometragem (KM)
  const availableRadiuses = React.useMemo(() => {
    const list = (deliveryRadiuses && deliveryRadiuses.length > 0)
      ? deliveryRadiuses
      : (storeSettings?.deliveryRadius || []);
    return list.filter(r => r.active !== false).sort((a, b) => a.maxKm - b.maxKm);
  }, [deliveryRadiuses, storeSettings?.deliveryRadius]);

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
    setSelectedBread(activeBread ? activeBread.name : (breadOptions[0]?.name || 'Pão 3 Queijos'));

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
      if (selectedMelted) nameDetails.push(selectedMelted);
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
  
  // Taxa de entrega dinâmica por bairro, raio/distância ou retirada (sempre numérica e segura)
  const deliveryFeeResult = deliveryType === 'delivery' 
    ? calculateDeliveryFee({ 
        neighborhoodName: selectedNeighborhood, 
        distanceKm: selectedDistanceKm,
        subtotal: cartTotal 
      })
    : { fee: 0, isFree: true, reason: 'Retirada no Balcão' };

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
      alert('Digite um número de telefone/WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }
    const found = lookupCustomer(clean);
    if (found) {
      setIdentifiedCustomer(found);
      setCustomerName(found.name || '');
      setPhone(found.phone || clean);
      if (found.address) setAddress(found.address);
      if (found.neighborhood) setSelectedNeighborhood(found.neighborhood);
      alert(`Bem-vindo de volta, ${found.name || 'Cliente'}! Seus dados foram preenchidos automaticamente.`);
    } else {
      setPhone(clean);
      alert('Telefone registrado. Finalize seu primeiro pedido para acumular selos no Cartão Fidelidade!');
    }
  };

  // Resgate de Fidelidade
  const handleApplyLoyaltyReward = () => {
    const rewardVal = storeSettings?.loyalty?.rewardValue || 20;
    setLoyaltyDiscount(rewardVal);
    alert(`Parabéns! Recompensa fidelidade de R$ ${rewardVal.toFixed(2)} aplicada no seu pedido! 🎉`);
  };

  // Envio do Pedido
  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Seu carrinho está vazio. Adicione itens antes de finalizar o pedido!');
      return;
    }

    if (!customerName.trim()) {
      alert('Por favor, informe seu nome para identificação do pedido.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Por favor, informe seu número de WhatsApp com DDD (mínimo 10 dígitos, ex: 31988887777).');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!selectedNeighborhood && !selectedDistanceKm) {
        alert('Por favor, selecione seu bairro ou a faixa de distância para entrega.');
        return;
      }
      if (!address.trim()) {
        alert('Por favor, digite seu endereço completo (rua, número, complemento e ponto de referência).');
        return;
      }
    }

    const finalPayment = paymentMethod === 'Dinheiro' && changeFor 
      ? `Dinheiro (Troco p/ R$ ${changeFor})` 
      : paymentMethod;

    const created = createOrder({
      customerName: customerName.trim(), 
      phone: cleanPhone, 
      type: deliveryType, 
      address: deliveryType === 'delivery' ? address.trim() : 'Retirada no Balcão',
      neighborhood: deliveryType === 'delivery' ? (selectedNeighborhood || (selectedDistanceKm ? `Raio até ${selectedDistanceKm} km` : 'Montes Claros')) : null,
      distanceKm: deliveryType === 'delivery' ? selectedDistanceKm : null,
      paymentMethod: finalPayment,
      changeFor: paymentMethod === 'Dinheiro' && changeFor ? changeFor : null,
      items: cart, 
      deliveryFee: parseFloat(Number(deliveryFee).toFixed(2)),
      discount: parseFloat(Number(totalDiscount).toFixed(2)),
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      total: parseFloat(Number(grandTotal).toFixed(2))
    });

    // Salva ou atualiza a memória do cliente e adiciona selo de fidelidade
    saveCustomer({
      phone: cleanPhone,
      name: customerName.trim(),
      address: deliveryType === 'delivery' ? address.trim() : (identifiedCustomer?.address || ''),
      neighborhood: deliveryType === 'delivery' ? selectedNeighborhood : (identifiedCustomer?.neighborhood || '')
    });

    setCart([]);
    setAppliedCoupon(null);
    setLoyaltyDiscount(0);
    setActiveTrackingOrder(created);
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

  const isStoreOpen = typeof isStoreOpenNow === 'function' ? isStoreOpenNow() : (storeSettings?.isOpen ?? true);

  // Categoria ativa a ser destacada nas pills
  const activePillId = viewMode === 'slider'
    ? (selectedCategory === 'todos' ? (activeProduct?.category || 'todos') : selectedCategory)
    : selectedCategory;

  return (
    <div 
      className="app-container"
      ref={mainContainerRef}
      style={{ 
        backgroundColor: backgroundColor,
        transition: 'background-color 0.8s ease-in-out',
        scrollBehavior: 'smooth',
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        overflowY: (viewMode === 'grid' || checkoutStep !== 'menu' || isCartOpen) ? 'auto' : 'hidden', 
        overflowX: 'hidden'
      }}
    >
      {/* BANNER DE STATUS DA LOJA */}
      {!isStoreOpen && checkoutStep === 'menu' && (
        <div style={{
          backgroundColor: '#991b1b',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '0.82rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
        }}>
          <AlertCircle size={16} />
          <span>
            {storeSettings?.closedNotice || 'No momento a loja está fechada para novos pedidos.'} 
            {` (Atendimento: todos os dias das ${storeSettings?.openTime || '19:00'} às ${storeSettings?.closeTime || '00:00'})`}
          </span>
        </div>
      )}

      {/* NOVO: CONTROLES FLUTUANTES PARA MOBILE & DESKTOP */}
      {checkoutStep === 'menu' && (
        <div 
          className="mobile-floating-header" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            padding: '12px 16px',
            backgroundColor: viewMode === 'grid' ? 'rgba(18, 18, 18, 0.92)' : 'transparent',
            backdropFilter: viewMode === 'grid' ? 'blur(12px)' : 'none',
            borderBottom: viewMode === 'grid' ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
            transition: 'background-color 0.3s ease, border-color 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '99px',
                backgroundColor: isStoreOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${isStoreOpen ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: isStoreOpen ? '#4ade80' : '#f87171',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isStoreOpen ? '#22c55e' : '#ef4444'
                }} />
                <span>{isStoreOpen ? `Aberto • ~${storeSettings?.estimatedTime || '35-50 min'}` : `Fechado • Abre às ${storeSettings?.openTime || '19:00'}`}</span>
              </div>
            </div>
            
            {/* Controles da direita (Acompanhar, Grade e Carrinho) */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {activeTrackingOrder && activeTrackingOrder.status !== 'delivered' && (
                <button 
                  onClick={() => setCheckoutStep('tracking')}
                  style={{ 
                    background: 'rgba(234, 179, 8, 0.25)', 
                    border: '1px solid #eab308', 
                    color: '#eab308', 
                    borderRadius: '99px', 
                    padding: '6px 12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    cursor: 'pointer' 
                  }}
                >
                  <Clock size={13} />
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
                      objectFit: 'contain',
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
                  disabled={!isStoreOpen}
                  className="btn-primary" 
                  style={{ 
                    padding: '12px 28px', 
                    fontSize: '1rem', 
                    backgroundColor: '#fff', 
                    color: '#000', 
                    fontWeight: 800,
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    cursor: isStoreOpen ? 'pointer' : 'not-allowed',
                    opacity: isStoreOpen ? 1 : 0.6
                  }}
                >
                  {isStoreOpen ? 'Pedir Agora' : 'Loja Fechada'}
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
            padding: '9.5rem 1.5rem 6rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem'
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
                          style={{ 
                            width: '100%', 
                            height: '200px', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            marginBottom: '1.25rem',
                            position: 'relative',
                            backgroundColor: '#0a0a0a',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                objectPosition: 'center', 
                                display: 'block',
                                filter: isPaused ? 'grayscale(80%)' : 'none',
                                transition: 'transform 0.4s ease'
                              }} 
                            />
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
                              Pausado
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
                            disabled={isPaused || !isStoreOpen}
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
                              cursor: (isPaused || !isStoreOpen) ? 'not-allowed' : 'pointer',
                              opacity: (isPaused || !isStoreOpen) ? 0.5 : 1
                            }}
                          >
                            {!isStoreOpen ? 'Fechado' : isPaused ? 'Esgotado' : 'Pedir'}
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

      {/* FORMULÁRIO DE CHECKOUT */}
      {checkoutStep === 'form' && (
        <div style={{ maxWidth: '600px', margin: '2rem auto 4rem auto', width: '100%', padding: '0 1.5rem' }} className="animate-fade-in">
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Finalizar Pedido</h2>
              <button 
                onClick={() => setCheckoutStep('menu')} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
              >
                Voltar ao Cardápio
              </button>
            </div>

            {/* SEÇÃO DE LOGIN / MEMÓRIA DO CLIENTE VIA TELEFONE */}
            <div style={{
              backgroundColor: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#fde047', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} /> Já comprou com a gente? Busque seus dados
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <input
                  type="tel"
                  placeholder="DDD + Seu WhatsApp"
                  value={customerSearchPhone}
                  onChange={(e) => setCustomerSearchPhone(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  type="button"
                  onClick={handleLookupPhone}
                  style={{
                    backgroundColor: '#eab308',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Search size={14} /> Buscar
                </button>
              </div>

              {/* Exibe o Cartão Fidelidade se o cliente for identificado */}
              {identifiedCustomer && (
                <div style={{ marginTop: '12px' }}>
                  <LoyaltyCard customer={identifiedCustomer} onApplyReward={handleApplyLoyaltyReward} />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome Completo</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Carlos Eduardo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Telefone / WhatsApp</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="Ex: (31) 98888-7777"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tipo de Entrega</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ flex: 1, padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: deliveryType === 'delivery' ? 'var(--color-brand-glow)' : 'transparent', borderColor: deliveryType === 'delivery' ? 'var(--color-brand)' : 'var(--border-glass)' }}>
                    <input 
                      type="radio" 
                      name="deliveryType" 
                      value="delivery"
                      checked={deliveryType === 'delivery'}
                      onChange={() => setDeliveryType('delivery')}
                      style={{ accentColor: 'var(--color-brand)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Delivery</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {deliveryFee === 0 ? '🎉 Frete Grátis!' : `+ R$ ${deliveryFee.toFixed(2)}`}
                      </div>
                    </div>
                  </label>
                  <label style={{ flex: 1, padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: deliveryType === 'pickup' ? 'var(--color-brand-glow)' : 'transparent', borderColor: deliveryType === 'pickup' ? 'var(--color-brand)' : 'var(--border-glass)' }}>
                    <input 
                      type="radio" 
                      name="deliveryType" 
                      value="pickup"
                      checked={deliveryType === 'pickup'}
                      onChange={() => setDeliveryType('pickup')}
                      style={{ accentColor: 'var(--color-brand)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Retirada</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem taxa de entrega</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Se for delivery, seleciona bairro / raio / gps e digita endereço */}
              {deliveryType === 'delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  {/* Origem da Loja */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    fontSize: '0.8rem',
                    color: '#facc15',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <MapPin size={16} color="#eab308" style={{ flexShrink: 0 }} />
                    <div style={{ lineHeight: '1.3' }}>
                      <strong>Ponto de Saída:</strong> {storeSettings?.storeAddress || 'Rua Agapanto, 264 - Sagrada Família, Montes Claros - MG'}
                      <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                        Taxas de entrega calculadas conforme a quilometragem / raio de distância da loja.
                      </div>
                    </div>
                  </div>

                  {/* Alternador de Modo de Seleção (Bairros de Montes Claros vs Faixa de Km) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    padding: '4px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setDeliverySelectionMode('neighborhood')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: deliverySelectionMode === 'neighborhood' ? 'var(--color-brand)' : 'transparent',
                        color: deliverySelectionMode === 'neighborhood' ? '#000' : '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🏙️ Bairro (Montes Claros)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliverySelectionMode('radius')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: deliverySelectionMode === 'radius' ? 'var(--color-brand)' : 'transparent',
                        color: deliverySelectionMode === 'radius' ? '#000' : '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📏 Raio por Km
                    </button>
                  </div>

                  {/* Botão de Localização GPS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        color: '#38bdf8',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Navigation size={15} />
                      <span>{gpsLoading ? 'Calculando distância via GPS...' : '📍 Detectar minha distância exata via GPS'}</span>
                    </button>

                    {gpsSuccessMessage && (
                      <div style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} /> {gpsSuccessMessage}
                      </div>
                    )}
                    {gpsError && (
                      <div style={{ fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={13} /> {gpsError}
                      </div>
                    )}
                  </div>

                  {/* Seleção por Bairro de Montes Claros */}
                  {deliverySelectionMode === 'neighborhood' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className="animate-fade-in">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Selecione seu Bairro (Montes Claros)
                      </label>
                      <select
                        value={selectedNeighborhood}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedNeighborhood(val);
                          const found = availableNeighborhoods.find(n => n.name === val);
                          if (found && found.distanceKm) {
                            setSelectedDistanceKm(found.distanceKm);
                          } else {
                            setSelectedDistanceKm(null);
                          }
                        }}
                        required
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-glass)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: '#fff',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Selecione o seu bairro...</option>
                        {availableNeighborhoods.map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name} {item.distanceKm ? `(~${item.distanceKm} km)` : ''} — R$ {item.fee.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Seleção por Faixa de Raio / Quilometragem (KM) */}
                  {deliverySelectionMode === 'radius' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className="animate-fade-in">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Selecione a Faixa de Distância da Loja (Rua Agapanto)
                      </label>
                      <select
                        value={selectedRadiusId}
                        onChange={(e) => {
                          const radId = e.target.value;
                          setSelectedRadiusId(radId);
                          const found = availableRadiuses.find(r => r.id === radId);
                          if (found) {
                            setSelectedDistanceKm(found.maxKm);
                            setSelectedNeighborhood(found.description || `Raio até ${found.maxKm} km`);
                          }
                        }}
                        required
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-glass)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: '#fff',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Selecione a distância até a sua casa...</option>
                        {availableRadiuses.map((item) => (
                          <option key={item.id} value={item.id}>
                            Até {item.maxKm} km ({item.description}) — R$ {item.fee.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Badge Informativo da Taxa Calculada */}
                  {(selectedNeighborhood || selectedDistanceKm !== null) && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.83rem'
                    }}>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>
                        🛵 {deliveryFeeResult?.reason || 'Taxa calculada:'}
                      </span>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                        {deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`}
                      </strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Endereço Completo</label>
                    <textarea 
                      required 
                      rows="3"
                      placeholder="Rua, número, complemento (ex: Apto 201) e ponto de referência"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* CAMPO DE CUPOM DE DESCONTO */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)'
              }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Cupom de Desconto
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Digite o cupom (ex: NUU10)"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      textTransform: 'uppercase',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Aplicar
                  </button>
                </div>
                {couponFeedback && (
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '6px',
                    color: couponFeedback.success ? '#4ade80' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {couponFeedback.success ? <Check size={12} /> : <AlertCircle size={12} />}
                    <span>{couponFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* FORMA DE PAGAMENTO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Forma de Pagamento</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Pix">⚡ Pix (Aprovação imediata)</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito (na maquininha)</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito (na maquininha)</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                </select>

                {paymentMethod === 'Pix' && (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'rgba(234, 179, 8, 0.08)', 
                    border: '1px solid rgba(234, 179, 8, 0.25)', 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px' 
                  }} className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#eab308', fontWeight: 600 }}>Chave Pix Oficial:</span>
                      <button 
                        type="button" 
                        onClick={handleCopyPix}
                        style={{ 
                          background: pixCopied ? 'var(--color-success)' : 'rgba(234, 179, 8, 0.25)', 
                          color: '#fff', 
                          border: 'none', 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px' 
                        }}
                      >
                        {pixCopied ? <Check size={12} /> : <Copy size={12} />}
                        {pixCopied ? 'Copiado!' : 'Copiar Chave'}
                      </button>
                    </div>
                    <code style={{ fontSize: '0.85rem', color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '5px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                      {officialPixKey}
                    </code>
                  </div>
                )}

                {paymentMethod === 'Dinheiro' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }} className="animate-fade-in">
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Precisa de troco? Para quanto?
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: R$ 50,00 ou Não preciso de troco"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Resumo de Valores */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Itens do Carrinho:</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Taxa de Entrega:</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#4ade80' }}>
                    <span>Desconto Total:</span>
                    <span>- R$ {totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand)', marginTop: '6px' }}>
                  <span>Total Geral:</span>
                  <span>R$ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                Confirmar e Enviar Pedido
              </button>
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
          <div style={{ maxWidth: '620px', margin: '2rem auto 4rem auto', width: '100%', padding: '0 1.5rem' }} className="animate-fade-in">
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

              {/* Chave Pix se Pendente */}
              {activeTrackingOrder.paymentMethod.includes('Pix') && activeTrackingOrder.status === 'pending' && (
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

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    try {
                      localStorage.removeItem('nuu_customer_last_order_id');
                    } catch(e) {}
                    setActiveTrackingOrder(null);
                    setCheckoutStep('menu');
                  }} 
                  className="btn-primary"
                >
                  Fazer Novo Pedido
                </button>
                <button 
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
              maxHeight: 'min(86vh, 86dvh)',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Personalizar Item</h3>
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
                <div style={{ width: '100%', height: '130px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                  <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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

                  {/* Queijo Fatiado */}
                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Queijo Fatiado:</strong>
                    <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {meltedOptions.map(opt => {
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
                              backgroundColor: selectedMelted === opt.name && !isPaused ? 'rgba(255,255,255,0.06)' : 'transparent',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: selectedMelted === opt.name && !isPaused ? '1px solid var(--border-glass)' : '1px solid transparent'
                            }}
                          >
                            <input 
                              type="radio" 
                              name="melted" 
                              disabled={isPaused}
                              checked={selectedMelted === opt.name && !isPaused} 
                              onChange={() => !isPaused && setSelectedMelted(opt.name)} 
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
              <button onClick={handleAddToCart} className="btn-primary" style={{ flex: '1 1 auto', justifyContent: 'center', padding: '10px 18px' }}>
                Adicionar • R$ {currentTotalPrice.toFixed(2)}
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
            <div className="modal-header" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="var(--color-brand)" /> Carrinho
              </h3>
              <button onClick={() => setIsCartOpen(false)} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
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

    </div>
  );
}
