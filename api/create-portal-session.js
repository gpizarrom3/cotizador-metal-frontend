import Stripe from 'stripe'
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
    const db = getAdminDb()
    const snap = await db.collection('suscripciones').doc(uid).get()
    if (!snap.exists) return res.status(404).json({ error: 'No hay suscripción activa' })

    const { stripeCustomerId } = snap.data()
    if (!stripeCustomerId) return res.status(404).json({ error: 'Customer no encontrado' })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = req.headers.origin || 'https://cotizametal.vercel.app'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/planes`,
    })

    res.status(200).json({ url: portalSession.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
