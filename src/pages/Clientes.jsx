import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'

const CLIENTS = [
  { id: 1, name: 'Aceros del Norte S.A.', rut: '76.123.456-7', email: 'contacto@acerosnorte.cl', phone: '+56 9 8765 4321', quotes: 8, totalAmount: 1250000 },
  { id: 2, name: 'Industrias Metálicas Ltda.', rut: '77.234.567-8', email: 'ventas@indmetalicas.cl', phone: '+56 9 7654 3210', quotes: 3, totalAmount: 450000 },
  { id: 3, name: 'Constructora Metalpro', rut: '78.345.678-9', email: 'gerencia@metalpro.cl', phone: '+56 2 2345 6789', quotes: 5, totalAmount: 980000 },
  { id: 4, name: 'Taller Mecánico Rodríguez', rut: '12.345.678-9', email: 'tallrguez@gmail.com', phone: '+56 9 6543 2109', quotes: 2, totalAmount: 120000 },
  { id: 5, name: 'Ferroindustria SA', rut: '79.456.789-0', email: 'info@ferroindustria.cl', phone: '+56 2 3456 7890', quotes: 4, totalAmount: 670000 },
  { id: 6, name: 'MetalWorks SpA', rut: '76.789.012-3', email: 'hola@metalworks.cl', phone: '+56 9 5432 1098', quotes: 2, totalAmount: 230000 },
]

const fmt = (n) => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function Clientes() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = CLIENTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rut.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 mt-1">{CLIENTS.length} clientes registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Nuevo cliente
        </button>
      </div>

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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">Cliente</th>
                <th className="text-left px-4 py-3">RUT</th>
                <th className="text-left px-4 py-3">Contacto</th>
                <th className="text-center px-4 py-3">Cotizaciones</th>
                <th className="text-right px-4 py-3">Total cotizado</th>
                <th className="text-center px-4 py-3 rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.name[0]}
                        </div>
                        <span className="text-slate-200 font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.rut}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-xs">{c.email}</p>
                      <p className="text-slate-500 text-xs">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-center">{c.quotes}</td>
                    <td className="px-4 py-3 text-slate-200 text-right font-medium">{fmt(c.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-slate-400 hover:text-blue-400 transition-colors" title="Ver detalle">
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre / Razón social</label>
                <input type="text" className="input-field" placeholder="Ej: Aceros del Norte S.A." />
              </div>
              <div>
                <label className="label">RUT</label>
                <input type="text" className="input-field" placeholder="76.123.456-7" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="contacto@empresa.cl" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="text" className="input-field" placeholder="+56 9 1234 5678" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={() => setShowModal(false)} className="btn-primary flex-1">Guardar cliente</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
