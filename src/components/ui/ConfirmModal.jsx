export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Eliminar', danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
      <div className="card w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          {danger && (
            <div className="w-10 h-10 bg-red-900/40 border border-red-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {message && <p className="text-slate-400 text-sm mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
