import React, { useState } from 'react';
import { 
  Flame, Check, Copy, ExternalLink, X, RefreshCw, 
  AlertCircle, ShieldCheck, HelpCircle, Code, Settings
} from 'lucide-react';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  isFirebaseConfigured, 
  testFirebaseConnection, 
  FIRESTORE_RULES_GUIDE 
} from '../services/firebase';

export default function FirebaseConfigModal({ onClose, onSaveSuccess }) {
  const currentConfig = getFirebaseConfig();
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');

  const [rawConfigInput, setRawConfigInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'settings' | 'rules'

  // Analisa bloco de código colado do console Firebase e preenche os campos automaticamente
  const handleParseRawConfig = (text) => {
    setRawConfigInput(text);
    if (!text.trim()) return;

    try {
      const extractField = (fieldName) => {
        const regex = new RegExp(`['"]?${fieldName}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = text.match(regex);
        return match ? match[1] : '';
      };

      const extractedApiKey = extractField('apiKey');
      const extractedAuthDomain = extractField('authDomain');
      const extractedProjectId = extractField('projectId');
      const extractedStorageBucket = extractField('storageBucket');
      const extractedMessagingSenderId = extractField('messagingSenderId');
      const extractedAppId = extractField('appId');

      if (extractedApiKey) setApiKey(extractedApiKey);
      if (extractedAuthDomain) setAuthDomain(extractedAuthDomain);
      if (extractedProjectId) setProjectId(extractedProjectId);
      if (extractedStorageBucket) setStorageBucket(extractedStorageBucket);
      if (extractedMessagingSenderId) setMessagingSenderId(extractedMessagingSenderId);
      if (extractedAppId) setAppId(extractedAppId);

      if (extractedApiKey && extractedProjectId) {
        setTestResult({
          success: true,
          message: 'Credenciais identificadas com sucesso a partir do bloco colado!'
        });
      }
    } catch (e) {}
  };

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(config);
    const result = await testFirebaseConnection(config);
    setTesting(false);
    setTestResult(result);

    if (result.success) {
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_GUIDE);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '620px',
        maxWidth: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.75rem',
        borderRadius: '20px',
        border: '1px solid rgba(255,160,0,0.3)',
        backgroundColor: '#14171f',
        color: '#fff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
      }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 160, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffa000'
            }}>
              <Flame size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Conexão Firebase (Cloud Firestore)</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: isConfigured ? '#34d399' : '#f59e0b' }}>
                {isConfigured ? '🟢 Conectado ao Firebase Cloud' : '🟠 Aguardando configuração do projeto'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'guide' ? '#ffa000' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'guide' ? '#000' : '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={15} /> 1. Passo a Passo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'settings' ? '#ffa000' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'settings' ? '#000' : '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Settings size={15} /> 2. Credenciais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'rules' ? '#ffa000' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'rules' ? '#000' : '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Code size={15} /> 3. Regras (Rules)
          </button>
        </div>

        {/* ABA 1: PASSO A PASSO NO CONSOLE DO FIREBASE */}
        {activeTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{
              backgroundColor: 'rgba(255, 160, 0, 0.08)',
              border: '1px solid rgba(255, 160, 0, 0.25)',
              padding: '12px 16px',
              borderRadius: '12px'
            }}>
              <strong style={{ color: '#ffa000' }}>Objetivo:</strong> Criar um projeto gratuito no Firebase e conectar ao Nuu Prensado para receber pedidos em tempo real.
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 800, color: '#ffa000', marginBottom: '6px' }}>
                Etapa 1: Acessar e Criar o Projeto
              </div>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>
                1. Abra o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: '#ffa000', fontWeight: 700, textDecoration: 'underline' }}>Console do Firebase</a> com sua conta Google.<br />
                2. Clique em <strong>"Adicionar projeto"</strong>.<br />
                3. Digite o nome (ex: <code>nuu-prensado</code>) e clique em Continuar até concluir.
              </p>
              <a 
                href="https://console.firebase.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Abrir Console Firebase <ExternalLink size={13} />
              </a>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 800, color: '#ffa000', marginBottom: '6px' }}>
                Etapa 2: Ativar o Cloud Firestore (Banco de Dados)
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                1. No menu lateral esquerdo, clique em <strong>Criação</strong> (Build) &rarr; <strong>Firestore Database</strong>.<br />
                2. Clique em <strong>"Criar banco de dados"</strong>.<br />
                3. Selecione o local (ex: <code>southamerica-east1</code> em São Paulo, ou o padrão).<br />
                4. Em Regras de Segurança, selecione <strong>"Iniciar no modo de teste"</strong> (ou copie as regras da aba 3 deste modal).
              </p>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 800, color: '#ffa000', marginBottom: '6px' }}>
                Etapa 3: Pegar o Código de Configuração (Web App)
              </div>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>
                1. Na visão geral do projeto, clique no ícone da Web <strong>&lt;/&gt;</strong> (Adicionar aplicativo da Web).<br />
                2. Dê um apelido (ex: <code>Nuu Prensado Web</code>) e clique em Registrar.<br />
                3. O Firebase exibirá um código com <code>const firebaseConfig = &#123; ... &#125;</code>.<br />
                4. Copie esse bloco e cole diretamente na aba <strong>2. Credenciais</strong>!
              </p>
              <button 
                type="button" 
                onClick={() => setActiveTab('settings')}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', backgroundColor: '#ffa000', color: '#000', fontWeight: 800 }}
              >
                Ir para a aba de Credenciais &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ABA 2: FORMULÁRIO DE CREDENCIAIS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleTestAndSave}>
            {/* Campo Rápido para colar o bloco todo */}
            <div style={{ marginBottom: '1.25rem', backgroundColor: 'rgba(255, 160, 0, 0.06)', border: '1px dashed rgba(255, 160, 0, 0.3)', padding: '12px', borderRadius: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#ffa000' }}>
                Colar bloco completo do Firebase (Auto-Preenchimento):
              </label>
              <textarea 
                rows={3}
                placeholder="Cole aqui o const firebaseConfig = { apiKey: '...', projectId: '...' } do console"
                value={rawConfigInput}
                onChange={(e) => handleParseRawConfig(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  backgroundColor: '#090d16',
                  color: '#e4e4e7',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '8px',
                  fontFamily: 'monospace'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Cole o bloco copiado do Firebase para preencher os campos abaixo automaticamente.
              </span>
            </div>

            {/* Campos Individuais */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#e4e4e7' }}>
                  Project ID *
                </label>
                <input 
                  type="text" 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="ex: nuu-prensado-12345"
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#090d16', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#e4e4e7' }}>
                  API Key *
                </label>
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#090d16', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#e4e4e7' }}>
                  Auth Domain
                </label>
                <input 
                  type="text" 
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="nuu-prensado.firebaseapp.com"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#090d16', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#e4e4e7' }}>
                  Storage Bucket
                </label>
                <input 
                  type="text" 
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="nuu-prensado.firebasestorage.app"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#090d16', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#e4e4e7' }}>
                  Messaging Sender ID
                </label>
                <input 
                  type="text" 
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="1234567890"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#090d16', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#e4e4e7' }}>
                  App ID
                </label>
                <input 
                  type="text" 
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456:web:abcd..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#090d16', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Feedback do Teste */}
            {testResult && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: testResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${testResult.success ? '#22c55e' : '#ef4444'}`,
                color: testResult.success ? '#4ade80' : '#f87171'
              }}>
                {testResult.success ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={testing}
                className="btn-primary"
                style={{ 
                  padding: '8px 20px', 
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffa000',
                  color: '#000',
                  fontWeight: 800
                }}
              >
                {testing ? <RefreshCw size={16} className="animate-spin" /> : <Flame size={16} />}
                {testing ? 'Testando Conexão...' : 'Salvar e Conectar'}
              </button>
            </div>
          </form>
        )}

        {/* ABA 3: REGRAS DO CLOUD FIRESTORE */}
        {activeTab === 'rules' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Cole essas regras na aba <strong>Firestore Database &rarr; Regras (Rules)</strong> no console do Firebase para permitir que o cardápio e a cozinha salvem e leiam pedidos em tempo real:
            </p>

            <pre style={{
              backgroundColor: '#090d16',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#34d399',
              fontFamily: 'monospace',
              overflowX: 'auto',
              border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: '260px'
            }}>
              {FIRESTORE_RULES_GUIDE}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleCopyRules}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: '#ffa000', color: '#000', fontWeight: 800 }}
              >
                {copiedRules ? <Check size={16} /> : <Copy size={16} />}
                {copiedRules ? 'Regras Copiadas!' : 'Copiar Regras do Firestore'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
