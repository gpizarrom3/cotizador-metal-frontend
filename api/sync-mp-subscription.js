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

async function searchPreapprovals(accessToken, params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`https://api.mercadopago.com/preapproval/search?${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data?.results || []
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { uid, email } = req.body || {}
  if (!uid) return res.status(400).json({ error: 'uid requerido' })

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado' })

  try {
    // Buscar por external_reference (uid de Firebase)
    let subs = await searchPreapprovals(accessToken, { external_reference: uid, limit: 10 })

    // Fallback: buscar por email del pagador
    if (subs.length === 0 && email) {
      subs = await searchPreapprovals(accessToken, { payer_email: email, limit: 10 })
    }

    // Fallback: listar todas las recientes (últimas 20)
    let allSubs = []
    if (subs.length === 0) {
      allSubs = await searchPreapprovals(accessToken, { limit: 20, sort: 'date_created', criteria: 'desc' })
    }

    const pool = subs.length > 0 ? subs : allSubs
    const active = pool.find((s) => s.status === 'authorized')
    const latest = active || pool.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))[0]

    if (!latest) {
      return res.status(200).json({
        found: false,
        searchedByUid: uid,
        searchedByEmail: email || null,
        message: 'No se encontró ninguna suscripción en MercadoPago.',
      })
    }

    const isActive = latest.status === 'authorized'
    const db = getAdminDb()
    await db.collection('suscripciones').doc(uid).set(
      {
        plan: isActive ? 'pro' : 'free',
        mpPreapprovalId: String(latest.id),
        status: latest.status,
        payerEmail: latest.payer_email || null,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return res.status(200).json({
      found: true,
      status: latest.status,
      activated: isActive,
      payerEmail: latest.payer_email,
      externalRef: latest.external_reference,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
