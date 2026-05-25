import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { suscribirCotizaciones, actualizarEstado, eliminarCotizacion, migrarCotizacionesPersonales, SHARED_DOMAIN } from '../firebase/firestore'
import CotizacionPrintView from '../components/cotizador/CotizacionPrintView'
import FichaCostosPrintView from '../components/cotizador/FichaCostosPrintView'
import { exportPDF } from '../utils/exportPDF'
import { getEmpresa } from '../utils/empresa'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const ESTADOS = ['Borrador', 'Enviada', 'En revisión', 'Aprobada', 'Rechazada', 'En producción', 'Entregada']

const STATUS_STYLE = {
  'Borrador':       'bg-slate-700/60 text-slate-300 border-slate-600',
  'Enviada':        'bg-blue-900/40 text-blue-300 border-blue-500/30',
  'En revisión':    'bg-yellow-900/40 text-yellow-300 border-yellow-500/30',
  'Aprobada':       'bg-green-900/40 text-green-400 border-green-500/30',
  'Rechazada':      'bg-red-900/40 text-red-400 border-red-500/30',
  'En producción':  'bg-purple-900/40 text-purple-300 border-purple-500/30',
  'Entregada':      'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
}

const DRAFT_KEY = 'cotizador_draft'

export default function Historial() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [error, setError]       = useState('')

  const isInstitutional = user?.email?.toLowerCase().endsWith(`@${SHARED_DOMAIN}`)

  const [preview, setPreview]         = useState(null) // { cot, tipo: 'cotizacion'|'ficha' }
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const previewRef = useRef(null)

  const handlePreview = (cot, tipo) => setPreview({ cot, tipo })
  const cerrarPreview = () => setPreview(null)

  const handleDescargarPDF = async () => {
    if (!preview) return
    setExportandoPDF(true)
    await exportPDF(
      'historial-preview-content',
      preview.tipo === 'cotizacion'
        ? `${preview.cot.numero || 'cotizacion'}.pdf`
        : `ficha-costos-${preview.cot.numero || 'interna'}.pdf`
    )
    setExportandoPDF(false)
  }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    let unsub = () => {}
    migrarCotizacionesPersonales(user.uid, user.email)
      .then(() => {
        unsub = suscribirCotizaciones(user.uid, user.email, (data) => {
          setCotizaciones(data)
          setLoading(false)
        })
      })
      .catch(() => {
        setError('No se pudieron cargar las cotizaciones.')
        setLoading(false)
      })
    return () => unsub()
  }, [user])

  const handleEstado = async (cotId, estado) => {
    try {
      await actualizarEstado(user.uid, cotId, estado, user.email)
      setCotizaciones((prev) => prev.map((c) => c.id === cotId ? { ...c, estado } : c))
    } catch { setError('Error al actualizar estado.') }
  }

  const handleEliminar = async (cotId) => {
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return
    try {
      await eliminarCotizacion(user.uid, cotId, user.email)
      setCotizaciones((prev) => prev.filter((c) => c.id !== cotId))
    } catch { setError('Error al eliminar.') }
  }

  const handleAbrir = (cot) => {
    const clienteObj = typeof cot.cliente === 'object' && cot.cliente !== null
      ? cot.cliente
      : { nombre: cot.cliente || '', rut: '', email: '', telefono: '' }

    const draft = {
      cotizacionId:    cot.id,
      numeroCot:       cot.numero || '',
      cliente:         clienteObj,
      estado:          cot.estado || 'Borrador',
      materiales:      cot.materiales      || [],
      roles:           cot.roles           || [],
      servicios:       cot.servicios       || {},
      bases:           cot.bases           || [],
      cantidadLotes:   cot.cantidadLotes   || 1,
      unidadesPorLote: cot.unidadesPorLote || 1,
      config:          cot.config          || {},
      embalaje:        cot.embalaje        || {},
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    navigate('/cotizador')
  }

  const handleDuplicar = (cot) => {
    const clienteRaw = cot.cliente
    const clienteObj = typeof clienteRaw === 'object' && clienteRaw !== null
      ? clienteRaw
      : { nombre: clienteRaw || '', rut: '', email: '', telefono: '' }

    const draft = {
      cliente:         clienteObj,
      materiales:      cot.materiales      || [],
      roles:           cot.roles           || [],
      servicios:       cot.servicios       || {},
      bases:           cot.bases           || [],
      cantidadLotes:   cot.cantidadLotes   || 1,
      unidadesPorLote: cot.unidadesPorLote || 1,
      config:          { ...(cot.config || {}), flete: 0 },
      embalaje:        cot.embalaje        || {},
      numeroCot:       '',
      estado:          'Borrador',
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    navigate('/cotizador')
  }

  const getNombreCliente = (c) => {
    if (typeof c.cliente === 'object' && c.cliente?.nombre) return c.cliente.nombre
    return c.cliente || '—'
  }

  const filtered = cotizaciones.filter((c) => {
    const nombre = getNombreCliente(c).toLowerCase()
    const s = search.toLowerCase()
    const matchSearch  = nombre.includes(s)
      || (c.numero || '').toLowerCase().includes(s)
      || (c.config?.numeroReferencia || '').toLowerCase().includes(s)
      || (c.config?.descripcion || '').toLowerCase().includes(s)
    const matchStatus  = statusFilter === 'Todos' || c.estado === statusFilter
    return matchSearch && matchStatus
  })

  const conteo = ESTADOS.reduce((acc, e) => {
    acc[e] = cotizaciones.filter(c => c.estado === e).length
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de cotizaciones</h1>
          <p className="text-slate-400 mt-1">{cotizaciones.length} cotizaciones en total</p>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="card">
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" className="input-field pl-9" placeholder="Buscar por cliente o número..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Chips de estado */}
        <div className="flex gap-2 flex-wrap mb-5">
          <button onClick={() => setStatusFilter('Todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === 'Todos' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            Todos ({cotizaciones.length})
          </button>
          {ESTADOS.map((s) => conteo[s] > 0 && (
            <button key={s} onClick={() => setStatusFilter(s === statusFilter ? 'Todos' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-500' : `${STATUS_STYLE[s] || 'bg-slate-700 text-slate-300 border-slate-600'} hover:opacity-80`}`}>
              {s} ({conteo[s]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando cotizaciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 rounded-l-lg">N°</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  {isInstitutional && <th className="text-left px-4 py-3">Creado por</th>}
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3 rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isInstitutional ? 7 : 6} className="text-center py-12 text-slate-500">
                      {cotizaciones.length === 0 ? 'Aún no tienes cotizaciones guardadas. Ve al Cotizador y guarda una.' : 'No se encontraron cotizaciones.'}
                    </td>
                  </tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-blue-400 font-mono font-medium">{c.numero}</p>
                      {c.config?.numeroReferencia && (
                        <p className="text-slate-500 text-xs mt-0.5">{c.config.numeroReferencia}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{getNombreCliente(c)}</p>
                      {c.config?.descripcion && (
                        <p className="text-slate-400 text-xs mt-0.5 max-w-xs truncate">{c.config.descripcion}</p>
                      )}
                      {!c.config?.descripcion && typeof c.cliente === 'object' && c.cliente?.rut && (
                        <p className="text-slate-500 text-xs">{c.cliente.rut}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.fecha}</td>
                    {isInstitutional && (
                      <td className="px-4 py-3 text-slate-400 text-xs">{c.creadoPor || '—'}</td>
                    )}
                    <td className="px-4 py-3 text-slate-200 text-right font-medium">
                      {fmt(c.totalFinal || c.costoTotal || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={c.estado || 'Borrador'}
                        onChange={(e) => handleEstado(c.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer appearance-none text-center ${STATUS_STYLE[c.estado] || STATUS_STYLE['Borrador']}`}
                      >
                        {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handlePreview(c, 'cotizacion')}
                          className="text-slate-400 hover:text-blue-400 transition-colors" title="Ver cotización">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => handlePreview(c, 'ficha')}
                          className="text-slate-400 hover:text-amber-400 transition-colors" title="Ver ficha de costos interna">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button onClick={() => handleAbrir(c)}
                          className="text-slate-400 hover:text-green-400 transition-colors" title="Abrir y editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDuplicar(c)}
                          className="text-slate-400 hover:text-blue-400 transition-colors" title="Duplicar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button onClick={() => handleEliminar(c.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal de preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm">
                {preview.tipo === 'cotizacion' ? 'Cotización' : 'Ficha de Costos Interna'}
                {' — '}
                <span className="text-blue-400 font-mono">{preview.cot.numero}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDescargarPDF}
                disabled={exportandoPDF}
                className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
              >
                {exportandoPDF ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Descargar PDF</>
                )}
              </button>
              <button onClick={cerrarPreview} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center" ref={previewRef}>
            <div id="historial-preview-content" className="w-full max-w-4xl">
              {preview.tipo === 'cotizacion' ? (
                <CotizacionPrintView empresa={preview.cot.empresa || getEmpresa()} cot={preview.cot} />
              ) : (
                <FichaCostosPrintView empresa={preview.cot.empresa || getEmpresa()} cot={preview.cot} />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
