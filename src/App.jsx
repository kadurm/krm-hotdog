import React, { useState } from 'react';
import { SystemProvider } from './contexts/SystemContext';
import DeliveryView from './views/delivery/DeliveryView';
import AdminView from './views/admin/AdminView';
import { ShoppingBag, LayoutDashboard, Flame } from 'lucide-react';
import './App.css';

function AppContent() {
  const [currentMode, setCurrentMode] = useState('delivery'); // 'delivery' | 'admin'

  return (
    <>
      {/* Premium Header */}
      <header className="app-header">
        <div className="container flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Logo */}
          <a href="#" className="nav-logo" onClick={() => setCurrentMode('delivery')}>
            <Flame size={28} color="var(--color-brand)" fill="var(--color-brand)" />
            <span>Hot<span className="logo-orange">Dog</span></span>
          </a>

          {/* Mode Switcher */}
          <nav className="nav-links">
            <button 
              onClick={() => setCurrentMode('delivery')} 
              className={`nav-link ${currentMode === 'delivery' ? 'active-brand' : ''}`}
            >
              <ShoppingBag size={16} /> Delivery (Cliente)
            </button>
            <button 
              onClick={() => setCurrentMode('admin')} 
              className={`nav-link ${currentMode === 'admin' ? 'active-brand' : ''}`}
            >
              <LayoutDashboard size={16} /> Painel Administrativo
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content Render */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentMode === 'delivery' ? <DeliveryView /> : <AdminView />}
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
        <div className="container">
          <p>© 2026 HotDog FoodTech - Todos os direitos reservados.</p>
          <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
            Protótipo de alta fidelidade para homologação de fluxo e funcionalidades de gestão.
          </p>
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
