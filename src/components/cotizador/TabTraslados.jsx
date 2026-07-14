import { useState, useRef, useCallback } from 'react'
import { useJsApiLoader, GoogleMap, Autocomplete, Polyline } from '@react-google-maps/api'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
const LIBS       = ['places', 'geometry']
const MAP_CENTER = { lat: -33.4489, lng: -70.6693 }
const MAP_OPTS   = {
  mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
  styles: [
    { elementType: 'geometry',           stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#94a3b8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
    { featureType: 'road',         elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
    { featureType: 'water',        elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
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

export const emptyTraslado = () => ({
  id: Date.now() + Math.random(),
  nombre: '',
  tipo_combustible: 'gasolina_93',
  precio_litro: 1039,
  origen: '', destino: '',
  km_total: 0,
  rendimiento: 12,
  tipo_vehiculo: '',
  total_viajes: 1,
})

export const calcCostoTraslado = (t) => {
  const km     = Number(t.km_total)     || 0
  const rendim = Number(t.rendimiento)  || 12
  const viajes = Number(t.total_viajes) || 1
  const precio = Number(t.precio_litro) || 0
  if (km <= 0 || precio <= 0) return 0
  return (km * viajes / rendim) * precio
}

function TrasladoCard({ traslado, index, onUpdate, onRemove, isLoaded }) {
  const autoOrig = useRef(null)
  const autoDest = useRef(null)
  const mapRef   = useRef(null)
  const [routePath,  setRoutePath]  = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [errorRuta,  setErrorRuta]  = useState('')

  const handleTipoCombustible = (tipo) => {
    const ref = TIPOS_COMBUSTIBLE.find(t => t.value === tipo)
    onUpdate({ tipo_combustible: tipo, precio_litro: ref?.precio ?? traslado.precio_litro })
  }

  const handleTipoVehiculo = (value) => {
    const v = TIPOS_VEHICULO.find(t => t.value === value)
    onUpdate({ tipo_vehiculo: value, rendimiento: v?.rendimiento ?? traslado.rendimiento })
  }

  const calcularRuta = useCallback(async () => {
    const origen  = autoOrig.current?.getPlace()?.formatted_address || traslado.origen
    const destino = autoDest.current?.getPlace()?.formatted_address || traslado.destino
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
      onUpdate({ origen, destino, km_total: data.km })
    } catch {
      setErrorRuta('Error al conectar con el servidor.')
    } finally {
      setCalculando(false)
    }
  }, [traslado.origen, traslado.destino, onUpdate])

  const kmTotal       = Number(traslado.km_total)     || 0
  const rendimiento   = Number(traslado.rendimiento)  || 12
  const totalViajes   = Number(traslado.total_viajes) || 1
  const precioLitro   = Number(traslado.precio_litro) || 0
  const litrosTotales = kmTotal > 0 ? (kmTotal * totalViajes) / rendimiento : 0
  const costoTotal    = litrosTotales * precioLitro

  return (
    <div className="card border border-slate-700 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
        <span className="text-slate-500 text-xs font-mono uppercase">Traslado {index + 1}</span>
        <input
          type="text"
          className="bg-transparent text-white font-medium focus:outline-none border-b border-transparent hover:border-slate-600 focus:border-orange-500 transition-colors flex-1 text-sm placeholder-slate-600"
          placeholder="Descripción (ej: Ida a obra, Retiro material)"
          value={traslado.nombre || ''}
          onChange={e => onUpdate({ nombre: e.target.value })}
        />
        {costoTotal > 0 && <span className="text-orange-400 font-bold text-sm whitespace-nowrap">{fmt(costoTotal)}</span>}
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors" title="Eliminar traslado">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Mapa y ruta */}
      {!GOOGLE_KEY ? (
        <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4">
          <p className="text-amber-400 text-sm font-semibold">Se necesita VITE_GOOGLE_MAPS_KEY para usar el mapa.</p>
        </div>
      ) : !isLoaded ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
          <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Cargando Google Maps...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />Origen
              </label>
              <Autocomplete
                onLoad={a => { autoOrig.current = a }}
                onPlaceChanged={() => {
                  const p = autoOrig.current?.getPlace()
                  if (p?.formatted_address) onUpdate({ origen: p.formatted_address, km_total: 0 })
                  setRoutePath(null)
                }}
                options={{ componentRestrictions: { country: 'cl' } }}
              >
                <input
                  type="text"
                  className="input-field text-sm py-2 w-full"
                  placeholder="Ej: Pasaje Los Aromos 456, Pudahuel"
                  defaultValue={traslado.origen || ''}
                />
              </Autocomplete>
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />Destino
              </label>
              <Autocomplete
                onLoad={a => { autoDest.current = a }}
                onPlaceChanged={() => {
                  const p = autoDest.current?.getPlace()
                  if (p?.formatted_address) onUpdate({ destino: p.formatted_address, km_total: 0 })
                  setRoutePath(null)
                }}
                options={{ componentRestrictions: { country: 'cl' } }}
              >
                <input
                  type="text"
                  className="input-field text-sm py-2 w-full"
                  placeholder="Ej: Av. Balmaceda 1234, Calama"
                  defaultValue={traslado.destino || ''}
                />
              </Autocomplete>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
            {kmTotal > 0 && (
              <div className="flex items-center gap-2 text-sm bg-slate-900 rounded-lg px-3 py-1.5">
                <span className="text-orange-400 font-bold">{kmTotal} km</span>
                <span className="text-slate-600 text-xs hidden sm:inline">{traslado.origen} → {traslado.destino}</span>
              </div>
            )}
          </div>

          <GoogleMap
            mapContainerStyle={{ width: '100%', height: 200, borderRadius: 10, overflow: 'hidden' }}
            center={MAP_CENTER}
            zoom={6}
            options={MAP_OPTS}
            onLoad={map => { mapRef.current = map }}
          >
            {routePath && <Polyline path={routePath} options={{ strokeColor: '#f97316', strokeWeight: 5, strokeOpacity: 0.85 }} />}
          </GoogleMap>
        </div>
      )}

      {/* Combustible y vehículo */}
      <div className="border-t border-slate-700 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Combustible</label>
          <select className="input-field text-sm py-2" value={traslado.tipo_combustible || 'gasolina_93'} onChange={e => handleTipoCombustible(e.target.value)}>
            {TIPOS_COMBUSTIBLE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">$/litro</label>
          <input type="number" min="0" className="input-field text-sm py-2" value={traslado.precio_litro || ''} onChange={e => onUpdate({ precio_litro: Number(e.target.value) })} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Vehículo</label>
          <select className="input-field text-sm py-2" value={traslado.tipo_vehiculo || ''} onChange={e => handleTipoVehiculo(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {TIPOS_VEHICULO.map(t => <option key={t.value} value={t.value}>{t.label} ({t.rendimiento} km/L)</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
          <div>
            <label className="label">km/L</label>
            <input type="number" min="1" step="0.5" className="input-field text-sm py-2" placeholder="12" value={traslado.rendimiento || ''} onChange={e => onUpdate({ rendimiento: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Viajes</label>
            <input type="number" min="1" className="input-field text-sm py-2" placeholder="1" value={traslado.total_viajes || ''} onChange={e => onUpdate({ total_viajes: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      {costoTotal > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>{kmTotal} km × {totalViajes} viaje{totalViajes !== 1 ? 's' : ''} = <b className="text-slate-300">{(kmTotal * totalViajes).toFixed(0)} km</b></span>
          <span>÷ {rendimiento} km/L = <b className="text-slate-300">{litrosTotales.toFixed(1)} L</b></span>
          <span>× {fmt(precioLitro)}/L = <b className="text-orange-400 text-sm">{fmt(costoTotal)}</b></span>
        </div>
      )}
    </div>
  )
}

export default function TabTraslados({ combustible, setCombustible }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_KEY, libraries: LIBS })

  const traslados = combustible.traslados || []

  const addTraslado = () =>
    setCombustible(c => ({ ...c, activo: true, traslados: [...(c.traslados || []), emptyTraslado()] }))

  const removeTraslado = (id) =>
    setCombustible(c => {
      const updated = (c.traslados || []).filter(t => t.id !== id)
      return { ...c, traslados: updated, activo: updated.length > 0 }
    })

  const updateTraslado = (id, changes) =>
    setCombustible(c => ({
      ...c,
      traslados: (c.traslados || []).map(t => t.id === id ? { ...t, ...changes } : t),
    }))

  const totalGeneral = traslados.reduce((acc, t) => acc + calcCostoTraslado(t), 0)

  if (traslados.length === 0) {
    return (
      <div className="card border border-dashed border-slate-700 text-center py-12">
        <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-slate-500 text-sm mb-1">Sin traslados configurados</p>
        <p className="text-slate-600 text-xs mb-5">Agrega cada ruta del proyecto por separado</p>
        <button onClick={addTraslado} className="btn-primary text-sm px-6 py-2.5">
          + Agregar traslado
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {traslados.map((t, i) => (
        <TrasladoCard
          key={t.id}
          traslado={t}
          index={i}
          onUpdate={(changes) => updateTraslado(t.id, changes)}
          onRemove={() => removeTraslado(t.id)}
          isLoaded={isLoaded}
        />
      ))}

      <button
        onClick={addTraslado}
        className="w-full bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600/40 border-dashed text-orange-400 hover:text-orange-300 font-medium rounded-xl py-3 text-sm transition-colors"
      >
        + Agregar traslado
        <span className="block text-xs text-slate-500 font-normal mt-0.5">Ej: Retiro material, Entrega en obra, Ida y vuelta</span>
      </button>

      {totalGeneral > 0 && (
        <div className="flex justify-end">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 flex items-center gap-4">
            <span className="text-slate-400 text-sm">Total traslados ({traslados.length}):</span>
            <span className="text-orange-400 font-bold text-lg">{fmt(totalGeneral)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
