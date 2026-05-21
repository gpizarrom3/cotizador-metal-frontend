import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import { suscribirCotizaciones } from '../firebase/firestore'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const STATUS_STYLE = {
  'Borrador':       'bg-slate-700/60 text-slate-300 border-slate-600',
  'Pendiente':      'bg-slate-700/60 text-slate-300 border-slate-600',
  'Enviada':        'bg-blue-900/40 text-blue-300 border-blue-500/30',
  'En revisión':    'bg-yellow-900/40 text-yellow-300 border-yellow-500/30',
  'Aprobada':       'bg-green-900/40 text-green-400 border-green-500/30',
  'Rechazada':      'bg-red-900/40 text-red-400 border-red-500/30',
  'En producción':  'bg-purple-900/40 text-purple-300 border-purple-500/30',
  'Entregada':      'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = suscribirCotizaciones(user.uid, user.email, (data) => {
      setCotizaciones(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  const now = new Date()
  const esMes = (c) =>
    c.fechaDate &&
    c.fechaDate.getMonth() === now.getMonth() &&
    c.fechaDate.getFullYear() === now.getFullYear()

  const thisMes    = cotizaciones.filter(esMes)
  const montoMes   = thisMes.reduce((s, c) => s + (Number(c.totalFinal) || 0), 0)
  const aprobadas  = cotizaciones.filter((c) => c.estado === 'Aprobada').length
  const rechazadas = cotizaciones.filter((c) => c.estado === 'Rechazada').length
  const tasaCierre = (aprobadas + rechazadas) > 0
    ? `${Math.round(aprobadas / (aprobadas + rechazadas) * 100)}%`
    : '—'
  const clientesUnicos = new Set(
    cotizaciones.map((c) => (typeof c.cliente === 'object' ? c.cliente?.nombre : c.cliente)).filter(Boolean)
  ).size

  const stats = [
    { label: 'Cotizaciones este mes', value: loading ? '—' : String(thisMes.length) },
    { label: 'Clientes únicos',       value: loading ? '—' : String(clientesUnicos) },
    { label: 'Monto cotizado (mes)',  value: loading ? '—' : fmt(montoMes) },
    { label: 'Tasa de cierre',        value: loading ? '—' : tasaCierre },
  ]

  const ESTADOS_ORDER = ['Enviada', 'En revisión', 'Aprobada', 'En producción', 'Rechazada', 'Entregada', 'Borrador', 'Pendiente']
  const porEstado = ESTADOS_ORDER
    .map((estado) => ({ estado, count: cotizaciones.filter((c) => c.estado === estado).length }))
    .filter((e) => e.count > 0)

  const recientes = cotizaciones.slice(0, 5)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bienvenido, {user?.displayName || 'Usuario'}
        </h1>
        <p className="text-slate-400 mt-1 capitalize">
          {now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Por estado */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Estado de cotizaciones</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Cargando...</p>
          ) : porEstado.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin cotizaciones aún.</p>
          ) : (
            <div className="space-y-2.5">
              {porEstado.map(({ estado, count }) => (
                <div key={estado} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[estado] || STATUS_STYLE['Borrador']}`}>
                    {estado}
                  </span>
                  <span className="text-white font-bold tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cotizaciones recientes */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Cotizaciones recientes</h2>
            <button onClick={() => navigate('/historial')} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              Ver todas →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : recientes.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">
              Aún no tienes cotizaciones guardadas.{' '}
              <button onClick={() => navigate('/cotizador')} className="text-blue-400 hover:text-blue-300">
                Crear una →
              </button>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-3 py-2 rounded-l-lg">N°</th>
                    <th className="text-left px-3 py-2">Cliente</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-center px-3 py-2 rounded-r-lg">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((c) => {
                    const nombre = typeof c.cliente === 'object' ? c.cliente?.nombre : c.cliente
                    return (
                      <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2.5 text-blue-400 font-mono text-xs">{c.numero}</td>
                        <td className="px-3 py-2.5 text-slate-200 text-xs">{nombre || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-200 text-right text-xs font-medium">{fmt(c.totalFinal || 0)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[c.estado] || STATUS_STYLE['Borrador']}`}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
