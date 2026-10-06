import React, { useState, useEffect } from 'react';
import { useSystem } from '../../contexts/SystemContext';
import { 
  ShoppingBag, Plus, Minus, Trash2, 
  Clock, Utensils, ChevronRight, X, Sparkles,
  ChevronUp, ChevronDown, CheckCircle,
  LayoutGrid, MonitorPlay, Copy, Check, Bike, Store, MessageCircle
} from 'lucide-react';

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
  const { products, createOrder, orders, complements = [] } = useSystem();
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [internalViewMode, setInternalViewMode] = useState('slider');
  const [internalCart, setInternalCart] = useState([]);
  const [internalIsCartOpen, setInternalIsCartOpen] = useState(false);
  const [internalCheckoutStep, setInternalCheckoutStep] = useState('menu');

  const viewMode = propViewMode !== undefined ? propViewMode : internalViewMode;
  const setViewMode = propSetViewMode || setInternalViewMode;
  const cart = propCart !== undefined ? propCart : internalCart;
  const setCart = propSetCart || setInternalCart;
  const isCartOpen = propIsCartOpen !== undefined ? propIsCartOpen : internalIsCartOpen;
  const setIsCartOpen = propSetIsCartOpen || setInternalIsCartOpen;
  const checkoutStep = propCheckoutStep !== undefined ? propCheckoutStep : internalCheckoutStep;
  const setCheckoutStep = propSetCheckoutStep || setInternalCheckoutStep;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQty, setProductQty] = useState(1);
  
  // Agrupamento dinâmico de complementos e adicionais
  const creamyOptions = complements.filter(c => c.group === 'creamy');
  const meltedOptions = complements.filter(c => c.group === 'melted');
  const sideOptions = complements.filter(c => c.group === 'side');
  const extraOptions = complements.filter(c => c.category === 'extra' || c.group === 'extras');

  // Estados dinâmicos de personalização do lanche
  const [selectedCreamy, setSelectedCreamy] = useState('Catupiry');
  const [selectedMelted, setSelectedMelted] = useState('Mussarela');
  const [selectedSide, setSelectedSide] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState([]); // array de IDs de adicionais extras selecionados

  // Cálculo de adicionais ativos selecionados
  const activeSelectedExtras = extraOptions.filter(e => selectedExtras.includes(e.id) && e.active);
  const extrasTotal = activeSelectedExtras.reduce((acc, e) => acc + (e.price || 0), 0);
  const currentUnitPrice = selectedProduct ? (selectedProduct.price + extrasTotal) : 0;
  const currentTotalPrice = currentUnitPrice * productQty;

  // 1. Cria um histórico falso sempre que o carrinho ou o modal do lanche abrirem
  useEffect(() => {
    if (isCartOpen || selectedProduct) {
      window.history.pushState({ modalOpen: true }, '');
    }
  }, [isCartOpen, selectedProduct]);

  // 2. Escuta o botão voltar do celular (evento 'popstate')
  useEffect(() => {
    const handlePopState = () => {
      if (isCartOpen) {
        setIsCartOpen(false); // Fecha o carrinho
      } else if (selectedProduct) {
        setSelectedProduct(null); // Fecha o modal de montagem
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCartOpen, selectedProduct]);

  // 2. Mapeamos as cores e emojis da animação usando os produtos do sistema!
  const visualProducts = products.filter(p => p.active).map((p, index) => {
    const themes = {
      1: { color: '#eab308', floaties: ['🥓', '🌭', '🧀'] }, // Prensadinho Bacon
      2: { color: '#f97316', floaties: ['🍗', '🧀', '🔥'] }, // Prensado Frango
      3: { color: '#b91c1c', floaties: ['🥩', '🔥', '🥓'] }, // Prensadão Costela
      4: { color: '#84cc16', floaties: ['🍖', '🌿', '🔥'] }, // Pernil
      5: { color: '#a16207', floaties: ['🥩', '🧀', '🔥'] }, // Carne seca
    };
    
    const theme = themes[p.id] || { color: '#333333', floaties: ['✨', '🍔', '🥤'] };
    return { ...p, ...theme, slideIndex: index };
  });

  // Checkout States
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [changeFor, setChangeFor] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(() => {
    try {
      const savedId = localStorage.getItem('nuu_customer_last_order_id');
      if (savedId) {
        return orders.find(o => o.id === parseInt(savedId)) || null;
      }
    } catch (e) {}
    return null;
  });

  // Manter rastreamento atualizado em tempo real sincronizado com a chapa/admin
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('nuu_customer_last_order_id');
      if (savedId) {
        const found = orders.find(o => o.id === parseInt(savedId));
        if (found) {
          if (!activeTrackingOrder || activeTrackingOrder.id !== found.id || activeTrackingOrder.status !== found.status) {
            setActiveTrackingOrder(found);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText('pix@nuuprensado.com');
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  // Navegação do Slider
  const nextSlide = () => setActiveSlide((prev) => (prev === visualProducts.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? visualProducts.length - 1 : prev - 1));

  // Estados para gerenciar o "swipe" estilo Reels
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Distância mínima (em pixels) para considerar um arraste válido
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    // Captura apenas o primeiro dedo (evita bugs de multitoque)
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    // Atualiza a posição final do dedo enquanto ele se move
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Calcula a distância vertical
    const distanceY = touchStart.y - touchEnd.y;
    
    // Verifica se arrastou o suficiente e se o movimento foi predominantemente vertical
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    
    // Garante que não foi um arraste horizontal (para evitar conflitos com sliders futuros)
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(touchStart.x - touchEnd.x);

    if (isVerticalSwipe) {
      if (isUpSwipe) {
        nextSlide(); // Arrastou para cima -> Vai para o próximo lanche
      } else if (isDownSwipe) {
        prevSlide(); // Arrastou para baixo -> Volta pro lanche anterior
      }
    }
  };

  // Lógica do Carrinho
  const handleOpenProduct = (product) => {
    if (!product.active) return; // Não abre se o produto estiver pausado
    setSelectedProduct(product);
    setProductQty(1);
    setSelectedExtras([]);
    setSelectedSide(false);

    // Seleciona a primeira opção ativa de queijo cremoso
    const activeCreamy = creamyOptions.find(c => c.active);
    setSelectedCreamy(activeCreamy ? activeCreamy.name : (creamyOptions[0]?.name || 'Catupiry'));

    // Seleciona a primeira opção ativa de queijo fatiado
    const activeMelted = meltedOptions.find(c => c.active);
    setSelectedMelted(activeMelted ? activeMelted.name : (meltedOptions[0]?.name || 'Mussarela'));
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedProduct.active) return;

    let nameDetails = [];
    
    // Se o produto tiver opções customizáveis (ex: queijos e vinagrete)
    if (selectedProduct.hasCustomOptions) {
      if (selectedCreamy) nameDetails.push(selectedCreamy);
      if (selectedMelted) nameDetails.push(selectedMelted);
      if (selectedSide) {
        const sideName = sideOptions[0]?.name || 'Vinagrete';
        nameDetails.push(`+ ${sideName}`);
      }
    }

    // Adiciona os adicionais extras ativos selecionados
    activeSelectedExtras.forEach(extra => {
      nameDetails.push(`+ ${extra.name}`);
    });

    const itemName = selectedProduct.name + (nameDetails.length > 0 ? ` (${nameDetails.join(' | ')})` : '');
    const finalUnitPrice = currentUnitPrice; // Preço do produto + adicionais extras selecionados

    const existingIndex = cart.findIndex(item => item.name === itemName);
    
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += productQty;
      setCart(updated);
    } else {
      setCart([...cart, { productId: selectedProduct.id, name: itemName, price: finalUnitPrice, quantity: productQty }]);
    }
    
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (index, amount) => {
    const updated = [...cart];
    updated[index].quantity += amount;
    if (updated[index].quantity <= 0) updated.splice(index, 1);
    setCart(updated);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = deliveryType === 'delivery' ? 7.00 : 0.00;
  const grandTotal = cartTotal + deliveryFee;

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const finalPayment = paymentMethod === 'Dinheiro' && changeFor ? `Dinheiro (Troco p/ R$ ${changeFor})` : paymentMethod;
    const created = createOrder({
      customerName, 
      phone, 
      type: deliveryType, 
      address: deliveryType === 'delivery' ? address : 'Retirada no Balcão',
      paymentMethod: finalPayment,
      changeFor: paymentMethod === 'Dinheiro' && changeFor ? changeFor : null,
      items: cart, 
      total: parseFloat(grandTotal.toFixed(2))
    });
    setCart([]);
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

    if (currentLevel >= targetLevel) {
      return 'step-active';
    }
    return 'step-inactive';
  };

  // Prevenção de tela preta (Crash fix)
  if (!products || visualProducts.length === 0) {
    return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Carregando cardápio...</div>;
  }

  // Garanta que visualProducts tenha itens antes de tentar pegar o slide ativo
  const activeProduct = visualProducts.length > 0 ? (visualProducts[activeSlide] || visualProducts[0]) : null;

  // Define a cor de fundo dependendo do modo
  const backgroundColor = checkoutStep !== 'menu' ? 'var(--bg-primary)' 
                        : viewMode === 'grid' ? '#121212' // Fundo escuro premium para a grade
                        : (activeProduct ? activeProduct.color : '#121212');

  return (
    <div 
      className="app-container"
      style={{ 
        backgroundColor: backgroundColor,
        transition: 'background-color 0.8s ease-in-out',
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
      {/* NOVO: CONTROLES FLUTUANTES PARA MOBILE */}
      {checkoutStep === 'menu' && (
        <div className="mobile-floating-header">
          {/* Logo Real em Imagem */}
          <img 
            src="/logoNuuPrensado-semfundo.png" 
            alt="Nuu Prensado Logo" 
            style={{ 
              height: '45px', 
              objectFit: 'contain', 
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
            }} 
          />
          
          {/* Controles da direita (Acompanhar, Grade e Carrinho) */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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

            <button 
              onClick={() => setViewMode(prev => prev === 'slider' ? 'grid' : 'slider')}
              style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer' }}
            >
              {viewMode === 'slider' ? <LayoutGrid size={20} /> : <MonitorPlay size={20} />}
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer', position: 'relative' }}
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#eab308', color: '#000', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TELA PRINCIPAL (SLIDER IMERSIVO) */}
      {checkoutStep === 'menu' && viewMode === 'slider' && activeProduct && (
        <div 
          className="immersive-slider" 
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem 2rem 3rem', position: 'relative', height: 'calc(100vh - 80px)' }}
        >
          
          {/* Indicadores Laterais (001, 002, etc) */}
          <div className="slider-indicator" style={{ position: 'absolute', bottom: '2rem', left: '3rem', color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem', fontWeight: 300, letterSpacing: '2px' }}>
            00{activeSlide + 1} / 00{visualProducts.length}
          </div>

          <div className="slider-nav-dots" style={{ position: 'absolute', left: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
            {visualProducts.map((_, i) => (
               <div key={i} onClick={() => setActiveSlide(i)} className={`dot ${i === activeSlide ? 'active' : ''}`} style={{ width: i === activeSlide ? '12px' : '8px', height: i === activeSlide ? '12px' : '8px', borderRadius: '50%', backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: '0.3s' }} />
            ))}
          </div>

          {/* Área Central: Imagem do Produto */}
          <div className="slider-image-area" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Elementos flutuantes simulando 3D */}
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
            
            {/* IMAGEM PRINCIPAL DO PRODUTO */}
            <div className="product-image-container animate-product-enter" key={activeProduct.id}>
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

          {/* Área da Direita: Textos e Botão */}
          <div className="slider-text-area animate-fade-in-up" style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', color: '#fff', zIndex: 10 }} key={`text-${activeProduct.id}`}>
            <h1 className="product-title" style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem', textShadow: '0 10px 30px rgba(0,0,0,0.3)', maxWidth: '380px' }}>
              {activeProduct.name}
            </h1>
            <p className="product-desc" style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', lineHeight: 1.5, maxWidth: '340px' }}>
              {activeProduct.description}
            </p>
            
            <div className="slider-action-row" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <span className="product-price" style={{ fontSize: '2.2rem', fontWeight: 800, textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                R$ {activeProduct.price.toFixed(2)}
              </span>
              <button 
                className="add-btn"
                onClick={() => handleOpenProduct(activeProduct)}
                style={{ 
                  backgroundColor: '#fff', border: 'none', color: activeProduct.color, padding: '14px 28px', 
                  borderRadius: '99px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
                }}
                onMouseOver={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; }}
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Setas para passar slide */}
          <div className="slider-nav-arrows" style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
            <button onClick={prevSlide} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(5px)' }}><ChevronUp size={24} /></button>
            <button onClick={nextSlide} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(5px)' }}><ChevronDown size={24} /></button>
          </div>

        </div>
      )}

      {/* TELA DE GRADE (GRID VIEW) */}
      {checkoutStep === 'menu' && viewMode === 'grid' && (
        <div className="grid-view-container animate-fade-in-up" style={{ padding: '2rem 4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', flex: 1, paddingBottom: '4rem' }}>
          {products.map((product) => {
            const themes = {
              1: { color: '#eab308', floaties: ['🥓', '🌭', '🧀'] },
              2: { color: '#f97316', floaties: ['🍗', '🧀', '🔥'] },
              3: { color: '#b91c1c', floaties: ['🥩', '🔥', '🥓'] },
              4: { color: '#84cc16', floaties: ['🍖', '🌿', '🔥'] },
              5: { color: '#a16207', floaties: ['🥩', '🧀', '🔥'] },
            };
            const theme = themes[product.id] || { color: '#333333', floaties: ['✨', '🍔', '🥤'] };
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
                  transition: 'transform 0.3s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => { if (!isPaused) e.currentTarget.style.transform = 'translateY(-10px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Foto Real do Produto na Grade */}
                <div 
                  className="grid-card-image"
                  style={{ 
                    width: '100%', 
                    height: '190px', 
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
                      className="grid-card-img"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      {theme.floaties?.[0] || '🌭'}
                    </div>
                  )}
                  
                  {/* Badge de status ou emoji */}
                  {isPaused ? (
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
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                      }}
                    >
                      ESGOTADO
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px', 
                        background: 'rgba(0,0,0,0.65)', 
                        backdropFilter: 'blur(6px)', 
                        padding: '4px 8px', 
                        borderRadius: '20px', 
                        fontSize: '1rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      {theme.floaties?.[0] || '🌭'}
                    </span>
                  )}
                </div>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: isPaused ? 'var(--text-secondary)' : theme.color }}>
                  {product.name}
                </h3>
                
                <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, lineHeight: 1.5 }}>
                  {product.description}
                </p>
                
                <div className="grid-price" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: isPaused ? 'var(--text-muted)' : '#fff' }}>
                  R$ {product.price.toFixed(2)}
                </div>
                
                {isPaused ? (
                  <button 
                    disabled={true}
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.06)', 
                      color: '#f87171', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      padding: '12px 0', 
                      borderRadius: '99px', 
                      fontWeight: 700, 
                      fontSize: '0.95rem',
                      cursor: 'not-allowed', 
                      width: '100%'
                    }}
                  >
                    Indisponível no Momento
                  </button>
                ) : (
                  <button 
                    onClick={() => handleOpenProduct(product)} 
                    style={{ 
                      backgroundColor: theme.color, 
                      color: '#fff', 
                      border: 'none', 
                      padding: '12px 0', 
                      borderRadius: '99px', 
                      fontWeight: 700, 
                      fontSize: '1rem',
                      cursor: 'pointer', 
                      width: '100%',
                      boxShadow: `0 4px 15px ${theme.color}40`
                    }}
                  >
                    Escolher Montagem
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FORMULÁRIO DE CHECKOUT */}
      {checkoutStep === 'form' && (
        <div className="checkout-container" style={{ maxWidth: '600px', margin: '2rem auto 4rem auto', width: '100%', padding: '0 1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <button onClick={() => setCheckoutStep('menu')} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Voltar
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginLeft: 'auto' }}>Finalizar seu Pedido</h2>
            </div>
            
            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Seu Nome</label>
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
                  placeholder="Ex: (11) 98888-7777"
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Receber em casa (+R$ 7,00)</div>
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

              {deliveryType === 'delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className="animate-fade-in">
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Endereço Completo</label>
                  <textarea 
                    required 
                    rows="3"
                    placeholder="Rua, número, bairro, complemento e pontos de referência"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Forma de Pagamento</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Pix">⚡ Pix (Aprovação imediata)</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito (na entrega/maquininha)</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito (na entrega/maquininha)</option>
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
                      pix@nuuprensado.com
                    </code>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Faça o Pix pelo seu banco. O comprovante pode ser enviado pelo WhatsApp após a confirmação.
                    </span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand)', marginTop: '6px' }}>
                  <span>Total Geral:</span>
                  <span>R$ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', marginTop: '0.5rem' }}>
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
                
                {/* Barra de progresso */}
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

                {/* Etapas */}
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
                  {activeTrackingOrder.status === 'delivered' && 'Agradecemos muito por escolher o Nuu Prensado!! Esperamos que saboreie seu pedido.'}
                </p>
              </div>

              {/* Lembrete de Pix se pendente */}
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
                    pix@nuuprensado.com
                  </div>
                </div>
              )}

              {/* Resumo do Pedido */}
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
                    const text = `Olá Nuu Prensado! Meu pedido é o #${activeTrackingOrder.id} em nome de ${activeTrackingOrder.customerName}. Gostaria de confirmar o status!`;
                    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <MessageCircle size={18} color="#25D366" />
                  Falar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DETALHE DO PRODUTO */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Personalizar Lanche</h3>
              <button onClick={() => setSelectedProduct(null)} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedProduct.image && (
                <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                  <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

              {/* Exibe opções de queijo e vinagrete se o lanche tiver opções de montagem */}
              {selectedProduct && selectedProduct.hasCustomOptions && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ marginBottom: '12px', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--color-brand-yellow)" />
                    Personalize seu Prensado:
                  </h4>
                  
                  {/* Escolha do Queijo Cremoso */}
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
                            {isPaused && (
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                                Esgotado
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Escolha do Queijo Derretido / Fatiado */}
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
                            {isPaused && (
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                                Esgotado
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Acompanhamentos Opcionais (Vinagrete) */}
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Acompanhamento:</strong>
                    <div style={{ marginTop: '6px' }}>
                      {sideOptions.length > 0 ? (
                        sideOptions.map(opt => {
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
                                gap: '6px'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                disabled={isPaused}
                                checked={selectedSide && !isPaused} 
                                onChange={(e) => !isPaused && setSelectedSide(e.target.checked)} 
                                style={{ accentColor: 'var(--color-brand)' }} 
                              />
                              <span>Adicionar {opt.name} (Opcional)</span>
                              {isPaused && (
                                <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                                  Esgotado
                                </span>
                              )}
                            </label>
                          );
                        })
                      ) : (
                        <label style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#fff' }}>
                          <input type="checkbox" checked={selectedSide} onChange={(e) => setSelectedSide(e.target.checked)} style={{ accentColor: 'var(--color-brand)' }} /> Adicionar Vinagrete Fresco (Opcional)
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Extras de Adicionais Dinâmicos */}
              {extraOptions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                    Adicionais Extras (Opcional):
                  </h5>
                  
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
                          padding: '8px 12px', 
                          border: '1px solid',
                          borderColor: isChecked ? 'var(--color-brand)' : 'var(--border-glass)', 
                          borderRadius: 'var(--radius-sm)', 
                          cursor: isPaused ? 'not-allowed' : 'pointer',
                          opacity: isPaused ? 0.5 : 1,
                          backgroundColor: isChecked ? 'rgba(234, 179, 8, 0.08)' : 'transparent',
                          transition: 'all 0.2s'
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
                          <span style={{ fontSize: '0.9rem', fontWeight: isChecked ? 600 : 400 }}>{extra.name}</span>
                          {isPaused && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                              Esgotado
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: isPaused ? 'var(--text-muted)' : 'var(--color-brand)', fontWeight: 600 }}>
                          {isPaused ? 'Indisponível' : `+ R$ ${extra.price.toFixed(2)}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

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
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-glass)', padding: '1rem 1.5rem' }}>
              <button onClick={() => setSelectedProduct(null)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleAddToCart} className="btn-primary">
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
              height: '100vh', 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
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
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-glass)', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>R$ {cartTotal.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Taxa de entrega calculada no checkout.
                </p>
                <button 
                  onClick={() => {
                    setCheckoutStep('form');
                    setIsCartOpen(false);
                  }}
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1.05rem' }}
                >
                  Avançar para Checkout <ChevronRight size={18} />
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
