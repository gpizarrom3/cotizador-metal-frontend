import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Toggle from '../ui/Toggle'

// Fix Leaflet icons en Vite (no usa webpack require)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const iconOrigen = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})
const iconDestino = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const TIPOS_COMBUSTIBLE = [
  { value: 'gasolina_93', label: 'Gasolina 93', precio: 1039 },
  { value: 'gasolina_95', label: 'Gasolina 95', precio: 1092 },
  { value: 'gasolina_97', label: 'Gasolina 97', precio: 1154 },
  { value: 'diesel',      label: 'Diesel',       precio:  923 },
]

const TIPOS_VEHICULO = [
  { value: 'auto',      label: 'Auto / Sedan',     rendimiento: 13 },
  { value: 'suv',       label: 'SUV / 4×4',        rendimiento: 11 },
  { value: 'camioneta', label: 'Camioneta pickup',  rendimiento: 9  },
  { value: 'furgon',    label: 'Furgón / Van',      rendimiento: 8  },
  { value: 'camion_l',  label: 'Camión ligero',     rendimiento: 6  },
  { value: 'camion_p',  label: 'Camión pesado',     rendimiento: 4  },
]

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, bounds])
  return null
}

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const calcDiasTrabajados = (r) => Math.ceil(Number(r.horas) / 8) || 0

const calcRoleTotal = (r) => {
  const hh = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
  const dias = calcDiasTrabajados(r)
  const col = r.colacion ? (dias * Number(r.cantidad) * Number(r.valor_colacion)) || 0 : 0
  return hh + col
}

export const newRole = () => ({ id: Date.now() + Math.random(), nombre: '', precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0, grupo: '', ubicacion: 'taller' })

export const emptyGrupoHH = (nombre = 'MANO DE OBRA') => ({
  id: Date.now() + Math.random(),
  nombre,
})

