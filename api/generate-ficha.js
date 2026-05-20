export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { nombreProducto, descripcion } = req.body || {}
  if (!nombreProducto) return res.status(400).json({ error: 'Se requiere nombre del producto' })

  const prompt = `Eres un ingeniero metalúrgico experto en mecanizado y fabricación industrial chilena.
Genera una ficha técnica completa y realista para el siguiente producto:

Nombre del producto: ${nombreProducto}
${descripcion ? `Descripción adicional: ${descripcion}` : ''}

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta (todos los campos son strings, componentes es un array):

{
  "tagReferencia": "",
  "numeroMaterial": "",
  "numeroPlano": "",
  "revisionPlano": "",
  "cantidad": "",
  "criterioDiseno": "",
  "tipoComponente": "",
  "denominacionCompleta": "",
  "usoDesignado": "",
  "funcionPrincipal": "",
  "componentes": [
    {
      "nombre": "",
      "material": "",
      "norma": "",
      "descripcion": "",
      "recubrimiento": "",
      "terminacion": "",
      "propiedades": [
        { "propiedad": "Resistencia a la Tracción", "valor": "", "norma": "" },
        { "propiedad": "Límite de Fluencia", "valor": "", "norma": "" },
        { "propiedad": "Dureza", "valor": "", "norma": "" },
        { "propiedad": "Elongación", "valor": "", "norma": "" }
      ]
    }
  ],
  "aplicacion": "",
  "carga": "",
  "ambiente": "",
  "temperaturaServicio": "",
  "geometria": "",
  "dimensiones": "",
  "normaTolerancia": "",
  "procesoFabricacion": "",
  "detalleRosca": "",
  "eliminacionRebabas": "",
  "terminacionAcabado": "",
  "inspeccionDimensional": "",
  "inspeccionVisual": "",
  "controlEspecial": "",
  "trazabilidad": "",
  "observaciones": ""
}

Reglas:
- Usa normas internacionales reales: ASTM, ISO, ASME, SAE, DIN según corresponda
- Incluye valores numéricos reales para propiedades mecánicas (MPa, HB, %)
- Para campos que no aplican al producto deja string vacío ""
- El array componentes debe tener entre 1 y 3 componentes según la complejidad del producto
- Si el producto tiene rosca, llena detalleRosca; si no, deja vacío
- Devuelve SOLO el JSON, sin markdown, sin texto adicional`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = (data.content?.[0]?.text || '').trim()
    const jsonStr = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const ficha = JSON.parse(jsonStr)

    const componentes = (ficha.componentes || []).map((comp, ci) => ({
      id: Date.now() + ci * 1000,
      nombre: comp.nombre || '',
      material: comp.material || '',
      norma: comp.norma || '',
      descripcion: comp.descripcion || '',
      recubrimiento: comp.recubrimiento || '',
      terminacion: comp.terminacion || '',
      propiedades: (comp.propiedades || []).map((p, pi) => ({
        id: Date.now() + ci * 1000 + pi + 1,
        propiedad: p.propiedad || '',
        valor: p.valor || '',
        norma: p.norma || '',
      })),
    }))

    res.json({ ...ficha, componentes, nombreProducto })
  } catch (err) {
    console.error('generate-ficha error:', err)
    res.status(500).json({ error: 'Error al generar la ficha técnica: ' + err.message })
  }
}
