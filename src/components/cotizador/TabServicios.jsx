import { useState, useEffect } from 'react'
import Toggle from '../ui/Toggle'
import { useAuth } from '../../hooks/useAuth'
import { obtenerCatalogoServicios } from '../../firebase/firestore'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const TRATAMIENTOS = [
  { value: 'normalizado', label: 'Normalizado', precio: 3500 },
  { value: 'recocido', label: 'Recocido', precio: 3000 },
  { value: 'temple', label: 'Temple', precio: 4000 },
  { value: 'revenido', label: 'Revenido', precio: 2500 },
  { value: 'bonificado', label: 'Temple + Revenido (Bonificado)', precio: 5500 },
  { value: 'cementacion', label: 'Cementación', precio: 8000 },
  { value: 'nitruracion', label: 'Nitruración', precio: 12000 },
  { value: 'carburizacion', label: 'Carburización', precio: 7500 },
  { value: 'induccion', label: 'Endurecimiento por Inducción', precio: 10000 },
  { value: 'alivio_tensiones', label: 'Alivio de Tensiones', precio: 2800 },
  { value: 'carbonitrurado', label: 'Carbonitrurado', precio: 9000 },
]

const SERVICIOS_SIMPLES = [
  { key: 'corte_plasma', label: 'Corte Plasma' },
  { key: 'corte_laser', label: 'Corte Láser' },
  { key: 'oxicorte', label: 'Oxicorte' },
  { key: 'plegado', label: 'Servicio de Plegado' },
  { key: 'cilindrado', label: 'Servicio de Cilindrado' },
]

