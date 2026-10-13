// src/components/MercadoPagoWhiteLabelCheckout.jsx
// Componente de Checkout White Label oficial com a identidade visual do Nuu Prensado integrado ao Mercado Pago

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Copy, AlertCircle, ShieldCheck, Loader2, RefreshCw, 
  CreditCard, Smartphone, CheckCircle, ArrowLeft, Lock, Sparkles
} from 'lucide-react';
import { 
  createMercadoPagoPix, 
  createMercadoPagoCard, 
  checkMercadoPagoStatus, 
  detectCardBrand,
  loadMercadoPagoSDK 
} from '../services/mercadoPagoService';

export default function MercadoPagoWhiteLabelCheckout({
  amount = 0,
  description = 'Pedido Nuu Prensado',
  customerName = '',
  customerPhone = '',
  storeSettings = {},
  onPaymentSuccess,
  onPaymentError,
  mode = 'pix', // 'pix' | 'credit' | 'debit'
  onBack
}) {
  const mpSettings = storeSettings?.mercadoPago || {};
  const customAccessToken = mpSettings?.accessToken || '';
  const publicKey = mpSettings?.publicKey || '';

  // Estados de Pix
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState(null); // { paymentId, qrCode, qrCodeBase64, status }
  const [pixCopied, setPixCopied] = useState(false);
  const [pixStatus, setPixStatus] = useState('idle'); // 'idle' | 'waiting' | 'approved' | 'expired' | 'error'
  const [pixSecondsLeft, setPixSecondsLeft] = useState(600); // 10 minutos
  const pollingRef = useRef(null);

  // Estados de Cartão
  const [cardLoading, setCardLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [cardError, setCardError] = useState(null);
  const [detectedBrand, setDetectedBrand] = useState({ id: 'generic', name: 'Cartão' });

  // 1. GERAÇÃO AUTOMÁTICA DE PIX
  useEffect(() => {
    if (mode === 'pix') {
      handleGeneratePix();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [mode]);

  // Detector de bandeira ao digitar cartão
  useEffect(() => {
    const brand = detectCardBrand(cardNumber);
    setDetectedBrand(brand);
  }, [cardNumber]);

  const handleGeneratePix = async () => {
    setPixLoading(true);
    setPixStatus('waiting');
    setPixData(null);
    setPixSecondsLeft(600);

    const payer = {
      name: customerName || 'Cliente',
      email: `${(customerPhone || 'cliente').replace(/\D/g, '')}@nuuprensado.com.br`,
      cpf: cardCpf.replace(/\D/g, '') || '11111111111'
    };

    const res = await createMercadoPagoPix({
      amount,
      description,
      payer,
      customAccessToken
    });

    setPixLoading(false);

    if (res.success && res.paymentId) {
      setPixData(res);
      startPixPolling(res.paymentId);
    } else {
      setPixStatus('error');
      if (onPaymentError) onPaymentError(res.error || 'Erro ao gerar Pix.');
    }
  };

  // Polling a cada 3.5 segundos para detectar aprovação instantânea
  const startPixPolling = (paymentId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const statusRes = await checkMercadoPagoStatus(paymentId, customAccessToken);
      
      if (statusRes.status === 'approved') {
        clearInterval(pollingRef.current);
        setPixStatus('approved');
        if (onPaymentSuccess) {
          onPaymentSuccess({
            paymentId,
            method: 'Pix (Mercado Pago)',
            status: 'approved',
            amount
          });
        }
      } else if (statusRes.status === 'rejected' || statusRes.status === 'cancelled') {
        clearInterval(pollingRef.current);
        setPixStatus('expired');
      }
    }, 3500);
  };

  // Timer regressivo de 10 minutos para o Pix
  useEffect(() => {
    if (pixStatus !== 'waiting') return;
    const timer = setInterval(() => {
      setPixSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPixStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixStatus]);

  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    });
  };

  // 2. PROCESSAMENTO DE CARTÃO (CRÉDITO / DÉBITO)
  const handleSubmitCard = async (e) => {
    e.preventDefault();
    setCardError(null);

    const cleanNumber = cardNumber.replace(/\D/g, '');
    const cleanCpf = cardCpf.replace(/\D/g, '');
    const cleanCvv = cardCvv.replace(/\D/g, '');
    const [month, year] = cardExpiry.split('/').map(v => v.trim());

    if (cleanNumber.length < 13) {
      setCardError('Número do cartão inválido.');
      return;
    }
    if (!cardHolder.trim()) {
      setCardError('Informe o nome impresso no cartão.');
      return;
    }
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setCardError('Data de validade inválida (formato MM/AA).');
      return;
    }
    if (cleanCvv.length < 3) {
      setCardError('Código de segurança (CVV) inválido.');
      return;
    }
    if (cleanCpf.length < 11) {
      setCardError('CPF do titular é obrigatório para validação antifraude.');
      return;
    }

    setCardLoading(true);

    try {
      let token = 'mock_token_' + Date.now();

      // Se houver publicKey oficial, tokeniza via SDK do Mercado Pago
      if (publicKey && typeof window !== 'undefined') {
        const mp = await loadMercadoPagoSDK(publicKey);
        if (mp && mp.createCardToken) {
          try {
            const tokenRes = await mp.createCardToken({
              cardNumber: cleanNumber,
              cardholderName: cardHolder.trim(),
              cardExpirationMonth: month,
              cardExpirationYear: '20' + year,
              securityCode: cleanCvv,
              identificationType: 'CPF',
              identificationNumber: cleanCpf
            });
            if (tokenRes && tokenRes.id) {
              token = tokenRes.id;
            }
          } catch (tokErr) {
            console.warn('Tokenização via SDK:', tokErr);
          }
        }
      }

      const res = await createMercadoPagoCard({
        amount,
        description,
        payer: {
          name: cardHolder.trim(),
          email: `${(customerPhone || 'cliente').replace(/\D/g, '')}@nuuprensado.com.br`,
          cpf: cleanCpf
        },
        token,
        installments: cardInstallments,
        paymentMethodId: detectedBrand.id !== 'generic' ? detectedBrand.id : 'master',
        customAccessToken
      });

      setCardLoading(false);

      if (res.success && res.status === 'approved') {
        if (onPaymentSuccess) {
          onPaymentSuccess({
            paymentId: res.paymentId,
            method: mode === 'credit' ? 'Cartão de Crédito (Mercado Pago)' : 'Cartão de Débito (Mercado Pago)',
            status: 'approved',
            amount
          });
        }
      } else {
        const msg = res.statusDetail === 'cc_rejected_bad_filled_security_code' 
          ? 'Código de segurança incorreto.' 
          : res.statusDetail === 'cc_rejected_insufficient_amount'
          ? 'Saldo insuficiente no cartão.'
          : (res.error || 'Cartão não autorizado pela operadora. Tente outro cartão ou Pix.');
        setCardError(msg);
        if (onPaymentError) onPaymentError(msg);
      }
    } catch (err) {
      setCardLoading(false);
      setCardError('Erro ao comunicar com a operadora de pagamentos.');
    }
  };

  const formatMinutes = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      border: '1px solid rgba(234, 179, 8, 0.35)',
      borderRadius: '14px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative'
    }} className="animate-fade-in">
      
      {/* Selo White Label do Nuu Prensado com Mercado Pago */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: '#eab308',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.85rem'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {mode === 'pix' ? 'Pix Automático' : mode === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                Mercado Pago
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Ambiente 100% Criptografado & Seguro
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Valor a pagar:</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-brand-yellow)' }}>
            R$ {Number(amount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* --- MODO PIX DINÂMICO --- */}
      {mode === 'pix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pixLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={28} className="animate-spin" color="#eab308" />
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                Gerando QR Code Oficial do Mercado Pago...
              </span>
            </div>
          ) : pixStatus === 'approved' ? (
            <div style={{
              padding: '20px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '10px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={36} color="#4ade80" />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                🎉 Pagamento Pix Confirmado!
              </div>
              <div style={{ fontSize: '0.78rem', color: '#4ade80' }}>
                Identificamos seu pagamento em tempo real. Enviando pedido para a chapa...
              </div>
            </div>
          ) : pixStatus === 'expired' ? (
            <div style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={28} color="#ef4444" />
              <span style={{ fontSize: '0.84rem', color: '#fff' }}>
                O tempo para pagamento deste Pix expirou.
              </span>
              <button
                type="button"
                onClick={handleGeneratePix}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', fontWeight: 700 }}
              >
                <RefreshCw size={12} /> Gerar Novo Pix
              </button>
            </div>
          ) : pixData ? (
            <>
              {/* Box com QR Code e Instruções */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)'
              }}>
                {/* Imagem do QR Code oficial */}
                {pixData.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix Mercado Pago"
                    style={{
                      width: '160px',
                      height: '160px',
                      borderRadius: '8px',
                      border: '3px solid #fff',
                      backgroundColor: '#fff',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                  }}>
                    {/* Fallback de QR Code gerado via API pública gratuita caso base64 venha vazio */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pixData.qrCode)}`}
                      alt="QR Code Pix"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                )}

                {/* Radar de Verificação em Tempo Real */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fde047', fontSize: '0.78rem', fontWeight: 700 }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  <span>Aguardando confirmação bancária... ({formatMinutes(pixSecondsLeft)})</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Não precisa enviar comprovante! O sistema aprova automaticamente assim que você pagar.
                </div>
              </div>

              {/* Código Pix Copia e Cola */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Ou pague usando o Pix Copia e Cola:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    style={{
                      backgroundColor: pixCopied ? '#22c55e' : '#eab308',
                      color: '#000',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pixCopied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                    {pixCopied ? 'Copiado!' : 'Copiar Código Pix'}
                  </button>
                </div>
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  wordBreak: 'break-all',
                  maxHeight: '44px',
                  overflowY: 'hidden',
                  fontFamily: 'monospace'
                }}>
                  {pixData.qrCode}
                </div>
              </div>

              {pixData.isSimulation && (
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  ℹ️ Modo demonstração ativo. Para simular aprovação automática agora mesmo, você pode avançar normalmente.
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <button
                type="button"
                onClick={handleGeneratePix}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Gerar QR Code Pix
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODO CARTÃO WHITE LABEL (CRÉDITO / DÉBITO) --- */}
      {(mode === 'credit' || mode === 'debit') && (
        <form onSubmit={handleSubmitCard} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Número do Cartão */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Número do Cartão
              </label>
              <span style={{ fontSize: '0.7rem', color: detectedBrand.color, fontWeight: 800, textTransform: 'uppercase' }}>
                {detectedBrand.name}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                  setCardNumber(v);
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
            </div>
          </div>

          {/* Nome Impresso */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Nome do Titular (como no cartão)
            </label>
            <input
              type="text"
              placeholder="Ex: CARLOS E SILVA"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                textTransform: 'uppercase'
              }}
            />
          </div>

          {/* Validade e CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Validade (MM/AA)
              </label>
              <input
                type="text"
                placeholder="MM/AA"
                maxLength={5}
                value={cardExpiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                  setCardExpiry(v);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                CVV
              </label>
              <input
                type="password"
                placeholder="123"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          {/* CPF do Titular */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              CPF do Titular do Cartão
            </label>
            <input
              type="text"
              placeholder="000.000.000-00"
              maxLength={14}
              value={cardCpf}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length <= 11) {
                  v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                }
                setCardCpf(v);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Parcelamento se Crédito */}
          {mode === 'credit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Número de Parcelas
              </label>
              <select
                value={cardInstallments}
                onChange={(e) => setCardInstallments(Number(e.target.value))}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: '#fff',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              >
                <option value={1}>1x de R$ {Number(amount).toFixed(2)} (sem juros)</option>
                {amount >= 50 && (
                  <option value={2}>2x de R$ {(amount / 2).toFixed(2)} (sem juros)</option>
                )}
                {amount >= 90 && (
                  <option value={3}>3x de R$ {(amount / 3).toFixed(2)} (sem juros)</option>
                )}
              </select>
            </div>
          )}

          {cardError && (
            <div style={{
              fontSize: '0.74rem',
              color: '#f87171',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <AlertCircle size={13} />
              <span>{cardError}</span>
            </div>
          )}

          {/* Botão de Pagamento com Cartão */}
          <button
            type="submit"
            disabled={cardLoading}
            className="btn-primary"
            style={{
              padding: '11px',
              fontSize: '0.92rem',
              fontWeight: 800,
              borderRadius: '8px',
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
              boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)'
            }}
          >
            {cardLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Processando Pagamento...</>
            ) : (
              <><Lock size={14} /> Pagar R$ {Number(amount).toFixed(2)} com Segurança</>
            )}
          </button>
        </form>
      )}

      {/* Rodapé de Segurança */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
        <ShieldCheck size={12} color="#4ade80" />
        <span>Seus dados são protegidos com criptografia de ponta a ponta Mercado Pago</span>
      </div>
    </div>
  );
}
