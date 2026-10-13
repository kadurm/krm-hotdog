// api/mercadopago/create-payment.js
// Endpoint Serverless na Vercel para criação de pagamentos Mercado Pago (Pix e Cartão)

export default async function handler(req, res) {
  // Configura CORS
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
      description,
      paymentMethod, // 'pix' | 'credit_card' | 'debit_card'
      payer = {},
      token, // token do cartão gerado pelo Mercado Pago SDK
      installments = 1,
      paymentMethodId, // 'visa', 'master', etc.
      issuerId,
      customAccessToken
    } = req.body;

    // Obtém o Access Token do Mercado Pago (via env var ou customizado pelo lojista no painel)
    const accessToken = customAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor do pedido inválido.' });
    }

    // Se não tiver Access Token configurado pelo lojista, gera resposta simulada de homologação/sandbox
    // para que a experiência do usuário nunca quebre mesmo antes de inserir as chaves
    if (!accessToken) {
      const simulatedPaymentId = 'sim_' + Date.now();
      if (paymentMethod === 'pix') {
        const simulatedQrCode = `00020101021226830014br.gov.bcb.pix2561pix.mercadopago.com.br/qr/v2/${simulatedPaymentId}520400005303986540${amount.toFixed(2)}5802BR5912Nuu Prensado6008MOC62070503***6304`;
        return res.status(200).json({
          success: true,
          isSimulation: true,
          paymentId: simulatedPaymentId,
          status: 'pending',
          statusDetail: 'waiting_payment',
          qrCode: simulatedQrCode,
          qrCodeBase64: '',
          ticketUrl: '',
          message: 'Modo demonstração/sandbox ativo. Configure seu Access Token no painel Admin para transações reais.'
        });
      } else {
        return res.status(200).json({
          success: true,
          isSimulation: true,
          paymentId: simulatedPaymentId,
          status: 'approved',
          statusDetail: 'accredited',
          message: 'Pagamento de cartão aprovado em modo demonstração!'
        });
      }
    }

    // Chamada oficial à API do Mercado Pago (v1/payments)
    let payload = {
      transaction_amount: parseFloat(Number(amount).toFixed(2)),
      description: description || 'Pedido Nuu Prensado',
      payer: {
        email: payer.email || 'contato@nuuprensado.com.br',
        first_name: payer.name || 'Cliente Nuu Prensado',
        identification: {
          type: 'CPF',
          number: (payer.cpf || '11111111111').replace(/\D/g, '')
        }
      }
    };

    if (paymentMethod === 'pix') {
      payload.payment_method_id = 'pix';
    } else {
      // Cartão de Crédito ou Débito
      payload.token = token;
      payload.installments = Number(installments) || 1;
      payload.payment_method_id = paymentMethodId || 'master';
      if (issuerId) payload.issuer_id = issuerId;
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': `nuu_${Date.now()}_${Math.random().toString(36).substring(7)}`
      },
      body: JSON.stringify(payload)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro retornado pelo Mercado Pago:', mpData);
      return res.status(mpResponse.status).json({
        error: mpData.message || 'Erro ao processar pagamento com o Mercado Pago.',
        details: mpData
      });
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || '';

    return res.status(200).json({
      success: true,
      paymentId: mpData.id,
      status: mpData.status, // 'pending' | 'approved' | 'rejected'
      statusDetail: mpData.status_detail,
      qrCode,
      qrCodeBase64,
      ticketUrl,
      paymentMethod: mpData.payment_method_id
    });

  } catch (error) {
    console.error('Erro na função create-payment:', error);
    return res.status(500).json({
      error: 'Erro interno ao conectar com Mercado Pago.',
      message: error.message
    });
  }
}