export default function TabServicios({ servicios, setServicios }) {
  const { user } = useAuth()
  const [catalogoCat, setCatalogoCat] = useState([])
  const [catOpen, setCatOpen]         = useState(false)
  const [catSearch, setCatSearch]     = useState('')

  useEffect(() => {
    if (!user) return
    obtenerCatalogoServicios(user.uid, user.email).then(setCatalogoCat).catch(() => {})
  }, [user])

  const update = (key, field, value) => {
    const current = servicios[key]
    const updated = { ...current, [field]: value }
    if (field === 'cantidad' || field === 'precio_ref') {
      updated.precio = (Number(updated.cantidad) || 0) * (Number(updated.precio_ref) || 0)
    }
    setServicios({ ...servicios, [key]: updated })
  }

  const handleTratamiento = (tipo) => {
    const t = TRATAMIENTOS.find((t) => t.value === tipo)
    setServicios({
      ...servicios,
      tratamiento_termico: {
        ...servicios.tratamiento_termico,
        tipo,
        precio: t ? t.precio : servicios.tratamiento_termico.precio,
      },
    })
  }

  // ── Servicios custom (desde catálogo) ────────────────────────────────────────
  const customItems = servicios.custom || []

  const agregarDesideCatalogo = (item) => {
    const nuevo = {
      id: Date.now() + Math.random(),
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      unidad: item.unidad || '',
      cantidad: 1,
      precio_ref: item.precio_unitario || 0,
    }
    setServicios({ ...servicios, custom: [...customItems, nuevo] })
  }

  const updateCustom = (id, field, value) => {
    setServicios({
      ...servicios,
      custom: customItems.map((s) => s.id === id ? { ...s, [field]: value } : s),
    })
  }

  const removeCustom = (id) => {
    setServicios({ ...servicios, custom: customItems.filter((s) => s.id !== id) })
  }

  // ── Totales ───────────────────────────────────────────────────────────────────
  const { custom: _custom, ...serviciosFijos } = servicios
  const totalFijos = Object.values(serviciosFijos).reduce(
    (acc, s) => acc + (s.activo ? Number(s.precio) || 0 : 0), 0
  )
  const totalCustom = customItems.reduce(
    (acc, s) => acc + (Number(s.cantidad) * Number(s.precio_ref) || 0), 0
  )
  const total = totalFijos + totalCustom

  return (
    <div className="space-y-4">

      {/* Catálogo de servicios */}
      {catalogoCat.length > 0 && (
        <div className="card border-teal-500/30 bg-slate-800">
          <button className="w-full flex items-center justify-between" onClick={() => setCatOpen(v => !v)}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-teal-600/30 border border-teal-500/30 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-teal-400">Desde catálogo de servicios</h3>
              <span className="text-xs text-slate-500">({catalogoCat.length} servicios)</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${catOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {catOpen && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                className="input-field"
                placeholder="Filtrar servicios..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {catalogoCat
                  .filter((i) =>
                    i.nombre?.toLowerCase().includes(catSearch.toLowerCase()) ||
                    i.descripcion?.toLowerCase().includes(catSearch.toLowerCase())
                  )
                  .map((i) => (
                    <button
                      key={i.id}
                      onClick={() => agregarDesideCatalogo(i)}
                      className="text-left bg-slate-950 border border-slate-600 hover:border-teal-500/50 rounded-lg p-3 transition-colors"
                    >
                      <p className="text-white font-medium text-sm leading-tight">{i.nombre}</p>
                      {i.descripcion && <p className="text-slate-400 text-xs mt-0.5">{i.descripcion}</p>}
                      <p className="text-teal-400 font-semibold text-xs mt-1">
                        {fmt(i.precio_unitario)}{i.unidad ? ` / ${i.unidad}` : ''}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Servicios fijos */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-5">Servicios requeridos</h2>

        <div className="space-y-3">
          {SERVICIOS_SIMPLES.map(({ key, label }) => (
            <ServiceRow
              key={key}
              label={label}
              activo={servicios[key].activo}
              precio={servicios[key].precio}
              cantidad={servicios[key].cantidad ?? 0}
              precioRef={servicios[key].precio_ref ?? 0}
              unidad={servicios[key].unidad ?? ''}
              onToggle={() => update(key, 'activo', !servicios[key].activo)}
              onUpdate={(field, value) => update(key, field, value)}
            />
          ))}

          {/* Tratamientos térmicos */}
          <div
            className={`border rounded-lg p-4 transition-colors ${
              servicios.tratamiento_termico.activo
                ? 'border-blue-500/40 bg-slate-900'
                : 'border-slate-700 bg-slate-900/40'
            }`}
          >
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-52">
                <Toggle
                  value={servicios.tratamiento_termico.activo}
                  onChange={() => update('tratamiento_termico', 'activo', !servicios.tratamiento_termico.activo)}
                />
                <span className={`font-medium text-sm ${servicios.tratamiento_termico.activo ? 'text-white' : 'text-slate-400'}`}>
                  Tratamiento Térmico
                </span>
              </div>

              {servicios.tratamiento_termico.activo && (
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <select
                    className="input-field text-sm py-2 flex-1 min-w-52"
                    value={servicios.tratamiento_termico.tipo}
                    onChange={(e) => handleTratamiento(e.target.value)}
                  >
                    <option value="">Seleccionar tratamiento...</option>
                    {TRATAMIENTOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs whitespace-nowrap">Precio ref. ($)</span>
                    <input
                      type="number"
                      min="0"
                      className="input-field text-sm py-2 w-32 text-right"
                      value={servicios.tratamiento_termico.precio || ''}
                      onChange={(e) => update('tratamiento_termico', 'precio', Number(e.target.value))}
                    />
                  </div>
                  <span className="text-blue-400 font-semibold text-sm whitespace-nowrap">
                    {fmt(servicios.tratamiento_termico.precio)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Servicios personalizados (desde catálogo) */}
        {customItems.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-teal-500 rounded-full" />
              <h3 className="text-sm font-semibold text-teal-400">Servicios del catálogo</h3>
            </div>
            {customItems.map((s) => (
              <div key={s.id} className="border border-teal-500/20 bg-slate-900 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{s.nombre}</p>
                    {s.descripcion && <p className="text-slate-400 text-xs mt-0.5">{s.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs whitespace-nowrap">Cantidad</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field text-sm py-2 w-24 text-right"
                        value={s.cantidad || ''}
                        onChange={(e) => updateCustom(s.id, 'cantidad', Number(e.target.value))}
                      />
                      {s.unidad && <span className="text-slate-500 text-xs">{s.unidad}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs whitespace-nowrap">Precio ref.</span>
                      <input
                        type="number"
                        min="0"
                        className="input-field text-sm py-2 w-28 text-right"
                        value={s.precio_ref || ''}
                        onChange={(e) => updateCustom(s.id, 'precio_ref', Number(e.target.value))}
                      />
                    </div>
                    <span className="text-teal-400 font-semibold text-sm w-28 text-right">
                      {fmt((s.cantidad || 0) * (s.precio_ref || 0))}
                    </span>
                    <button onClick={() => removeCustom(s.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <div className="bg-slate-900 rounded-lg px-5 py-3 flex items-center gap-4">
            <span className="text-slate-400 text-sm">Total Servicios:</span>
            <span className="text-blue-400 font-bold text-lg">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceRow({ label, activo, precio, cantidad, precioRef, unidad, onToggle, onUpdate }) {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        activo ? 'border-blue-500/40 bg-slate-900' : 'border-slate-700 bg-slate-900/40'
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-52 mt-0.5">
          <Toggle value={activo} onChange={onToggle} />
          <span className={`font-medium text-sm ${activo ? 'text-white' : 'text-slate-400'}`}>{label}</span>
        </div>
        {activo && (
          <div className="flex items-center gap-3 flex-wrap flex-1 justify-end">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs whitespace-nowrap">Cantidad</span>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input-field text-sm py-2 w-24 text-right"
                placeholder="0"
                value={cantidad || ''}
                onChange={(e) => onUpdate('cantidad', Number(e.target.value))}
              />
              <span className="text-slate-500 text-xs w-8">{unidad}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs whitespace-nowrap">Precio ref.</span>
              <input
                type="number"
                min="0"
                className="input-field text-sm py-2 w-28 text-right"
                value={precioRef || ''}
                onChange={(e) => onUpdate('precio_ref', Number(e.target.value))}
              />
              <span className="text-slate-500 text-xs w-8">/{unidad}</span>
            </div>
            <span className="text-blue-400 font-semibold text-sm w-28 text-right">
              {fmt(precio)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
