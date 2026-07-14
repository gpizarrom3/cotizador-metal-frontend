import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

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
  const { uid, cotizacionId, action } = body

  if (!uid || !cotizacionId) return res.status(400).json({ error: 'Missing uid or cotizacionId' })

  const db = getAdminDb()
  const cotRef = db.doc(`usuarios/${uid}/cotizaciones/${cotizacionId}`)

  try {
    const cotSnap = await cotRef.get()
    if (!cotSnap.exists) return res.status(404).json({ error: 'Not found' })

    if (action === 'despublicar') {
      const existingToken = cotSnap.data().shareToken
      if (existingToken) {
        await db.doc(`publicLinks/${existingToken}`).delete()
        await cotRef.update({ shareToken: FieldValue.delete() })
      }
      return res.status(200).json({ ok: true })
    }

    // Default: publicar
    const shareToken = crypto.randomBytes(20).toString('hex')
    await db.doc(`publicLinks/${shareToken}`).set({
      uid,
      cotizacionId,
      creadoEn: FieldValue.serverTimestamp(),
    })
    await cotRef.update({ shareToken })

    res.status(200).json({ shareToken })
  } catch (err) {
    console.error('[publicar-cotizacion]', err)
    res.status(500).json({ error: err.message })
  }
}
