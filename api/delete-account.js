import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function getAdmin() {
  if (!getApps().length) {
    const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
    initializeApp({ credential: cert(credentials) })
  }
  return { db: getFirestore(), auth: getAuth() }
}

async function deleteSubcollection(db, parentRef, name) {
  const snap = await db.collection(`${parentRef.path}/${name}`).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.slice(7)

  try {
    const { db, auth } = getAdmin()

    const decoded = await auth.verifyIdToken(token)
    const uid = decoded.uid

    const userRef = db.collection('usuarios').doc(uid)

    for (const sub of ['cotizaciones', 'clientes', 'catalogo', 'catalogo_servicios', 'plantillas', 'meta']) {
      await deleteSubcollection(db, userRef, sub)
    }
    await userRef.delete()

    const susRef = db.collection('suscripciones').doc(uid)
    await susRef.delete()

    await auth.deleteUser(uid)

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[delete-account]', err)
    res.status(500).json({ error: err.message })
  }
}
