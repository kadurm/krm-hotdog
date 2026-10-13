// api/mercadopago/create-preference.js
// Endpoint Serverless na Vercel para criação de preferências de pagamento no Mercado Pago (Carteira do Celular, Google Pay, Apple Pay)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const {
      amount,
      description = 'Pedido Nuu Prensado',
      payer = {},
      customAccessToken,
      backUrl
    } = req.body;

    const DEFAULT_ACCESS_TOKEN = 'APP_USR-5871168214552840-101316-1948f98e71fbd6fa559b3aa99105d959-611629089';
    const accessToken = customAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido para o pagamento.' });
    }

    const host = req.headers.origin || req.headers.host ? `https://${req.headers.host}` : 'https://nuuprensado.com.br';
    const returnUrl = backUrl || host;

    const preferenceData = {
      items: [
        {
          id: 'nuu-pedido-' + Date.now(),
          title: description,
          description: description,
          quantity: 1,
          unit_price: Number(Number(amount).toFixed(2)),
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: payer.name || 'Cliente',
        email: payer.email || `${(payer.phone || 'cliente').toString().replace(/\D/g, '')}@nuuprensado.com.br`,
        identification: {
          type: 'CPF',
          number: (payer.cpf || '11111111111').toString().replace(/\D/g, '')
        }
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' } // Remove boleto para focar em carteira digital e cartões
        ],
        installments: 1
      },
      back_urls: {
        success: returnUrl,
        pending: returnUrl,
        failure: returnUrl
      },
      auto_return: 'approved',
      statement_descriptor: 'NUU PRENSADO',
      external_reference: 'nuu_' + Date.now()
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro Mercado Pago ao criar preferência:', data);
      return res.status(mpResponse.status).json({
        success: false,
        error: data.message || 'Erro ao gerar pagamento com carteira digital.',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    });
  } catch (error) {
    console.error('Exceção ao criar preferência Mercado Pago:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar carteira digital.',
      message: error.message
    });
  }
}
