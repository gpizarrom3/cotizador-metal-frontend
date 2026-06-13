import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'
import { guardarItemCatalogo, obtenerCatalogo, actualizarItemCatalogo, eliminarItemCatalogo, importarCatalogoBase } from '../firebase/firestore'
import { CATALOGO_BASE } from '../data/catalogoBase'
import ConfirmModal from '../components/ui/ConfirmModal'

const FREE_LIMIT = 2

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const EMPTY_FORM = { nombre: '', proveedor: '', formato: '', precio_unitario: '', unidad: '', tipo: '', peso_por_metro: '' }

const TIPOS_MATERIAL = [
  { value: '',        label: 'Sin especificar' },
  { value: 'plancha', label: 'Plancha / Lámina' },
  { value: 'barra',   label: 'Barra' },
  { value: 'tubo',    label: 'Tubo' },
  { value: 'perfil',  label: 'Perfil (L / C / T)' },
  { value: 'viga',    label: 'Viga (I / H)' },
]

const TIPO_BADGE = {
  plancha: { label: 'Plancha',  cls: 'bg-slate-700 text-slate-300' },
  barra:   { label: 'Barra',    cls: 'bg-blue-900/60 text-blue-300' },
  tubo:    { label: 'Tubo',     cls: 'bg-cyan-900/60 text-cyan-300' },
  perfil:  { label: 'Perfil',   cls: 'bg-amber-900/60 text-amber-300' },
  viga:    { label: 'Viga',     cls: 'bg-orange-900/60 text-orange-300' },
}

