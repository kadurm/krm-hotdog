// api/mercadopago/check-payment.js
// Endpoint Serverless na Vercel para verificar o status de um pagamento Pix ou Cartão

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { paymentId, customAccessToken } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId é obrigatório.' });
  }

  // Se for ID simulado de teste
  if (String(paymentId).startsWith('sim_')) {
    return res.status(200).json({
      paymentId,
      status: 'pending',
      statusDetail: 'simulation',
      isSimulation: true
    });
  }

  const accessToken = customAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(200).json({
      paymentId,
      status: 'pending',
      statusDetail: 'missing_access_token'
    });
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({
        error: mpData.message || 'Erro ao consultar pagamento no Mercado Pago.',
        details: mpData
      });
    }

    return res.status(200).json({
      paymentId: mpData.id,
      status: mpData.status, // 'pending' | 'approved' | 'rejected' | 'cancelled'
      statusDetail: mpData.status_detail,
      dateApproved: mpData.date_approved,
      transactionAmount: mpData.transaction_amount
    });
  } catch (error) {
    console.error('Erro na função check-payment:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar Mercado Pago.',
      message: error.message
    });
  }
}
