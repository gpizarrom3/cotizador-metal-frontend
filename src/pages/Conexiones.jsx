import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import {
  enviarInvitacion,
  suscribirInvitacionesPendientes,
  obtenerInvitacionesEnviadas,
  obtenerConexionesComoOwner,
  obtenerConexionesComoLector,
  aceptarInvitacion,
  rechazarInvitacion,
  cancelarInvitacion,
  eliminarConexion,
} from '../firebase/firestore'

const PERMISO_LABELS = {
  lectura: { label: 'Solo lectura', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  editor:  { label: 'Editor',       color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
}

function PermisoBadge({ permiso }) {
  const p = PERMISO_LABELS[permiso] || PERMISO_LABELS.lectura
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${p.bg} ${p.color}`}>
      {p.label}
    </span>
  )
}

export default function Conexiones() {
  const { user } = useAuth()

  const [toEmail, setToEmail]   = useState('')
  const [permiso, setPermiso]   = useState('lectura')
  const [enviando, setEnviando] = useState(false)
  const [envioOk, setEnvioOk]   = useState(false)
  const [envioErr, setEnvioErr] = useState('')

  const [pendientes, setPendientes]   = useState([])   // invitaciones recibidas pendientes
  const [enviadas, setEnviadas]       = useState([])   // invitaciones que envié
  const [comoOwner, setComoOwner]     = useState([])   // personas a quienes les comparto
  const [comoLector, setComoLector]   = useState([])   // personas que me comparten

  const [accionando, setAccionando] = useState(null)   // id siendo procesado

  useEffect(() => {
    if (!user) return
    const unsub = suscribirInvitacionesPendientes(user.email, setPendientes)
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    Promise.all([
      obtenerInvitacionesEnviadas(user.uid),
      obtenerConexionesComoOwner(user.uid),
      obtenerConexionesComoLector(user.uid),
    ]).then(([env, owner, lector]) => {
      setEnviadas(env)
      setComoOwner(owner)
      setComoLector(lector)
    })
  }, [user])

  const handleEnviar = async (e) => {
    e.preventDefault()
    setEnvioErr('')
    setEnvioOk(false)
    setEnviando(true)
    try {
      await enviarInvitacion(user.uid, user.email, user.displayName || '', toEmail, permiso)
      setEnvioOk(true)
      setToEmail('')
      const env = await obtenerInvitacionesEnviadas(user.uid)
      setEnviadas(env)
    } catch (err) {
      setEnvioErr(err.message || 'Error al enviar la invitación.')
    } finally {
      setEnviando(false)
    }
  }

  const handleAceptar = async (inv) => {
    setAccionando(inv.id)
    try {
      await aceptarInvitacion(inv, user.uid, user.email, user.displayName || '')
      setPendientes(prev => prev.filter(i => i.id !== inv.id))
      const lector = await obtenerConexionesComoLector(user.uid)
      setComoLector(lector)
    } catch { /* silencioso */ }
    setAccionando(null)
  }

  const handleRechazar = async (invId) => {
    setAccionando(invId)
    try {
      await rechazarInvitacion(invId)
      setPendientes(prev => prev.filter(i => i.id !== invId))
    } catch { /* silencioso */ }
    setAccionando(null)
  }

  const handleCancelarInv = async (invId) => {
    setAccionando(invId)
    try {
      await cancelarInvitacion(invId)
      setEnviadas(prev => prev.filter(i => i.id !== invId))
    } catch { /* silencioso */ }
    setAccionando(null)
  }

  const handleEliminarConexion = async (conexionId) => {
    setAccionando(conexionId)
    try {
      await eliminarConexion(conexionId)
      setComoOwner(prev => prev.filter(c => c.id !== conexionId))
      setComoLector(prev => prev.filter(c => c.id !== conexionId))
    } catch { /* silencioso */ }
    setAccionando(null)
  }

  const invEnviadas = enviadas.filter(i => i.status === 'pending')

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Conexiones</h1>
        <p className="text-slate-400 mt-1 text-sm">Comparte tus cotizaciones con otros usuarios o accede a las que te han compartido.</p>
      </div>

      <div className="space-y-6 max-w-3xl">

        {/* Invitaciones recibidas */}
        {pendientes.length > 0 && (
          <div className="card border-amber-500/30 bg-amber-500/5">
            <h2 className="text-base font-semibold text-amber-300 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                {pendientes.length}
              </span>
              Invitaciones pendientes
            </h2>
            <div className="space-y-3">
              {pendientes.map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm">{inv.fromNombre || inv.fromEmail}</p>
                    <p className="text-slate-400 text-xs">{inv.fromEmail}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Quiere compartir sus cotizaciones contigo como: <PermisoBadge permiso={inv.permiso} />
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAceptar(inv)}
                      disabled={accionando === inv.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleRechazar(inv.id)}
                      disabled={accionando === inv.id}
                      className="bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enviar invitación */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Compartir mis cotizaciones</h2>
          <form onSubmit={handleEnviar} className="space-y-4">
            <div>
              <label className="label">Correo del destinatario</label>
              <input
                type="email"
                className="input-field"
                placeholder="usuario@empresa.com"
                value={toEmail}
                onChange={e => { setToEmail(e.target.value); setEnvioOk(false); setEnvioErr('') }}
                required
              />
            </div>
            <div>
              <label className="label">Tipo de acceso</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setPermiso('lectura')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    permiso === 'lectura'
                      ? 'border-sky-500/60 bg-sky-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className={`text-sm font-medium ${permiso === 'lectura' ? 'text-sky-300' : 'text-slate-300'}`}>Solo lectura</span>
                  </div>
                  <p className="text-slate-500 text-xs">Puede ver y exportar PDF. No puede editar ni crear.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPermiso('editor')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    permiso === 'editor'
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className={`text-sm font-medium ${permiso === 'editor' ? 'text-amber-300' : 'text-slate-300'}`}>Editor</span>
                  </div>
                  <p className="text-slate-500 text-xs">Puede ver, crear y editar cotizaciones. No puede eliminar.</p>
                </button>
              </div>
            </div>
            {envioErr && <p className="text-red-400 text-sm">{envioErr}</p>}
            {envioOk && <p className="text-green-400 text-sm">Invitación enviada. El destinatario debe aceptarla desde su cuenta.</p>}
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </form>
        </div>

        {/* Invitaciones enviadas pendientes */}
        {invEnviadas.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Invitaciones enviadas (pendientes)</h2>
            <div className="space-y-2">
              {invEnviadas.map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-slate-300 text-sm">{inv.toEmail}</p>
                    <span className="mt-0.5"><PermisoBadge permiso={inv.permiso} /></span>
                  </div>
                  <button
                    onClick={() => handleCancelarInv(inv.id)}
                    disabled={accionando === inv.id}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personas que acceden a mis cotizaciones */}
        {comoOwner.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Personas con acceso a mis cotizaciones</h2>
            <div className="space-y-2">
              {comoOwner.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">{c.readerNombre || c.readerEmail}</p>
                    <p className="text-slate-500 text-xs">{c.readerEmail}</p>
                    <span className="mt-0.5"><PermisoBadge permiso={c.permiso} /></span>
                  </div>
                  <button
                    onClick={() => handleEliminarConexion(c.id)}
                    disabled={accionando === c.id}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    Revocar acceso
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cotizaciones que me comparten */}
        {comoLector.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Cotizaciones compartidas conmigo</h2>
            <div className="space-y-2">
              {comoLector.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">{c.ownerNombre || c.ownerEmail}</p>
                    <p className="text-slate-500 text-xs">{c.ownerEmail}</p>
                    <span className="mt-0.5"><PermisoBadge permiso={c.permiso} /></span>
                  </div>
                  <button
                    onClick={() => handleEliminarConexion(c.id)}
                    disabled={accionando === c.id}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    Desconectar
                  </button>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Las cotizaciones compartidas contigo aparecen en la pestaña "Compartidas" del Historial.
            </p>
          </div>
        )}

        {pendientes.length === 0 && comoOwner.length === 0 && comoLector.length === 0 && invEnviadas.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Sin conexiones activas. Envía una invitación para comenzar.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
