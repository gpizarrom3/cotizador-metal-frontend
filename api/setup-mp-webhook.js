// Endpoint temporal para registrar el webhook en MercadoPago.
// Llamar una sola vez, luego eliminar este archivo.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const accessToken = process.env.MP_ACCESS_TOKEN
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!accessToken) return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado' })

  const webhookUrl = 'https://cotizador-metal-frontend.vercel.app/api/mp-webhook'

  try {
    // Listar webhooks existentes
    const listRes = await fetch('https://api.mercadopago.com/v1/webhooks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const listData = await listRes.json()
    const existing = (listData || []).find((w) => w.url === webhookUrl)

    if (existing) {
      return res.status(200).json({
        ok: true,
        action: 'already_registered',
        id: existing.id,
        url: existing.url,
        events: existing.topic_filters,
        status: existing.status,
      })
    }

    // Registrar nuevo webhook
    const body = {
      url: webhookUrl,
      topic_filters: ['subscription_preapproval'],
    }
    if (secret) body.webhook_secret = secret

    const createRes = await fetch('https://api.mercadopago.com/v1/webhooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const createData = await createRes.json()

    if (!createRes.ok) {
      return res.status(400).json({ ok: false, error: createData })
    }

    return res.status(200).json({
      ok: true,
      action: 'registered',
      id: createData.id,
      url: createData.url,
      events: createData.topic_filters,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
