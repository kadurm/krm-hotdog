import React, { useState, useEffect } from 'react';
import { SystemProvider } from './contexts/SystemContext';
import DeliveryView from './views/delivery/DeliveryView';
import AdminView from './views/admin/AdminView';
import AdminLoginView from './views/admin/AdminLoginView';
import { Lock } from 'lucide-react';
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

        </div>
      </header>

      {/* Main Content Render */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentMode === 'admin' && isAdminAuthenticated ? (
          <AdminView onLogout={handleLogout} />
        ) : (
          <DeliveryView />
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-glass)', 
        padding: '1.5rem 0', 
        backgroundColor: 'var(--bg-secondary)', 
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        textAlign: 'center'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <p>© 2026 Nuu Prensado!! - Todos os direitos reservados.</p>
          <p style={{ fontSize: '0.75rem' }}>
            Protótipo de alta fidelidade para homologação de fluxo e funcionalidades de gestão.
          </p>
          <button 
            onClick={handleOpenAdmin}
            style={{ 
              marginTop: '8px', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              opacity: 0.5,
              cursor: 'pointer'
            }}
            title="Acesso Administrativo Restrito"
          >
            <Lock size={12} /> Acesso Restrito à Gestão
          </button>
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
