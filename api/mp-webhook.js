import crypto from 'crypto'
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

function validateSignature(req, body) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true

  const xSignature = req.headers['x-signature'] || ''
  const xRequestId = req.headers['x-request-id'] || ''

  const parts = {}
  xSignature.split(',').forEach((part) => {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  })

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const dataId = body?.data?.id || ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  return hmac === v1
}

async function setSubscription(db, uid, data) {
  await db.collection('suscripciones').doc(uid).set(
    { ...data, updatedAt: new Date() },
    { merge: true }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

  if (!validateSignature(req, body)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Solo procesar eventos de preapproval (suscripciones)
  if (body.type !== 'subscription_preapproval' && body.type !== 'preapproval') {
    return res.status(200).json({ received: true })
  }

  const preapprovalId = body?.data?.id
  if (!preapprovalId) return res.status(400).json({ error: 'Missing preapproval id' })

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preapprovalApi = new PreApproval(client)

    const sub = await preapprovalApi.get({ id: String(preapprovalId) })

    const uid = sub.external_reference
    if (!uid) return res.status(200).json({ received: true })

    const isActive = sub.status === 'authorized'
    const db = getAdminDb()

    await setSubscription(db, uid, {
      plan: isActive ? 'pro' : 'free',
      mpPreapprovalId: String(preapprovalId),
      status: sub.status,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }

  res.status(200).json({ received: true })
}
