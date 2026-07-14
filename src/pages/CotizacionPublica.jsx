import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import CotizacionPrintView from '../components/cotizador/CotizacionPrintView'

export default function CotizacionPublica() {
  const { token } = useParams()
  const [cot, setCot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`/api/cotizacion?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setCot(data.cot)
      })
      .catch(() => setError('Error al cargar la cotización'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando cotización...</p>
        </div>
      </div>
    )
  }

  if (error || !cot) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-lg mb-2">Cotización no encontrada</h1>
          <p className="text-slate-400 text-sm mb-6">{error || 'El link puede haber expirado o sido eliminado.'}</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Ir a CotizaMetal</Link>
        </div>
      </div>
    )
  }

  const empresa = cot.empresa || {}
  const clienteNombre = typeof cot.cliente === 'object' ? (cot.cliente?.nombre || '—') : (cot.cliente || '—')

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            CotizaMetal
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-blue-400 font-mono text-sm">{cot.numero}</span>
          <span className="text-slate-600 text-sm">— {clienteNombre}</span>
        </div>
        <span className="text-slate-500 text-xs">Vista de solo lectura</span>
      </div>

      {/* Cotización */}
      <div className="max-w-4xl mx-auto p-6">
        <CotizacionPrintView empresa={empresa} cot={cot} />
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-slate-400 text-xs">
        Cotización generada con{' '}
        <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors">CotizaMetal</Link>
        {' '}· La información de este documento es confidencial
      </div>
    </div>
  )
}
