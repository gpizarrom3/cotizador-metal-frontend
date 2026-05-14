import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'

const QUOTES = [
  { id: 'COT-0024', client: 'Aceros del Norte S.A.', date: '14/05/2026', amount: 185000, status: 'Aprobada', items: 3 },
  { id: 'COT-0023', client: 'Industrias Metálicas Ltda.', date: '13/05/2026', amount: 97500, status: 'Pendiente', items: 1 },
  { id: 'COT-0022', client: 'Constructora Metalpro', date: '12/05/2026', amount: 320000, status: 'Aprobada', items: 5 },
  { id: 'COT-0021', client: 'Taller Mecánico Rodríguez', date: '10/05/2026', amount: 54000, status: 'Rechazada', items: 2 },
  { id: 'COT-0020', client: 'Ferroindustria SA', date: '09/05/2026', amount: 210000, status: 'Pendiente', items: 4 },
  { id: 'COT-0019', client: 'MetalWorks SpA', date: '07/05/2026', amount: 88000, status: 'Aprobada', items: 2 },
  { id: 'COT-0018', client: 'Aceros del Norte S.A.', date: '05/05/2026', amount: 145000, status: 'Aprobada', items: 3 },
  { id: 'COT-0017', client: 'Estructuras Macul', date: '03/05/2026', amount: 67500, status: 'Rechazada', items: 1 },
]

const statusColors = {
  Aprobada: 'bg-green-900/40 text-green-400 border border-green-500/30',
  Pendiente: 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30',
  Rechazada: 'bg-red-900/40 text-red-400 border border-red-500/30',
}

const fmt = (n) => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function Historial() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')

  const filtered = QUOTES.filter((q) => {
    const matchSearch =
      q.client.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Todos' || q.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Historial de cotizaciones</h1>
        <p className="text-slate-400 mt-1">{QUOTES.length} cotizaciones en total</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Buscar por cliente o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['Todos', 'Aprobada', 'Pendiente', 'Rechazada'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">ID</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-center px-4 py-3">Ítems</th>
                <th className="text-right px-4 py-3">Monto</th>
                <th className="text-center px-4 py-3">Estado</th>
                <th className="text-center px-4 py-3 rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No se encontraron cotizaciones
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="table-row">
                    <td className="px-4 py-3 text-blue-400 font-mono font-medium">{q.id}</td>
                    <td className="px-4 py-3 text-slate-200">{q.client}</td>
                    <td className="px-4 py-3 text-slate-400">{q.date}</td>
                    <td className="px-4 py-3 text-slate-400 text-center">{q.items}</td>
                    <td className="px-4 py-3 text-slate-200 text-right font-medium">{fmt(q.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-slate-400 hover:text-blue-400 transition-colors" title="Ver">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="text-slate-400 hover:text-yellow-400 transition-colors" title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
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
      </div>
    </DashboardLayout>
  )
}
