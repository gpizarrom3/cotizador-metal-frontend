import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { obtenerCatalogoServicios, guardarItemCatalogoServicios, eliminarItemCatalogoServicios } from '../../firebase/firestore'
import ConfirmModal from '../ui/ConfirmModal'

const EMPTY_NUEVO = { nombre: '', descripcion: '', unidad: '', cantidad: 1, precio_ref: '' }

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function TabServicios({ servicios, setServicios }) {
  const { user } = useAuth()
  const [catalogoCat, setCatalogoCat]     = useState([])
  const [catSearch, setCatSearch]         = useState('')
  const [showNuevo, setShowNuevo]         = useState(false)
  const [nuevoForm, setNuevoForm]         = useState(EMPTY_NUEVO)
  const [guardarEnCat, setGuardarEnCat]   = useState(true)
  const [savingNuevo, setSavingNuevo]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })

  useEffect(() => {
    if (!user) return
    obtenerCatalogoServicios(user.uid, user.email).then(setCatalogoCat).catch(() => {})
  }, [user])

  const customItems = servicios.custom || []

  // ── Desde catálogo ───────────────────────────────────────────────────────────
  const agregarDesdeCatalogo = (item) => {
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

  // ── Nuevo servicio manual ────────────────────────────────────────────────────
  const abrirNuevo = () => { setNuevoForm(EMPTY_NUEVO); setGuardarEnCat(true); setShowNuevo(true) }
  const cerrarNuevo = () => setShowNuevo(false)

  const handleAgregarNuevo = async () => {
    if (!nuevoForm.nombre.trim()) return
    setSavingNuevo(true)
    try {
      const nuevo = {
        id: Date.now() + Math.random(),
        nombre: nuevoForm.nombre.trim(),
        descripcion: nuevoForm.descripcion.trim(),
        unidad: nuevoForm.unidad.trim(),
        cantidad: Number(nuevoForm.cantidad) || 1,
        precio_ref: Number(nuevoForm.precio_ref) || 0,
      }
      setServicios({ ...servicios, custom: [...customItems, nuevo] })
      if (guardarEnCat && user) {
        const datos = {
          nombre: nuevo.nombre,
          descripcion: nuevo.descripcion,
          unidad: nuevo.unidad,
          precio_unitario: nuevo.precio_ref,
        }
        const id = await guardarItemCatalogoServicios(user.uid, datos, user.email)
        setCatalogoCat((prev) =>
          [...prev, { id, ...datos }].sort((a, b) => a.nombre.localeCompare(b.nombre))
        )
      }
      cerrarNuevo()
    } finally {
      setSavingNuevo(false)
    }
  }

  // ── Eliminar del catálogo ────────────────────────────────────────────────────
  const ejecutarEliminarCat = async () => {
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await eliminarItemCatalogoServicios(user.uid, id, user.email)
      setCatalogoCat((prev) => prev.filter((i) => i.id !== id))
    } catch { /* silent */ }
  }

  const total = customItems.reduce((acc, s) => acc + (Number(s.cantidad) * Number(s.precio_ref) || 0), 0)

  const catalogFiltrado = catalogoCat.filter((i) =>
    i.nombre?.toLowerCase().includes(catSearch.toLowerCase()) ||
    i.descripcion?.toLowerCase().includes(catSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">

      {/* ── Catálogo de servicios ─────────────────────────────────────────────── */}
      <div className="card border-teal-500/30 bg-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600/30 border border-teal-500/30 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-teal-400">Catálogo de servicios</h3>
            {catalogoCat.length > 0 && (
              <span className="text-xs text-slate-500">({catalogoCat.length})</span>
            )}
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-400/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo servicio
          </button>
        </div>

        {catalogoCat.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-900/30 border border-teal-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Catálogo vacío</p>
              <p className="text-slate-600 text-xs mt-1">Usa <strong className="text-teal-500">Nuevo servicio</strong> para agregar y guardar servicios reutilizables</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              className="input-field"
              placeholder="Filtrar servicios..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {catalogFiltrado.length === 0 ? (
                <p className="col-span-3 text-center text-slate-500 text-sm py-4">Sin resultados</p>
              ) : (
                catalogFiltrado.map((i) => (
                  <div key={i.id} className="group relative bg-slate-950 border border-slate-600 hover:border-teal-500/50 rounded-lg p-3 transition-colors">
                    <button onClick={() => agregarDesdeCatalogo(i)} className="text-left w-full pr-6">
                      <p className="text-white font-medium text-sm leading-tight">{i.nombre}</p>
                      {i.descripcion && <p className="text-slate-400 text-xs mt-0.5 leading-tight">{i.descripcion}</p>}
                      <p className="text-teal-400 font-semibold text-xs mt-1.5">
                        {fmt(i.precio_unitario)}{i.unidad ? ` / ${i.unidad}` : ''}
                      </p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, id: i.id }) }}
                      className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar del catálogo"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Servicios en esta cotización ─────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Servicios en esta cotización</h2>
          {customItems.length > 0 && (
            <span className="text-xs text-slate-500">{customItems.length} ítem{customItems.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {customItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Sin servicios agregados. Selecciona desde el catálogo o crea uno nuevo.
          </div>
        ) : (
          <div className="space-y-3">
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
                      <div>
                        <span className="text-slate-400 text-xs whitespace-nowrap">Precio ref.</span>
                        <p className="text-[10px] text-slate-600 leading-none mt-0.5">decimal: punto (.)</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        className="input-field text-sm py-2 w-28 text-right"
                        placeholder="Ej: 1500.50"
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

                {/* Peso que agrega el servicio */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => updateCustom(s.id, 'agregaPeso', !s.agregaPeso)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      s.agregaPeso
                        ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-400'
                        : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Agrega peso a la pieza
                  </button>
                  {s.agregaPeso && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="input-field text-xs py-1 w-28 text-right"
                        placeholder="0"
                        value={s.pesoKg || ''}
                        onChange={(e) => updateCustom(s.id, 'pesoKg', Number(e.target.value))}
                      />
                      <span className="text-slate-500 text-xs whitespace-nowrap">kg total</span>
                      {Number(s.pesoKg) > 0 && (
                        <span className="text-emerald-400 text-xs font-medium">
                          +{Number(s.pesoKg).toFixed(2)} kg
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-1">
              <div className="bg-slate-900 rounded-lg px-5 py-3 flex items-center gap-4">
                <span className="text-slate-400 text-sm">Total Servicios:</span>
                <span className="text-teal-400 font-bold text-lg">{fmt(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal nuevo servicio ──────────────────────────────────────────────── */}
      {showNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Nuevo servicio</h2>
              <button onClick={cerrarNuevo} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input type="text" className="input-field" placeholder="Ej: Servicio de arenado"
                  value={nuevoForm.nombre} onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <input type="text" className="input-field" placeholder="Ej: Arenado superficial para estructuras"
                  value={nuevoForm.descripcion} onChange={(e) => setNuevoForm({ ...nuevoForm, descripcion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unidad</label>
                  <input type="text" className="input-field" placeholder="m², hora, kg..."
                    value={nuevoForm.unidad} onChange={(e) => setNuevoForm({ ...nuevoForm, unidad: e.target.value })} />
                </div>
                <div>
                  <label className="label">Precio ref. (CLP)</label>
                  <input type="number" min="0" className="input-field" placeholder="Ej: 1500.50"
                    value={nuevoForm.precio_ref} onChange={(e) => setNuevoForm({ ...nuevoForm, precio_ref: e.target.value })} />
                  <p className="text-[11px] text-slate-600 mt-1">Punto (.) para decimales</p>
                </div>
              </div>
              <div>
                <label className="label">Cantidad</label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="1"
                  value={nuevoForm.cantidad} onChange={(e) => setNuevoForm({ ...nuevoForm, cantidad: e.target.value })} />
              </div>

              <button
                onClick={() => setGuardarEnCat(v => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                  guardarEnCat ? 'border-teal-500/40 bg-teal-900/20' : 'border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                  guardarEnCat ? 'bg-teal-500 border-teal-500' : 'border-slate-600 bg-transparent'
                }`}>
                  {guardarEnCat && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${guardarEnCat ? 'text-teal-300' : 'text-slate-400'}`}>
                    Guardar en Cat. Servicios
                  </p>
                  <p className="text-slate-500 text-xs">Quedará disponible para futuras cotizaciones</p>
                </div>
              </button>

              <div className="flex gap-3 pt-1">
                <button onClick={cerrarNuevo} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={handleAgregarNuevo}
                  className="btn-primary flex-1"
                  disabled={savingNuevo || !nuevoForm.nombre.trim()}
                >
                  {savingNuevo ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Eliminar servicio del catálogo"
        message="Este servicio será eliminado del catálogo permanentemente. Las cotizaciones existentes no se verán afectadas."
        onConfirm={ejecutarEliminarCat}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  )
}
