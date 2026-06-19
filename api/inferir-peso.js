const SYSTEM_PROMPT = `Eres un experto en metalmecánica. Analiza la descripción de un material metálico en español y extrae: geometría, dimensiones exactas en milímetros y material.

GEOMETRÍAS DISPONIBLES — usa exactamente el id indicado:
- plancha        campos: largo, ancho, espesor           | planchas, láminas, chapas, sheets
- barra_redonda  campos: diametro, largo                 | barras redondas, redondo, eje, shaft, rod
- barra_cuad     campos: lado, largo                     | barras cuadradas, cuadrado, square bar
- barra_plana    campos: ancho, espesor, largo           | barra plana, flat bar, pletina
- barra_hex      campos: diagonal, largo                 | hexagonal, hex bar (diagonal = entre caras opuestas)
- tubo_redondo   campos: diametro_ext, espesor_pared, largo | tubo redondo, caño, pipe, sello
- tubo_cuad      campos: lado_ext, espesor_pared, largo  | tubo cuadrado, caño cuadrado
- tubo_rect      campos: largo_ext, ancho_ext, espesor_pared, largo | tubo rectangular, caño rectangular
- perfil_l       campos: ala1, ala2, espesor, largo      | ángulo, angular, perfil L, angle
- perfil_c       campos: alto, ala, espesor, largo       | canal C, canal U, costanera, UPN, UPE, channel
- perfil_t       campos: ala, alto, espesor, largo       | perfil T, T bar
- viga_i         campos: alto, ala, esp_alma, esp_brida, largo | viga I, viga H, IPE, HEB, HEA, IPN

MATERIALES — usa el índice (densidadIdx) exacto:
0: Acero A36 (7850 kg/m³) — acero estructural genérico si no se especifica
1: Acero A572 Gr50 (7850)
2: Acero SAE 1020 (7860)
3: Acero SAE 1045 (7860)
4: Acero SAE 4140 (7850)
5: Acero Hardox 400 (7800)
6: Acero galvanizado (7850)
7: Acero Inox 304 (7900)
8: Acero Inox 316 (7980)
9: Acero Inox 430 (7700)
10: Acero Inox 2205 Duplex (7805)
11: Aluminio 1100 (2710)
12: Aluminio 3003 (2730)
13: Aluminio 5052 (2680)
14: Aluminio 6061 (2700)
15: Aluminio 6063 (2690)
16: Aluminio 7075 (2810)
17: Cobre electrolítico (8960)
18: Bronce SAE 660 (8900)
19: Latón CuZn37 (8440)
20: Titanio Gr1 (4510)
21: Titanio Gr5 Ti-6Al-4V (4430)
22: Fundición gris GG20 (7200)
23: Fundición nodular GGG40 (7100)
24: Zinc (7133)
25: Plomo (11340)
26: Níquel 200 (8900)
27: Magnesio AZ31 (1770)

CONVERSIONES DE UNIDADES (convierte todo a mm):
- 1 pulgada (") o (") = 25.4 mm
- 1 pie (') = 304.8 mm
- Fracciones: 1/2" = 12.7, 3/4" = 19.05, 1" = 25.4, 1 1/2" = 38.1, 2" = 50.8, 2 1/2" = 63.5, 3" = 76.2, 4" = 101.6, 5" = 127, 6" = 152.4
- 1 metro = 1000 mm | 1 cm = 10 mm
- Si el número es > 50 sin unidad y parece largo → asumir mm
- Espesores de pared típicos de tubos sin especificar: usa 3mm para tubos pequeños (<100mm), 5mm para medianos, 6mm para grandes

REGLAS:
- Si no se especifica material → usa acero A36 (índice 0), confianza "media"
- Si hay ambigüedad → elige lo más probable en contexto metalmecánico industrial
- Todos los campos de dims deben ser números positivos en mm
- pesoKg es el peso de UNA pieza con las dimensiones dadas

Responde SOLO con JSON válido (sin markdown, sin texto adicional):
{
  "geomId": "...",
  "dims": { "campo1": 0.0, "campo2": 0.0 },
  "densidadIdx": 0,
  "materialNombre": "...",
  "pesoKg": 0.000,
  "explicacion": "frase corta explicando lo inferido y las conversiones aplicadas",
  "confianza": "alta|media|baja",
  "advertencias": []
}`

function calcPesoKg(geomId, dims, densidad) {
  const d = (k) => Number(dims[k]) || 0
  const rho = densidad / 1e9
  let vol = 0
  switch (geomId) {
    case 'plancha':       vol = d('largo') * d('ancho') * d('espesor'); break
    case 'barra_redonda': vol = Math.PI / 4 * d('diametro') ** 2 * d('largo'); break
    case 'barra_cuad':    vol = d('lado') ** 2 * d('largo'); break
    case 'barra_plana':   vol = d('ancho') * d('espesor') * d('largo'); break
    case 'barra_hex':     vol = (Math.sqrt(3) / 2) * d('diagonal') ** 2 * d('largo'); break
    case 'tubo_redondo': {
      const ri = Math.max(0, d('diametro_ext') / 2 - d('espesor_pared'))
      vol = Math.PI * ((d('diametro_ext') / 2) ** 2 - ri ** 2) * d('largo'); break
    }
    case 'tubo_cuad': {
      const li = Math.max(0, d('lado_ext') - 2 * d('espesor_pared'))
      vol = (d('lado_ext') ** 2 - li ** 2) * d('largo'); break
    }
    case 'tubo_rect': {
      const li = Math.max(0, d('largo_ext') - 2 * d('espesor_pared'))
      const wi = Math.max(0, d('ancho_ext') - 2 * d('espesor_pared'))
      vol = (d('largo_ext') * d('ancho_ext') - li * wi) * d('largo'); break
    }
    case 'perfil_l':  vol = (d('ala1') + d('ala2') - d('espesor')) * d('espesor') * d('largo'); break
    case 'perfil_c':  vol = (d('alto') + 2 * Math.max(0, d('ala') - d('espesor'))) * d('espesor') * d('largo'); break
    case 'perfil_t':  vol = (d('ala') + Math.max(0, d('alto') - d('espesor'))) * d('espesor') * d('largo'); break
    case 'viga_i':    vol = (2 * d('ala') * d('esp_brida') + Math.max(0, d('alto') - 2 * d('esp_brida')) * d('esp_alma')) * d('largo'); break
    default: break
  }
  return vol * rho
}

const DENSIDADES = [
  7850,7850,7860,7860,7850,7800,7850,7900,7980,7700,7805,
  2710,2730,2680,2700,2690,2810,8960,8900,8440,
  4510,4430,7200,7100,7133,11340,8900,1770,
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { descripcion } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  if (!descripcion?.trim()) return res.status(400).json({ error: 'Descripción requerida' })

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
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: descripcion.trim() }],
      }),
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = (data.content || []).find(b => b.type === 'text')?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No se pudo interpretar la respuesta')

    const parsed = JSON.parse(match[0])

    // Recalcular peso server-side para verificar coherencia
    const densidad = DENSIDADES[parsed.densidadIdx] ?? 7850
    const pesoCalc = calcPesoKg(parsed.geomId, parsed.dims || {}, densidad)
    parsed.pesoKg = pesoCalc > 0 ? pesoCalc : (parsed.pesoKg || 0)

    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
