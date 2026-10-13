// src/services/mercadoPagoService.js
// Serviço de Integração do Mercado Pago para Checkout White Label (Pix e Cartão)

let mpInstance = null;

/**
 * Carrega dinamicamente o SDK oficial do Mercado Pago JS v2
 */
export async function loadMercadoPagoSDK(publicKey) {
  if (typeof window === 'undefined') return null;

  if (window.MercadoPago && publicKey) {
    if (!mpInstance || mpInstance._publicKey !== publicKey) {
      mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      mpInstance._publicKey = publicKey;
    }
    return mpInstance;
  }

  return new Promise((resolve) => {
    if (document.getElementById('mercadopago-sdk-script')) {
      const checkInterval = setInterval(() => {
        if (window.MercadoPago && publicKey) {
          clearInterval(checkInterval);
          mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
          mpInstance._publicKey = publicKey;
          resolve(mpInstance);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'mercadopago-sdk-script';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      if (window.MercadoPago && publicKey) {
        mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        mpInstance._publicKey = publicKey;
        resolve(mpInstance);
      } else {
        resolve(null);
      }
    };
    script.onerror = () => {
      console.warn('Não foi possível carregar o script externo do Mercado Pago SDK.');
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

/**
 * Cria um pagamento Pix Dinâmico no Mercado Pago via backend serverless
 */
export async function createMercadoPagoPix({
  amount,
  description,
  payer = {},
  customAccessToken = ''
}) {
  try {
    const response = await fetch('/api/mercadopago/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        description,
        paymentMethod: 'pix',
        payer,
        customAccessToken
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao chamar create-payment Pix:', error);
    return {
      success: false,
      error: 'Não foi possível conectar ao serviço de pagamento.',
      message: error.message
    };
  }
}

/**
 * Cria um pagamento de Cartão (Crédito ou Débito) no Mercado Pago
 */
export async function createMercadoPagoCard({
  amount,
  description,
  payer = {},
  token,
  installments = 1,
  paymentMethodId = 'master',
  issuerId = null,
  customAccessToken = ''
}) {
  try {
    const response = await fetch('/api/mercadopago/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        description,
        paymentMethod: 'credit_card',
        payer,
        token,
        installments,
        paymentMethodId,
        issuerId,
        customAccessToken
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao chamar create-payment Card:', error);
    return {
      success: false,
      error: 'Falha na comunicação de pagamento.',
      message: error.message
    };
  }
}

/**
 * Consulta em tempo real se o pagamento Pix/Cartão foi aprovado
 */
export async function checkMercadoPagoStatus(paymentId, customAccessToken = '') {
  try {
    const url = `/api/mercadopago/check-payment?paymentId=${encodeURIComponent(paymentId)}${
      customAccessToken ? `&customAccessToken=${encodeURIComponent(customAccessToken)}` : ''
    }`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Detecta a bandeira de cartão baseado nos dígitos iniciais
 */
export function detectCardBrand(cardNumber = '') {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return { id: 'visa', name: 'Visa', color: '#1a1f71' };
  if (/^(5[1-5]|2[2-7])/.test(clean)) return { id: 'master', name: 'Mastercard', color: '#eb001b' };
  if (/^(4011|438935|451416|4576|504175|506699|5067|509|627780|636297|636368|650|6516|6550)/.test(clean)) {
    return { id: 'elo', name: 'Elo', color: '#00a4e0' };
  }
  if (/^(606282|3841)/.test(clean)) return { id: 'hipercard', name: 'Hipercard', color: '#b31010' };
  if (/^3[47]/.test(clean)) return { id: 'amex', name: 'American Express', color: '#007bc1' };
  return { id: 'generic', name: 'Cartão', color: '#eab308' };
}

/**
 * Cria uma preferência de pagamento para Carteira Digital (Google Pay, Apple Pay e Mercado Pago)
 */
export async function createMercadoPagoPreference({
  amount,
  description,
  payer = {},
  customAccessToken = '',
  backUrl = ''
}) {
  try {
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        description,
        payer,
        customAccessToken,
        backUrl
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao chamar create-preference:', error);
    return {
      success: false,
      error: 'Não foi possível inicializar a carteira digital.',
      message: error.message
    };
  }
}
