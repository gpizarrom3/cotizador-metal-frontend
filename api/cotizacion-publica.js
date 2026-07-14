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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'Missing token' })

  res.setHeader('Access-Control-Allow-Origin', '*')

  const db = getAdminDb()

  try {
    const linkSnap = await db.doc(`publicLinks/${token}`).get()
    if (!linkSnap.exists) return res.status(404).json({ error: 'Link no encontrado o expirado' })

    const { uid, cotizacionId } = linkSnap.data()
    const cotSnap = await db.doc(`usuarios/${uid}/cotizaciones/${cotizacionId}`).get()
    if (!cotSnap.exists) return res.status(404).json({ error: 'Cotización no encontrada' })

    const data = cotSnap.data()
    // Convert Firestore Timestamps to strings
    const fechaDate = data.fecha?.toDate ? data.fecha.toDate() : null
    const fechaStr = fechaDate
      ? fechaDate.toLocaleDateString('es-CL')
      : (typeof data.fecha === 'string' ? data.fecha : '—')

    // Remove internal-only fields
    const { shareToken: _st, deleted: _d, deletedAt: _da, ...publicData } = data

    res.status(200).json({
      cot: { id: cotizacionId, ...publicData, fecha: fechaStr },
    })
  } catch (err) {
    console.error('[cotizacion-publica]', err)
    res.status(500).json({ error: err.message })
  }
}
