import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { handleCors } from './_cors.js'

function getAdminDb() {
  if (!getApps().length) {
    const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
    initializeApp({ credential: cert(credentials) })
  }
  return getFirestore()
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { uid } = req.body || {}
  if (!uid) return res.status(400).json({ error: 'uid requerido' })

  try {
    const db = getAdminDb()
    const snap = await db.collection('suscripciones').doc(uid).get()
    if (!snap.exists) return res.status(404).json({ error: 'No hay suscripción activa' })

    const { mpPreapprovalId } = snap.data()
    if (!mpPreapprovalId) return res.status(404).json({ error: 'ID de suscripción no encontrado' })

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preapproval = new PreApproval(client)

    await preapproval.update({
      id: mpPreapprovalId,
      body: { status: 'cancelled' },
    })

    // Actualizar Firestore de inmediato para reflejar el cambio en la UI
    await db.collection('suscripciones').doc(uid).set(
      { plan: 'free', status: 'cancelled', updatedAt: new Date() },
      { merge: true }
    )

    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
