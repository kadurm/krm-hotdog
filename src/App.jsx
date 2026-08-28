import React, { useState, useEffect } from 'react';
import { SystemProvider } from './contexts/SystemContext';
import DeliveryView from './views/delivery/DeliveryView';
import AdminView from './views/admin/AdminView';
import AdminLoginView from './views/admin/AdminLoginView';
import { Lock, LayoutGrid, MonitorPlay, ShoppingBag } from 'lucide-react';
import './App.css';

function AppContent() {
  const getModeFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#admin')) return 'admin';
    return 'delivery';
  };

  const [currentMode, setCurrentMode] = useState(getModeFromHash);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('nuu_admin_authenticated') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Estados compartilhados com a DeliveryView para a barra superior
  const [viewMode, setViewMode] = useState('slider');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('menu');

  useEffect(() => {
    const handleHashChange = () => {
      const mode = getModeFromHash();
      setCurrentMode(mode);
      if (mode === 'admin' && !isAdminAuthenticated) {
        setShowLoginModal(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdminAuthenticated]);

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
      {/* Header Limpo para o Cliente */}
      <header className="app-header">
        <div className="container flex justify-between items-center" style={{ padding: '0.75rem 1.5rem' }}>
          
          {/* Logo Oficial */}
          <a 
            href="#delivery" 
            className="nav-logo" 
            onClick={(e) => { 
              e.preventDefault(); 
              setCurrentMode('delivery'); 
              window.location.hash = 'delivery'; 
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
          </a>

          {/* Botões de Ação na Barra Superior Superior */}
          {currentMode === 'delivery' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {checkoutStep === 'menu' && (
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
          )}

        </div>
      </header>

      {/* Main Content Render */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentMode === 'admin' && isAdminAuthenticated ? (
          <AdminView onLogout={handleLogout} />
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

      {/* Footer */}
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
          <p>© 2026 Nuu Prensado!! - Todos os direitos reservados.</p>
        </div>
      </footer>
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
