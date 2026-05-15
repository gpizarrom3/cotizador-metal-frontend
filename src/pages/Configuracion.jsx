import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { getEmpresa, saveEmpresa } from '../utils/empresa'

export default function Configuracion() {
  const [form, setForm] = useState(() => ({
    nombre: '', rut: '', giro: '', direccion: '', telefono: '', email: '', logo: null,
    ...getEmpresa(),
  }))
  const [success, setSuccess] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    saveEmpresa(form)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configuración de empresa</h1>
        <p className="text-slate-400 mt-1 text-sm">Estos datos aparecerán en el encabezado de tus cotizaciones PDF</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Logo */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Logo de la empresa</h2>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 bg-slate-700 rounded-xl border border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="space-y-2">
              <label className="btn-secondary text-sm cursor-pointer inline-block">
                Subir logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </label>
              {form.logo && (
                <button onClick={() => set('logo', null)} className="ml-2 text-red-400 hover:text-red-300 text-sm transition-colors">
                  Eliminar
                </button>
              )}
              <p className="text-slate-500 text-xs">PNG o JPG. Recomendado: 300x100px</p>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Datos de la empresa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Razón social / Nombre empresa</label>
              <input type="text" className="input-field" placeholder="Ej: Metalmecánica Rodríguez Ltda." value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </div>
            <div>
              <label className="label">RUT</label>
              <input type="text" className="input-field" placeholder="76.123.456-7" value={form.rut} onChange={(e) => set('rut', e.target.value)} />
            </div>
            <div>
              <label className="label">Giro</label>
              <input type="text" className="input-field" placeholder="Fabricación metalmecánica" value={form.giro} onChange={(e) => set('giro', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input type="text" className="input-field" placeholder="Av. Industrial 1234, Santiago" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input type="text" className="input-field" placeholder="+56 2 2345 6789" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
            </div>
            <div>
              <label className="label">Email comercial</label>
              <input type="email" className="input-field" placeholder="cotizaciones@empresa.cl" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-900/30 border border-green-500/50 text-green-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Configuración guardada correctamente.
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary">Guardar configuración</button>
        </div>
      </div>
    </DashboardLayout>
  )
}
