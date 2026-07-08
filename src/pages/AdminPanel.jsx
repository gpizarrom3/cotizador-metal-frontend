import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { obtenerUsuariosAdmin } from '../firebase/firestore'

const fmtDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmtDateTime = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const PROVIDER_LABEL = { 'google.com': 'Google', 'password': 'Email' }

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    obtenerUsuariosAdmin()
      .then(setUsuarios)
      .catch(e => setError('Error al cargar usuarios. Verifica las reglas de Firestore.'))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = usuarios.filter(u => {
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === 'todos' || u.plan === filtro
    return matchSearch && matchFiltro
  })

  const totalPro  = usuarios.filter(u => u.plan === 'pro').length
  const totalFree = usuarios.filter(u => u.plan === 'free').length

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
            <p className="text-slate-400 text-sm mt-0.5">Usuarios registrados en CotizaMetal</p>
          </div>
          <button
            onClick={() => { setLoading(true); obtenerUsuariosAdmin().then(setUsuarios).catch(() => {}).finally(() => setLoading(false)) }}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card border border-slate-700">
            <p className="text-slate-400 text-xs mb-1">Total usuarios</p>
            <p className="text-3xl font-bold text-white">{usuarios.length}</p>
          </div>
          <div className="card border border-emerald-700/40 bg-emerald-900/10">
            <p className="text-slate-400 text-xs mb-1">Plan Pro</p>
            <p className="text-3xl font-bold text-emerald-400">{totalPro}</p>
          </div>
          <div className="card border border-slate-700">
            <p className="text-slate-400 text-xs mb-1">Plan Free</p>
            <p className="text-3xl font-bold text-slate-300">{totalFree}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="input-field text-sm py-2 flex-1 min-w-48"
          />
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            {['todos', 'pro', 'free'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 text-xs font-medium transition-colors capitalize ${
                  filtro === f
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-400 text-sm">
            <p className="font-semibold mb-1">Error de permisos</p>
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-500">
              Agrega esta regla en Firestore Security Rules:
            </p>
            <pre className="mt-1 text-xs bg-slate-900 rounded p-2 overflow-x-auto text-slate-300">{`match /usuarios_lista/{uid} {
  allow read: if request.auth.token.email == 'guillermopizarro@innovattech.org';
  allow write: if request.auth != null;
}
match /suscripciones/{uid} {
  allow read: if request.auth.token.email == 'guillermopizarro@innovattech.org'
               || request.auth.uid == uid;
}`}</pre>
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <div className="card border border-slate-700 flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card border border-slate-700 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Usuario</th>
                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Plan</th>
                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden sm:table-cell">Acceso</th>
                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden md:table-cell">Registro</th>
                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3 hidden lg:table-cell">Último login</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-500 py-12">
                        {search || filtro !== 'todos' ? 'Sin resultados para ese filtro' : 'Sin usuarios registrados aún'}
                      </td>
                    </tr>
                  ) : filtrados.map((u) => (
                    <tr key={u.uid} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium truncate max-w-xs">{u.email}</p>
                          {u.displayName && (
                            <p className="text-slate-500 text-xs truncate max-w-xs">{u.displayName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.plan === 'pro'
                            ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {u.plan === 'pro' ? '⚡ Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-slate-400 text-xs">
                          {PROVIDER_LABEL[u.provider] || u.provider || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-400 text-xs">{fmtDate(u.creadoEn)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-400 text-xs">{fmtDateTime(u.ultimoLogin)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtrados.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
                {filtrados.length} de {usuarios.length} usuarios
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-600 text-center">
          Los usuarios aparecen aquí la primera vez que inician sesión después del último deploy.
        </p>
      </div>
    </DashboardLayout>
  )
}