function CombustibleCard({ combustible, setCombustible }) {
  const upd = (field, val) => setCombustible(c => ({ ...c, [field]: val }))

  const [origenInput,  setOrigenInput]  = useState(combustible.origen  || '')
  const [destinoInput, setDestinoInput] = useState(combustible.destino || '')
  const [calculando,   setCalculando]   = useState(false)
  const [errorRuta,    setErrorRuta]    = useState('')

  const origenCoords  = combustible.origen_coords  || null
  const destinoCoords = combustible.destino_coords || null
  const rutaCoords    = combustible.ruta_coords    || null

  // Al activar, carga precio por defecto si aún no tiene uno
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

  const geocode = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Chile')}&format=json&limit=1`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    const data = await res.json()
    if (!data.length) throw new Error(`No se encontró la dirección: "${address}". Intenta agregar la ciudad o comuna.`)
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }

  const calcularRuta = async () => {
    if (!origenInput.trim() || !destinoInput.trim()) return
    setCalculando(true)
    setErrorRuta('')
    try {
      const [orig, dest] = await Promise.all([geocode(origenInput), geocode(destinoInput)])
      const osrmUrl  = `https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      const routeRes = await fetch(osrmUrl)
      const routeData = await routeRes.json()
      if (routeData.code !== 'Ok') throw new Error('No se pudo trazar la ruta entre esas ubicaciones.')
      const route   = routeData.routes[0]
      const kmTotal = Math.round(route.distance / 100) / 10
      const coords  = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      setCombustible(c => ({
        ...c,
        origen: origenInput, destino: destinoInput,
        origen_coords:  { lat: orig.lat, lng: orig.lng },
        destino_coords: { lat: dest.lat, lng: dest.lng },
        km_total: kmTotal, ruta_coords: coords,
      }))
    } catch (e) {
      setErrorRuta(e.message || 'Error al calcular la ruta.')
    } finally {
      setCalculando(false)
    }
  }

  const kmTotal      = Number(combustible.km_total)     || 0
  const rendimiento  = Number(combustible.rendimiento)  || 12
  const totalViajes  = Number(combustible.total_viajes) || 1
  const precioLitro  = Number(combustible.precio_litro) || 0
  const litrosTotales = kmTotal > 0 ? (kmTotal * totalViajes) / rendimiento : 0
  const costoTotal    = litrosTotales * precioLitro

  const mapBounds = origenCoords && destinoCoords
    ? [[origenCoords.lat, origenCoords.lng], [destinoCoords.lat, destinoCoords.lng]]
    : null
  const mapCenter = origenCoords ? [origenCoords.lat, origenCoords.lng] : [-33.4489, -70.6693]

  return (
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

          {/* ── Ruta ── */}
          <div className="space-y-3">
            <p className="text-slate-500 text-xs">Ingresa calle, pasaje o dirección completa. Incluye la comuna para mayor precisión.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />
                  Punto de origen
                </label>
                <input
                  type="text"
                  className="input-field text-sm py-2"
                  placeholder="Ej: Pasaje Los Aromos 456, Pudahuel"
                  value={origenInput}
                  onChange={e => setOrigenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && calcularRuta()}
                />
              </div>
              <div>
                <label className="label">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />
                  Punto de destino
                </label>
                <input
                  type="text"
                  className="input-field text-sm py-2"
                  placeholder="Ej: Av. Balmaceda 1234, Calama"
                  value={destinoInput}
                  onChange={e => setDestinoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && calcularRuta()}
                />
              </div>
            </div>
            <button
              onClick={calcularRuta}
              disabled={calculando || !origenInput.trim() || !destinoInput.trim()}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50 flex items-center gap-2"
            >
              {calculando
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Calculando ruta...</>
                : <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Calcular ruta
                  </>
              }
            </button>
            {errorRuta && <p className="text-red-400 text-sm">{errorRuta}</p>}
          </div>

          {/* ── Mapa ── */}
          <div className="rounded-xl overflow-hidden border border-slate-600" style={{ height: 300 }}>
            <MapContainer
              center={mapCenter}
              zoom={origenCoords ? 11 : 6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {origenCoords  && <Marker position={[origenCoords.lat,  origenCoords.lng]}  icon={iconOrigen}  />}
              {destinoCoords && <Marker position={[destinoCoords.lat, destinoCoords.lng]} icon={iconDestino} />}
              {rutaCoords    && <Polyline positions={rutaCoords} color="#f97316" weight={4} opacity={0.85} />}
              {mapBounds     && <FitBounds bounds={mapBounds} />}
            </MapContainer>
          </div>

          {kmTotal > 0 && (
            <div className="bg-slate-900 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap text-sm">
              <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-orange-400 font-bold">{kmTotal} km</span>
              <span className="text-slate-500">{combustible.origen} → {combustible.destino}</span>
            </div>
          )}

          {/* ── Combustible ── */}
          <div className="border-t border-slate-700 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de combustible</label>
              <select
                className="input-field text-sm py-2"
                value={combustible.tipo_combustible || 'gasolina_93'}
                onChange={e => handleTipoCombustible(e.target.value)}
              >
                {TIPOS_COMBUSTIBLE.map(t => (
                  <option key={t.value} value={t.value}>{t.label} — ref. ${t.precio.toLocaleString('es-CL')}/L</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Precio ($/litro) — editable</label>
              <input
                type="number" min="0"
                className="input-field text-sm py-2"
                value={combustible.precio_litro || ''}
                onChange={e => upd('precio_litro', Number(e.target.value))}
              />
            </div>
          </div>

          {/* ── Vehículo ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Tipo de vehículo</label>
              <select
                className="input-field text-sm py-2"
                value={combustible.tipo_vehiculo || ''}
                onChange={e => handleTipoVehiculo(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {TIPOS_VEHICULO.map(t => (
                  <option key={t.value} value={t.value}>{t.label} — {t.rendimiento} km/L (estimado)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rendimiento (km/L) — editable</label>
              <input
                type="number" min="1" step="0.5"
                className="input-field text-sm py-2"
                placeholder="Ej: 12"
                value={combustible.rendimiento || ''}
                onChange={e => upd('rendimiento', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">N° de viajes</label>
              <input
                type="number" min="1"
                className="input-field text-sm py-2"
                placeholder="1"
                value={combustible.total_viajes || ''}
                onChange={e => upd('total_viajes', Number(e.target.value))}
              />
            </div>
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
  )
}

export default function TabHorasHombre({
  roles, setRoles,
  configRoles = [],
  gruposHH = [], setGruposHH = () => {},
  combustible = {}, setCombustible = () => {}
}) {
  const update = (id, field, value) =>
    setRoles(prev => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const updateMulti = (id, fields) =>
    setRoles(prev => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)))
  const removeRole = (id) => setRoles(prev => prev.filter((r) => r.id !== id))

  const addRoleToGroup = (grupoNombre) =>
    setRoles(prev => [...prev, { ...newRole(), grupo: grupoNombre }])

  const addGroup = () => {
    const g = emptyGrupoHH('NUEVO GRUPO')
    setGruposHH(prev => [...prev, g])
  }

  const removeGroup = (grupoId, grupoNombre) => {
    setGruposHH(prev => prev.filter(g => g.id !== grupoId))
    setRoles(prev => prev.filter(r => r.grupo !== grupoNombre))
  }

  const renameGroup = (grupoId, oldNombre, newNombre) => {
    setGruposHH(prev => prev.map(g => g.id === grupoId ? { ...g, nombre: newNombre } : g))
    setRoles(prev => prev.map(r => r.grupo === oldNombre ? { ...r, grupo: newNombre } : r))
  }

  const total = roles.reduce((acc, r) => acc + calcRoleTotal(r), 0)

  const grupoNombres = new Set(gruposHH.map(g => g.nombre))
  const rolesSinGrupo = roles.filter(r => !r.grupo || !grupoNombres.has(r.grupo))

  const renderCargo = (r) => (
    <div key={r.id} className="bg-slate-950 border border-slate-700 rounded-lg p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3 items-end">
        {/* Cargo */}
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Cargo</label>
          {configRoles.length > 0 ? (
            <>
              <select
                className="input-field text-sm py-2"
                value={configRoles.find((cr) => cr.nombre === r.nombre) ? r.nombre : '__custom__'}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__custom__') {
                    update(r.id, 'nombre', '')
                  } else {
                    const preset = configRoles.find((cr) => cr.nombre === val)
                    updateMulti(r.id, { nombre: val, ...(preset ? { precio_hora: preset.precio_hora } : {}) })
                  }
                }}
              >
                {configRoles.map((cr) => (
                  <option key={cr.nombre} value={cr.nombre}>{cr.nombre}</option>
                ))}
                <option value="__custom__">Personalizado...</option>
              </select>
              {!configRoles.find((cr) => cr.nombre === r.nombre) && (
                <input
                  type="text"
                  className="input-field text-sm py-2 mt-1"
                  placeholder="Nombre del cargo"
                  value={r.nombre}
                  onChange={(e) => update(r.id, 'nombre', e.target.value)}
                />
              )}
            </>
          ) : (
            <input
              type="text"
              className="input-field text-sm py-2"
              value={r.nombre}
              onChange={(e) => update(r.id, 'nombre', e.target.value)}
            />
          )}
        </div>

        {/* Precio/hora */}
        <div>
          <label className="label">
            Precio / hora
            <span className="text-[10px] text-slate-600 font-normal ml-1">decimal: (.)</span>
          </label>
          <input
            type="number" min="0"
            className="input-field text-sm py-2"
            placeholder="Ej: 1500"
            value={r.precio_hora || ''}
            onChange={(e) => update(r.id, 'precio_hora', Number(e.target.value))}
          />
        </div>

        {/* Personas */}
        <div>
          <label className="label">Personas</label>
          <input
            type="number" min="1"
            className="input-field text-sm py-2"
            value={r.cantidad}
            onChange={(e) => update(r.id, 'cantidad', Number(e.target.value))}
          />
        </div>

        {/* Horas totales */}
        <div>
          <label className="label">Horas totales</label>
          <input
            type="number" min="0" step="0.5"
            className="input-field text-sm py-2"
            placeholder="0"
            value={r.horas || ''}
            onChange={(e) => update(r.id, 'horas', Number(e.target.value))}
          />
        </div>

        {/* Ubicación */}
        <div>
          <label className="label">Ubicación</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-600 h-10">
            <button
              type="button"
              onClick={() => update(r.id, 'ubicacion', 'taller')}
              className={`flex-1 text-xs font-medium transition-colors px-2 ${r.ubicacion !== 'terreno' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Taller
            </button>
            <button
              type="button"
              onClick={() => update(r.id, 'ubicacion', 'terreno')}
              className={`flex-1 text-xs font-medium transition-colors px-2 ${r.ubicacion === 'terreno' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Terreno
            </button>
          </div>
        </div>

        {/* Colación */}
        <div>
          <label className="label">Colación</label>
          <div className="flex items-center gap-2 h-10">
            <Toggle value={r.colacion} onChange={() => update(r.id, 'colacion', !r.colacion)} />
            <span className="text-slate-400 text-xs">{r.colacion ? 'Sí' : 'No'}</span>
          </div>
        </div>

        {/* Valor colación */}
        <div>
          <label className="label">Valor colación</label>
          <input
            type="number" min="0"
            className={`input-field text-sm py-2 transition-opacity ${r.colacion ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
            placeholder="Por persona/día"
            value={r.valor_colacion || ''}
            onChange={(e) => update(r.id, 'valor_colacion', Number(e.target.value))}
            disabled={!r.colacion}
          />
        </div>

        {/* Subtotal + eliminar */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400 mb-1">Subtotal</p>
            <p className="text-blue-400 font-semibold text-sm">{fmt(calcRoleTotal(r))}</p>
          </div>
          <button
            onClick={() => removeRole(r.id)}
            className="text-slate-500 hover:text-red-400 transition-colors mb-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {(r.precio_hora > 0 || r.horas > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>HH: {fmt(Number(r.precio_hora) * Number(r.horas))} × {r.cantidad} persona(s) = {fmt(Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad))}</span>
          {r.colacion && r.valor_colacion > 0 && (() => {
            const dias = calcDiasTrabajados(r)
            return (
              <span className="text-amber-500/80">
                Colación: {dias} día(s) × {r.cantidad} pers. × {fmt(r.valor_colacion)} = {fmt(dias * Number(r.cantidad) * Number(r.valor_colacion))}
              </span>
            )
          })()}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Grupos de HH */}
      {gruposHH.map((grupo) => {
        const rolesGrupo = roles.filter(r => r.grupo === grupo.nombre)
        const subtotal = rolesGrupo.reduce((acc, r) => acc + calcRoleTotal(r), 0)
        const horasTotal = rolesGrupo.reduce((acc, r) => acc + (Number(r.horas) * Number(r.cantidad) || 0), 0)

        return (
          <div key={grupo.id} className="card border border-slate-700">
            {/* Header del grupo */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <input
                  type="text"
                  value={grupo.nombre}
                  onChange={(e) => renameGroup(grupo.id, grupo.nombre, e.target.value)}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim().toUpperCase()
                    if (trimmed && trimmed !== grupo.nombre) renameGroup(grupo.id, grupo.nombre, trimmed)
                    else if (!trimmed) renameGroup(grupo.id, grupo.nombre, 'GRUPO SIN NOMBRE')
                  }}
                  className="bg-transparent text-white font-semibold focus:outline-none border-b border-transparent hover:border-slate-600 focus:border-blue-500 transition-colors min-w-0 flex-1 max-w-xs uppercase"
                />
                {rolesGrupo.length > 0 && (
                  <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
                    {horasTotal.toFixed(1)} hrs·persona
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {rolesGrupo.length > 0 && (
                  <span className="text-blue-400 font-bold text-sm">{fmt(subtotal)}</span>
                )}
                <button
                  onClick={() => addRoleToGroup(grupo.nombre)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  + Cargo
                </button>
                {gruposHH.length > 1 && (
                  <button
                    onClick={() => removeGroup(grupo.id, grupo.nombre)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Eliminar grupo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {rolesGrupo.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">
                Sin cargos asignados — haz click en "+ Cargo"
              </p>
            ) : (
              <div className="space-y-3">
                {rolesGrupo.map(renderCargo)}
              </div>
            )}
          </div>
        )
      })}

      {/* Cargos legacy sin grupo (migración desde datos antiguos) */}
      {rolesSinGrupo.length > 0 && (
        <div className="card border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0" />
              <h3 className="text-slate-400 font-semibold">Sin grupo</h3>
            </div>
            <span className="text-slate-400 font-bold">
              {fmt(rolesSinGrupo.reduce((acc, r) => acc + calcRoleTotal(r), 0))}
            </span>
          </div>
          <div className="space-y-3">
            {rolesSinGrupo.map(renderCargo)}
          </div>
        </div>
      )}

      {/* Botón agregar grupo */}
      <button
        onClick={addGroup}
        className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/40 border-dashed text-blue-400 hover:text-blue-300 font-medium rounded-xl py-3 text-sm transition-colors"
      >
        + Agregar grupo de horas hombre
        <span className="block text-xs text-slate-500 font-normal mt-0.5">Fabricación, Montaje, Instalación, etc.</span>
      </button>

      {/* Combustible */}
      <CombustibleCard combustible={combustible} setCombustible={setCombustible} />

      {/* Total general */}
      {(() => {
        const totalCombustible = combustible.activo
          ? (Number(combustible.precio_litro) * Number(combustible.litros_dia) * Number(combustible.total_dias)) || 0
          : 0
        const totalConCombustible = total + totalCombustible
        return (
          <div className="flex justify-end">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 flex items-center gap-4 flex-wrap justify-end">
              {totalCombustible > 0 && (
                <span className="text-slate-500 text-xs">
                  HH {fmt(total)} + Combustible {fmt(totalCombustible)}
                </span>
              )}
              <span className="text-slate-400 text-sm">Total HH:</span>
              <span className="text-blue-400 font-bold text-lg">{fmt(totalConCombustible)}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
