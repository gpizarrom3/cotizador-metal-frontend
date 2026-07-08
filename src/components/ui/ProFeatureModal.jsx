import { NavLink } from 'react-router-dom'

export default function ProFeatureModal({ title, description, benefits, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
              PRO
            </span>
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 ml-2 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">{description}</p>

        <ul className="space-y-2.5 mb-6">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cerrar</button>
          <NavLink to="/planes" onClick={onClose} className="btn-primary flex-1 text-center">
            Ver planes
          </NavLink>
        </div>
      </div>
    </div>
  )
}
