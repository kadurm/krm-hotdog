import React, { useState, useEffect } from 'react';
import { useSystem } from '../../contexts/SystemContext';
import { 
  ShoppingBag, Plus, Minus, Trash2, 
  Clock, Utensils, ChevronRight, X, Sparkles,
  ChevronUp, ChevronDown, CheckCircle
} from 'lucide-react';

export default function DeliveryView() {
  const { products, createOrder, orders } = useSystem();
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [extraBacon, setExtraBacon] = useState(false);
  const [extraCheese, setExtraCheese] = useState(false);
  const [productQty, setProductQty] = useState(1);
  
  // NOVOS ESTADOS PARA AS OPÇÕES DO CARDÁPIO REAL
  const [creamyCheese, setCreamyCheese] = useState('catupiry'); // 'catupiry' ou 'requeijao'
  const [meltedCheese, setMeltedCheese] = useState('mussarela'); // 'mussarela' ou 'cheddar'
  const [hasVinagrete, setHasVinagrete] = useState(false);

  // SEUS PRODUTOS BASEADOS NA ANOTAÇÃO
  const menuReal = [
    { id: 1, name: 'Prensadin', description: 'Nossa base tradicional perfeitamente prensada com muito Bacon.', price: 18.00, hasCustomOptions: false },
    { id: 2, name: 'Prensado', description: 'A base clássica recheada com Frango desfiado e bem temperado.', price: 20.00, hasCustomOptions: false },
    { id: 3, name: 'Prensadão de Costela', description: 'Base generosa com Costela suculenta que derrete na boca.', price: 26.00, hasCustomOptions: true },
    { id: 4, name: 'Prensadão de Pernil', description: 'Base deliciosa com Pernil desfiado super temperado.', price: 24.00, hasCustomOptions: true },
    { id: 5, name: 'Prensadão de Carne Seca', description: 'O autêntico sabor da Carne Seca na nossa base perfeita.', price: 28.00, hasCustomOptions: true },
  ];

  // MAPEAMENTO VISUAL (Cores e Emojis para o efeito Imersivo)
  const sourceProducts = products && products.length > 0 ? products.filter(p => p.active) : menuReal;

  const visualProducts = sourceProducts.map((p, index) => {
    const themes = {
      1: { color: '#eab308', floaties: ['🥓', '🌭', '🧀'] }, // Prensadin Bacon (Amarelo)
      2: { color: '#f97316', floaties: ['🍗', '🧀', '🔥'] }, // Prensado Frango (Laranja)
      3: { color: '#b91c1c', floaties: ['🥩', '🔥', '🥓'] }, // Prensadão Costela (Vermelho Escuro)
      4: { color: '#84cc16', floaties: ['🍖', '🌿', '🔥'] }, // Pernil (Verde Limão)
      5: { color: '#a16207', floaties: ['🥩', '🧀', '🔥'] }, // Carne seca (Marrom/Dourado Escuro)
    };
    const theme = themes[p.id] || { color: '#333333', floaties: ['✨', '🍔', '🥤'] };
    return { ...p, ...theme, slideIndex: index };
  });

  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState('menu'); // 'menu' | 'form' | 'tracking'
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

  // Manter rastreamento atualizado em tempo real
  useEffect(() => {
    if (activeTrackingOrder) {
      const updated = orders.find(o => o.id === activeTrackingOrder.id);
      if (updated) {
        setActiveTrackingOrder(updated);
      }
    }
  }, [orders, activeTrackingOrder]);

  // Navegação do Slider
  const nextSlide = () => setActiveSlide((prev) => (prev === visualProducts.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? visualProducts.length - 1 : prev - 1));

  // Lógica do Carrinho
  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setProductQty(1);
    setExtraBacon(false);
    setExtraCheese(false);
    setCreamyCheese('catupiry');
    setMeltedCheese('mussarela');
    setHasVinagrete(false);
  };

  const handleAddToCart = () => {
    let price = selectedProduct.price;
    let nameDetails = [];
    
    // Opções personalizadas para produtos que suportam
    if (selectedProduct.hasCustomOptions !== false) {
      nameDetails.push(creamyCheese === 'catupiry' ? 'Catupiry' : 'Requeijão');
      nameDetails.push(meltedCheese === 'mussarela' ? 'Mussarela' : 'Cheddar');
      if (hasVinagrete) nameDetails.push('Com Vinagrete');
    }
    
    if (extraBacon) { price += 4.0; nameDetails.push('+ Extra Bacon'); }
    if (extraCheese) { price += 3.0; nameDetails.push('+ Extra Queijo'); }

    const itemName = selectedProduct.name + (nameDetails.length > 0 ? ` (${nameDetails.join(', ')})` : '');
    const existingIndex = cart.findIndex(item => item.name === itemName);
    
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += productQty;
      setCart(updated);
    } else {
      setCart([...cart, { productId: selectedProduct.id, name: itemName, price, quantity: productQty }]);
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
    const created = createOrder({
      customerName, 
      phone, 
      type: deliveryType, 
      address: deliveryType === 'delivery' ? address : 'Retirada no Balcão',
      paymentMethod, 
      items: cart, 
      total: parseFloat(grandTotal.toFixed(2))
    });
    setCart([]);
    setActiveTrackingOrder(created);
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

  const activeProduct = visualProducts[activeSlide] || visualProducts[0];

  return (
    <div 
      style={{ 
        backgroundColor: checkoutStep === 'menu' && activeProduct ? activeProduct.color : 'var(--bg-primary)',
        transition: 'background-color 0.8s ease-in-out',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* HEADER MINIMALISTA */}
      <header style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '1px' }}>
          <Utensils color="#fff" size={24} /> NUU PRENSADO
        </div>
        <nav style={{ display: 'flex', gap: '2rem', color: '#fff', fontSize: '0.9rem', fontWeight: 600, alignItems: 'center' }}>
          <a 
            href="#" 
            style={{ cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', textDecoration: 'none' }} 
            onClick={(e) => { e.preventDefault(); setCheckoutStep('menu'); }}
          >
            Catálogo
          </a>
          <div 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '99px', backdropFilter: 'blur(5px)' }}
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={18} color="#fff" />
            <span>Carrinho</span>
            {cart.length > 0 && (
              <span style={{ background: '#fff', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* TELA PRINCIPAL (SLIDER IMERSIVO) */}
      {checkoutStep === 'menu' && activeProduct && (
        <div className="immersive-slider" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem 2rem 3rem', position: 'relative' }}>
          
          {/* Indicadores Laterais (001, 002, etc) */}
          <div style={{ position: 'absolute', bottom: '2rem', left: '3rem', color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem', fontWeight: 300, letterSpacing: '2px' }}>
            00{activeSlide + 1} / 00{visualProducts.length}
          </div>

          <div style={{ position: 'absolute', left: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
            {visualProducts.map((_, i) => (
               <div key={i} onClick={() => setActiveSlide(i)} style={{ width: i === activeSlide ? '12px' : '8px', height: i === activeSlide ? '12px' : '8px', borderRadius: '50%', backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: '0.3s' }} />
            ))}
          </div>

          {/* Área Central: Imagem do Produto */}
          <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
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
                <div style={{ width: '420px', height: '420px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.25)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '2rem', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.15)' }}>
                  <Utensils size={72} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, opacity: 0.9 }}>{activeProduct.name}</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>[ Foto PNG Recortada ]</span>
                </div>
            </div>
          </div>

          {/* Área da Direita: Textos e Botão */}
          <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', color: '#fff', zIndex: 10 }} className="animate-fade-in-up" key={`text-${activeProduct.id}`}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.05, marginBottom: '1rem', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              {activeProduct.name.split(' ').map((word, i) => <span key={i} style={{ display: 'block' }}>{word}</span>)}
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', lineHeight: 1.5, maxWidth: '340px' }}>
              {activeProduct.description}
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                R$ {activeProduct.price.toFixed(2)}
              </span>
              <button 
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
          <div style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
            <button onClick={prevSlide} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(5px)' }}><ChevronUp size={24} /></button>
            <button onClick={nextSlide} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(5px)' }}><ChevronDown size={24} /></button>
          </div>

        </div>
      )}

      {/* FORMULÁRIO DE CHECKOUT */}
      {checkoutStep === 'form' && (
        <div style={{ maxWidth: '600px', margin: '2rem auto 4rem auto', width: '100%', padding: '0 1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <button onClick={() => setCheckoutStep('menu')} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Voltar ao Catálogo
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Forma de Pagamento</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Pix">⚡ Pix (Aprovação imediata)</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito (na entrega/maquininha)</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1rem' }}>
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

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', marginTop: '1rem' }}>
                Confirmar e Enviar Pedido
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TELA DE RASTREAMENTO DO PEDIDO */}
      {checkoutStep === 'tracking' && activeTrackingOrder && (
        <div style={{ maxWidth: '600px', margin: '2rem auto 4rem auto', width: '100%', padding: '0 1.5rem' }} className="animate-fade-in">
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Clock size={32} color="var(--color-brand)" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Acompanhe seu Pedido</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Código do Pedido: <strong style={{ color: 'var(--color-brand)' }}>#{activeTrackingOrder.id}</strong>
            </p>

            {/* Status Visual Tracker */}
            <div className="status-tracker-container" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '2.5rem', padding: '0 10px' }}>
              <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '3px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}></div>
              
              {/* Barra de progresso */}
              <div style={{ 
                position: 'absolute', 
                top: '15px', 
                left: '10%', 
                width: activeTrackingOrder.status === 'pending' ? '0%' : 
                       activeTrackingOrder.status === 'preparing' ? '33%' : 
                       activeTrackingOrder.status === 'shipping' ? '66%' : '80%', 
                height: '3px', 
                backgroundColor: 'var(--color-brand)', 
                transition: 'all 0.5s',
                zIndex: 2 
              }}></div>

              {/* Etapas */}
              {[
                { key: 'pending', name: 'Recebido' },
                { key: 'preparing', name: 'Preparando' },
                { key: 'shipping', name: 'A Caminho' },
                { key: 'delivered', name: 'Entregue' }
              ].map(step => {
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

            {/* Mensagem descritiva do status */}
            <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', textAlign: 'left', marginBottom: '2rem' }}>
              <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--color-brand)" /> 
                {activeTrackingOrder.status === 'pending' && 'Aguardando confirmação...'}
                {activeTrackingOrder.status === 'preparing' && 'Seu Prensado já está na chapa!'}
                {activeTrackingOrder.status === 'shipping' && 'Saiu para entrega! O motoboy está a caminho.'}
                {activeTrackingOrder.status === 'delivered' && 'Entregue! Bom apetite!'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {activeTrackingOrder.status === 'pending' && 'Seu pedido foi recebido pelo sistema e está aguardando para entrar na cozinha.'}
                {activeTrackingOrder.status === 'preparing' && 'Nosso chapeiro está preparando seu lanche prensado com ingredientes selecionados.'}
                {activeTrackingOrder.status === 'shipping' && `Endereço de envio: ${activeTrackingOrder.address}. Forma de pagamento: ${activeTrackingOrder.paymentMethod}.`}
                {activeTrackingOrder.status === 'delivered' && 'Este pedido foi finalizado. Agradecemos a preferência!'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setCheckoutStep('menu')} className="btn-primary">
                Fazer Novo Pedido
              </button>
              <button 
                onClick={() => {
                  const text = `Olá! Gostaria de saber mais sobre o status do meu pedido #${activeTrackingOrder.id}`;
                  window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`);
                }}
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Falar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {selectedProduct.name}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedProduct.description}
                </p>
              </div>

              {/* Opções Personalizáveis (para prensados que possuem customOptions) */}
              {selectedProduct.hasCustomOptions !== false && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  
                  {/* Queijo Cremoso */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Escolha o Queijo Cremoso:</h5>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <label style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: creamyCheese === 'catupiry' ? 'rgba(234, 179, 8, 0.15)' : 'transparent', borderColor: creamyCheese === 'catupiry' ? '#eab308' : 'var(--border-glass)' }}>
                        <input type="radio" name="creamyCheese" value="catupiry" checked={creamyCheese === 'catupiry'} onChange={() => setCreamyCheese('catupiry')} style={{ accentColor: '#eab308' }} />
                        <span>Catupiry</span>
                      </label>
                      <label style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: creamyCheese === 'requeijao' ? 'rgba(234, 179, 8, 0.15)' : 'transparent', borderColor: creamyCheese === 'requeijao' ? '#eab308' : 'var(--border-glass)' }}>
                        <input type="radio" name="creamyCheese" value="requeijao" checked={creamyCheese === 'requeijao'} onChange={() => setCreamyCheese('requeijao')} style={{ accentColor: '#eab308' }} />
                        <span>Requeijão</span>
                      </label>
                    </div>
                  </div>

                  {/* Queijo Fatiado Derretido */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Escolha o Queijo Fatiado Derretido:</h5>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <label style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: meltedCheese === 'mussarela' ? 'rgba(249, 115, 22, 0.15)' : 'transparent', borderColor: meltedCheese === 'mussarela' ? '#f97316' : 'var(--border-glass)' }}>
                        <input type="radio" name="meltedCheese" value="mussarela" checked={meltedCheese === 'mussarela'} onChange={() => setMeltedCheese('mussarela')} style={{ accentColor: '#f97316' }} />
                        <span>Mussarela</span>
                      </label>
                      <label style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: meltedCheese === 'cheddar' ? 'rgba(249, 115, 22, 0.15)' : 'transparent', borderColor: meltedCheese === 'cheddar' ? '#f97316' : 'var(--border-glass)' }}>
                        <input type="radio" name="meltedCheese" value="cheddar" checked={meltedCheese === 'cheddar'} onChange={() => setMeltedCheese('cheddar')} style={{ accentColor: '#f97316' }} />
                        <span>Cheddar</span>
                      </label>
                    </div>
                  </div>

                  {/* Vinagrete */}
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={hasVinagrete}
                        onChange={(e) => setHasVinagrete(e.target.checked)}
                        style={{ accentColor: 'var(--color-brand)' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Adicionar Vinagrete Fresco</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sem custo</span>
                  </label>

                </div>
              )}

              {/* Extras de Adicionais Padrão */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Adicionais Extras (Opcional):</h5>
                
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={extraBacon}
                      onChange={(e) => setExtraBacon(e.target.checked)}
                      style={{ accentColor: 'var(--color-brand)' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>Extra Bacon Crocante</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-brand)', fontWeight: 600 }}>+ R$ 4,00</span>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={extraCheese}
                      onChange={(e) => setExtraCheese(e.target.checked)}
                      style={{ accentColor: 'var(--color-brand)' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>Extra Queijo Derretido</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-brand)', fontWeight: 600 }}>+ R$ 3,00</span>
                </label>
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
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-glass)', padding: '1rem 1.5rem' }}>
              <button onClick={() => setSelectedProduct(null)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleAddToCart} className="btn-primary">
                Adicionar • R$ {((selectedProduct.price + (extraBacon ? 4.0 : 0) + (extraCheese ? 3.0 : 0)) * productQty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARRINHO DE COMPRAS FLUTUANTE (SIDE PANEL) */}
      {isCartOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={() => setIsCartOpen(false)}>
          <div 
            className="animate-slide-in-right" 
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
