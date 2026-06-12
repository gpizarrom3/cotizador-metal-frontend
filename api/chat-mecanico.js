const SYSTEM_PROMPT = `Usted es Carlos, ingeniero senior y especialista en cotizaciones metalmecánicas con más de 25 años de experiencia en la industria chilena.

Su expertise abarca:
- Fabricación de estructuras metálicas, maquinaria industrial, piezas mecánicas y trabajos a medida
- Conocimiento profundo del mercado de materiales en Chile: acero A36, A572, inoxidable, aluminio, cobre, entre otros (distribuidores como CINTAC, Aceros AZA, Dinalco, Brasimet)
- Precios de mano de obra especializados: soldadores, maestros torneros, fresadores, pintores industriales
- Servicios subcontratados: corte láser, plasma, oxicorte, tratamientos térmicos, galvanizado, pintura electrostática
- Rentabilidad y márgenes del rubro: gastos generales 15–25%, imprevistos 5–10%, utilidad mínima rentable 20–30% sobre costo directo

Su forma de comunicarse:
- Formal y profesional, como un especialista de alto nivel
- Preciso y directo: cuando identifica errores, precios fuera de mercado o ítems faltantes, lo señala claramente con datos concretos
- Cuando el usuario describe el proyecto, utiliza esa descripción en conjunto con los datos de la cotización para entregar un análisis completo
- Si la cotización está vacía o incompleta, guía paso a paso al usuario sobre los materiales, HH y servicios que típicamente requiere ese tipo de proyecto, con referencias de precios actuales del mercado chileno
- No use modismos ni lenguaje informal

Instrucciones de análisis:
1. Cruce siempre la descripción del proyecto (proporcionada por el usuario) con los datos ya ingresados en la cotización
2. Identifique lo que falta, lo que está sobredimensionado o lo que podría ajustarse
3. Para cotizaciones vacías: proponga una estructura de costos típica para el proyecto descrito
4. Entregue valores de referencia concretos (rangos de precio actuales en CLP) cuando sea posible
5. Evalúe la rentabilidad y señale si el margen es adecuado para el rubro

Responda de forma estructurada y concisa. Máximo 5 párrafos por respuesta.`

function buildContext(contexto) {
  if (!contexto) return ''

  const {
    cliente, materiales, roles, servicios, bases, config, numeroCot,
    totalMateriales, totalHH, totalServicios, totalBases, totalEmbalaje, totalFinal,
  } = contexto

  const fmt = (n) => `$${(Number(n) || 0).toLocaleString('es-CL')}`

  const flatMats = (materiales || []).flatMap((sp) => sp.items || [])
  const matsStr = flatMats.length === 0
    ? '  (sin materiales ingresados)'
    : flatMats.slice(0, 20).map((m) =>
        `  - ${m.nombre}${m.proveedor ? ` (${m.proveedor})` : ''}: ${m.cantidad} ${m.formato || 'unid'} × ${fmt(m.precio_unitario)} = ${fmt((Number(m.cantidad) * Number(m.precio_unitario)) || 0)}`
      ).join('\n') + (flatMats.length > 20 ? `\n  ...y ${flatMats.length - 20} ítems adicionales` : '')

  const rolesStr = (roles || []).length === 0
    ? '  (sin horas hombre ingresadas)'
    : roles.map((r) =>
        `  - ${r.nombre}: ${r.horas}h × ${fmt(r.precio_hora)}/h × ${r.cantidad} persona(s) = ${fmt((Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0)}`
      ).join('\n')

  const activeSvcs = Object.entries(servicios || {}).filter(([k, s]) => k !== 'custom' && s?.activo)
  const customSvcs = (servicios?.custom || []).filter((s) => Number(s.cantidad) > 0)
  const svcsStr = (activeSvcs.length + customSvcs.length) === 0
    ? '  (sin servicios activos)'
    : [
        ...activeSvcs.map(([k, s]) => `  - ${k}: ${fmt(s.precio)}`),
        ...customSvcs.map((s) => `  - ${s.nombre}: ${s.cantidad} × ${fmt(s.precio_ref)}`),
      ].join('\n')

  const basesActivas = (bases || []).filter((b) => Number(b.porcentaje) > 0)
  const basesStr = basesActivas.length === 0
    ? '  (sin gastos generales configurados)'
    : basesActivas.map((b) => `  - ${b.nombre}: ${b.porcentaje}%`).join('\n')

  return `

--- DATOS DE LA COTIZACIÓN ACTUAL ---
Número: ${numeroCot || 'Borrador'} | Cliente: ${cliente?.nombre || 'Sin especificar'}

MATERIALES — Subtotal: ${fmt(totalMateriales)}
${matsStr}

HORAS HOMBRE — Subtotal: ${fmt(totalHH)}
${rolesStr}

SERVICIOS SUBCONTRATADOS — Subtotal: ${fmt(totalServicios)}
${svcsStr}

GASTOS GENERALES / BASES — Subtotal: ${fmt(totalBases)}
${basesStr}

EMBALAJE Y ENVÍO — Subtotal: ${fmt(totalEmbalaje)}

RESUMEN FINANCIERO:
  Descuento aplicado: ${config?.tipoDescuento === 'porcentaje' ? `${config?.descuento || 0}%` : fmt(config?.descuento || 0)}
  IVA (19%): ${config?.incluyeIVA ? 'incluido' : 'no incluido'}
  TOTAL FINAL: ${fmt(totalFinal)}
--- FIN DATOS COTIZACIÓN ---`
}

import { handleCors } from './_cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, contexto } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] requerido' })
  }

  try {
    const systemWithCtx = SYSTEM_PROMPT + buildContext(contexto)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemWithCtx,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const reply = data.content?.[0]?.text || ''
    return res.status(200).json({ reply })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
