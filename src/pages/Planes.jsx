import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'

export default function Planes() {
  const { user } = useAuth()
  const { plan, isPro } = usePlan()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState('')

  const success = searchParams.get('success') === '1'
  const canceled = searchParams.get('canceled') === '1'

  const handleUpgrade = async () => {
    setLoadingCheckout(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Error al iniciar el pago.')
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  const handlePortal = async () => {
    setLoadingPortal(true)
    setError('')
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Error al abrir el portal.')
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoadingPortal(false)
    }
  }

  const freatures = [
    { label: 'Cotizador modo Estándar', free: true, pro: true },
    { label: 'Cotizador modo Avanzado (embalaje, pallets)', free: false, pro: true },
    { label: 'Historial de cotizaciones', free: true, pro: true },
    { label: 'Gestión de clientes', free: true, pro: true },
    { label: 'Catálogo de materiales (2 ítems)', free: true, pro: false },
    { label: 'Catálogo de materiales ilimitado', free: false, pro: true },
    { label: 'Catálogo de servicios (2 ítems)', free: true, pro: false },
    { label: 'Catálogo de servicios ilimitado', free: false, pro: true },
    { label: 'Exportar PDF de cotizaciones', free: true, pro: true },
    { label: 'Plantillas de cotización', free: true, pro: true },
    { label: 'Conexiones y colaboración', free: true, pro: true },
    { label: 'Asistente IA Mecánico', free: true, pro: true },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Planes</h1>
          <p className="text-slate-400 mt-2">Elige el plan que mejor se adapte a tu negocio</p>
        </div>

        {success && (
          <div className="mb-6 bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 rounded-xl px-5 py-4 text-center">
            <p className="font-semibold text-lg">¡Suscripción activada!</p>
            <p className="text-sm mt-1 text-emerald-400">Ya tienes acceso a todas las funciones Pro. Puede tomar unos segundos en reflejarse.</p>
          </div>
        )}
        {canceled && (
          <div className="mb-6 bg-amber-900/30 border border-amber-500/50 text-amber-300 rounded-xl px-5 py-4 text-center">
            <p className="text-sm">Pago cancelado. Puedes intentarlo nuevamente cuando quieras.</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-400 rounded-xl px-5 py-4 text-center text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Plan Gratuito */}
          <div className={`card border-2 transition-colors ${!isPro ? 'border-amber-500/60' : 'border-slate-700'}`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-white">Gratuito</h2>
              {!isPro && (
                <span className="text-xs font-semibold bg-amber-600/30 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-full">
                  Plan actual
                </span>
              )}
            </div>
            <div className="mb-5">
              <span className="text-3xl font-bold text-white">$0</span>
              <span className="text-slate-500 text-sm ml-1">/ siempre gratis</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {freatures.filter(f => f.free).map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">{f.label}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-slate-500 cursor-not-allowed"
            >
              {!isPro ? 'Plan actual' : 'Plan básico'}
            </button>
          </div>

          {/* Plan Pro */}
          <div className={`card border-2 transition-colors relative ${isPro ? 'border-blue-500/60' : 'border-slate-700 hover:border-blue-500/40'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full shadow">
                RECOMENDADO
              </span>
            </div>
            <div className="flex items-center justify-between mb-1 mt-2">
              <h2 className="text-xl font-bold text-white">Pro</h2>
              {isPro && (
                <span className="text-xs font-semibold bg-blue-600/30 text-blue-400 border border-blue-500/40 px-2.5 py-1 rounded-full">
                  Plan actual
                </span>
              )}
            </div>
            <div className="mb-5">
              <span className="text-3xl font-bold text-white">$12 USD</span>
              <span className="text-slate-500 text-sm ml-1">/ mes</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {freatures.filter(f => f.pro).map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-200">{f.label}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-60"
              >
                {loadingPortal ? 'Cargando...' : 'Gestionar suscripción'}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loadingCheckout}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-lg shadow-blue-900/30"
              >
                {loadingCheckout ? 'Redirigiendo...' : 'Actualizar a Pro'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Pagos procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
        </p>
      </div>
    </DashboardLayout>
  )
}
