const PROMPT = (query) =>
  `Eres un experto en materiales metalmecánicos en Chile. El usuario busca: "${query}".
Proporciona exactamente 3 opciones de este material disponibles en el mercado chileno.
Responde SOLO con un JSON array con esta estructura exacta (sin markdown, sin texto adicional):
[
  {
    "nombre": "nombre técnico del material",
    "proveedor": "empresa distribuidora real en Chile",
    "formato": "formato de venta (ej: Barra 6m, Plancha 2000x1000mm, Kg)",
    "precio_unitario": 12000,
    "unidad": "unidad de medida (ej: unidad, kg, metro)"
  }
]
Los precios deben ser en pesos chilenos (CLP) con valores realistas del mercado actual.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Query requerida' })
  }

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
        max_tokens: 1024,
        messages: [{ role: 'user', content: PROMPT(query) }],
      }),
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = data.content?.[0]?.text || ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Respuesta inesperada del modelo')

    return res.status(200).json({ results: JSON.parse(match[0]) })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
