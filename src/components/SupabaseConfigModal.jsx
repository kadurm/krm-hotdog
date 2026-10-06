import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, X, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  SUPABASE_SCHEMA_SQL 
} from '../services/supabase';

export default function SupabaseConfigModal({ onClose, onSaveSuccess }) {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'sql'

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    saveSupabaseCredentials(cleanUrl, cleanKey);
    const result = await testSupabaseConnection();
    setTesting(false);
    setTestResult(result);

    if (result.success) {
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '580px',
        maxWidth: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: '#18181b',
        color: '#fff',
        boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
      }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#3ecf8e22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3ecf8e'
            }}>
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Conexão com Supabase</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isConfigured ? '🟢 Conectado ao banco em nuvem' : '🟠 Modo Local / Fallback offline ativo'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'settings' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Credenciais do Projeto
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'sql' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Database size={15} /> Script SQL das Tabelas
          </button>
        </div>

        {activeTab === 'settings' ? (
          <form onSubmit={handleTestAndSave}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#e4e4e7' }}>
                Project URL (Supabase)
              </label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Encontre em: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#e4e4e7' }}>
                Anon Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Encontre em: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon / public)
              </span>
            </div>

            {testResult && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                backgroundColor: testResult.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: testResult.success ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)',
                color: testResult.success ? '#4ade80' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {testResult.success ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#ccc',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={testing}
                className="btn-primary"
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  cursor: testing ? 'not-allowed' : 'pointer'
                }}
              >
                {testing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Testando...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Salvar & Conectar
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.5' }}>
              Copie o código SQL abaixo e cole no <strong>SQL Editor</strong> do seu projeto no Supabase. Ele cria todas as tabelas (pedidos, clientes, estoque, motoboys, caixa e configurações) com permissões públicas de leitura e escrita.
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <textarea
                readOnly
                value={SUPABASE_SCHEMA_SQL}
                rows={12}
                style={{
                  width: '100%',
                  backgroundColor: '#09090b',
                  color: '#3ecf8e',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  resize: 'none'
                }}
              />
              <button
                onClick={handleCopySql}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: copiedSql ? '#22c55e' : 'var(--color-brand)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#3ecf8e',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Abrir Supabase Dashboard <ExternalLink size={14} />
              </a>

              <button
                onClick={() => setActiveTab('settings')}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Próximo: Inserir Chaves
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
