import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { suscribirCotizaciones, actualizarEstado, eliminarCotizacion, migrarCotizacionesPersonales, suscribirPresencias, SHARED_DOMAIN } from '../firebase/firestore'
import CotizacionPrintView from '../components/cotizador/CotizacionPrintView'
import FichaCostosPrintView from '../components/cotizador/FichaCostosPrintView'
import ConfirmModal from '../components/ui/ConfirmModal'
import AdjuntarFichaModal from '../components/historial/AdjuntarFichaModal'
import { exportPDF } from '../utils/exportPDF'
import { useUserData } from '../contexts/UserDataContext'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const ESTADOS = ['Pendiente', 'Aprobada', 'Entregada']

const STATUS_STYLE = {
  'Pendiente':  'bg-slate-700/60 text-slate-300 border-slate-600',
  'Aprobada':   'bg-green-900/40 text-green-400 border-green-500/30',
  'Entregada':  'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
}

const DRAFT_KEY = 'cotizador_draft'

export default function Historial() {
  const { user }   = useAuth()
  const { empresa } = useUserData()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState(() => location.state?.search || '')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [error, setError]       = useState('')
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [fichaModal, setFichaModal] = useState(null)
  const [presencias, setPresencias] = useState({})
  const [sortBy, setSortBy] = useState('fecha_desc')
  const [pagina, setPagina] = useState(1)

  const isInstitutional = user?.email?.toLowerCase().endsWith(`@${SHARED_DOMAIN}`)

  const [preview, setPreview]         = useState(null)
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
        unsub = suscribirCotizaciones(
          user.uid,
          user.email,
          (data) => {
            setCotizaciones(data)
            setLoading(false)
          },
          () => {
            // Error de permisos Firestore: mostrar lista vacía sin romper la app
            setLoading(false)
          }
        )
      })
      .catch(() => {
        setError('No se pudieron cargar las cotizaciones.')
        setLoading(false)
      })
    return () => unsub()
  }, [user])

  useEffect(() => {
    if (!isInstitutional) return
    return suscribirPresencias(setPresencias)
  }, [isInstitutional])

  useEffect(() => { setPagina(1) }, [search, statusFilter, fechaDesde, fechaHasta, sortBy])

  const handleEstado = async (cotId, estado) => {
    try {
      await actualizarEstado(user.uid, cotId, estado, user.email)
      setCotizaciones((prev) => prev.map((c) => c.id === cotId ? { ...c, estado } : c))
    } catch { setError('Error al actualizar estado.') }
  }

  const handleEliminar = (cotId) => setConfirmDelete({ open: true, id: cotId })

  const ejecutarEliminar = async () => {
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await eliminarCotizacion(user.uid, id, user.email)
      setCotizaciones((prev) => prev.filter((c) => c.id !== id))
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
      estado:          cot.estado || 'Pendiente',
      materiales:      cot.materiales      || [],
      roles:           cot.roles           || [],
      servicios:       cot.servicios       || {},
      bases:           cot.bases           || [],
      cantidadLotes:   cot.cantidadLotes   || 1,
      unidadesPorLote: cot.unidadesPorLote || 1,
      config:          cot.config          || {},
      embalaje:        cot.embalaje        || {},
    }
    localStorage.setItem('cotizador_original', JSON.stringify(cot))
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
      conMaterial:     cot.conMaterial     ?? null,
      consumibles:     cot.consumibles     || [],
      numeroCot:       '',
      estado:          'Pendiente',
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    navigate('/cotizador')
  }

  const handleArchivosUpdate = (cotId, archivos) => {
    setCotizaciones((prev) => prev.map((c) => c.id === cotId ? { ...c, fichasTecnicas: archivos } : c))
    setFichaModal((prev) => prev ? { ...prev, fichasTecnicas: archivos } : null)
  }

  const getNombreCliente = (c) => {
    if (typeof c.cliente === 'object' && c.cliente !== null) return c.cliente.nombre || '—'
    return (typeof c.cliente === 'string' ? c.cliente : '') || '—'
  }

  const limpiarFiltros = () => {
    setSearch('')
    setStatusFilter('Todos')
    setFechaDesde('')
    setFechaHasta('')
    setPagina(1)
  }

  const desde = fechaDesde ? new Date(fechaDesde + 'T00:00:00') : null
  const hasta = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null
  const hayFiltros = search || statusFilter !== 'Todos' || fechaDesde || fechaHasta

  const filtered = cotizaciones.filter((c) => {
    const nombre = getNombreCliente(c).toLowerCase()
    const s = search.toLowerCase()
    const matchSearch = nombre.includes(s)
      || (c.numero || '').toLowerCase().includes(s)
      || (c.config?.numeroReferencia || '').toLowerCase().includes(s)
      || (c.config?.descripcion || '').toLowerCase().includes(s)
    const matchStatus = statusFilter === 'Todos' || normEstado(c.estado) === statusFilter
    const matchDesde = !desde || (c.fechaDate && c.fechaDate >= desde)
    const matchHasta = !hasta || (c.fechaDate && c.fechaDate <= hasta)
    return matchSearch && matchStatus && matchDesde && matchHasta
  })

  const sorted = [...filtered].sort((a, b) => {
    const ta = a.totalFinal || a.costoTotal || 0
    const tb = b.totalFinal || b.costoTotal || 0
    const fa = a.fechaDate || 0
    const fb = b.fechaDate || 0
    if (sortBy === 'fecha_asc')   return fa - fb
    if (sortBy === 'fecha_desc')  return fb - fa
    if (sortBy === 'precio_desc') return tb - ta
    if (sortBy === 'precio_asc')  return ta - tb
    return 0
  })

  const POR_PAGINA = 20
  const totalPaginas = Math.max(1, Math.ceil(sorted.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginados = sorted.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const normEstado = (e) => ESTADOS.includes(e) ? e : 'Pendiente'

  const conteo = ESTADOS.reduce((acc, e) => {
    acc[e] = cotizaciones.filter(c => normEstado(c.estado) === e).length
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
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" className="input-field pl-9" placeholder="Buscar por cliente, número, referencia..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <label className="text-slate-400 text-xs whitespace-nowrap">Desde</label>
                <input type="date" className="input-field text-sm py-2 w-32" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-slate-400 text-xs whitespace-nowrap">Hasta</label>
                <input type="date" className="input-field text-sm py-2 w-32" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
              </div>
              {hayFiltros && (
                <button onClick={limpiarFiltros} className="text-slate-400 hover:text-slate-200 text-xs border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 py-2 transition-colors whitespace-nowrap">
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Chips de estado + ordenamiento */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap items-center">
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
            <div className="flex items-center gap-2">
              {filtered.length !== cotizaciones.length && (
                <span className="text-slate-500 text-xs">
                  {filtered.length} de {cotizaciones.length}
                </span>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-xs py-1.5 pr-7 pl-2.5 w-auto"
              >
                <option value="fecha_desc">Fecha: más reciente</option>
                <option value="fecha_asc">Fecha: más antigua</option>
                <option value="precio_desc">Precio: mayor primero</option>
                <option value="precio_asc">Precio: menor primero</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando cotizaciones...</p>
          </div>
        ) : (
          <>
          {/* ── Vista móvil: tarjetas ── */}
          <div className="md:hidden space-y-3">
            {sorted.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">
                {cotizaciones.length === 0 ? 'Sin cotizaciones guardadas.' : 'Sin resultados con estos filtros.'}
              </p>
            ) : paginados.map((c) => (
              <div key={c.id} className="bg-stone-800/60 border border-stone-700 rounded-xl p-4">
                {/* N° + Estado */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-amber-500 font-mono font-semibold text-sm">{c.numero}</span>
                    {c.config?.numeroReferencia && (
                      <span className="text-slate-500 text-xs ml-2">{c.config.numeroReferencia}</span>
                    )}
                    {(() => {
                      const editandoArr = (presencias[c.id] || []).filter(p => p.uid !== user?.uid)
                      return editandoArr.length > 0 ? (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                          <span className="text-amber-400 text-xs">{editandoArr.map(p => p.nombre).join(', ')}</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                  <select
                    value={c.estado || 'Pendiente'}
                    onChange={(e) => handleEstado(c.id, e.target.value)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer appearance-none text-center ${STATUS_STYLE[c.estado] || STATUS_STYLE['Pendiente']}`}
                  >
                    {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Cliente */}
                <p className="text-slate-100 font-medium text-sm">{getNombreCliente(c)}</p>
                {c.config?.descripcion && (
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{c.config.descripcion}</p>
                )}
                {isInstitutional && c.creadoPor && (
                  <p className="text-slate-500 text-xs mt-0.5">Por: {c.creadoPor}</p>
                )}
                {/* Fecha + Total */}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-slate-500 text-xs">{c.fecha}</span>
                  <span className="text-slate-100 font-semibold text-sm">{fmt(c.totalFinal || c.costoTotal || 0)}</span>
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-stone-700 flex-wrap">
                  <button onClick={() => handlePreview(c, 'cotizacion')}
                    className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-stone-800" title="Ver cotización">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Ver
                  </button>
                  <button onClick={() => handleAbrir(c)}
                    className="flex items-center gap-1 text-slate-400 hover:text-green-400 transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-stone-800" title="Editar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar
                  </button>
                  <button onClick={() => handleDuplicar(c)}
                    className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-stone-800" title="Duplicar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Duplicar
                  </button>
                  <button onClick={() => setFichaModal(c)}
                    className="relative flex items-center gap-1 text-slate-400 hover:text-violet-400 transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-stone-800" title="Fichas técnicas">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    {(c.fichasTecnicas?.length > 0) && (
                      <span className="ml-0.5 w-4 h-4 bg-violet-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                        {c.fichasTecnicas.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => handleEliminar(c.id)}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-stone-800 ml-auto" title="Eliminar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Vista desktop: tabla ── */}
          <div className="hidden md:block overflow-x-auto">
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
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={isInstitutional ? 7 : 6} className="text-center py-12 text-slate-500">
                      {cotizaciones.length === 0
                        ? 'Aún no tienes cotizaciones guardadas. Ve al Cotizador y guarda una.'
                        : 'No se encontraron cotizaciones con esos filtros.'}
                    </td>
                  </tr>
                ) : paginados.map((c) => (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-blue-400 font-mono font-medium">{c.numero}</p>
                      {c.config?.numeroReferencia && (
                        <p className="text-slate-500 text-xs mt-0.5">{c.config.numeroReferencia}</p>
                      )}
                      {(() => {
                        const editando = (presencias[c.id] || []).filter(p => p.uid !== user?.uid)
                        return editando.length > 0 ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                            <span className="text-amber-400 text-xs">{editando.map(p => p.nombre).join(', ')}</span>
                          </div>
                        ) : null
                      })()}
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
                        value={c.estado || 'Pendiente'}
                        onChange={(e) => handleEstado(c.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer appearance-none text-center ${STATUS_STYLE[c.estado] || STATUS_STYLE['Pendiente']}`}
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
                        <button onClick={() => setFichaModal(c)}
                          className="relative text-slate-400 hover:text-violet-400 transition-colors" title="Fichas técnicas adjuntas">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {(c.fichasTecnicas?.length > 0) && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-violet-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
                              {c.fichasTecnicas.length}
                            </span>
                          )}
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

          {/* ── Paginación ── */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
              <span className="text-slate-500 text-xs">
                {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, sorted.length)} de {sorted.length} cotizaciones
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                    acc.push(n)
                    return acc
                  }, [])
                  .map((n, i) => n === '…'
                    ? <span key={`sep-${i}`} className="px-1 text-slate-600 text-xs">…</span>
                    : <button key={n} onClick={() => setPagina(n)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${paginaActual === n ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {n}
                      </button>
                  )
                }
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Modal de preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
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
          <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center" ref={previewRef}>
            <div id="historial-preview-content" className="w-full max-w-4xl">
              {preview.tipo === 'cotizacion' ? (
                <CotizacionPrintView empresa={preview.cot.empresa || empresa} cot={preview.cot} />
              ) : (
                <FichaCostosPrintView empresa={preview.cot.empresa || empresa} cot={preview.cot} />
              )}
            </div>
          </div>
        </div>
      )}

      {fichaModal && (
        <AdjuntarFichaModal
          cot={fichaModal}
          onClose={() => setFichaModal(null)}
          onArchivosUpdate={handleArchivosUpdate}
        />
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Eliminar cotización"
        message="Esta acción no se puede deshacer. La cotización será eliminada permanentemente."
        onConfirm={ejecutarEliminar}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </DashboardLayout>
  )
}
