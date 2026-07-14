import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'CotizaMetal <onboarding@resend.dev>'

const fmt = (n) =>
  (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const { to, cot, empresa } = body
  if (!to || !cot) return res.status(400).json({ error: 'Missing to or cot' })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const nombreEmpresa = empresa?.nombre || 'CotizaMetal'
  const clienteNombre = typeof cot.cliente === 'object' ? (cot.cliente?.nombre || '—') : (cot.cliente || '—')

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Cotización ${cot.numero || ''} — ${nombreEmpresa}`,
      html: buildHtml(cot, empresa, clienteNombre),
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[send-cotizacion]', err)
    res.status(500).json({ error: err.message })
  }
}

function buildHtml(cot, empresa, clienteNombre) {
  const e = empresa || {}
  const total = fmt(cot.totalFinal || cot.costoTotal || 0)
  const validez = cot.config?.validezDias ? `${cot.config.validezDias} días` : '30 días'

  const rows = [
    cot.totalMateriales > 0 && ['Materiales', fmt(cot.totalMateriales)],
    cot.totalHH > 0 && ['Mano de obra', fmt(cot.totalHH)],
    cot.totalServicios > 0 && ['Servicios', fmt(cot.totalServicios)],
    cot.totalEmbalaje > 0 && ['Embalaje y envío', fmt(cot.totalEmbalaje)],
    cot.totalBases > 0 && ['Gastos generales / utilidad', fmt(cot.totalBases)],
    Number(cot.config?.flete) > 0 && ['Flete', fmt(cot.config.flete)],
    cot.descuentoMonto > 0 && ['Descuento', `- ${fmt(cot.descuentoMonto)}`],
    cot.totalIVA > 0 && ['IVA (19%)', fmt(cot.totalIVA)],
  ].filter(Boolean)

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b">${label}</td>
      <td style="padding:6px 0;color:#e2e8f0;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${value}</td>
    </tr>`).join('')

  const condiciones = [
    cot.config?.condicionesPago && `Pago: ${cot.config.condicionesPago}`,
    cot.config?.plazoEntrega && `Plazo: ${cot.config.plazoEntrega}`,
    `Validez: ${validez}`,
  ].filter(Boolean).join(' · ')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px">

    <!-- Header empresa -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px 12px 0 0;padding:24px 28px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <p style="color:#f1f5f9;font-size:17px;font-weight:700;margin:0">${e.nombre || 'CotizaMetal'}</p>
        ${e.rut ? `<p style="color:#64748b;font-size:12px;margin:2px 0 0 0">RUT ${e.rut}</p>` : ''}
        ${e.email ? `<p style="color:#64748b;font-size:12px;margin:2px 0 0 0">${e.email}</p>` : ''}
      </div>
      <div style="text-align:right">
        <p style="color:#60a5fa;font-family:monospace;font-size:15px;font-weight:700;margin:0">${cot.numero || ''}</p>
        <p style="color:#64748b;font-size:12px;margin:2px 0 0 0">${cot.fecha || ''}</p>
      </div>
    </div>

    <!-- Cliente -->
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:16px 28px">
      <p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0">Cliente</p>
      <p style="color:#1e293b;font-size:15px;font-weight:600;margin:0">${clienteNombre}</p>
      ${typeof cot.cliente === 'object' && cot.cliente?.rut ? `<p style="color:#64748b;font-size:12px;margin:2px 0 0 0">RUT ${cot.cliente.rut}</p>` : ''}
    </div>

    ${cot.config?.descripcion ? `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:0 28px 16px">
      <p style="color:#475569;font-size:13px;margin:0">${cot.config.descripcion}</p>
    </div>` : ''}

    <!-- Desglose -->
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:20px 28px">
      <p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0">Desglose</p>
      <table style="width:100%;border-collapse:collapse">
        ${rowsHtml}
        <tr>
          <td style="padding:12px 0 4px 0;color:#1e293b;font-size:15px;font-weight:700">TOTAL</td>
          <td style="padding:12px 0 4px 0;color:#1d4ed8;font-size:17px;font-weight:700;text-align:right">${total}</td>
        </tr>
      </table>
    </div>

    <!-- Condiciones -->
    ${condiciones ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:14px 28px">
      <p style="color:#64748b;font-size:12px;margin:0">${condiciones}</p>
    </div>` : '<div style="border-radius:0 0 12px 12px;height:12px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none"></div>'}

    ${cot.config?.notas ? `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 20px;margin-top:16px">
      <p style="color:#92400e;font-size:13px;margin:0"><strong>Notas:</strong> ${cot.config.notas}</p>
    </div>` : ''}

    <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:24px">
      Cotización generada con CotizaMetal · <a href="https://cotizametal.cl" style="color:#94a3b8">cotizametal.cl</a>
    </p>
  </div>
</body>
</html>`
}
