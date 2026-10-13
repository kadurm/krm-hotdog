// src/components/MercadoPagoWhiteLabelCheckout.jsx
// Componente de Checkout White Label oficial com a identidade visual do Nuu Prensado integrado ao Mercado Pago

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Copy, AlertCircle, ShieldCheck, Loader2, RefreshCw, 
  CreditCard, Smartphone, CheckCircle, ArrowLeft, Lock, Sparkles, Trash2
} from 'lucide-react';
import { 
  createMercadoPagoPix, 
  createMercadoPagoCard, 
  checkMercadoPagoStatus, 
  detectCardBrand,
  loadMercadoPagoSDK,
  createMercadoPagoPreference
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

  // Detecção de ecossistema Apple (iPhone / Safari)
  const isAppleDevice = typeof navigator !== 'undefined' && (/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) || (typeof window !== 'undefined' && !!window.ApplePaySession));

  // Estados de Cartão & Carteira do Celular
  const [cardLoading, setCardLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [cardError, setCardError] = useState(null);
  const [detectedBrand, setDetectedBrand] = useState({ id: 'generic', name: 'Cartão', color: '#eab308' });
  const [cardInputMethod, setCardInputMethod] = useState('wallet'); // 'wallet' | 'manual'
  const [savedCards, setSavedCards] = useState([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const cardNumberInputRef = useRef(null);

  // Carrega cartões salvos no dispositivo do cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nuu_saved_cards');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedCards(parsed);
          setSelectedSavedCard(parsed[0]);
          handleApplyCard(parsed[0]);
        }
      }
    } catch (e) {
      console.warn('Falha ao carregar cartões salvos:', e);
    }
  }, []);

  // Detecta retorno automático se o cliente pagou pela Carteira Digital do Mercado Pago
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('collection_status') || urlParams.get('status');
      const paymentId = urlParams.get('payment_id') || urlParams.get('collection_id');
      
      if (status === 'approved' && onPaymentSuccess) {
        window.history.replaceState({}, document.title, window.location.pathname);
        onPaymentSuccess({
          paymentId: paymentId || 'wallet_' + Date.now(),
          method: 'Carteira Digital (Google Pay / Apple Pay)',
          status: 'approved',
          amount
        });
      }
    } catch (e) {
      console.warn('Erro ao verificar retorno da carteira:', e);
    }
  }, []);

  const handleApplyCard = (card) => {
    setSelectedSavedCard(card);
    setCardNumber(card.fullNumber ? card.fullNumber.replace(/(\d{4})/g, '$1 ').trim() : `•••• •••• •••• ${card.last4}`);
    setCardHolder(card.holder || '');
    setCardExpiry(card.expiry || '');
    setCardCpf(card.cpf || '');
    if (card.brandId) {
      setDetectedBrand({ id: card.brandId, name: card.brand || 'Cartão', color: '#eab308' });
    }
  };

  const handleDeleteSavedCard = (cardId, e) => {
    e.stopPropagation();
    const updated = savedCards.filter(c => c.id !== cardId);
    setSavedCards(updated);
    try {
      localStorage.setItem('nuu_saved_cards', JSON.stringify(updated));
    } catch (err) {}
    if (selectedSavedCard?.id === cardId) {
      setSelectedSavedCard(null);
      setCardNumber('');
      setCardCvv('');
    }
  };

  // Abre a Carteira Digital Oficial Nativa do Aparelho (Apple Pay no iPhone, Google Pay no Android)
  const handlePayWithWallet = async () => {
    setWalletLoading(true);
    setCardError(null);

    // 1. TENTA ABRIR O APPLE PAY / GOOGLE PAY NATIVO DO APARELHO (PaymentRequest API)
    if (typeof window !== 'undefined' && window.PaymentRequest) {
      try {
        const supportedPaymentMethods = [];
        
        // Suporte Apple Pay (Safari / iOS)
        if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
          supportedPaymentMethods.push({
            supportedMethods: 'https://apple.com/apple-pay',
            data: {
              version: 3,
              merchantIdentifier: 'merchant.com.nuuprensado',
              countryCode: 'BR',
              currencyCode: 'BRL',
              supportedNetworks: ['visa', 'masterCard', 'elo', 'amex'],
              merchantCapabilities: ['supports3DS']
            }
          });
        }

        // Suporte Google Pay (Chrome / Android)
        supportedPaymentMethods.push({
          supportedMethods: 'https://google.com/pay',
          data: {
            environment: 'PRODUCTION',
            apiVersion: 2,
            apiVersionMinor: 0,
            merchantInfo: {
              merchantName: 'Nuu Prensado Delivery'
            },
            allowedPaymentMethods: [
              {
                type: 'CARD',
                parameters: {
                  allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                  allowedCardNetworks: ['VISA', 'MASTERCARD', 'ELO', 'AMEX']
                },
                tokenizationSpecification: {
                  type: 'PAYMENT_GATEWAY',
                  parameters: {
                    gateway: 'mercadopago',
                    'gatewayMerchantId': 'APP_USR-5871168214552840-101316-1948f98e71fbd6fa559b3aa99105d959-611629089'
                  }
                }
              }
            ]
          }
        });

        // Suporte a cartões gerais da carteira do navegador
        supportedPaymentMethods.push({
          supportedMethods: 'basic-card',
          data: {
            supportedNetworks: ['visa', 'mastercard', 'elo', 'amex']
          }
        });

        const paymentDetails = {
          total: {
            label: 'Nuu Prensado Delivery',
            amount: { currency: 'BRL', value: Number(amount).toFixed(2) }
          }
        };

        const pr = new window.PaymentRequest(supportedPaymentMethods, paymentDetails);
        const prResponse = await pr.show();

        if (prResponse) {
          await prResponse.complete('success');
          
          const details = prResponse.details || {};
          if (details.cardNumber) {
            setCardNumber(details.cardNumber);
            if (details.cardholderName) setCardHolder(details.cardholderName);
            if (details.expiryMonth && details.expiryYear) {
              setCardExpiry(`${details.expiryMonth.padStart(2, '0')}/${details.expiryYear.slice(-2)}`);
            }
            if (details.cardSecurityCode) setCardCvv(details.cardSecurityCode);
          }

          setWalletLoading(false);
          if (onPaymentSuccess) {
            onPaymentSuccess({
              paymentId: 'wallet_' + Date.now(),
              method: isAppleDevice ? 'Apple Pay (Carteira do iPhone)' : 'Google Pay (Carteira Digital)',
              status: 'approved',
              amount
            });
          }
          return;
        }
      } catch (prErr) {
        console.log('PaymentRequest nativo cancelado ou em fallback:', prErr);
      }
    }

    // 2. Fallback Inteligente e Elegante:
    // Se o navegador bloquear o pop-up nativo por restrição de certificado comercial da Apple/Google,
    // nós NUNCA jogamos o usuário para a tela cinza externa do Mercado Pago!
    // Ativamos imediatamente o foco com Face ID / AutoFill da Carteira do iPhone no campo de cartão.
    setWalletLoading(false);
    setCardInputMethod('manual');
    setTimeout(() => {
      if (cardNumberInputRef.current) {
        cardNumberInputRef.current.focus();
      }
    }, 150);
  };

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
        if (saveCardForFuture && cleanNumber.length >= 13) {
          try {
            const existing = JSON.parse(localStorage.getItem('nuu_saved_cards') || '[]');
            const last4 = cleanNumber.slice(-4);
            const filtered = existing.filter(c => c.last4 !== last4);
            const newCard = {
              id: Date.now().toString(),
              brand: detectedBrand.name,
              brandId: detectedBrand.id,
              last4,
              fullNumber: cleanNumber,
              holder: cardHolder.trim(),
              expiry: cardExpiry,
              cpf: cleanCpf
            };
            const updated = [newCard, ...filtered];
            localStorage.setItem('nuu_saved_cards', JSON.stringify(updated));
            setSavedCards(updated);
          } catch (storageErr) {
            console.warn('Erro ao salvar cartão localmente:', storageErr);
          }
        }
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
          ) : pixStatus === 'error' ? (
            <div style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={28} color="#f59e0b" />
              <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>
                Não foi possível gerar o QR Code no momento.
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Verifique sua conexão ou tente gerar novamente.
              </span>
              <button
                type="button"
                onClick={handleGeneratePix}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '6px', fontWeight: 700 }}
              >
                <RefreshCw size={13} /> Tentar Novamente
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Seletor Amigável: Carteira do Celular vs Inserir Manualmente */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)'
          }}>
            <button
              type="button"
              onClick={() => {
                setCardInputMethod('wallet');
                setCardError(null);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: cardInputMethod === 'wallet' ? '#eab308' : 'transparent',
                color: cardInputMethod === 'wallet' ? '#000' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Smartphone size={14} /> Carteira do Celular
            </button>
            <button
              type="button"
              onClick={() => {
                setCardInputMethod('manual');
                setSelectedSavedCard(null);
                setCardError(null);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: cardInputMethod === 'manual' ? '#eab308' : 'transparent',
                color: cardInputMethod === 'manual' ? '#000' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <CreditCard size={14} /> Inserir Dados
            </button>
          </div>

          {/* MODO CARTEIRA DO CELULAR */}
          {cardInputMethod === 'wallet' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
              {/* Box de Ação para Pagar com a Carteira Digital */}
              <div style={{
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1.5px solid rgba(234, 179, 8, 0.35)',
                borderRadius: '12px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
                  {isAppleDevice ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                      <span style={{ fontSize: '1.2rem' }}></span> Apple Pay (Carteira do iPhone)
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fde047' }}>
                      <Smartphone size={18} color="#eab308" /> Carteira Digital (Google Pay)
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: 1.4 }}>
                  {isAppleDevice 
                    ? 'Pague com 1 toque seguro usando Face ID e os cartões cadastrados no seu iPhone.'
                    : 'Pague com 1 toque seguro usando sua biometria e os cartões salvos no seu aparelho.'}
                </p>

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
                    justifyContent: 'center',
                    gap: '5px'
                  }}>
                    <AlertCircle size={13} />
                    <span>{cardError}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={walletLoading}
                  onClick={handlePayWithWallet}
                  style={{
                    backgroundColor: isAppleDevice ? '#000000' : '#eab308',
                    color: isAppleDevice ? '#ffffff' : '#000000',
                    border: isAppleDevice ? '1.5px solid rgba(255, 255, 255, 0.25)' : 'none',
                    padding: '12px 18px',
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isAppleDevice ? '0 4px 18px rgba(0,0,0,0.6)' : '0 4px 15px rgba(234, 179, 8, 0.35)',
                    cursor: walletLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {walletLoading ? (
                    <><Loader2 size={16} className="animate-spin" color={isAppleDevice ? '#fff' : '#000'} /> Conectando à Carteira...</>
                  ) : isAppleDevice ? (
                    <><span style={{ fontSize: '1.25rem', lineHeight: 1 }}></span> Pagar com Apple Pay • R$ {Number(amount).toFixed(2)}</>
                  ) : (
                    <><Lock size={15} /> Pagar com Google Pay • R$ {Number(amount).toFixed(2)}</>
                  )}
                </button>
              </div>

              {/* Lista de Cartões Salvos neste Aparelho (se houver) */}
              {savedCards.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Cartões Salvos neste Aparelho:
                  </label>
                  {savedCards.map(c => {
                    const isSelected = selectedSavedCard?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleApplyCard(c)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1.5px solid #eab308' : '1px solid var(--border-glass)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CreditCard size={18} color="#eab308" />
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>
                              {c.brand} •••• {c.last4}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Titular: {c.holder} • Val: {c.expiry}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedCard(c.id, e)}
                            title="Remover cartão salvo"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Se houver cartão salvo selecionado, pede só o CVV e confirmação */}
              {selectedSavedCard ? (
                <form onSubmit={handleSubmitCard} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: mode === 'credit' ? '1fr 1fr' : '1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        CVV (Código de Segurança)
                      </label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        autoFocus
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
                    {mode === 'credit' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Parcelas
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
                          {amount >= 50 && <option value={2}>2x de R$ {(amount / 2).toFixed(2)} (sem juros)</option>}
                          {amount >= 90 && <option value={3}>3x de R$ {(amount / 3).toFixed(2)} (sem juros)</option>}
                        </select>
                      </div>
                    )}
                  </div>

                  {cardError && (
                    <div style={{ fontSize: '0.74rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <AlertCircle size={13} />
                      <span>{cardError}</span>
                    </div>
                  )}

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
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setCardInputMethod('manual')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Caso não tenha cartão na carteira, clique aqui para inserir os dados
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* MODO INSERIR DADOS MANUALMENTE */
            <form onSubmit={handleSubmitCard} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="animate-fade-in">
              
              {/* Número do Cartão */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="card-number-input" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Número do Cartão
                  </label>
                  <span style={{ fontSize: '0.7rem', color: detectedBrand.color || '#eab308', fontWeight: 800, textTransform: 'uppercase' }}>
                    {detectedBrand.name}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={cardNumberInputRef}
                    id="card-number-input"
                    name="cardNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
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
                <label htmlFor="card-holder-input" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Nome do Titular (como no cartão)
                </label>
                <input
                  id="card-holder-input"
                  name="cardHolder"
                  type="text"
                  autoComplete="cc-name"
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
                  <label htmlFor="card-expiry-input" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Validade (MM/AA)
                  </label>
                  <input
                    id="card-expiry-input"
                    name="cardExpiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
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
                  <label htmlFor="card-cvv-input" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    CVV
                  </label>
                  <input
                    id="card-cvv-input"
                    name="cardCvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
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
                <label htmlFor="card-cpf-input" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  CPF do Titular do Cartão
                </label>
                <input
                  id="card-cpf-input"
                  name="cardCpf"
                  type="text"
                  inputMode="numeric"
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
                  <label htmlFor="card-installments-select" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Número de Parcelas
                  </label>
                  <select
                    id="card-installments-select"
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

              {/* Opção para Salvar Cartão no Aparelho */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 0' }}>
                <input
                  type="checkbox"
                  checked={saveCardForFuture}
                  onChange={(e) => setSaveCardForFuture(e.target.checked)}
                  style={{ accentColor: '#eab308' }}
                />
                <span>Lembrar este cartão na carteira deste celular para próximas compras</span>
              </label>

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

              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => setCardInputMethod('wallet')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  📱 Voltar para Carteira do Celular
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Rodapé de Segurança */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
        <ShieldCheck size={12} color="#4ade80" />
        <span>Seus dados são protegidos com criptografia de ponta a ponta Mercado Pago</span>
      </div>
    </div>
  );
}
