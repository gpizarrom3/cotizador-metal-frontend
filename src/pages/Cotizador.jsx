import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'

const MATERIALES = [
  { value: 'acero_a36', label: 'Acero A36', precioPorKg: 1850 },
  { value: 'acero_inox_304', label: 'Acero Inoxidable 304', precioPorKg: 4200 },
  { value: 'acero_inox_316', label: 'Acero Inoxidable 316', precioPorKg: 5800 },
  { value: 'aluminio_6061', label: 'Aluminio 6061', precioPorKg: 3200 },
  { value: 'hierro_fundido', label: 'Hierro Fundido', precioPorKg: 1200 },
]

const PROCESOS = [
  { value: 'corte_laser', label: 'Corte Láser', precioHora: 15000 },
  { value: 'soldadura_mig', label: 'Soldadura MIG', precioHora: 8000 },
  { value: 'soldadura_tig', label: 'Soldadura TIG', precioHora: 12000 },
  { value: 'torneado', label: 'Torneado CNC', precioHora: 18000 },
  { value: 'fresado', label: 'Fresado CNC', precioHora: 22000 },
  { value: 'pintura', label: 'Pintura en polvo', precioHora: 6000 },
]

const emptyItem = () => ({
  id: Date.now(),
  descripcion: '',
  material: '',
  cantidad: 1,
  pesoKg: 0,
  proceso: '',
  horas: 0,
})

export default function Cotizador() {
  const [cliente, setCliente] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [margen, setMargen] = useState(30)
  const [submitted, setSubmitted] = useState(false)

  const addItem = () => setItems([...items, emptyItem()])
  const removeItem = (id) => setItems(items.filter((i) => i.id !== id))
  const updateItem = (id, field, value) =>
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))

  const calcItem = (item) => {
    const mat = MATERIALES.find((m) => m.value === item.material)
    const proc = PROCESOS.find((p) => p.value === item.proceso)
    const costoMat = mat ? mat.precioPorKg * item.pesoKg * item.cantidad : 0
    const costoProc = proc ? proc.precioHora * item.horas * item.cantidad : 0
    return costoMat + costoProc
  }

  const subtotal = items.reduce((acc, i) => acc + calcItem(i), 0)
  const margenMonto = subtotal * (margen / 100)
  const total = subtotal + margenMonto

  const fmt = (n) => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Cotización</h1>
          <p className="text-slate-400 mt-1">Completa los datos para generar la cotización</p>
        </div>
        <span className="text-slate-500 font-mono text-sm">COT-{String(Date.now()).slice(-4)}</span>
      </div>

      {submitted && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-400 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cotización guardada correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Datos del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del cliente / empresa</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej: Industrias Metálicas Ltda."
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Fecha de emisión</label>
              <input
                type="date"
                className="input-field"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Ítems de la cotización</h2>
            <button type="button" onClick={addItem} className="btn-secondary text-sm py-2">
              + Agregar ítem
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="bg-slate-900 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm font-medium">Ítem #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="label">Descripción</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: Estructura metálica para galpón"
                      value={item.descripcion}
                      onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Material</label>
                    <select
                      className="input-field"
                      value={item.material}
                      onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {MATERIALES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Proceso</label>
                    <select
                      className="input-field"
                      value={item.proceso}
                      onChange={(e) => updateItem(item.id, 'proceso', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {PROCESOS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label">Peso total (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="input-field"
                      value={item.pesoKg}
                      onChange={(e) => updateItem(item.id, 'pesoKg', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label">Horas de trabajo</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="input-field"
                      value={item.horas}
                      onChange={(e) => updateItem(item.id, 'horas', Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5">
                      <p className="text-slate-400 text-xs mb-0.5">Subtotal ítem</p>
                      <p className="text-blue-400 font-semibold">{fmt(calcItem(item))}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Resumen y margen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="label">Margen de ganancia: {margen}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={margen}
                onChange={(e) => setMargen(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Costo base</span>
                <span className="text-slate-200 font-medium">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Margen ({margen}%)</span>
                <span className="text-slate-200 font-medium">{fmt(margenMonto)}</span>
              </div>
              <div className="border-t border-slate-600 pt-2 flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-blue-400 font-bold text-lg">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary">Vista previa PDF</button>
          <button type="submit" className="btn-primary">Guardar cotización</button>
        </div>
      </form>
    </DashboardLayout>
  )
}
