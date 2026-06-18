import crypto from 'crypto'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { Resend } from 'resend'

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
  // MP envía GET para validar la URL al registrarla
  if (req.method === 'GET') return res.status(200).json({ ok: true })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

  const sigValid = validateSignature(req, body)
  console.log('[mp-webhook] type:', body.type, '| sig_valid:', sigValid, '| data_id:', body?.data?.id)

  if (!sigValid) {
    console.log('[mp-webhook] firma inválida — x-signature:', req.headers['x-signature'])
    return res.status(200).json({ received: true })
  }

  // Solo procesar eventos de preapproval (suscripciones)
  if (body.type !== 'subscription_preapproval' && body.type !== 'preapproval') {
    console.log('[mp-webhook] tipo ignorado:', body.type)
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

    // Enviar email transaccional (no falla el webhook si falla el email)
    try {
      const authUser = await getAuth().getUser(uid)
      const email = authUser.email
      if (email && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const FROM = process.env.RESEND_FROM || 'CotizaMetal <onboarding@resend.dev>'
        const nombre = authUser.displayName || email.split('@')[0]
        if (isActive) {
          await resend.emails.send({
            from: FROM,
            to: email,
            subject: '¡Tu plan Pro está activo! 🚀',
            html: buildProActivadoHtml(nombre),
          })
        } else if (sub.status === 'cancelled') {
          await resend.emails.send({
            from: FROM,
            to: email,
            subject: 'Tu suscripción Pro ha sido cancelada',
            html: buildCanceladoHtml(nombre),
          })
        }
      }
    } catch (emailErr) {
      console.error('[mp-webhook] error enviando email:', emailErr.message)
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }

  res.status(200).json({ received: true })
}

function buildProActivadoHtml(nombre) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:#1d4ed8;border-radius:14px;padding:14px 28px">
        <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:1px">CotizaMetal</span>
      </div>
    </div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px">
      <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 10px 0">¡Plan Pro activado, ${nombre}! 🚀</h1>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px 0">
        Tu suscripción <strong style="color:#f59e0b">Pro</strong> está activa. Ya tienes acceso a todas las funciones avanzadas de CotizaMetal.
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0">Ahora tienes acceso a</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:5px 0;color:#fbbf24;font-size:13px">★ Cotizaciones ilimitadas</td></tr>
          <tr><td style="padding:5px 0;color:#fbbf24;font-size:13px">★ Asistente IA (Carlos)</td></tr>
          <tr><td style="padding:5px 0;color:#fbbf24;font-size:13px">★ Catálogos ilimitados</td></tr>
          <tr><td style="padding:5px 0;color:#fbbf24;font-size:13px">★ Compartir cotizaciones (Conexiones)</td></tr>
          <tr><td style="padding:5px 0;color:#fbbf24;font-size:13px">★ Modo avanzado con embalaje y pallets</td></tr>
        </table>
      </div>
      <div style="text-align:center">
        <a href="https://cotizametal.cl/cotizador"
           style="display:inline-block;background:#f59e0b;color:#000;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:bold;font-size:14px">
          Ir al cotizador →
        </a>
      </div>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin-top:20px">
      © ${new Date().getFullYear()} CotizaMetal ·
      <a href="https://cotizametal.cl/privacidad" style="color:#334155">Privacidad</a>
    </p>
  </div>
</body>
</html>`
}

function buildCanceladoHtml(nombre) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:#1d4ed8;border-radius:14px;padding:14px 28px">
        <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:1px">CotizaMetal</span>
      </div>
    </div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px">
      <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 10px 0">Suscripción cancelada, ${nombre}</h1>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px 0">
        Tu plan Pro ha sido cancelado. A partir de ahora tu cuenta volverá al plan gratuito con acceso a hasta 10 cotizaciones.
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px 0">
        Todos tus datos, cotizaciones e historial se conservan. Puedes reactivar tu suscripción cuando lo desees.
      </p>
      <div style="text-align:center">
        <a href="https://cotizametal.cl/planes"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:bold;font-size:14px">
          Reactivar plan Pro →
        </a>
      </div>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin-top:20px">
      © ${new Date().getFullYear()} CotizaMetal ·
      <a href="https://cotizametal.cl/privacidad" style="color:#334155">Privacidad</a>
    </p>
  </div>
</body>
</html>`
}

