import { useState, useRef, useCallback, useEffect } from 'react'
import { useJsApiLoader, GoogleMap, Autocomplete, Polyline } from '@react-google-maps/api'
import Toggle from '../ui/Toggle'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
const LIBS       = ['places', 'geometry']
const MAP_CENTER = { lat: -33.4489, lng: -70.6693 }
const MAP_OPTS   = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry',           stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#94a3b8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
    { featureType: 'road',       elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
    { featureType: 'water',      elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'poi',        stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',    stylers: [{ visibility: 'off' }] },
  ],
}

const TIPOS_COMBUSTIBLE = [
  { value: 'gasolina_93', label: 'Gasolina 93', precio: 1039 },
  { value: 'gasolina_95', label: 'Gasolina 95', precio: 1092 },
  { value: 'gasolina_97', label: 'Gasolina 97', precio: 1154 },
  { value: 'diesel',      label: 'Diesel',       precio:  923 },
]

const TIPOS_VEHICULO = [
  { value: 'auto',      label: 'Auto / Sedan',    rendimiento: 13 },
  { value: 'suv',       label: 'SUV / 4×4',       rendimiento: 11 },
  { value: 'camioneta', label: 'Camioneta pickup', rendimiento: 9  },
  { value: 'furgon',    label: 'Furgón / Van',     rendimiento: 8  },
  { value: 'camion_l',  label: 'Camión ligero',    rendimiento: 6  },
  { value: 'camion_p',  label: 'Camión pesado',    rendimiento: 4  },
]

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function TabTraslados({ combustible, setCombustible }) {
  const upd = (field, val) => setCombustible(c => ({ ...c, [field]: val }))

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_KEY, libraries: LIBS })

  const autoOrig = useRef(null)
  const autoDest = useRef(null)
  const mapRef   = useRef(null)
  const [routePath,  setRoutePath]  = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [errorRuta,  setErrorRuta]  = useState('')

  useEffect(() => {
    if (combustible.activo && !combustible.precio_litro) {
      const tipo = combustible.tipo_combustible || 'gasolina_93'
      const ref  = TIPOS_COMBUSTIBLE.find(t => t.value === tipo)
      if (ref) upd('precio_litro', ref.precio)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combustible.activo])

  const handleTipoCombustible = (tipo) => {
    const ref = TIPOS_COMBUSTIBLE.find(t => t.value === tipo)
    setCombustible(c => ({ ...c, tipo_combustible: tipo, precio_litro: ref?.precio ?? c.precio_litro }))
  }

  const handleTipoVehiculo = (value) => {
    const v = TIPOS_VEHICULO.find(t => t.value === value)
    setCombustible(c => ({ ...c, tipo_vehiculo: value, rendimiento: v?.rendimiento ?? c.rendimiento }))
  }

  const calcularRuta = useCallback(async () => {
    const origen  = autoOrig.current?.getPlace()?.formatted_address || combustible.origen
    const destino = autoDest.current?.getPlace()?.formatted_address || combustible.destino
    if (!origen || !destino) { setErrorRuta('Selecciona origen y destino desde las sugerencias.'); return }
    setCalculando(true)
    setErrorRuta('')
    setRoutePath(null)
    try {
      const res  = await fetch(`/api/calcular-ruta?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`)
      const data = await res.json()
      if (!res.ok || data.error) { setErrorRuta(data.error || 'No se pudo calcular la ruta.'); return }
      const path = window.google.maps.geometry.encoding.decodePath(data.encodedPolyline)
      setRoutePath(path)
      if (mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        mapRef.current.fitBounds(bounds, 60)
      }
      setCombustible(c => ({ ...c, origen, destino, km_total: data.km }))
    } catch {
      setErrorRuta('Error al conectar con el servidor.')
    } finally {
      setCalculando(false)
    }
  }, [combustible.origen, combustible.destino, setCombustible])

  const kmTotal       = Number(combustible.km_total)     || 0
  const rendimiento   = Number(combustible.rendimiento)  || 12
  const totalViajes   = Number(combustible.total_viajes) || 1
  const precioLitro   = Number(combustible.precio_litro) || 0
  const litrosTotales = kmTotal > 0 ? (kmTotal * totalViajes) / rendimiento : 0
  const costoTotal    = litrosTotales * precioLitro

  return (
    <div className="space-y-4">
      <div className="card border border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
            <h3 className="text-white font-semibold">Combustible y traslados</h3>
            {costoTotal > 0 && <span className="text-orange-400 font-bold text-sm">{fmt(costoTotal)}</span>}
          </div>
          <Toggle value={combustible.activo} onChange={() => upd('activo', !combustible.activo)} />
        </div>

        {!combustible.activo && (
          <p className="text-slate-600 text-xs mt-2">Activa para calcular el costo de combustible y traslados del proyecto.</p>
        )}

        {combustible.activo && (
          <div className="mt-4 space-y-5">

            {!GOOGLE_KEY ? (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 space-y-2">
                <p className="text-amber-400 font-semibold text-sm">Se necesita una Google Maps API Key</p>
                <ol className="text-amber-200/70 text-xs space-y-1 list-decimal list-inside">
                  <li>Ve a <b>console.cloud.google.com</b> → crea o selecciona un proyecto</li>
                  <li>Activa: <b>Maps JavaScript API</b>, <b>Places API</b> y <b>Routes API</b></li>
                  <li>Crea una clave de API (Credentials → Create credentials)</li>
                  <li>En Vercel: Settings → Environment Variables → agrega <code className="bg-black/30 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code></li>
                  <li>Redespliega el proyecto</li>
                </ol>
              </div>
            ) : !isLoaded ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Cargando Google Maps...
              </div>
            ) : (
              <>
                {/* Inputs con autocompletado Google */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />Punto de origen
                    </label>
                    <Autocomplete
                      onLoad={a => { autoOrig.current = a }}
                      onPlaceChanged={() => {
                        const p = autoOrig.current?.getPlace()
                        if (p?.formatted_address) setCombustible(c => ({ ...c, origen: p.formatted_address, km_total: 0 }))
                        setRoutePath(null)
                      }}
                      options={{ componentRestrictions: { country: 'cl' } }}
                    >
                      <input
                        type="text"
                        className="input-field text-sm py-2 w-full"
                        placeholder="Ej: Pasaje Los Aromos 456, Pudahuel"
                        defaultValue={combustible.origen || ''}
                      />
                    </Autocomplete>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />Punto de destino
                    </label>
                    <Autocomplete
                      onLoad={a => { autoDest.current = a }}
                      onPlaceChanged={() => {
                        const p = autoDest.current?.getPlace()
                        if (p?.formatted_address) setCombustible(c => ({ ...c, destino: p.formatted_address, km_total: 0 }))
                        setRoutePath(null)
                      }}
                      options={{ componentRestrictions: { country: 'cl' } }}
                    >
                      <input
                        type="text"
                        className="input-field text-sm py-2 w-full"
                        placeholder="Ej: Av. Balmaceda 1234, Calama"
                        defaultValue={combustible.destino || ''}
                      />
                    </Autocomplete>
                  </div>
                </div>

                <button
                  onClick={calcularRuta}
                  disabled={calculando}
                  className="btn-primary text-sm py-2 px-5 disabled:opacity-50 flex items-center gap-2"
                >
                  {calculando
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Calculando...</>
                    : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>Calcular ruta</>
                  }
                </button>
                {errorRuta && <p className="text-red-400 text-sm">{errorRuta}</p>}

                {/* Mapa */}
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: 300, borderRadius: 12, overflow: 'hidden' }}
                  center={MAP_CENTER}
                  zoom={6}
                  options={MAP_OPTS}
                  onLoad={map => { mapRef.current = map }}
                >
                  {routePath && (
                    <Polyline
                      path={routePath}
                      options={{ strokeColor: '#f97316', strokeWeight: 5, strokeOpacity: 0.85 }}
                    />
                  )}
                </GoogleMap>

                {kmTotal > 0 && (
                  <div className="bg-slate-900 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap text-sm">
                    <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <span className="text-orange-400 font-bold">{kmTotal} km</span>
                    <span className="text-slate-500 text-xs">{combustible.origen} → {combustible.destino}</span>
                  </div>
                )}
              </>
            )}

            {/* Combustible */}
            <div className="border-t border-slate-700 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo de combustible</label>
                <select className="input-field text-sm py-2" value={combustible.tipo_combustible || 'gasolina_93'} onChange={e => handleTipoCombustible(e.target.value)}>
                  {TIPOS_COMBUSTIBLE.map(t => <option key={t.value} value={t.value}>{t.label} — ref. ${t.precio.toLocaleString('es-CL')}/L</option>)}
                </select>
              </div>
              <div>
                <label className="label">Precio ($/litro) — editable</label>
                <input type="number" min="0" className="input-field text-sm py-2" value={combustible.precio_litro || ''} onChange={e => upd('precio_litro', Number(e.target.value))} />
              </div>
            </div>

            {/* Vehículo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Tipo de vehículo</label>
                <select className="input-field text-sm py-2" value={combustible.tipo_vehiculo || ''} onChange={e => handleTipoVehiculo(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {TIPOS_VEHICULO.map(t => <option key={t.value} value={t.value}>{t.label} — {t.rendimiento} km/L (estimado)</option>)}
                </select>
              </div>
              <div>
                <label className="label">Rendimiento (km/L)</label>
                <input type="number" min="1" step="0.5" className="input-field text-sm py-2" placeholder="Ej: 12" value={combustible.rendimiento || ''} onChange={e => upd('rendimiento', Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="label">N° de viajes</label>
              <input type="number" min="1" className="input-field text-sm py-2 max-w-[160px]" placeholder="1" value={combustible.total_viajes || ''} onChange={e => upd('total_viajes', Number(e.target.value))} />
            </div>

            {costoTotal > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center pt-2 border-t border-slate-700 text-xs text-slate-400">
                <span>{kmTotal} km × {totalViajes} viaje{totalViajes !== 1 ? 's' : ''} = <b className="text-slate-300">{(kmTotal * totalViajes).toFixed(0)} km</b> totales</span>
                <span>÷ {rendimiento} km/L = <b className="text-slate-300">{litrosTotales.toFixed(1)} L</b></span>
                <span>× {fmt(precioLitro)}/L = <b className="text-orange-400 text-sm">{fmt(costoTotal)}</b></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
