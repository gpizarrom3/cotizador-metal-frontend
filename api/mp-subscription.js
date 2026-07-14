import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminDb() {
  if (!getApps().length) {
    const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
    initializeApp({ credential: cert(credentials) })
  }
  return getFirestore()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const { action, uid, email } = body

  if (!uid) return res.status(400).json({ error: 'uid requerido' })

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  const preapproval = new PreApproval(client)

  try {
    if (action === 'create') {
      if (!email) return res.status(400).json({ error: 'email requerido' })
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
      return res.status(200).json({ url: result.init_point })
    }

    if (action === 'cancel') {
      const db = getAdminDb()
      const snap = await db.collection('suscripciones').doc(uid).get()
      if (!snap.exists) return res.status(404).json({ error: 'No hay suscripción activa' })

      const { mpPreapprovalId } = snap.data()
      if (!mpPreapprovalId) return res.status(404).json({ error: 'ID de suscripción no encontrado' })

      await preapproval.update({ id: mpPreapprovalId, body: { status: 'cancelled' } })
      await db.collection('suscripciones').doc(uid).set(
        { plan: 'free', status: 'cancelled', updatedAt: new Date() },
        { merge: true }
      )
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'action debe ser create o cancel' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
