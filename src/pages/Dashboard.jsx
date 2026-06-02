import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import { suscribirCotizaciones } from '../firebase/firestore'

const fmt = (n) =>
  (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const STATUS_STYLE = {
  Pendiente: 'bg-stone-700/60 text-stone-300 border-stone-600',
  Aprobada:  'bg-green-900/40 text-green-400 border-green-500/30',
  Entregada: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
}

const STATUS_COLOR = { Pendiente: '#78716c', Aprobada: '#4ade80', Entregada: '#34d399' }
const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// ── Gráfico de barras puro (CSS/flexbox) ────────────────────────────────────
function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-40 px-1">
      {data.map((entry, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs font-semibold tabular-nums" style={{ color: entry.isCurrent ? '#d97706' : '#a8a29e' }}>
            {entry.count > 0 ? entry.count : ''}
          </span>
          <div className="w-full flex items-end" style={{ height: 120 }}>
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${(entry.count / maxVal) * 100}%`,
                minHeight: entry.count > 0 ? 6 : 0,
                background: entry.isCurrent ? '#d97706' : '#57534e',
              }}
            />
          </div>
          <span className="text-xs text-stone-500">{entry.mes}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut SVG puro ───────────────────────────────────────────────────────────
function DonutChart({ data, total }) {
  const R = 58
  const C = 2 * Math.PI * R
  const GAP = 3  // grados de separación entre segmentos

  let cumulativeDeg = -90  // empezamos desde arriba

  const segments = data.map(({ value, fill }) => {
    const pct     = total > 0 ? value / total : 0
    const deg     = pct * 360 - GAP
    const dash    = (deg / 360) * C
    const gap     = C - dash
    const rotation = cumulativeDeg
    cumulativeDeg += pct * 360
    return { dash, gap, rotation, fill, skip: deg <= 0 }
  })

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Pista de fondo */}
        <circle cx="80" cy="80" r={R} fill="none" stroke="#292524" strokeWidth="22" />
        {/* Segmentos */}
        {segments.map((seg, i) =>
          seg.skip ? null : (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={seg.fill}
              strokeWidth="22"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeLinecap="butt"
              transform={`rotate(${seg.rotation}, 80, 80)`}
            />
          )
        )}
      </svg>
      {/* Label central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-stone-100 leading-none">{total}</span>
        <span className="text-xs text-stone-500 mt-0.5">total</span>
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = suscribirCotizaciones(user.uid, (data) => {
      setCotizaciones(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  const now        = new Date()
  const mesActual  = now.getMonth()
  const anioActual = now.getFullYear()
  const mesPrev    = mesActual === 0 ? 11 : mesActual - 1
  const anioPrev   = mesActual === 0 ? anioActual - 1 : anioActual

  const esMes = (c, m, a) =>
    c.fechaDate && c.fechaDate.getMonth() === m && c.fechaDate.getFullYear() === a

  const thisMes    = cotizaciones.filter((c) => esMes(c, mesActual, anioActual))
  const prevMes    = cotizaciones.filter((c) => esMes(c, mesPrev, anioPrev))
  const montoMes   = thisMes.reduce((s, c) => s + (Number(c.totalFinal ?? c.costoTotal) || 0), 0)
  const montoMesP  = prevMes.reduce((s, c) => s + (Number(c.totalFinal ?? c.costoTotal) || 0), 0)
  const entregadas = cotizaciones.filter((c) => c.estado === 'Entregada').length
  const tasaCierre = cotizaciones.length > 0
    ? `${Math.round((entregadas / cotizaciones.length) * 100)}%`
    : '—'
  const clientesUnicos = new Set(
    cotizaciones.map((c) => (typeof c.cliente === 'object' ? c.cliente?.nombre : c.cliente)).filter(Boolean)
  ).size

  const maxMes = thisMes.length > 0
    ? Math.max(...thisMes.map((c) => Number(c.totalFinal ?? c.costoTotal) || 0))
    : null

  let variacion = '—'
  let variacionPositiva = true
  if (montoMesP > 0) {
    const pct = ((montoMes - montoMesP) / montoMesP) * 100
    variacion = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
    variacionPositiva = pct >= 0
  } else if (montoMes > 0) {
    variacion = 'Primer mes'
  }

  const stats = [
    { label: 'Cotizaciones este mes',     value: String(thisMes.length) },
    { label: 'Clientes únicos',           value: String(clientesUnicos) },
    { label: 'Monto cotizado (mes)',       value: fmt(montoMes) },
    { label: 'Tasa de cierre',            value: tasaCierre },
    { label: 'Cotiz. más alta del mes',   value: maxMes !== null ? fmt(maxMes) : '—' },
    { label: 'Variación vs mes anterior', value: variacion, isVariacion: true, positive: variacionPositiva },
  ]

  // Barras: últimos 6 meses
  const barData = Array.from({ length: 6 }, (_, i) => {
    let m = mesActual - 5 + i
    let a = anioActual
    if (m < 0)  { m += 12; a -= 1 }
    if (m > 11) { m -= 12; a += 1 }
    return {
      mes:       MESES_ES[m],
      count:     cotizaciones.filter((c) => esMes(c, m, a)).length,
      isCurrent: m === mesActual && a === anioActual,
    }
  })

  // Donut: por estado
  const total   = cotizaciones.length
  const pieData = ['Pendiente', 'Aprobada', 'Entregada']
    .map((estado) => ({
      name:  estado,
      value: cotizaciones.filter((c) => c.estado === estado).length,
      fill:  STATUS_COLOR[estado],
      pct:   total > 0 ? Math.round((cotizaciones.filter((c) => c.estado === estado).length / total) * 100) : 0,
    }))
    .filter((e) => e.value > 0)

  const recientes = cotizaciones.slice(0, 5)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-100">
          Bienvenido, {user?.displayName || 'Usuario'}
        </h1>
        <p className="text-stone-400 mt-1 capitalize">
          {now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-stone-400 text-xs leading-tight">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              stat.isVariacion
                ? stat.positive ? 'text-green-400' : 'text-red-400'
                : 'text-stone-100'
            }`}>
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Barras por mes */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-stone-100 mb-5">
            Cotizaciones por mes
            <span className="text-stone-500 text-xs font-normal ml-2">(últimos 6 meses)</span>
          </h2>
          {loading ? (
            <div className="h-44 flex items-center justify-center">
              <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <BarChart data={barData} />
              <div className="flex items-center gap-4 mt-3 justify-end">
                <span className="flex items-center gap-1.5 text-stone-500 text-xs">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-600" />mes actual
                </span>
                <span className="flex items-center gap-1.5 text-stone-500 text-xs">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-stone-500" />meses anteriores
                </span>
              </div>
            </>
          )}
        </div>

        {/* Donut por estado */}
        <div className="card flex flex-col">
          <h2 className="text-base font-semibold text-stone-100 mb-4">Por estado</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pieData.length === 0 ? (
            <p className="text-stone-500 text-sm text-center my-auto py-8">Sin cotizaciones aún.</p>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <DonutChart data={pieData} total={total} />
              </div>
              <div className="space-y-2.5">
                {pieData.map(({ name, value, fill, pct }) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: fill }} />
                      <span className="text-stone-300">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-100 font-bold tabular-nums">{value}</span>
                      <span className="text-stone-500 text-xs w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cotizaciones recientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-100">Cotizaciones recientes</h2>
          <button
            onClick={() => navigate('/historial')}
            className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
          >
            Ver todas →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : recientes.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-6">
            Aún no tienes cotizaciones guardadas.{' '}
            <button onClick={() => navigate('/cotizador')} className="text-amber-500 hover:text-amber-400">
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
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-center px-3 py-2 rounded-r-lg">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((c) => {
                  const nombre = typeof c.cliente === 'object' ? c.cliente?.nombre : c.cliente
                  return (
                    <tr key={c.id} className="border-b border-stone-700/50 hover:bg-stone-800/40 transition-colors">
                      <td className="px-3 py-2.5 text-amber-500 font-mono text-xs">{c.numero}</td>
                      <td className="px-3 py-2.5 text-stone-200 text-xs">{nombre || '—'}</td>
                      <td className="px-3 py-2.5 text-stone-400 text-xs">{c.fecha || '—'}</td>
                      <td className="px-3 py-2.5 text-stone-200 text-right text-xs font-medium">{fmt(c.totalFinal || 0)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[c.estado] || STATUS_STYLE['Pendiente']}`}>
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
    </DashboardLayout>
  )
}
