import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import { suscribirCotizaciones } from '../firebase/firestore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'

const fmt = (n) =>
  (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const STATUS_STYLE = {
  Pendiente: 'bg-stone-700/60 text-stone-300 border-stone-600',
  Aprobada:  'bg-green-900/40 text-green-400 border-green-500/30',
  Entregada: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
}

const STATUS_COLOR = {
  Pendiente: '#78716c',
  Aprobada:  '#4ade80',
  Entregada: '#34d399',
}

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-stone-300 font-medium">{label}</p>
      <p className="text-amber-400 font-bold">{payload[0].value} cotizaciones</p>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-medium" style={{ color: entry.payload.fill }}>{entry.name}</p>
      <p className="text-stone-200">{entry.value} cotizaciones ({entry.payload.pct}%)</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = suscribirCotizaciones(user.uid, user.email, (data) => {
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

  const thisMes   = cotizaciones.filter((c) => esMes(c, mesActual, anioActual))
  const prevMes   = cotizaciones.filter((c) => esMes(c, mesPrev, anioPrev))
  const montoMes  = thisMes.reduce((s, c) => s + (Number(c.totalFinal ?? c.costoTotal) || 0), 0)
  const montoMesP = prevMes.reduce((s, c) => s + (Number(c.totalFinal ?? c.costoTotal) || 0), 0)

  const entregadas     = cotizaciones.filter((c) => c.estado === 'Entregada').length
  const tasaCierre     = cotizaciones.length > 0
    ? `${Math.round((entregadas / cotizaciones.length) * 100)}%`
    : '—'
  const clientesUnicos = new Set(
    cotizaciones
      .map((c) => (typeof c.cliente === 'object' ? c.cliente?.nombre : c.cliente))
      .filter(Boolean)
  ).size

  // KPI: cotización más alta del mes
  const maxMes = thisMes.length > 0
    ? Math.max(...thisMes.map((c) => Number(c.totalFinal ?? c.costoTotal) || 0))
    : null

  // KPI: variación vs mes anterior
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
    { label: 'Cotizaciones este mes',      value: String(thisMes.length) },
    { label: 'Clientes únicos',            value: String(clientesUnicos) },
    { label: 'Monto cotizado (mes)',        value: fmt(montoMes) },
    { label: 'Tasa de cierre',             value: tasaCierre },
    { label: 'Cotiz. más alta del mes',    value: maxMes !== null ? fmt(maxMes) : '—' },
    { label: 'Variación vs mes anterior',  value: variacion, isVariacion: true, positive: variacionPositiva },
  ]

  // Barras: cotizaciones por mes (últimos 6)
  const barData = Array.from({ length: 6 }, (_, i) => {
    const offset = i - 5
    let m = mesActual + offset
    let a = anioActual
    if (m < 0)  { m += 12; a -= 1 }
    if (m > 11) { m -= 12; a += 1 }
    const count = cotizaciones.filter((c) => esMes(c, m, a)).length
    return { mes: MESES_ES[m], count, isCurrent: m === mesActual && a === anioActual }
  })

  // Donut: por estado
  const total   = cotizaciones.length
  const pieData = ['Pendiente', 'Aprobada', 'Entregada']
    .map((estado) => {
      const count = cotizaciones.filter((c) => c.estado === estado).length
      return { name: estado, value: count, fill: STATUS_COLOR[estado], pct: total > 0 ? Math.round((count / total) * 100) : 0 }
    })
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
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="mes" tick={{ fill: '#a8a29e', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#a8a29e', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: '#44403c44' }} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.isCurrent ? '#d97706' : '#57534e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 justify-end">
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
            <p className="text-stone-500 text-sm text-center my-auto">Sin cotizaciones aún.</p>
          ) : (
            <>
              {/* Donut con label central via overlay */}
              <div className="flex justify-center">
                <div className="relative" style={{ width: 170, height: 170 }}>
                  <PieChart width={170} height={170}>
                    <Pie
                      data={pieData}
                      cx={85}
                      cy={85}
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                  {/* Label central con CSS overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-stone-100 leading-none">{total}</span>
                    <span className="text-xs text-stone-500 mt-1">total</span>
                  </div>
                </div>
              </div>
              {/* Leyenda */}
              <div className="space-y-2.5 mt-4">
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
