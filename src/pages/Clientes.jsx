import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { guardarCliente, obtenerClientes, actualizarCliente, eliminarCliente, obtenerCotizaciones } from '../firebase/firestore'
import ConfirmModal from '../components/ui/ConfirmModal'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const EMPTY_FORM = { nombre: '', rut: '', email: '', telefono: '' }

export default function Clientes() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [cotStats, setCotStats]   = useState({})

  useEffect(() => {
    if (!user) return
    obtenerClientes(user.uid, user.email)
      .then(setClientes)
      .catch(() => setError('No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    obtenerCotizaciones(user.uid, user.email).then((cots) => {
      const stats = {}
      cots.forEach((c) => {
        const nombre = (typeof c.cliente === 'object' ? c.cliente?.nombre : c.cliente) || ''
        if (!nombre) return
        if (!stats[nombre]) stats[nombre] = { count: 0, total: 0 }
        stats[nombre].count++
        stats[nombre].total += Number(c.totalFinal ?? c.costoTotal) || 0
      })
      setCotStats(stats)
    }).catch(() => {})
  }, [user])

  const filtered = clientes.filter((c) =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.rut?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const abrirNuevo = () => {
    setEditando(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const abrirEditar = (c) => {
    setEditando(c.id)
    setForm({ nombre: c.nombre || '', rut: c.rut || '', email: c.email || '', telefono: c.telefono || '' })
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setEditando(null)
    setForm(EMPTY_FORM)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      if (editando) {
        await actualizarCliente(user.uid, editando, form, user.email)
        setClientes((prev) => prev.map((c) => c.id === editando ? { ...c, ...form } : c))
      } else {
        const id = await guardarCliente(user.uid, form, user.email)
        setClientes((prev) => [{ id, ...form }, ...prev].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }
      cerrarModal()
    } catch {
      setError('Error al guardar el cliente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = (id) => setConfirmDelete({ open: true, id })

  const ejecutarEliminar = async () => {
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await eliminarCliente(user.uid, id, user.email)
      setClientes((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Error al eliminar el cliente.')
    }
  }

  const verCotizaciones = (nombre) => {
    navigate('/historial', { state: { search: nombre } })
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 mt-1">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary">+ Nuevo cliente</button>
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
              placeholder="Buscar por nombre, RUT o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando clientes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 rounded-l-lg">Cliente</th>
                  <th className="text-left px-4 py-3">RUT</th>
                  <th className="text-left px-4 py-3">Contacto</th>
                  <th className="text-right px-4 py-3">Cotizaciones</th>
                  <th className="text-center px-4 py-3 rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">
                      {clientes.length === 0 ? 'Aún no hay clientes registrados.' : 'No se encontraron clientes.'}
                    </td>
                  </tr>
                ) : filtered.map((c) => {
                  const stats = cotStats[c.nombre] || { count: 0, total: 0 }
                  return (
                    <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {c.nombre?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="text-slate-200 font-medium">{c.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.rut || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300 text-xs">{c.email || '—'}</p>
                        <p className="text-slate-500 text-xs">{c.telefono || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {stats.count > 0 ? (
                          <div>
                            <p className="text-slate-200 font-medium">{stats.count} cot.</p>
                            <p className="text-slate-500 text-xs">{fmt(stats.total)}</p>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">Sin cotizaciones</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {stats.count > 0 && (
                            <button onClick={() => verCotizaciones(c.nombre)}
                              className="text-slate-400 hover:text-blue-400 transition-colors" title="Ver cotizaciones">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => abrirEditar(c)} className="text-slate-400 hover:text-yellow-400 transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleEliminar(c.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre / Razón social *</label>
                <input type="text" className="input-field" placeholder="Ej: Aceros del Norte S.A."
                  value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className="label">RUT</label>
                <input type="text" className="input-field" placeholder="76.123.456-7"
                  value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="contacto@empresa.cl"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="text" className="input-field" placeholder="+56 9 1234 5678"
                  value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={cerrarModal} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleGuardar} className="btn-primary flex-1" disabled={saving || !form.nombre.trim()}>
                  {saving ? 'Guardando...' : 'Guardar cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Eliminar cliente"
        message="Esta acción no se puede deshacer."
        onConfirm={ejecutarEliminar}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </DashboardLayout>
  )
}
