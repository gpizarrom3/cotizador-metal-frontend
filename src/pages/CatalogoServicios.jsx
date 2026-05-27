import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import {
  guardarItemCatalogoServicios,
  obtenerCatalogoServicios,
  actualizarItemCatalogoServicios,
  eliminarItemCatalogoServicios,
} from '../firebase/firestore'
import ConfirmModal from '../components/ui/ConfirmModal'

const fmt = (n) =>
  (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const EMPTY_FORM = { nombre: '', descripcion: '', unidad: '', precio_unitario: '' }

export default function CatalogoServicios() {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editando, setEditando]     = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })

  useEffect(() => {
    if (!user) return
    obtenerCatalogoServicios(user.uid, user.email)
      .then(setItems)
      .catch(() => setError('No se pudo cargar el catálogo de servicios.'))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = items.filter(
    (i) =>
      i.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      i.descripcion?.toLowerCase().includes(search.toLowerCase())
  )

  const abrirNuevo  = () => { setEditando(null); setForm(EMPTY_FORM); setShowModal(true) }
  const abrirEditar = (i) => {
    setEditando(i.id)
    setForm({
      nombre: i.nombre || '',
      descripcion: i.descripcion || '',
      unidad: i.unidad || '',
      precio_unitario: i.precio_unitario || '',
    })
    setShowModal(true)
  }
  const cerrarModal = () => { setShowModal(false); setEditando(null); setForm(EMPTY_FORM) }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const datos = { ...form, precio_unitario: Number(form.precio_unitario) || 0 }
      if (editando) {
        await actualizarItemCatalogoServicios(user.uid, editando, datos, user.email)
        setItems((prev) => prev.map((i) => i.id === editando ? { ...i, ...datos } : i))
      } else {
        const id = await guardarItemCatalogoServicios(user.uid, datos, user.email)
        setItems((prev) =>
          [...prev, { id, ...datos }].sort((a, b) => a.nombre.localeCompare(b.nombre))
        )
      }
      cerrarModal()
    } catch {
      setError('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar   = (id) => setConfirmDelete({ open: true, id })
  const ejecutarEliminar = async () => {
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await eliminarItemCatalogoServicios(user.uid, id, user.email)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo de servicios</h1>
          <p className="text-slate-400 mt-1">{items.length} servicios guardados</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary">+ Nuevo servicio</button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="card">
        <div className="mb-5">
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input-field pl-9 max-w-sm"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando catálogo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 rounded-l-lg">Servicio</th>
                  <th className="text-left px-4 py-3">Descripción</th>
                  <th className="text-left px-4 py-3">Unidad</th>
                  <th className="text-right px-4 py-3">Precio ref.</th>
                  <th className="text-center px-4 py-3 rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">
                      {items.length === 0
                        ? 'Aún no hay servicios guardados. Agrega uno para usarlo en el cotizador.'
                        : 'No se encontraron servicios.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((i) => (
                    <tr key={i.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">{i.nombre}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{i.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{i.unidad || '—'}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editando ? 'Editar servicio' : 'Nuevo servicio'}
              </h2>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Servicio de arenado"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Arenado superficial para estructuras metálicas"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unidad</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="m2, hora, kg, ml..."
                    value={form.unidad}
                    onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Precio ref. (CLP)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    value={form.precio_unitario}
                    onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={cerrarModal} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={handleGuardar}
                  className="btn-primary flex-1"
                  disabled={saving || !form.nombre.trim()}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Eliminar servicio"
        message="Este servicio será eliminado del catálogo permanentemente."
        onConfirm={ejecutarEliminar}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </DashboardLayout>
  )
}
