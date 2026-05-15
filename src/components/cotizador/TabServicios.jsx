import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const TRATAMIENTOS = [
  { value: 'normalizado', label: 'Normalizado', precio: 3500 },
  { value: 'recocido', label: 'Recocido', precio: 3000 },
  { value: 'temple', label: 'Temple', precio: 4000 },
  { value: 'revenido', label: 'Revenido', precio: 2500 },
  { value: 'bonificado', label: 'Temple + Revenido (Bonificado)', precio: 5500 },
  { value: 'cementacion', label: 'Cementación', precio: 8000 },
  { value: 'nitruracion', label: 'Nitruración', precio: 12000 },
  { value: 'carburizacion', label: 'Carburización', precio: 7500 },
  { value: 'induccion', label: 'Endurecimiento por Inducción', precio: 10000 },
  { value: 'alivio_tensiones', label: 'Alivio de Tensiones', precio: 2800 },
  { value: 'carbonitrurado', label: 'Carbonitrurado', precio: 9000 },
]

const SERVICIOS_SIMPLES = [
  { key: 'corte_plasma', label: 'Corte Plasma' },
  { key: 'corte_laser', label: 'Corte Láser' },
  { key: 'oxicorte', label: 'Oxicorte' },
  { key: 'plegado', label: 'Servicio de Plegado' },
  { key: 'cilindrado', label: 'Servicio de Cilindrado' },
]

export default function TabServicios({ servicios, setServicios }) {
  const update = (key, field, value) =>
    setServicios({ ...servicios, [key]: { ...servicios[key], [field]: value } })

  const handleTratamiento = (tipo) => {
    const t = TRATAMIENTOS.find((t) => t.value === tipo)
    setServicios({
      ...servicios,
      tratamiento_termico: {
        ...servicios.tratamiento_termico,
        tipo,
        precio: t ? t.precio : servicios.tratamiento_termico.precio,
      },
    })
  }

  const total = Object.values(servicios).reduce(
    (acc, s) => acc + (s.activo ? Number(s.precio) || 0 : 0),
    0
  )

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-5">Servicios requeridos</h2>

      <div className="space-y-3">
        {SERVICIOS_SIMPLES.map(({ key, label }) => (
          <ServiceRow
            key={key}
            label={label}
            activo={servicios[key].activo}
            precio={servicios[key].precio}
            onToggle={() => update(key, 'activo', !servicios[key].activo)}
            onPrecio={(v) => update(key, 'precio', v)}
          />
        ))}

        {/* Tratamientos térmicos */}
        <div
          className={`border rounded-lg p-4 transition-colors ${
            servicios.tratamiento_termico.activo
              ? 'border-blue-500/40 bg-slate-900'
              : 'border-slate-700 bg-slate-900/40'
          }`}
        >
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-52">
              <Toggle
                value={servicios.tratamiento_termico.activo}
                onChange={() => update('tratamiento_termico', 'activo', !servicios.tratamiento_termico.activo)}
              />
              <span className={`font-medium text-sm ${servicios.tratamiento_termico.activo ? 'text-white' : 'text-slate-400'}`}>
                Tratamiento Térmico
              </span>
            </div>

            {servicios.tratamiento_termico.activo && (
              <div className="flex items-center gap-3 flex-wrap flex-1">
                <select
                  className="input-field text-sm py-2 flex-1 min-w-52"
                  value={servicios.tratamiento_termico.tipo}
                  onChange={(e) => handleTratamiento(e.target.value)}
                >
                  <option value="">Seleccionar tratamiento...</option>
                  {TRATAMIENTOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs whitespace-nowrap">Precio ref. ($)</span>
                  <input
                    type="number"
                    min="0"
                    className="input-field text-sm py-2 w-32 text-right"
                    value={servicios.tratamiento_termico.precio || ''}
                    onChange={(e) => update('tratamiento_termico', 'precio', Number(e.target.value))}
                  />
                </div>
                <span className="text-blue-400 font-semibold text-sm whitespace-nowrap">
                  {fmt(servicios.tratamiento_termico.precio)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <div className="bg-slate-900 rounded-lg px-5 py-3 flex items-center gap-4">
          <span className="text-slate-400 text-sm">Total Servicios:</span>
          <span className="text-blue-400 font-bold text-lg">{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

function ServiceRow({ label, activo, precio, onToggle, onPrecio }) {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        activo ? 'border-blue-500/40 bg-slate-900' : 'border-slate-700 bg-slate-900/40'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-52">
          <Toggle value={activo} onChange={onToggle} />
          <span className={`font-medium text-sm ${activo ? 'text-white' : 'text-slate-400'}`}>{label}</span>
        </div>
        {activo && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              className="input-field text-sm py-2 w-36 text-right"
              placeholder="Precio total"
              value={precio || ''}
              onChange={(e) => onPrecio(Number(e.target.value))}
            />
            <span className="text-blue-400 font-semibold text-sm w-28 text-right">
              {(Number(precio) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
