import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { handleCors } from './_cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { uid, email } = req.body || {}
  if (!uid || !email) return res.status(400).json({ error: 'uid y email requeridos' })

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preapproval = new PreApproval(client)

    const origin = req.headers.origin || 'https://cotizador-metal-frontend.vercel.app'

    const result = await preapproval.create({
      body: {
        reason: 'Plan Pro — CotizaMetal',
        payer_email: email,
        external_reference: uid,
        back_url: `${origin}/planes?success=1`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 14990,
          currency_id: 'CLP',
        },
        status: 'pending',
      },
    })

    res.status(200).json({ url: result.init_point })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
