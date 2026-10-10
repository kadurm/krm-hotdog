import React, { useState, useEffect } from 'react';
import { SystemProvider, useSystem } from './contexts/SystemContext';
import DeliveryView from './views/delivery/DeliveryView';
import AdminView from './views/admin/AdminView';
import AdminLoginView from './views/admin/AdminLoginView';
import OperationView from './views/operation/OperationView';
import { Lock, LayoutGrid, MonitorPlay, ShoppingBag, Clock, ChefHat, Shield, LogOut } from 'lucide-react';
import { VIEW_CONFIG } from './config/viewConfig';
import './App.css';

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
  const { orders, storeSettings } = useSystem();
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
            
            {/* Logo Oficial */}
            <span 
              className="nav-logo" 
              style={{ cursor: 'pointer' }}
              onClick={() => { 
                setCurrentMode('delivery'); 
                setCheckoutStep('menu');
              }}
            >
              <img 
                src="/logoNuuPrensado-semfundo.png" 
                alt="Nuu Prensado!!" 
                style={{ 
                  height: '48px', 
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                }} 
              />
            </span>

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
              {checkoutStep === 'menu' && (() => {
                const savedId = typeof window !== 'undefined' ? localStorage.getItem('nuu_customer_last_order_id') : null;
                const activeOrder = savedId ? orders.find(o => o.id === parseInt(savedId) && o.status !== 'delivered') : null;
                if (!activeOrder) return null;
                return (
                  <button 
                    onClick={() => setCheckoutStep('tracking')}
                    style={{ 
                      background: 'rgba(234, 179, 8, 0.18)', 
                      border: '1px solid #eab308', 
                      color: '#eab308', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '7px 14px', 
                      borderRadius: '99px', 
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}
                  >
                    <Clock size={15} />
                    <span>Acompanhar Pedido #{activeOrder.id}</span>
                  </button>
                );
              })()}
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          />
        )}
      </main>

      {/* Footer Limpo e Exclusivo para o Cliente */}
      {currentMode === 'delivery' && (
        <footer className="app-footer" style={{ 
          borderTop: '1px solid var(--border-glass)', 
          padding: '1.5rem 0', 
          backgroundColor: 'rgba(9, 13, 22, 0.85)', 
          backdropFilter: 'blur(12px)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <p style={{ margin: 0 }}>© 2026 Nuu Prensado!! - Todos os direitos reservados.</p>
          </div>
        </footer>
      )}
    </>
  );
}

export default function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}
