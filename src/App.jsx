import React, { useState, useEffect } from 'react';
import { SystemProvider, useSystem } from './contexts/SystemContext';
import DeliveryView from './views/delivery/DeliveryView';
import AdminView from './views/admin/AdminView';
import AdminLoginView from './views/admin/AdminLoginView';
import OperationView from './views/operation/OperationView';
import { Lock, LayoutGrid, MonitorPlay, ShoppingBag, Clock, ChefHat, Shield, LogOut, User, XCircle } from 'lucide-react';
import { VIEW_CONFIG } from './config/viewConfig';
import './App.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado no Sistema:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          backgroundColor: '#090d16',
          color: '#fff',
          textAlign: 'center'
        }}>
          <img 
            src="/logoNuuPrensado-semfundo.png" 
            alt="Nuu Prensado" 
            style={{ height: '70px', objectFit: 'contain', marginBottom: '1.5rem' }} 
          />
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#111827',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#eab308', marginBottom: '0.75rem' }}>
              Nuu Prensado!!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Ocorreu uma pequena instabilidade ao carregar o cardápio. Clique no botão abaixo para restaurar e recarregar a página.
            </p>
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              🔄 Recarregar Cardápio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado no AdminView:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '3rem 1.5rem', 
          maxWidth: '600px', 
          margin: '2rem auto', 
          textAlign: 'center', 
          backgroundColor: '#161d2f', 
          borderRadius: '12px', 
          border: '1px solid #ef4444' 
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Ops! Ocorreu um problema ao carregar a página</h2>
          <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'Erro inesperado durante a renderização.'}
          </p>
          <button 
            className="btn-primary" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { orders, storeSettings, isStoreOpenNow, getStorePauseStatus } = useSystem();
  const pauseStatus = typeof getStorePauseStatus === 'function' ? getStorePauseStatus() : { isPaused: false };
  const isStoreOpen = typeof isStoreOpenNow === 'function' ? isStoreOpenNow() : (storeSettings?.isOpen ?? true);
  const isImmersiveEnabled = storeSettings?.enableImmersiveView ?? VIEW_CONFIG.ENABLE_IMMERSIVE_VIEW;
  const preferredDefaultMode = storeSettings?.defaultViewMode || VIEW_CONFIG.DEFAULT_VIEW_MODE;

  const getModeFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#admin')) return 'admin';
    if (hash.startsWith('#operacao') || hash.startsWith('#pdv') || hash.startsWith('#caixa') || hash.startsWith('#kds')) return 'operacao';
    return 'delivery';
  };

  const [currentMode, setCurrentMode] = useState(getModeFromHash);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('nuu_admin_authenticated') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Estados compartilhados com a DeliveryView para a barra superior
  const [viewMode, setViewMode] = useState(isImmersiveEnabled ? preferredDefaultMode : 'grid');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('menu');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loggedCustomer, setLoggedCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('nuu_customer_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    const syncSession = () => {
      try {
        const saved = localStorage.getItem('nuu_customer_session');
        setLoggedCustomer(saved ? JSON.parse(saved) : null);
      } catch (e) {}
    };
    window.addEventListener('storage', syncSession);
    window.addEventListener('nuu_customer_session_changed', syncSession);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('nuu_customer_session_changed', syncSession);
    };
  }, []);

  useEffect(() => {
    if (!isImmersiveEnabled && viewMode !== 'grid') {
      setViewMode('grid');
    }
  }, [isImmersiveEnabled, viewMode]);

  useEffect(() => {
    const handleHashChange = () => {
      const mode = getModeFromHash();
      setCurrentMode(mode);
      const isAuth = sessionStorage.getItem('nuu_admin_authenticated') === 'true';
      setIsAdminAuthenticated(isAuth);
      if (mode === 'admin' && !isAuth) {
        setShowLoginModal(true);
      } else if (mode === 'admin' && isAuth) {
        setShowLoginModal(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setCurrentMode('admin');
      if (!window.location.hash.startsWith('#admin')) {
        window.location.hash = 'admin/dashboard';
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('nuu_admin_authenticated', 'true');
    setIsAdminAuthenticated(true);
    setShowLoginModal(false);
    setCurrentMode('admin');
    if (!window.location.hash.startsWith('#admin')) {
      window.location.hash = 'admin/dashboard';
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nuu_admin_authenticated');
    setIsAdminAuthenticated(false);
    setCurrentMode('delivery');
    window.location.hash = 'delivery';
  };

  const handleCancelLogin = () => {
    setShowLoginModal(false);
    if (currentMode === 'admin' && !isAdminAuthenticated) {
      setCurrentMode('delivery');
      window.location.hash = 'delivery';
    }
  };

  const isAccessingAdminWithoutAuth = (currentMode === 'admin' || showLoginModal) && !isAdminAuthenticated;

  if (isAccessingAdminWithoutAuth) {
    return (
      <AdminLoginView 
        onLoginSuccess={handleLoginSuccess}
        onCancel={handleCancelLogin}
      />
    );
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Header Limpo para o Cliente (apenas no modo delivery) */}
      {currentMode === 'delivery' && (
        <header className="app-header">
          <div className="container flex justify-between items-center" style={{ padding: '0.75rem 1.5rem' }}>
            
            {/* Logo Oficial + Status da Loja */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span 
                className="nav-logo" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => { 
                  setCurrentMode('delivery'); 
                  setCheckoutStep('menu');
                }}
              >
                <img 
                  src="/logoNuuPrensado-semfundo.png" 
                  alt="Nuu Prensado!!" 
                  style={{ 
                    height: '46px', 
                    objectFit: 'contain', 
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                  }} 
                />
              </span>

              {/* Badge Oficial de Status de Abertura e Horário */}
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '99px',
                  backgroundColor: pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.18)' : isStoreOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${pauseStatus.isPaused ? 'rgba(234, 179, 8, 0.5)' : isStoreOpen ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  color: pauseStatus.isPaused ? '#fef08a' : isStoreOpen ? '#4ade80' : '#f87171',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.2px'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: pauseStatus.isPaused ? '#f59e0b' : isStoreOpen ? '#22c55e' : '#ef4444',
                  boxShadow: pauseStatus.isPaused ? '0 0 6px #f59e0b' : isStoreOpen ? '0 0 6px #22c55e' : '0 0 6px #ef4444'
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
                          const [openH, openM] = (storeSettings?.openTime || '19:00').split(':').map(Number);
                          const nowMins = now.getHours() * 60 + now.getMinutes();
                          const openMins = openH * 60 + (openM || 0);

                          if (openDays.includes(currentDay) && nowMins < openMins) {
                            return `Fechado • Abre às ${storeSettings?.openTime || '19:00'}`;
                          }
                          if (currentDay === 'seg') {
                            return `Fechado • Abre Terça às ${storeSettings?.openTime || '19:00'}`;
                          }
                          if (currentDay === 'dom' && nowMins >= openMins) {
                            return `Fechado • Abre Terça às ${storeSettings?.openTime || '19:00'}`;
                          }
                          return `Fechado • Abre amanhã às ${storeSettings?.openTime || '19:00'}`;
                        })()}
                </span>
              </div>
            </div>

            {/* Botões de Ação na Barra Superior */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {checkoutStep !== 'menu' && (
                <span 
                  style={{ cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }} 
                  onClick={() => setCheckoutStep('menu')}
                >
                  Catálogo
                </span>
              )}
              {checkoutStep === 'menu' && isImmersiveEnabled && (
                <button 
                  onClick={() => setViewMode(prev => prev === 'slider' ? 'grid' : 'slider')}
                  style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: '#fff', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 16px', 
                    borderRadius: '99px', 
                    transition: '0.3s', 
                    backdropFilter: 'blur(5px)',
                    fontWeight: 600
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  {viewMode === 'slider' ? <LayoutGrid size={18} /> : <MonitorPlay size={18} />}
                  <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                    {viewMode === 'slider' ? 'Ver em Grade' : 'Ver Imersivo'}
                  </span>
                </button>
              )}

              {/* Botão Entrar / Minha Conta no Header Desktop */}
              <button 
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                style={{ 
                  background: loggedCustomer ? 'rgba(234, 179, 8, 0.16)' : 'rgba(255,255,255,0.12)', 
                  border: loggedCustomer ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid rgba(255,255,255,0.2)', 
                  color: loggedCustomer ? '#facc15' : '#fff', 
                  borderRadius: '99px', 
                  padding: '8px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  backdropFilter: 'blur(5px)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  transition: 'all 0.2s ease'
                }}
                title={loggedCustomer ? `Conectado: ${loggedCustomer.phone}` : "Entrar ou ver Meus Pedidos"}
              >
                <User size={18} color={loggedCustomer ? '#facc15' : '#fff'} />
                <span>
                  {loggedCustomer 
                    ? (loggedCustomer.name && loggedCustomer.name !== 'Cliente' 
                        ? loggedCustomer.name.split(' ')[0] 
                        : (loggedCustomer.phone ? loggedCustomer.phone : 'Minha Conta')) 
                    : 'Entrar'}
                </span>
              </button>

              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: 'rgba(255,255,255,0.15)', 
                  padding: '8px 16px', 
                  borderRadius: '99px', 
                  backdropFilter: 'blur(5px)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag size={18} color="#fff" />
                <span>Carrinho</span>
                {totalCartCount > 0 && (
                  <span style={{ background: '#fff', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {totalCartCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Barra Superior Dedicada para o Painel Admin */}
      {currentMode === 'admin' && isAdminAuthenticated && (
        <header className="admin-header-bar" style={{
          backgroundColor: 'rgba(9, 13, 22, 0.95)',
          borderBottom: '1px solid var(--border-glass)',
          padding: '0.65rem 1.5rem',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => {
                setCurrentMode('delivery');
                window.location.hash = 'delivery';
              }}
              title="Voltar ao Cardápio"
            >
              <img 
                src="/logoNuuPrensado-semfundo.png" 
                alt="Nuu Prensado!!" 
                style={{ height: '38px', objectFit: 'contain' }}
              />
            </span>
            <span style={{ 
              backgroundColor: 'rgba(234, 179, 8, 0.15)', 
              color: 'var(--color-brand-yellow)', 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              padding: '3px 8px', 
              borderRadius: '6px',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              letterSpacing: '0.5px'
            }}>
              PAINEL ADMIN
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setCurrentMode('operacao');
                window.location.hash = 'operacao';
              }}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <ChefHat size={16} />
              <span>Frente de Operação</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentMode('delivery');
                window.location.hash = 'delivery';
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Ver Cardápio</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600
              }}
              title="Sair do painel administrativo"
            >
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Render */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: (isCartOpen || !isStoreOpen) ? 99999 : 1 }}>
        {currentMode === 'operacao' ? (
          <OperationView 
            onOpenAdmin={handleOpenAdmin}
            onGoDelivery={() => {
              setCurrentMode('delivery');
              window.location.hash = 'delivery';
            }}
          />
        ) : currentMode === 'admin' && isAdminAuthenticated ? (
          <AdminErrorBoundary>
            <AdminView 
              onLogout={handleLogout}
              onGoOperation={() => {
                setCurrentMode('operacao');
                window.location.hash = 'operacao';
              }}
            />
          </AdminErrorBoundary>
        ) : (
          <DeliveryView 
            viewMode={viewMode}
            setViewMode={setViewMode}
            cart={cart}
            setCart={setCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            checkoutStep={checkoutStep}
            setCheckoutStep={setCheckoutStep}
            isCustomerModalOpen={isCustomerModalOpen}
            setIsCustomerModalOpen={setIsCustomerModalOpen}
            loggedCustomer={loggedCustomer}
            setLoggedCustomer={setLoggedCustomer}
          />
        )}
      </main>

    </>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <SystemProvider>
        <AppContent />
      </SystemProvider>
    </GlobalErrorBoundary>
  );
}
