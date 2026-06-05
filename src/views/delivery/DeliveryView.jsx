import React, { useState, useEffect } from 'react';
import { useSystem } from '../../contexts/SystemContext';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, 
  MapPin, CreditCard, CheckCircle, Clock, 
  Utensils, ChevronRight, X, Sparkles 
} from 'lucide-react';

export default function DeliveryView() {
  const { products, createOrder, orders } = useSystem();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [extraBacon, setExtraBacon] = useState(false);
  const [extraCheese, setExtraCheese] = useState(false);
  const [productQty, setProductQty] = useState(1);
  
  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState('menu'); // 'menu' | 'form' | 'tracking'
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

  // Auto-track most recent order if it's not delivered yet
  useEffect(() => {
    const pendingOrders = orders.filter(o => o.status !== 'delivered');
    if (pendingOrders.length > 0 && checkoutStep !== 'form') {
      setActiveTrackingOrder(pendingOrders[0]);
      setCheckoutStep('tracking');
    }
  }, [orders]);

  // Keep tracking updated in real-time
  useEffect(() => {
    if (activeTrackingOrder) {
      const updated = orders.find(o => o.id === activeTrackingOrder.id);
      if (updated) {
        setActiveTrackingOrder(updated);
      }
    }
  }, [orders, activeTrackingOrder]);

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'hotdogs', name: 'Hotdogs na Chapa' },
    { id: 'drinks', name: 'Sucos & Bebidas' },
    { id: 'sides', name: 'Acompanhamentos' }
  ];

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setProductQty(1);
    setExtraBacon(false);
    setExtraCheese(false);
  };

  const handleAddToCart = () => {
    let price = selectedProduct.price;
    let nameDetails = [];
    
    if (extraBacon) {
      price += 4.0;
      nameDetails.push('+ Bacon');
    }
    if (extraCheese) {
      price += 3.0;
      nameDetails.push('+ Catupiry/Cheddar');
    }

    const itemName = selectedProduct.name + (nameDetails.length > 0 ? ` (${nameDetails.join(', ')})` : '');
    
    const existingIndex = cart.findIndex(item => item.name === itemName);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += productQty;
      setCart(updated);
    } else {
      setCart([...cart, {
        productId: selectedProduct.id,
        name: itemName,
        price: price,
        quantity: productQty
      }]);
    }
    
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (index, amount) => {
    const updated = [...cart];
    updated[index].quantity += amount;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = deliveryType === 'delivery' ? 7.00 : 0.00;
  const grandTotal = cartTotal + deliveryFee;

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const orderData = {
      customerName,
      phone,
      type: deliveryType,
      address: deliveryType === 'delivery' ? address : 'Retirada no Balcão',
      paymentMethod,
      items: cart,
      total: parseFloat(grandTotal.toFixed(2))
    };

    const created = createOrder(orderData);
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

  return (
    <div className="delivery-view animate-fade-in" style={{ padding: '2rem 0', flex: 1 }}>
      <div className="container">
        
        {/* Banner Hero */}
        {checkoutStep !== 'tracking' && (
          <div className="hero-banner glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <Utensils size={200} color="var(--color-brand)" />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Sparkles size={16} /> O Melhor Hotdog na Chapa da Cidade
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, color: '#fff' }}>
              Sabores Irresistíveis e <br/>
              Entrega Super Rápida!
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '1rem' }}>
              Pão fresquinho selado na chapa, ingredientes selecionados de alta qualidade e sucos totalmente naturais feitos na hora.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-success)', background: 'var(--color-success-glow)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span> Aberto para Pedidos
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Clock size={14} /> 25 a 45 min
              </div>
            </div>
          </div>
        )}

        {checkoutStep === 'menu' && (
          <>
            {/* Filtros e Busca */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '99px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      backgroundColor: selectedCategory === cat.id ? 'var(--color-brand)' : 'var(--bg-secondary)',
                      color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid',
                      borderColor: selectedCategory === cat.id ? 'var(--color-brand)' : 'var(--border-glass)'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar no cardápio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '40px', borderRadius: '99px' }}
                />
              </div>
            </div>

            {/* Menu Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
              {filteredProducts.map(prod => (
                <div key={prod.id} className="glass-panel food-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', transition: 'all 0.2s' }}>
                  {/* Decorative Food Icon Category */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.15 }}>
                    <Utensils size={24} color="var(--color-brand)" />
                  </div>
                  
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{prod.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, marginBottom: '1rem' }}>{prod.description}</p>
                  
                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                      R$ {prod.price.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleOpenProduct(prod)}
                      className="btn-primary" 
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum produto encontrado nesta busca.
                </div>
              )}
            </div>
          </>
        )}

        {checkoutStep === 'form' && (
          <div style={{ maxWidth: '600px', margin: '0 auto 4rem auto' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <button onClick={() => setCheckoutStep('menu')} style={{ color: 'var(--text-secondary)' }}>
                  Voltar
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Finalizar seu Pedido</h2>
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
                    <label style={{ flex: 1, padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: deliveryType === 'delivery' ? 'rgba(249,115,22,0.1)' : 'transparent', borderColor: deliveryType === 'delivery' ? 'var(--color-brand)' : 'var(--border-glass)' }}>
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
                    <label style={{ flex: 1, padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: deliveryType === 'pickup' ? 'rgba(249,115,22,0.1)' : 'transparent', borderColor: deliveryType === 'pickup' ? 'var(--color-brand)' : 'var(--border-glass)' }}>
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

        {checkoutStep === 'tracking' && activeTrackingOrder && (
          <div style={{ maxWidth: '600px', margin: '0 auto 4rem auto' }} className="animate-fade-in">
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-brand-glow)', display: 'flex', alignItems: 'center', justifyBetween: 'center', margin: '0 auto 1.5rem auto' }}>
                <Clock size={32} color="var(--color-brand)" style={{ margin: 'auto' }} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Acompanhe seu Pedido</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Código do Pedido: <strong style={{ color: 'var(--color-brand)' }}>#{activeTrackingOrder.id}</strong>
              </p>

              {/* Status Visual Tracker */}
              <div className="status-tracker-container" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '2.5rem', padding: '0 10px' }}>
                <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '3px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}></div>
                
                {/* Progress color bar */}
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

                {/* Steps */}
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

              {/* Status Message detail */}
              <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', textAlign: 'left', marginBottom: '2rem' }}>
                <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--color-brand)" /> 
                  {activeTrackingOrder.status === 'pending' && 'Aguardando confirmação...'}
                  {activeTrackingOrder.status === 'preparing' && 'Seu Hotdog já está na chapa!'}
                  {activeTrackingOrder.status === 'shipping' && 'Saiu para entrega! O motoboy está a caminho.'}
                  {activeTrackingOrder.status === 'delivered' && 'Entregue! Bom apetite!'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {activeTrackingOrder.status === 'pending' && 'Seu pedido foi recebido pelo sistema e está aguardando para entrar na cozinha.'}
                  {activeTrackingOrder.status === 'preparing' && 'Nosso chapeiro está preparando seu pedido com ingredientes fresquinhos.'}
                  {activeTrackingOrder.status === 'shipping' && `Endereço de envio: ${activeTrackingOrder.address}. Forma de pagamento: ${activeTrackingOrder.paymentMethod}.`}
                  {activeTrackingOrder.status === 'delivered' && 'Este pedido foi finalizado. Agradecemos a preferência!'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {activeTrackingOrder.status === 'delivered' && (
                  <button onClick={() => setCheckoutStep('menu')} className="btn-primary">
                    Fazer Novo Pedido
                  </button>
                )}
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

      </div>

      {/* MODAL DETALHE DO PRODUTO */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Adicionar ao Carrinho</h3>
              <button onClick={() => setSelectedProduct(null)} style={{ color: 'var(--text-secondary)' }}>
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

              {/* Extras (only show for hotdogs) */}
              {selectedProduct.category === 'hotdogs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Adicionais (Opcional)</h5>
                  
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={extraBacon}
                        onChange={(e) => setExtraBacon(e.target.checked)}
                        style={{ accentColor: 'var(--color-brand)' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Bacon Extra Crocante</span>
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
                      <span style={{ fontSize: '0.9rem' }}>Cheddar/Catupiry Extra</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-brand)', fontWeight: 600 }}>+ R$ 3,00</span>
                  </label>
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
              <button onClick={() => setIsCartOpen(false)} style={{ color: 'var(--text-secondary)' }}>
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
                    <button onClick={() => updateCartQty(index, -item.quantity)} style={{ color: 'var(--color-danger)' }}>
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

      {/* FLOAT ACTION BUTTON CARRO (MOBILE ONLY / FIXED BOTTOM) */}
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
            boxShadow: '0 8px 30px rgba(249,115,22,0.4)',
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
