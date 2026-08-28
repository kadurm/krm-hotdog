import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle, LogIn } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Credenciais de homologação/administração
    const userClean = username.trim().toLowerCase();
    if ((userClean === 'admin' && password === 'admin123') ||
        (userClean === 'admin' && password === 'nuu123')) {
      onLoginSuccess();
    } else {
      setError('Usuário ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '420px', padding: '0', overflow: 'hidden' }}>
        
        {/* Header do Login */}
        <div style={{ 
          background: 'linear-gradient(135deg, #b8261b 0%, #8e1c13 100%)', 
          padding: '2rem 1.5rem', 
          textAlign: 'center',
          color: '#fff',
          position: 'relative'
        }}>
          {onCancel && (
            <button 
              onClick={onCancel}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#fff', opacity: 0.8 }}
            >
              <X size={20} />
            </button>
          )}
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 0.75rem auto' 
          }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Acesso Administrativo</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
            Área restrita à gestão da Nuu Prensado!!
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
          
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239,68,68,0.15)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              color: '#ef4444', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Usuário Admin
            </label>
            <input 
              type="text" 
              required
              autoFocus
              placeholder="Ex: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Senha de Acesso
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            {onCancel ? (
              <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.9rem' }}>
                Voltar ao Site
              </button>
            ) : <div />}
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              <LogIn size={16} /> Entrar
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Dica de acesso: usuário <strong>admin</strong> | senha <strong>admin123</strong>
          </div>

        </form>

      </div>
    </div>
  );
}
