import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, LogIn, ArrowLeft } from 'lucide-react';

export default function AdminLoginView({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const userClean = username.trim().toLowerCase();
    const passClean = password.trim();

    if (userClean === 'nuuadm' && (passClean === 'NuuAdm' || passClean === 'nuuadm')) {
      onLoginSuccess();
    } else {
      setError('Usuário ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#090d16',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(168, 35, 25, 0.15) 0%, rgba(9, 13, 22, 1) 70%)'
    }} className="animate-fade-in">
      
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '0', 
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        border: '1px solid var(--border-glass)'
      }}>
        
        {/* Header do Login com a cor amarela exata #edb143 e Logo sem fundo */}
        <div style={{ 
          backgroundColor: '#edb143', 
          padding: '2.5rem 2rem 2rem 2rem', 
          textAlign: 'center',
          color: '#1a1a1a',
          position: 'relative'
        }}>
          {onCancel && (
            <button 
              onClick={onCancel}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                left: '16px', 
                color: '#1a1a1a', 
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
              title="Voltar ao site"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}

          {/* Logo Oficial Sem Fundo integrada no fundo amarelo #edb143 */}
          <img 
            src="/logoNuuPrensado-semfundo.png" 
            alt="Nuu Prensado!!" 
            style={{ 
              height: '110px', 
              objectFit: 'contain', 
              margin: '0 auto 0.75rem auto',
              display: 'block'
            }} 
          />

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8f2018', letterSpacing: '0.5px' }}>Painel Administrativo</h3>
          <p style={{ fontSize: '0.85rem', color: '#333333', fontWeight: 600, marginTop: '4px' }}>
            Acesso exclusivo para gestão e equipe operacional
          </p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem' }}>
          
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239,68,68,0.15)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              color: '#ef4444', 
              padding: '12px 14px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Usuário Administrativo
            </label>
            <input 
              type="text" 
              required
              autoFocus
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px 14px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Senha de Acesso
            </label>
            <input 
              type="password" 
              required
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '14px', 
              fontSize: '1rem', 
              marginTop: '0.5rem' 
            }}
          >
            <LogIn size={18} /> Acessar Sistema
          </button>

        </form>

      </div>
    </div>
  );
}
