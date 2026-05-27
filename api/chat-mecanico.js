const SYSTEM_PROMPT = `Eres Carlos, un mecánico con 25 años de experiencia en cotizaciones metalmecánicas en Chile.
Trabajas con todo tipo de proyectos: estructuras metálicas, maquinaria, piezas, fabricación en taller.
Conoces bien el mercado chileno: precios del acero, aluminio, cobre, servicios de corte, soldadura, torneado.

Tu manera de ser:
- Directo y honesto, sin rodeos
- Usas términos técnicos del rubro, pero explicas cuando es necesario
- Cuando ves algo inusual o un precio fuera de mercado, lo dices claramente
- Das consejos prácticos basados en experiencia real de taller
- Hablas en español chileno informal pero profesional (puedes usar "po", "cachai", etc. con moderación)
- Conoces los márgenes típicos del rubro: materiales suelen llevar 15-25% de gastos generales, HH debe incluir leyes sociales, etc.

Cuando analices una cotización:
- Evalúa si los precios de materiales son razonables para Chile actualmente (considera inflación, dólar, precios CINTAC, Aceros AZA, etc.)
- Identifica ítems que típicamente faltan según el tipo de trabajo
- Opina sobre rentabilidad y márgenes (mínimo rentable suele ser 20-30% sobre costo directo)
- Señala riesgos: ítems subestimados, HH insuficientes, sin considerar mermas, etc.
- Sugiere mejoras concretas con números cuando puedas

Responde de forma conversacional, concisa y útil. Máximo 4 párrafos por respuesta.`

function buildContext(contexto) {
  if (!contexto) return ''

  const {
    cliente, materiales, roles, servicios, bases, config, numeroCot,
    totalMateriales, totalHH, totalServicios, totalBases, totalEmbalaje, totalFinal,
  } = contexto

  const fmt = (n) => `$${(Number(n) || 0).toLocaleString('es-CL')}`

  const flatMats = (materiales || []).flatMap((sp) => sp.items || [])
  const matsStr = flatMats.length === 0
    ? '  (sin materiales)'
    : flatMats.slice(0, 20).map((m) =>
        `  - ${m.nombre}${m.proveedor ? ` (${m.proveedor})` : ''}: ${m.cantidad} ${m.formato || 'unid'} × ${fmt(m.precio_unitario)} = ${fmt((Number(m.cantidad) * Number(m.precio_unitario)) || 0)}`
      ).join('\n') + (flatMats.length > 20 ? `\n  ...y ${flatMats.length - 20} ítems más` : '')

  const rolesStr = (roles || []).length === 0
    ? '  (sin HH)'
    : roles.map((r) =>
        `  - ${r.nombre}: ${r.horas}h × ${fmt(r.precio_hora)}/h × ${r.cantidad} persona = ${fmt((Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0)}`
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
    ? '  (sin gastos generales)'
    : basesActivas.map((b) => `  - ${b.nombre}: ${b.porcentaje}%`).join('\n')

  return `

--- COTIZACIÓN EN PANTALLA ---
Número: ${numeroCot || 'Borrador'} | Cliente: ${cliente?.nombre || 'Sin especificar'}

MATERIALES — Total: ${fmt(totalMateriales)}
${matsStr}

HORAS HOMBRE — Total: ${fmt(totalHH)}
${rolesStr}

SERVICIOS — Total: ${fmt(totalServicios)}
${svcsStr}

GASTOS GENERALES/BASES — Total: ${fmt(totalBases)}
${basesStr}

EMBALAJE Y ENVÍO — Total: ${fmt(totalEmbalaje)}

RESUMEN:
  Descuento: ${config?.tipoDescuento === 'porcentaje' ? `${config?.descuento || 0}%` : fmt(config?.descuento || 0)}
  IVA (19%): ${config?.incluyeIVA ? 'incluido' : 'no incluido'}
  TOTAL FINAL: ${fmt(totalFinal)}
--- FIN COTIZACIÓN ---`
}

export default async function handler(req, res) {
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
