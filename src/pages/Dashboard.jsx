import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'

const stats = [
  { label: 'Cotizaciones este mes', value: '24', change: '+12%', up: true },
  { label: 'Clientes activos', value: '18', change: '+3', up: true },
  { label: 'Monto cotizado', value: '$1.4M', change: '+8%', up: true },
  { label: 'Tasa de cierre', value: '67%', change: '-2%', up: false },
]

const recentQuotes = [
  { id: 'COT-0024', client: 'Aceros del Norte S.A.', date: '14/05/2026', amount: '$185.000', status: 'Aprobada' },
  { id: 'COT-0023', client: 'Industrias Metálicas Ltda.', date: '13/05/2026', amount: '$97.500', status: 'Pendiente' },
  { id: 'COT-0022', client: 'Constructora Metalpro', date: '12/05/2026', amount: '$320.000', status: 'Aprobada' },
  { id: 'COT-0021', client: 'Taller Mecánico Rodríguez', date: '10/05/2026', amount: '$54.000', status: 'Rechazada' },
  { id: 'COT-0020', client: 'Ferroindustria SA', date: '09/05/2026', amount: '$210.000', status: 'Pendiente' },
]

const statusColors = {
  Aprobada: 'bg-green-900/40 text-green-400 border border-green-500/30',
  Pendiente: 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30',
  Rechazada: 'bg-red-900/40 text-red-400 border border-red-500/30',
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bienvenido, {user?.displayName || 'Usuario'}
        </h1>
        <p className="text-slate-400 mt-1">Resumen de actividad — Mayo 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <span className={`text-xs font-medium ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
              {stat.change} vs mes anterior
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Cotizaciones recientes</h2>
          <a href="/historial" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Ver todas →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">ID</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-right px-4 py-3">Monto</th>
                <th className="text-center px-4 py-3 rounded-r-lg">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.map((q) => (
                <tr key={q.id} className="table-row">
                  <td className="px-4 py-3 text-blue-400 font-mono font-medium">{q.id}</td>
                  <td className="px-4 py-3 text-slate-200">{q.client}</td>
                  <td className="px-4 py-3 text-slate-400">{q.date}</td>
                  <td className="px-4 py-3 text-slate-200 text-right font-medium">{q.amount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
