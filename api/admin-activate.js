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
  if (req.method !== 'POST') return res.status(405).end()
  const { secret } = req.body || {}
  if (secret !== 'cotiza-activate-2026') return res.status(403).json({ error: 'Forbidden' })

  const uid = 'VjHV6Xje3bh5NH3FuNw0KzzpP5C2'
  const db = getAdminDb()
  await db.collection('suscripciones').doc(uid).set({
    plan: 'pro',
    status: 'authorized',
    activatedManually: true,
    updatedAt: new Date(),
  }, { merge: true })

  return res.status(200).json({ ok: true, uid })
}
