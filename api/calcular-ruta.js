export default async function handler(req, res) {
  const { origen, destino } = req.query
  if (!origen || !destino) return res.status(400).json({ error: 'Origen y destino requeridos' })

  const key = process.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return res.status(500).json({ error: 'API key no configurada' })

  try {
    const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.polyline.encodedPolyline',
        'Referer': 'https://cotizador-metal-frontend.vercel.app',
      },
      body: JSON.stringify({
        origin:      { address: origen },
        destination: { address: destino },
        travelMode:  'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      }),
    })

    const data = await r.json()

    if (!r.ok || !data.routes?.length) {
      return res.status(400).json({
        error: 'No se pudo calcular la ruta. Verifica las direcciones.',
        detail: data.error?.message || data.error?.status,
      })
    }

    const route = data.routes[0]
    res.status(200).json({
      km: Math.round(route.distanceMeters / 100) / 10,
      encodedPolyline: route.polyline.encodedPolyline,
    })
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor', detail: e.message })
  }
}
