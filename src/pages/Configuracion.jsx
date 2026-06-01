import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useUserData } from '../contexts/UserDataContext'


export default function Configuracion() {
  const { empresa, configDefaults, saveEmpresa, saveConfigDefaults } = useUserData()

  const [form, setForm] = useState(() => ({
    nombre: '', rut: '', giro: '', direccion: '', telefono: '', email: '', logo: null,
    ...empresa,
  }))
  const [success, setSuccess] = useState(false)

  const [configDef, setConfigDef] = useState(() => configDefaults)
  const [defSuccess, setDefSuccess] = useState(false)

  // Sync form when empresa loads from Firestore (async)
  useEffect(() => {
    setForm((f) => ({ nombre: '', rut: '', giro: '', direccion: '', telefono: '', email: '', logo: null, ...empresa, ...f }))
  }, [empresa]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync configDef when configDefaults loads from Firestore (async)
  useEffect(() => {
    setConfigDef(configDefaults)
  }, [configDefaults]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateRole = (i, field, value) =>
    setConfigDef((d) => ({ ...d, roles: d.roles.map((r, idx) => idx === i ? { ...r, [field]: value } : r) }))
  const addRole = () =>
    setConfigDef((d) => ({ ...d, roles: [...d.roles, { nombre: '', precio_hora: 0 }] }))
  const removeRole = (i) =>
    setConfigDef((d) => ({ ...d, roles: d.roles.filter((_, idx) => idx !== i) }))

  const updateBase = (i, field, value) =>
    setConfigDef((d) => ({ ...d, bases: d.bases.map((b, idx) => idx === i ? { ...b, [field]: value } : b) }))
  const addBase = () =>
    setConfigDef((d) => ({ ...d, bases: [...d.bases, { nombre: '', porcentaje: 0 }] }))
  const removeBase = (i) =>
    setConfigDef((d) => ({ ...d, bases: d.bases.filter((_, idx) => idx !== i) }))

  const handleSaveDefaults = () => {
    saveConfigDefaults(configDef)  // from context — saves to Firestore + localStorage
    setDefSuccess(true)
    setTimeout(() => setDefSuccess(false), 3000)
  }

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    saveEmpresa(form)  // from context — saves to Firestore + localStorage
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración de empresa</h1>
          <p className="text-slate-400 mt-1 text-sm">Estos datos aparecerán en el encabezado de tus cotizaciones PDF</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('abrirTutorial'))}
          className="flex items-center gap-2 btn-secondary text-sm py-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ver tutorial
        </button>
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

      {/* Valores predeterminados */}
      <div className="max-w-2xl mt-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Valores predeterminados</h1>
          <p className="text-slate-400 mt-1 text-sm">Precios y porcentajes que se usarán como base al crear nuevas cotizaciones</p>
        </div>

        {/* Roles / Horas Hombre */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cargos (Horas Hombre)</h2>
            <button onClick={addRole} className="btn-secondary text-sm py-2">+ Agregar</button>
          </div>
          <div className="space-y-2">
            {configDef.roles.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  className="input-field text-sm py-2 flex-1"
                  placeholder="Nombre del cargo"
                  value={r.nombre}
                  onChange={(e) => updateRole(i, 'nombre', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs whitespace-nowrap">$/hora</span>
                  <input
                    type="number"
                    min="0"
                    className="input-field text-sm py-2 w-32 text-right"
                    placeholder="0"
                    value={r.precio_hora || ''}
                    onChange={(e) => updateRole(i, 'precio_hora', Number(e.target.value))}
                  />
                </div>
                <button
                  onClick={() => removeRole(i)}
                  className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">% Bases</h2>
            <button onClick={addBase} className="btn-secondary text-sm py-2">+ Agregar</button>
          </div>
          <div className="space-y-2">
            {configDef.bases.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  className="input-field text-sm py-2 flex-1"
                  placeholder="Nombre (ej: Utilidades)"
                  value={b.nombre}
                  onChange={(e) => updateBase(i, 'nombre', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="input-field text-sm py-2 w-24 text-right"
                    placeholder="0"
                    value={b.porcentaje || ''}
                    onChange={(e) => updateBase(i, 'porcentaje', Number(e.target.value))}
                  />
                  <span className="text-slate-400 text-sm">%</span>
                </div>
                <button
                  onClick={() => removeBase(i)}
                  className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {defSuccess && (
          <div className="bg-green-900/30 border border-green-500/50 text-green-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Valores predeterminados guardados. Se aplicarán en la próxima cotización nueva.
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSaveDefaults} className="btn-primary">Guardar valores predeterminados</button>
        </div>
      </div>
    </DashboardLayout>
  )
}
