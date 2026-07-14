// Precios de referencia combustible Chile (actualizados periódicamente)
// Fuente: ENAP / CNE – valores en $/litro para la Región Metropolitana
const PRECIOS_REF = {
  gasolina_93: 1039,
  gasolina_95: 1092,
  gasolina_97: 1154,
  diesel:       923,
}

export default async function handler(req, res) {
  const tipo = req.query.tipo || 'gasolina_93'

  // Intenta obtener precio real de una fuente pública chilena
  try {
    // CNE publica precios semanales en formato JSON vía su portal SIE
    const cneRes = await fetch(
      'https://sipco.sie.cl/api/energia/combustibles/precios?region=13&format=json',
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) }
    )
    if (cneRes.ok) {
      const cneData = await cneRes.json()
      // Estructura hipotética del JSON – ajustar si el endpoint real difiere
      const mapa = {
        gasolina_93: cneData?.gasolina93 || cneData?.g93,
        gasolina_95: cneData?.gasolina95 || cneData?.g95,
        gasolina_97: cneData?.gasolina97 || cneData?.g97,
        diesel:      cneData?.diesel     || cneData?.diesel_normal,
      }
      const precio = Number(mapa[tipo])
      if (precio > 500) {
        return res.status(200).json({ precio, tipo, fuente: 'cne', actualizado: new Date().toISOString() })
      }
    }
  } catch (_) {
    // fallo silencioso → usa precios de referencia
  }

  // Fallback: precios de referencia hardcodeados
  const precio = PRECIOS_REF[tipo] ?? PRECIOS_REF.gasolina_95
  res.status(200).json({
    precio,
    tipo,
    fuente: 'referencia',
    nota: 'Precio de referencia RM. Verifique en su distribuidora local.',
    actualizado: new Date().toISOString(),
  })
}
