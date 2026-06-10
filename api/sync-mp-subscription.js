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

  const { uid } = req.body || {}
  if (!uid) return res.status(400).json({ error: 'uid requerido' })

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preapprovalApi = new PreApproval(client)

    const result = await preapprovalApi.search({
      options: { external_reference: uid },
    })

    const subs = result?.results || []
    const active = subs.find((s) => s.status === 'authorized')
    const latest = active || subs.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))[0]

    if (!latest) {
      return res.status(200).json({ found: false, message: 'No se encontró ninguna suscripción para este usuario en MercadoPago.' })
    }

    const isActive = latest.status === 'authorized'
    const db = getAdminDb()
    await db.collection('suscripciones').doc(uid).set(
      {
        plan: isActive ? 'pro' : 'free',
        mpPreapprovalId: String(latest.id),
        status: latest.status,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return res.status(200).json({
      found: true,
      status: latest.status,
      activated: isActive,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
