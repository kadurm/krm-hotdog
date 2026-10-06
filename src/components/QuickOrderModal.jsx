import React, { useState } from 'react';
import { 
  X, Plus, Minus, ShoppingBag, User, Phone, MapPin, 
  CreditCard, DollarSign, QrCode, Utensils, Check, Sparkles, MessageCircle 
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';

export default function QuickOrderModal({ onClose, onOrderCreated }) {
  const { 
    products, 
    complements = [], 
    deliveryNeighborhoods = [], 
    createOrder, 
    lookupCustomer, 
    saveCustomer,
    currentOperator 
  } = useSystem();

  // Dados do Cliente e Tipo
  const [orderType, setOrderType] = useState('takeout'); // 'takeout' (Balcão) | 'delivery' (Entrega)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [notes, setNotes] = useState('');

  // Carrinho do Lançamento Rápido
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('prensados');

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [changeFor, setChangeFor] = useState('');

  // Auto-completar cliente ao digitar telefone
  const handlePhoneChange = (val) => {
    setCustomerPhone(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 10) {
      const found = lookupCustomer(clean);
      if (found) {
        if (!customerName && found.name) setCustomerName(found.name);
        if (!address && found.address) setAddress(found.address);
        if (!neighborhood && found.neighborhood) setNeighborhood(found.neighborhood);
      }
    }
  };

  const handleAddItem = (product) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === product.id && (!item.selectedComplements || item.selectedComplements.length === 0));
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        selectedComplements: []
      }];
    });
  };

  const handleUpdateQty = (index, delta) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      const target = copy[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = { ...target, quantity: newQty };
      return copy;
    });
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((acc, item) => {
      const itemBase = item.price * item.quantity;
      const compsTotal = (item.selectedComplements || []).reduce((cAcc, comp) => cAcc + (comp.price || 0), 0) * item.quantity;
      return acc + itemBase + compsTotal;
    }, 0);
  };

  const deliveryFee = orderType === 'delivery' 
    ? (deliveryNeighborhoods.find(n => n.name === neighborhood)?.fee || 5.00) 
    : 0;

  const total = calculateSubtotal() + deliveryFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Selecione ao menos um produto para lançar o pedido.');
      return;
    }
    if (!customerName.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }
    if (orderType === 'delivery' && (!address.trim() || !neighborhood)) {
      alert('Para entrega, informe o endereço completo e o bairro.');
      return;
    }

    const orderData = {
      type: orderType,
      customerName: customerName.trim(),
      phone: customerPhone.trim(),
      address: orderType === 'delivery' ? address.trim() : 'Balcão / Retirada',
      neighborhood: orderType === 'delivery' ? neighborhood : 'Balcão',
      deliveryFee: deliveryFee,
      items: selectedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedComplements: item.selectedComplements || []
      })),
      total: parseFloat(total.toFixed(2)),
      paymentMethod,
      changeFor: paymentMethod === 'Dinheiro' && changeFor ? parseFloat(changeFor) : null,
      notes: notes.trim(),
      operatorName: currentOperator ? `${currentOperator.name} (${currentOperator.role})` : 'Operador'
    };

    const newOrder = createOrder(orderData);

    if (customerPhone) {
      saveCustomer({
        phone: customerPhone,
        name: customerName,
        address: address,
        neighborhood: neighborhood
      });
    }

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
    onClose();
  };

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    if (activeCategory === 'prensados') return p.category === 'prensados' || !p.category;
    return p.category === activeCategory;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div 
        className="glass-panel animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          backgroundColor: '#0d131f',
          border: '1px solid rgba(234, 179, 8, 0.35)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(234, 179, 8, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              backgroundColor: 'var(--color-brand)', 
              color: '#000', 
              padding: '6px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Utensils size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Lançamento Rápido de Pedido
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Frente de Operação & Caixa • {currentOperator ? `Operador: ${currentOperator.name}` : 'Atendimento'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Corpo do Modal (2 Colunas: Produtos à esquerda, Dados do Pedido à direita) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          flex: 1,
          overflow: 'hidden',
          gap: 0
        }}>
          {/* Coluna 1: Seleção de Produtos do Cardápio */}
          <div style={{
            padding: '1.25rem',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            maxHeight: 'calc(92vh - 80px)'
          }}>
            {/* Categorias */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveCategory('prensados')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  backgroundColor: activeCategory === 'prensados' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
                  borderColor: activeCategory === 'prensados' ? 'var(--color-brand)' : 'rgba(255,255,255,0.15)',
                  color: activeCategory === 'prensados' ? '#000' : '#fff'
                }}
              >
                🌭 Prensados
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('bebidas')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  backgroundColor: activeCategory === 'bebidas' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
                  borderColor: activeCategory === 'bebidas' ? 'var(--color-brand)' : 'rgba(255,255,255,0.15)',
                  color: activeCategory === 'bebidas' ? '#000' : '#fff'
                }}
              >
                🥤 Bebidas
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('acompanhamentos')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  backgroundColor: activeCategory === 'acompanhamentos' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
                  borderColor: activeCategory === 'acompanhamentos' ? 'var(--color-brand)' : 'rgba(255,255,255,0.15)',
                  color: activeCategory === 'acompanhamentos' ? '#000' : '#fff'
                }}
              >
                🍟 Acompanhamentos
              </button>
            </div>

            {/* Lista de Produtos para clique rápido */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleAddItem(prod)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={prod.image || '/logoNuuPrensado-semfundo.png'} 
                      alt={prod.name} 
                      style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'contain' }} 
                    />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-yellow)', fontWeight: 600 }}>
                        R$ {prod.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                      border: '1px solid var(--color-brand)',
                      color: 'var(--color-brand-yellow)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 2: Carrinho, Cliente e Pagamento */}
          <div style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            maxHeight: 'calc(92vh - 80px)',
            backgroundColor: 'rgba(0,0,0,0.2)'
          }}>
            {/* Seletor de Tipo (Balcão ou Entrega) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setOrderType('takeout')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid',
                  backgroundColor: orderType === 'takeout' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: orderType === 'takeout' ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: orderType === 'takeout' ? '#4ade80' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🏪 Balcão / Retirada
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid',
                  backgroundColor: orderType === 'delivery' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: orderType === 'delivery' ? 'var(--color-brand)' : 'rgba(255,255,255,0.1)',
                  color: orderType === 'delivery' ? 'var(--color-brand-yellow)' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🛵 Entrega / Delivery
              </button>
            </div>

            {/* Dados do Cliente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Telefone / WhatsApp
                  </label>
                  <input 
                    type="text"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(31) 99999-9999"
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Nome do Cliente *
                  </label>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    required
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                        Endereço Completo
                      </label>
                      <input 
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Rua, Número, Apto"
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                        Bairro
                      </label>
                      <select
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        <option value="">Selecione...</option>
                        {deliveryNeighborhoods.map(nb => (
                          <option key={nb.id} value={nb.name}>
                            {nb.name} (R$ {nb.fee.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Itens Escolhidos */}
            <div style={{ flex: 1, marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Itens do Pedido ({selectedItems.length})
              </div>
              {selectedItems.length === 0 ? (
                <div style={{ 
                  padding: '1.5rem', 
                  textAlign: 'center', 
                  border: '1px dashed rgba(255,255,255,0.15)', 
                  borderRadius: '8px', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.85rem' 
                }}>
                  Nenhum item adicionado ainda.<br />Clique nos produtos à esquerda para incluir.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedItems.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        padding: '8px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          R$ {item.price.toFixed(2)} cada
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          style={{
                            background: 'rgba(234, 179, 8, 0.25)',
                            border: 'none',
                            color: 'var(--color-brand-yellow)',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginLeft: '6px', minWidth: '55px', textAlign: 'right' }}>
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações da Comanda */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                Observação para a Chapa / Cozinha:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem milho, caprichar na batata..."
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Forma de Pagamento */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Forma de Pagamento:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '6px',
                      border: '1px solid',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === m ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.03)',
                      borderColor: paymentMethod === m ? 'var(--color-brand)' : 'rgba(255,255,255,0.1)',
                      color: paymentMethod === m ? 'var(--color-brand-yellow)' : '#94a3b8'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Dinheiro' && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Troco para R$:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="form-input"
                    style={{ width: '100px', padding: '4px 8px', fontSize: '0.8rem' }}
                  />
                  {changeFor && parseFloat(changeFor) > total && (
                    <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                      (Troco: R$ {(parseFloat(changeFor) - total).toFixed(2)})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Total e Botão de Finalizar */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Subtotal:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>R$ {calculateSubtotal().toFixed(2)}</span>
              </div>
              {orderType === 'delivery' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Taxa de Entrega:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem' }}>
                <span style={{ color: '#fff', fontWeight: 800 }}>Total a Pagar:</span>
                <span style={{ color: 'var(--color-brand-yellow)', fontWeight: 800 }}>R$ {total.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedItems.length === 0}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(234, 179, 8, 0.4)'
                }}
              >
                <Check size={18} />
                <span>Confirmar e Enviar para a Cozinha</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
