import React, { useState, useEffect } from 'react';
import { useSystem, playNotificationChime } from '../../contexts/SystemContext';
import OrderTimerBadge from '../../components/OrderTimerBadge';
import ThermalPrintReceipt from '../../components/ThermalPrintReceipt';
import CashShiftModal from '../../components/CashShiftModal';
import QuickOrderModal from '../../components/QuickOrderModal';
import { 
  ChefHat, Bike, DollarSign, PlusCircle, Printer, Clock, 
  Phone, MapPin, CheckCircle2, AlertTriangle, Volume2, VolumeX, 
  LogOut, User, Lock, Store, ShoppingBag, ArrowRight, Shield, 
  RotateCcw, Sparkles, Navigation, Check, X, RefreshCw, Trash2
} from 'lucide-react';

export default function OperationView({ onOpenAdmin, onGoDelivery }) {
  const { 
    orders, 
    motoboys = [],
    assignOrderMotoboy, 
    updateOrderStatus, 
    deleteOrder,
    operators = [], 
    currentOperator, 
    loginOperator, 
    logoutOperator,
    upsertOperator,
    activeShift,
    currentShift,
    openCashShift,
    addShiftBleed,
    addShiftSupply,
    closeCashShift,
    shiftHistory = []
  } = useSystem();

  // Abas da operação diária: 'kds' | 'cash' | 'delivery'
  const [activeTab, setActiveTab] = useState('kds');

  // Modais operacionais
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Estados de identificação / login do operador com senha
  const [selectedOperatorForLogin, setSelectedOperatorForLogin] = useState(null);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [newOpName, setNewOpName] = useState('');
  const [newOpRole, setNewOpRole] = useState('Atendente');
  const [newOpPin, setNewOpPin] = useState('');
  const [isAddingNewOp, setIsAddingNewOp] = useState(false);

  // Controle de campainha de novos pedidos
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const shippingOrders = orders.filter(o => o.status === 'shipping');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const [prevPendingCount, setPrevPendingCount] = useState(pendingOrders.length);
  useEffect(() => {
    if (pendingOrders.length > prevPendingCount) {
      if (isSoundEnabled) {
        playNotificationChime();
      }
    }
    setPrevPendingCount(pendingOrders.length);
  }, [pendingOrders.length, isSoundEnabled, prevPendingCount]);

  const handleSelectOperator = (op) => {
    setSelectedOperatorForLogin(op);
    setLoginPin('');
    setLoginError('');
  };

  const handleConfirmLogin = (e) => {
    e.preventDefault();
    if (!selectedOperatorForLogin) return;
    const expectedPin = selectedOperatorForLogin.pin || '1234';
    if (loginPin.trim() === expectedPin.trim()) {
      loginOperator(selectedOperatorForLogin);
      setSelectedOperatorForLogin(null);
      setLoginPin('');
      setLoginError('');
    } else {
      setLoginError('Senha incorreta! Verifique ou solicite ao administrador.');
    }
  };

  // Se o operador ainda não estiver identificado, exibe a tela de login do turno
  if (!currentOperator) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(234, 179, 8, 0.12) 0%, rgba(9, 13, 22, 1) 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        color: '#fff'
      }}>
        <div 
          className="glass-panel animate-scale-up" 
          style={{
            width: '100%',
            maxWidth: '560px',
            padding: '2.5rem',
            borderRadius: '20px',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}
        >
          {/* Logo e Selo */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src="/logoNuuPrensado-semfundo.png" 
              alt="Nuu Prensado!!" 
              style={{ height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} 
            />
            <div style={{
              marginTop: '12px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid var(--color-brand)',
              color: 'var(--color-brand-yellow)',
              padding: '4px 14px',
              borderRadius: '99px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              Frente de Operação & Turno do Dia
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            Quem está no atendimento hoje?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Selecione seu usuário e digite sua senha de acesso individual.
          </p>

          {/* Modal / Formulário de Confirmação de Senha do Operador Selecionado */}
          {selectedOperatorForLogin ? (
            <form 
              onSubmit={handleConfirmLogin}
              className="animate-fade-in"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                border: '2px solid var(--color-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-brand-yellow)',
                fontWeight: 800,
                fontSize: '1.4rem',
                margin: '0 auto 10px auto'
              }}>
                {selectedOperatorForLogin.name.charAt(0).toUpperCase()}
              </div>

              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                {selectedOperatorForLogin.name}
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedOperatorForLogin.role}
              </p>

              <div style={{ maxWidth: '280px', margin: '0 auto 1rem auto', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Digite sua Senha de Acesso:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => {
                      setLoginPin(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="••••"
                    required
                    autoFocus
                    className="form-input"
                    style={{
                      padding: '10px 14px',
                      fontSize: '1.2rem',
                      letterSpacing: '4px',
                      textAlign: 'center',
                      borderColor: loginError ? '#ef4444' : 'rgba(255,255,255,0.2)'
                    }}
                  />
                </div>
                {loginError && (
                  <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px', textAlign: 'center', fontWeight: 600 }}>
                    {loginError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOperatorForLogin(null);
                    setLoginPin('');
                    setLoginError('');
                  }}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Lock size={15} />
                  <span>Entrar no Turno</span>
                </button>
              </div>
            </form>
          ) : !isAddingNewOp ? (
            /* Lista de Operadores Cadastrados */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                {operators.map(op => (
                  <button
                    key={op.id}
                    onClick={() => handleSelectOperator(op)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      padding: '1.25rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: '#fff',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-brand)';
                      e.currentTarget.style.background = 'rgba(234, 179, 8, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                      border: '1px solid var(--color-brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-brand-yellow)',
                      fontWeight: 800,
                      fontSize: '1.2rem'
                    }}>
                      {op.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{op.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{op.role}</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginTop: '2px'
                    }}>
                      <Lock size={10} /> Requer Senha
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNewOp(true)}
                  style={{
                    background: 'none',
                    border: '1px dashed rgba(255,255,255,0.25)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '99px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={15} />
                  <span>Outro Atendente / Novo Operador</span>
                </button>
              </div>
            </>
          ) : (
            /* Formulário para Inserir Outro Operador com Senha */
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newOpName.trim()) return;
                const newOp = {
                  id: 'op-' + Date.now(),
                  name: newOpName.trim(),
                  role: newOpRole,
                  pin: newOpPin.trim() || '1234',
                  active: true
                };
                upsertOperator(newOp);
                loginOperator(newOp);
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '1.25rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                Cadastrar Atendente para o Turno:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Nome:</label>
                  <input
                    type="text"
                    value={newOpName}
                    onChange={(e) => setNewOpName(e.target.value)}
                    placeholder="Ex: Matheus"
                    required
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Função:</label>
                  <select
                    value={newOpRole}
                    onChange={(e) => setNewOpRole(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  >
                    <option value="Atendente">Atendente</option>
                    <option value="Caixa">Caixa</option>
                    <option value="Chapa / Cozinha">Chapa / Cozinha</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Proprietário">Proprietário</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Senha de Acesso (PIN):
                </label>
                <input
                  type="password"
                  value={newOpPin}
                  onChange={(e) => setNewOpPin(e.target.value)}
                  placeholder="Ex: 1234"
                  required
                  className="form-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem', letterSpacing: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  Cadastrar e Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewOp(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Links para Navegação Externa (Admin ou Cardápio Cliente) */}
          <div style={{ 
            paddingTop: '1.25rem', 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem'
          }}>
            <button
              type="button"
              onClick={onGoDelivery}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Store size={15} />
              <span>Ver Loja Online</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-brand-yellow)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Lock size={15} />
              <span>Gestão Estratégica ERP (Admin)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA PRINCIPAL DA FRENTE DE OPERAÇÃO (OPERADOR LOGADO) ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOPBAR DA FRENTE DE OPERAÇÃO */}
      <header style={{
        backgroundColor: 'rgba(13, 19, 31, 0.95)',
        borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Logo e Selo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logoNuuPrensado-semfundo.png" 
            alt="Nuu Prensado!!" 
            style={{ height: '42px', objectFit: 'contain' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontWeight: 900, 
              color: '#fff', 
              fontSize: '1rem', 
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Frente de Operação
              <span style={{ 
                backgroundColor: 'var(--color-brand)', 
                color: '#000', 
                fontSize: '0.65rem', 
                padding: '1px 6px', 
                borderRadius: '4px',
                fontWeight: 800
              }}>
                PDV & KDS
              </span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Rotina diária da chapa, caixa e entregas
            </span>
          </div>
        </div>

        {/* Informações do Turno e Operador Ativo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Identificação do Operador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '5px 12px',
            borderRadius: '99px'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentOperator.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>Turno:</span>
              <strong style={{ color: '#fff' }}>{currentOperator.name}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>({currentOperator.role})</span>
            </div>
            <button
              onClick={logoutOperator}
              title="Trocar de operador"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '4px'
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Status do Caixa do Turno */}
          <button
            type="button"
            onClick={() => setIsCashModalOpen(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '99px',
              border: '1px solid',
              backgroundColor: activeShift ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              borderColor: activeShift ? '#22c55e' : '#ef4444',
              color: activeShift ? '#4ade80' : '#f87171',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeShift ? '#22c55e' : '#ef4444',
              boxShadow: activeShift ? '0 0 8px #22c55e' : 'none'
            }} />
            <span>
              {activeShift ? `Caixa Aberto (Fundo: R$ ${activeShift.initialFloat.toFixed(2)})` : 'Caixa Fechado'}
            </span>
          </button>

          {/* Controle de Campainha */}
          <button 
            onClick={() => {
              const next = !isSoundEnabled;
              setIsSoundEnabled(next);
              if (next) playNotificationChime();
            }}
            style={{
              background: isSoundEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${isSoundEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: isSoundEnabled ? '#34d399' : '#ef4444',
              padding: '6px 10px',
              borderRadius: '99px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Campainha de novos pedidos"
          >
            {isSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Botão Novo Pedido Balcão */}
          <button
            type="button"
            onClick={() => setIsQuickOrderOpen(true)}
            className="btn-primary"
            style={{
              padding: '7px 14px',
              borderRadius: '99px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(234, 179, 8, 0.3)'
            }}
          >
            <PlusCircle size={16} />
            <span>Novo Pedido (Balcão)</span>
          </button>

          {/* Atalho para o ERP Master */}
          <button
            type="button"
            onClick={onOpenAdmin}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              padding: '7px 12px',
              borderRadius: '99px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: '0.2s'
            }}
            title="Acesso às configurações gerais, estoque, DRE e parâmetros"
          >
            <Lock size={14} />
            <span>Gestão ERP</span>
          </button>
        </div>
      </header>

      {/* 2. BARRA DE NAVEGAÇÃO DE ABAS OPERACIONAIS */}
      <div style={{
        backgroundColor: '#0c111c',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0.5rem 1.5rem',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setActiveTab('kds')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'kds' ? 'var(--color-brand)' : 'transparent',
            color: activeTab === 'kds' ? '#000' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s'
          }}
        >
          <ChefHat size={18} />
          <span>Cozinha & KDS</span>
          {(pendingOrders.length + preparingOrders.length) > 0 && (
            <span style={{
              backgroundColor: activeTab === 'kds' ? '#000' : 'var(--color-brand)',
              color: activeTab === 'kds' ? '#fff' : '#000',
              padding: '1px 6px',
              borderRadius: '99px',
              fontSize: '0.72rem',
              fontWeight: 900
            }}>
              {pendingOrders.length + preparingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cash')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'cash' ? 'var(--color-brand)' : 'transparent',
            color: activeTab === 'cash' ? '#000' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s'
          }}
        >
          <DollarSign size={18} />
          <span>Frente de Caixa & Turno</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'delivery' ? 'var(--color-brand)' : 'transparent',
            color: activeTab === 'delivery' ? '#000' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s'
          }}
        >
          <Bike size={18} />
          <span>Despache & Motoboys</span>
          {shippingOrders.length > 0 && (
            <span style={{
              backgroundColor: activeTab === 'delivery' ? '#000' : '#38bdf8',
              color: activeTab === 'delivery' ? '#fff' : '#000',
              padding: '1px 6px',
              borderRadius: '99px',
              fontSize: '0.72rem',
              fontWeight: 900
            }}>
              {shippingOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. CONTEÚDO DA ABA SELECIONADA */}
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        
        {/* --- ABA 1: COZINHA & KDS --- */}
        {activeTab === 'kds' && (
          <div className="animate-fade-in">
            {/* Grid das 4 Colunas: Pendentes > Na Chapa > Despache > Entregues */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
              
              {/* 1. PENDENTES */}
              <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-danger)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></span>
                    Novos / Pendentes
                  </span>
                  <span className="badge badge-pending">{pendingOrders.length}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingOrders.map(order => (
                    <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.1rem' }}>#{order.id}</span>
                          <OrderTimerBadge orderDate={order.date} />
                          <button 
                            onClick={() => { if (confirm(`Deseja excluir o pedido #${order.id}?`)) deleteOrder(order.id); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setReceiptOrder(order)}
                            style={{
                              background: 'rgba(56,189,248,0.15)',
                              border: '1px solid rgba(56,189,248,0.3)',
                              color: '#38bdf8',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={12} /> Comanda
                          </button>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '6px' }}>
                        {order.customerName}
                      </div>

                      {/* Tipo e Bairro */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <span style={{
                          backgroundColor: order.type === 'delivery' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: order.type === 'delivery' ? 'var(--color-brand-yellow)' : '#4ade80',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {order.type === 'delivery' ? `🛵 Entrega (${order.neighborhood})` : '🏪 Balcão'}
                        </span>
                      </div>

                      {/* Itens do Pedido */}
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '3px' }}>
                            <strong>{item.quantity}x</strong> {item.name}
                            {item.selectedComplements && item.selectedComplements.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-yellow)', paddingLeft: '12px' }}>
                                + {item.selectedComplements.map(c => c.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                        {order.notes && (
                          <div style={{ fontSize: '0.78rem', color: '#f87171', fontStyle: 'italic', marginTop: '4px' }}>
                            Obs: {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Ação: Mover para Chapa */}
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="btn-primary"
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        <ChefHat size={16} />
                        <span>Mandar para a Chapa</span>
                      </button>
                    </div>
                  ))}

                  {pendingOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum pedido pendente no momento.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. NA CHAPA / PREPARANDO */}
              <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-warning)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></span>
                    Na Chapa / Preparando
                  </span>
                  <span className="badge badge-warning">{preparingOrders.length}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {preparingOrders.map(order => (
                    <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.1rem' }}>#{order.id}</span>
                          <OrderTimerBadge orderDate={order.date} />
                        </div>
                        <button
                          onClick={() => setReceiptOrder(order)}
                          style={{
                            background: 'rgba(56,189,248,0.15)',
                            border: '1px solid rgba(56,189,248,0.3)',
                            color: '#38bdf8',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Printer size={12} /> Comanda
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '6px' }}>
                        {order.customerName}
                      </div>

                      <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '3px' }}>
                            <strong>{item.quantity}x</strong> {item.name}
                            {item.selectedComplements && item.selectedComplements.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-yellow)', paddingLeft: '12px' }}>
                                + {item.selectedComplements.map(c => c.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                        {order.notes && (
                          <div style={{ fontSize: '0.78rem', color: '#f87171', fontStyle: 'italic', marginTop: '4px' }}>
                            Obs: {order.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'pending')}
                          style={{
                            padding: '8px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Voltar para Pendente"
                        >
                          <RotateCcw size={15} />
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, order.type === 'delivery' ? 'shipping' : 'delivered')}
                          className="btn-primary"
                          style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        >
                          {order.type === 'delivery' ? <Bike size={16} /> : <CheckCircle2 size={16} />}
                          <span>{order.type === 'delivery' ? 'Pronto para Despache' : 'Entregar no Balcão'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {preparingOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum lanche na chapa agora.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. DESPACHE / ENTREGA */}
              <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-info)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-info)' }}></span>
                    Pronto / Despache
                  </span>
                  <span className="badge badge-info">{shippingOrders.length}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shippingOrders.map(order => (
                    <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.1rem' }}>#{order.id}</span>
                        <OrderTimerBadge orderDate={order.date} />
                      </div>

                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        📍 {order.address} ({order.neighborhood})
                      </div>

                      {/* Atribuição de Motoboy */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                          Motoboy Responsável:
                        </label>
                        <select
                          value={order.motoboyId || ''}
                          onChange={(e) => assignOrderMotoboy(order.id, e.target.value)}
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                        >
                          <option value="">Aguardando Motoboy...</option>
                          {motoboys.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {order.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ', ' + order.neighborhood)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '8px 10px',
                              backgroundColor: 'rgba(56,189,248,0.15)',
                              border: '1px solid rgba(56,189,248,0.3)',
                              color: '#38bdf8',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none'
                            }}
                            title="Abrir GPS Google Maps"
                          >
                            <Navigation size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="btn-success"
                          style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        >
                          <CheckCircle2 size={16} />
                          <span>Confirmar Entrega</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {shippingOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum pedido em rota no momento.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. CONCLUÍDOS HOJE */}
              <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '4px solid var(--color-success)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span>
                    Concluídos Hoje
                  </span>
                  <span className="badge badge-success">{deliveredOrders.length}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
                  {deliveredOrders.slice(0, 15).map(order => (
                    <div key={order.id} style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
                          #{order.id} • {order.customerName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.items.length} itens • {order.paymentMethod} • R$ {order.total?.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => setReceiptOrder(order)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Reimprimir Comanda"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  ))}

                  {deliveredOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum pedido entregue ainda hoje.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- ABA 2: FRENTE DE CAIXA & TURNO (PDV) --- */}
        {activeTab === 'cash' && (
          <div className="animate-fade-in" style={{ maxWidth: '980px', margin: '0 auto' }}>
            {/* Header de Status */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>
                  Frente de Caixa (PDV)
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Abertura com troco, sangrias, suprimentos e conferência de caixa por turno.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(true)}
                  className={activeShift ? "btn-danger" : "btn-primary"}
                  style={{ padding: '10px 18px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <DollarSign size={18} />
                  <span>{activeShift ? 'Fechar Turno de Caixa' : 'Abrir Caixa Agora'}</span>
                </button>
              </div>
            </div>

            {/* Painel do Turno Atual */}
            {activeShift ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Cards de Métricas do Turno */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Fundo de Troco Inicial
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                      R$ {activeShift.initialFloat.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Por: {activeShift.operatorName}
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Sangrias (Retiradas)
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                      - R$ {(activeShift.bleedTotal || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {activeShift.bleeds?.length || 0} lançamentos
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Suprimentos (Troco Adicionado)
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
                      + R$ {(activeShift.supplyTotal || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {activeShift.supplies?.length || 0} reforços
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(234, 179, 8, 0.4)', backgroundColor: 'rgba(234, 179, 8, 0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-yellow)', textTransform: 'uppercase', fontWeight: 800 }}>
                      Ações do Caixa
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        onClick={() => setIsCashModalOpen(true)}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '8px', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        Lançar Sangria
                      </button>
                      <button
                        onClick={() => setIsCashModalOpen(true)}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '8px', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        Lançar Suprimento
                      </button>
                    </div>
                  </div>
                </div>

                {/* Movimentações do Turno */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                    Extrato de Movimentações do Turno #{activeShift.id}
                  </h3>
                  
                  {(!activeShift.bleeds?.length && !activeShift.supplies?.length) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Nenhuma sangria ou suprimento lançado neste turno ainda.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(activeShift.bleeds || []).map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <div>
                            <strong style={{ color: '#ef4444' }}>Sangria:</strong> {b.reason}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.date).toLocaleTimeString()}</div>
                          </div>
                          <span style={{ fontWeight: 800, color: '#ef4444' }}>- R$ {b.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      {(activeShift.supplies || []).map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div>
                            <strong style={{ color: '#22c55e' }}>Suprimento:</strong> {s.reason}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleTimeString()}</div>
                          </div>
                          <span style={{ fontWeight: 800, color: '#22c55e' }}>+ R$ {s.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Se o caixa estiver fechado */
              <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px dashed rgba(239, 68, 68, 0.4)' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto'
                }}>
                  <Lock size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                  O Caixa está Fechado
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
                  Para iniciar as vendas do turno, abra o caixa informando o fundo de troco inicial da gaveta.
                </p>
                <button
                  onClick={() => setIsCashModalOpen(true)}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.95rem', fontWeight: 800 }}
                >
                  Abrir Caixa com Fundo de Troco
                </button>
              </div>
            )}

            {/* Histórico de Turnos Fechados */}
            {shiftHistory.filter(s => s.status === 'closed').length > 0 && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                  Histórico de Turnos Anteriores Fechados
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shiftHistory.filter(s => s.status === 'closed').map(shift => (
                    <div 
                      key={shift.id} 
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Turno #{shift.id}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Operador: {shift.operatorName} • Fechado em: {new Date(shift.closedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                          Vendas Dinheiro: R$ {(shift.cashSales || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: shift.difference === 0 ? '#4ade80' : '#f87171' }}>
                          Diferença Apurada: R$ {(shift.difference || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ABA 3: DESPACHE & MOTOBOYS --- */}
        {activeTab === 'delivery' && (
          <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                Logística de Despache & Motoboys
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Atribua entregadores e acompanhe os pedidos em rota em tempo real.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Pedidos Aguardando Despache ou em Rota */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bike size={20} color="var(--color-brand-yellow)" />
                  Pedidos em Rota de Entrega ({shippingOrders.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shippingOrders.map(order => {
                    const mb = motoboys.find(m => m.id === order.motoboyId);
                    return (
                      <div key={order.id} className="glass-panel" style={{ padding: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.1rem' }}>#{order.id}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            R$ {order.total?.toFixed(2)} ({order.paymentMethod})
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          📍 {order.address} • {order.neighborhood}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Entregador:</span>
                          <strong style={{ color: mb ? '#38bdf8' : '#f59e0b', fontSize: '0.85rem' }}>
                            {mb ? mb.name : 'Não Atribuído'}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {order.phone && (
                            <a
                              href={`https://wa.me/55${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.customerName}! Seu pedido #${order.id} do Nuu Prensado acabou de sair para entrega!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 12px',
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: '#4ade80',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                textDecoration: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 600
                              }}
                            >
                              <Phone size={14} /> WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="btn-success"
                            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 800 }}
                          >
                            Concluir Entrega
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {shippingOrders.length === 0 && (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum pedido em rota de entrega no momento.
                    </div>
                  )}
                </div>
              </div>

              {/* Equipe de Motoboys Cadastrados */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                  Motoboys da Equipe ({motoboys.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {motoboys.map(m => (
                    <div 
                      key={m.id}
                      className="glass-panel"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {m.phone} • {m.vehicle}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-yellow)', fontWeight: 700 }}>
                          R$ {m.feePerDelivery?.toFixed(2)}/entrega
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE CAIXA */}
      {isCashModalOpen && (
        <CashShiftModal onClose={() => setIsCashModalOpen(false)} />
      )}

      {/* MODAL DE LANÇAMENTO RÁPIDO DE PEDIDO */}
      {isQuickOrderOpen && (
        <QuickOrderModal 
          onClose={() => setIsQuickOrderOpen(false)}
          onOrderCreated={(newOrder) => {
            setReceiptOrder(newOrder);
          }}
        />
      )}

      {/* MODAL DE IMPRESSÃO DE COMANDA TÉRMICA */}
      {receiptOrder && (
        <ThermalPrintReceipt 
          order={receiptOrder} 
          onClose={() => setReceiptOrder(null)} 
        />
      )}

    </div>
  );
}
