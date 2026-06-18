import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'CotizaMetal <onboarding@resend.dev>'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const { email, nombre } = body
  if (!email) return res.status(400).json({ error: 'Missing email' })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const displayName = nombre || email.split('@')[0]

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: '¡Bienvenido a CotizaMetal! Tu cuenta está lista 🔩',
      html: buildWelcomeHtml(displayName),
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[send-welcome]', err)
    res.status(500).json({ error: err.message })
  }
}

function buildWelcomeHtml(nombre) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">

    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:#1d4ed8;border-radius:14px;padding:14px 28px">
        <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:1px">CotizaMetal</span>
      </div>
    </div>

    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px">
      <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 10px 0">¡Hola, ${nombre}! 👋</h1>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px 0">
        Tu cuenta en <strong style="color:#f1f5f9">CotizaMetal</strong> ya está lista. Ahora puedes crear cotizaciones profesionales de metalurgia y metalmecánica en minutos.
      </p>

      <div style="background:#0f172a;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0">Tu plan gratuito incluye</p>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:5px 0;color:#cbd5e1;font-size:13px">✓ Hasta <strong>10 cotizaciones</strong> activas</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#cbd5e1;font-size:13px">✓ Materiales, mano de obra y servicios</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#cbd5e1;font-size:13px">✓ Exportación de PDF profesional</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#cbd5e1;font-size:13px">✓ Catálogo de materiales (hasta 2 ítems)</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#cbd5e1;font-size:13px">✓ Historial y gestión de clientes</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:20px">
        <a href="https://cotizametal.cl/cotizador"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:bold;font-size:14px">
          Crear mi primera cotización →
        </a>
      </div>

      <div style="border-top:1px solid #334155;padding-top:16px">
        <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6">
          ¿Necesitas más capacidad? El plan <strong style="color:#f59e0b">Pro</strong> incluye cotizaciones ilimitadas, asistente IA, catálogos ilimitados y más.
          <a href="https://cotizametal.cl/planes" style="color:#3b82f6;text-decoration:none"> Ver planes →</a>
        </p>
      </div>
    </div>

    <p style="color:#334155;font-size:11px;text-align:center;margin-top:20px;line-height:1.6">
      Si no creaste esta cuenta, puedes ignorar este correo.<br>
      © ${new Date().getFullYear()} CotizaMetal ·
      <a href="https://cotizametal.cl/privacidad" style="color:#334155">Privacidad</a> ·
      <a href="https://cotizametal.cl/terminos" style="color:#334155">Términos</a>
    </p>
  </div>
</body>
</html>`
}
