import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { subirFichaTecnica, eliminarArchivoStorage } from '../../firebase/storage'
import { actualizarFichasTecnicas } from '../../firebase/firestore'
import ConfirmModal from '../ui/ConfirmModal'

const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

const fmtTamaño = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileIcon({ tipo }) {
  if (tipo === 'application/pdf') {
    return (
      <div className="w-9 h-9 bg-red-900/40 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-red-400 font-bold text-xs">PDF</span>
      </div>
    )
  }
  if (tipo?.startsWith('image/')) {
    return (
      <div className="w-9 h-9 bg-blue-900/40 border border-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  )
}

export default function AdjuntarFichaModal({ cot, onClose, onArchivosUpdate }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [archivos, setArchivos] = useState(cot.fichasTecnicas || [])
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const [confirmDel, setConfirmDel] = useState({ open: false, arch: null })
  const [previewImg, setPreviewImg] = useState(null)

  const guardarEnFirestore = async (nuevos) => {
    await actualizarFichasTecnicas(user.uid, cot.id, nuevos, user.email)
    setArchivos(nuevos)
    onArchivosUpdate(cot.id, nuevos)
  }

  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setUploadError('Tipo no permitido. Usa PDF o imagen (JPG, PNG, WEBP).')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError('El archivo supera el límite de 20 MB.')
      return
    }
    setUploadError('')
    setUploading(true)
    setProgress(0)
    try {
      const arch = await subirFichaTecnica(user.uid, cot.id, file, setProgress)
      const nuevos = [...archivos, arch]
      await guardarEnFirestore(nuevos)
    } catch {
      setUploadError('Error al subir el archivo. Intenta de nuevo.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleEliminar = async () => {
    const arch = confirmDel.arch
    setConfirmDel({ open: false, arch: null })
    try {
      await eliminarArchivoStorage(arch.path)
    } catch { /* ignora si ya no existe en storage */ }
    const nuevos = archivos.filter((a) => a.path !== arch.path)
    await guardarEnFirestore(nuevos)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="card w-full max-w-lg max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white">Fichas técnicas adjuntas</h2>
              <p className="text-slate-400 text-xs mt-0.5 font-mono">{cot.numero}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lista de archivos */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mb-4">
            {archivos.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Sin archivos adjuntos aún.</p>
            ) : archivos.map((arch) => (
              <div key={arch.path} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5">
                <FileIcon tipo={arch.tipo} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{arch.nombre}</p>
                  <p className="text-slate-500 text-xs">{fmtTamaño(arch.tamaño || 0)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {arch.tipo?.startsWith('image/') && (
                    <button
                      onClick={() => setPreviewImg(arch)}
                      className="text-slate-400 hover:text-blue-400 transition-colors p-1.5" title="Vista previa">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  <a
                    href={arch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-green-400 transition-colors p-1.5" title="Abrir / Ver">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href={arch.url}
                    download={arch.nombre}
                    className="text-slate-400 hover:text-blue-400 transition-colors p-1.5" title="Descargar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  <button
                    onClick={() => setConfirmDel({ open: true, arch })}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1.5" title="Eliminar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mb-3 flex-shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Subiendo...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <p className="text-red-400 text-xs mb-3 flex-shrink-0">{uploadError}</p>
          )}

          {/* Drop zone */}
          <div
            className={`flex-shrink-0 border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-7 h-7 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <p className="text-slate-400 text-sm font-medium">Arrastra un archivo o haz clic para seleccionar</p>
            <p className="text-slate-600 text-xs mt-1">PDF, JPG, PNG · máximo 20 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>
      </div>

      {/* Preview imagen */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewImg.url} alt={previewImg.nombre} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            <div className="absolute top-3 right-3 flex gap-2">
              <a href={previewImg.url} download={previewImg.nombre}
                className="bg-slate-900/80 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Descargar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <button onClick={() => setPreviewImg(null)}
                className="bg-slate-900/80 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-400 text-xs text-center mt-2">{previewImg.nombre}</p>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDel.open}
        title="Eliminar archivo"
        message={`¿Eliminar "${confirmDel.arch?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleEliminar}
        onCancel={() => setConfirmDel({ open: false, arch: null })}
      />
    </>
  )
}