export default function Catalogo() {
  const { user } = useAuth()
  const { isPro } = usePlan()
  const navigate = useNavigate()
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [importando, setImportando] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)

  useEffect(() => {
    if (!user) return
    obtenerCatalogo(user.uid)
      .then(setItems)
      .catch(() => setError('No se pudo cargar el catálogo.'))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = items.filter((i) =>
    i.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    i.proveedor?.toLowerCase().includes(search.toLowerCase())
  )

  const visibleItems = isPro ? filtered : filtered.slice(0, FREE_LIMIT)
  const lockedItems  = isPro ? [] : filtered.slice(FREE_LIMIT)

  const abrirNuevo = () => { setEditando(null); setForm(EMPTY_FORM); setShowModal(true) }
  const abrirEditar = (i) => {
    setEditando(i.id)
    setForm({ nombre: i.nombre || '', proveedor: i.proveedor || '', formato: i.formato || '', precio_unitario: i.precio_unitario || '', unidad: i.unidad || '', tipo: i.tipo || '', peso_por_metro: i.peso_por_metro || '' })
    setShowModal(true)
  }
  const cerrarModal = () => { setShowModal(false); setEditando(null); setForm(EMPTY_FORM) }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const datos = {
        ...form,
        precio_unitario: Number(form.precio_unitario) || 0,
        peso_por_metro: form.tipo === 'plancha' ? 0 : (Number(form.peso_por_metro) || 0),
      }
      if (editando) {
        await actualizarItemCatalogo(user.uid, editando, datos)
        setItems((prev) => prev.map((i) => i.id === editando ? { ...i, ...datos } : i))
      } else {
        const id = await guardarItemCatalogo(user.uid, datos)
        setItems((prev) => [...prev, { id, ...datos }].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }
      cerrarModal()
    } catch {
      setError('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleImportarBase = async () => {
    setConfirmImport(false)
    setImportando(true)
    try {
      const existentes = new Set(items.map((i) => i.nombre))
      const agregados = await importarCatalogoBase(user.uid, CATALOGO_BASE, existentes)
      const actualizados = await obtenerCatalogo(user.uid)
      setItems(actualizados)
      if (agregados === 0) setError('Todos los materiales del catálogo base ya existen.')
    } catch {
      setError('Error al importar el catálogo base.')
    } finally {
      setImportando(false)
    }
  }

  const handleEliminar = (id) => setConfirmDelete({ open: true, id })

  const ejecutarEliminar = async () => {
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await eliminarItemCatalogo(user.uid, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo de materiales</h1>
          <p className="text-slate-400 mt-1">{items.length} materiales guardados</p>
        </div>
        <div className="flex items-center gap-3">
          {isPro && (
            <button
              onClick={() => setConfirmImport(true)}
              disabled={importando}
              className="btn-secondary flex items-center gap-2"
            >
              {importando ? (
                <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Importando...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>Cargar catálogo base</>
              )}
            </button>
          )}
          {isPro || items.length < FREE_LIMIT ? (
            <button onClick={abrirNuevo} className="btn-primary">+ Nuevo material</button>
          ) : (
            <button onClick={() => navigate('/planes')} className="btn-primary flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              + Nuevo material
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      <div className="card">
        <div className="mb-5">
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" className="input-field pl-9 max-w-sm" placeholder="Buscar por nombre o proveedor..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando catálogo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 rounded-l-lg">Material</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Proveedor</th>
                  <th className="text-left px-4 py-3">Formato</th>
                  <th className="text-left px-4 py-3">Unidad</th>
                  <th className="text-right px-4 py-3">kg/m lineal</th>
                  <th className="text-right px-4 py-3">Precio ref.</th>
                  <th className="text-center px-4 py-3 rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      {items.length === 0
                        ? 'Aún no hay materiales en el catálogo. Agrega uno para usarlo en el cotizador.'
                        : 'No se encontraron materiales.'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {visibleItems.map((i) => (
                      <tr key={i.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-200 font-medium">{i.nombre}</td>
                        <td className="px-4 py-3">
                          {i.tipo && TIPO_BADGE[i.tipo]
                            ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_BADGE[i.tipo].cls}`}>{TIPO_BADGE[i.tipo].label}</span>
                            : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{i.proveedor || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{i.formato || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{i.unidad || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {i.peso_por_metro > 0
                            ? <span className="text-emerald-400 font-medium text-sm">{i.peso_por_metro} kg/m</span>
                            : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-200 text-right font-medium">{fmt(i.precio_unitario)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => abrirEditar(i)} className="text-slate-400 hover:text-yellow-400 transition-colors" title="Editar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleEliminar(i.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {lockedItems.length > 0 && (
                      <>
                        {lockedItems.map((i) => (
                          <tr key={i.id} className="border-b border-slate-700/30 opacity-40 select-none">
                            <td className="px-4 py-3 text-slate-400 font-medium blur-[3px]">{i.nombre}</td>
                            <td className="px-4 py-3 blur-[3px]"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-500">—</span></td>
                            <td className="px-4 py-3 text-slate-500 text-xs blur-[3px]">———</td>
                            <td className="px-4 py-3 text-slate-500 text-xs blur-[3px]">———</td>
                            <td className="px-4 py-3 text-slate-500 text-xs blur-[3px]">—</td>
                            <td className="px-4 py-3 text-right blur-[3px]"><span className="text-slate-600">—</span></td>
                            <td className="px-4 py-3 text-slate-500 text-right blur-[3px]">$———</td>
                            <td className="px-4 py-3 text-center">
                              <svg className="w-4 h-4 text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={8} className="px-4 py-4">
                            <div className="flex items-center justify-between bg-blue-950/40 border border-blue-500/30 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <p className="text-sm text-slate-300">
                                  <span className="font-semibold text-white">{lockedItems.length} {lockedItems.length === 1 ? 'material bloqueado' : 'materiales bloqueados'}</span>
                                  {' '}— actualiza a Pro para acceder a todo tu catálogo.
                                </p>
                              </div>
                              <button
                                onClick={() => navigate('/planes')}
                                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-4"
                              >
                                Ver planes
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editando ? 'Editar material' : 'Nuevo material'}</h2>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input type="text" className="input-field" placeholder="Ej: Acero A36 plancha"
                  value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className="label">Tipo de material</label>
                <select
                  className="input-field"
                  value={form.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value
                    setForm({ ...form, tipo, ...(tipo === 'plancha' ? { peso_por_metro: '' } : {}) })
                  }}
                >
                  {TIPOS_MATERIAL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Proveedor</label>
                <input type="text" className="input-field" placeholder="Ej: Aceros Santiago"
                  value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Formato</label>
                  <input type="text" className="input-field" placeholder="Ej: 2000×1000mm"
                    value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value })} />
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <input type="text" className="input-field" placeholder="kg, unidad, metro"
                    value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />
                </div>
              </div>
              <div className={form.tipo !== 'plancha' ? 'grid grid-cols-2 gap-3' : ''}>
                <div>
                  <label className="label">Precio referencial (CLP)</label>
                  <input type="number" min="0" className="input-field" placeholder="Ej: 1500.50"
                    value={form.precio_unitario} onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })} />
                </div>
                {form.tipo !== 'plancha' && (
                  <div>
                    <label className="label">Peso lineal (kg/m) <span className="text-slate-600 font-normal">opcional</span></label>
                    <input type="number" min="0" step="0.001" className="input-field" placeholder="Ej: 3.56"
                      value={form.peso_por_metro} onChange={(e) => setForm({ ...form, peso_por_metro: e.target.value })} />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-600 -mt-1">
                Punto <strong className="text-slate-500">(·)</strong> para decimales,
                sin separador de miles — ej: <span className="text-slate-500">1500.50</span> o <span className="text-slate-500">3.56</span>
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={cerrarModal} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleGuardar} className="btn-primary flex-1" disabled={saving || !form.nombre.trim()}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Eliminar material"
        message="Este material será eliminado del catálogo permanentemente."
        onConfirm={ejecutarEliminar}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />

      <ConfirmModal
        open={confirmImport}
        title="Cargar catálogo base"
        message={`Se agregarán hasta ${CATALOGO_BASE.length} materiales (vigas, perfiles, tubos, barras, planchas). Los que ya existan en tu catálogo no se duplicarán.`}
        onConfirm={handleImportarBase}
        onCancel={() => setConfirmImport(false)}
      />
    </DashboardLayout>
  )
}
