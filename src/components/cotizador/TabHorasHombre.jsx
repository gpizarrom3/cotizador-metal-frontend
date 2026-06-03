import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const calcRoleTotal = (r) => {
  const hh = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
  const col = r.colacion ? (Number(r.valor_colacion) * Number(r.cantidad)) || 0 : 0
  return hh + col
}

export default function TabHorasHombre({ roles, setRoles, configRoles = [] }) {
  const addRole = () =>
    setRoles([
      ...roles,
      { id: Date.now(), nombre: '', precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 },
    ])

  const removeRole = (id) => setRoles(roles.filter((r) => r.id !== id))
  const update = (id, field, value) =>
    setRoles(roles.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const updateMulti = (id, fields) =>
    setRoles(roles.map((r) => (r.id === id ? { ...r, ...fields } : r)))

  const total = roles.reduce((acc, r) => acc + calcRoleTotal(r), 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Horas Hombre por cargo</h2>
        <button onClick={addRole} className="btn-secondary text-sm py-2">+ Agregar cargo</button>
      </div>

      <div className="space-y-3">
        {roles.map((r) => (
          <div key={r.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
              {/* Cargo */}
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Cargo</label>
                {configRoles.length > 0 ? (
                  <>
                    <select
                      className="input-field text-sm py-2"
                      value={configRoles.find((cr) => cr.nombre === r.nombre) ? r.nombre : '__custom__'}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '__custom__') {
                          update(r.id, 'nombre', '')
                        } else {
                          const preset = configRoles.find((cr) => cr.nombre === val)
                          updateMulti(r.id, { nombre: val, ...(preset ? { precio_hora: preset.precio_hora } : {}) })
                        }
                      }}
                    >
                      {configRoles.map((cr) => (
                        <option key={cr.nombre} value={cr.nombre}>{cr.nombre}</option>
                      ))}
                      <option value="__custom__">Personalizado...</option>
                    </select>
                    {!configRoles.find((cr) => cr.nombre === r.nombre) && (
                      <input
                        type="text"
                        className="input-field text-sm py-2 mt-1"
                        placeholder="Nombre del cargo"
                        value={r.nombre}
                        onChange={(e) => update(r.id, 'nombre', e.target.value)}
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    className="input-field text-sm py-2"
                    value={r.nombre}
                    onChange={(e) => update(r.id, 'nombre', e.target.value)}
                  />
                )}
              </div>

              {/* Precio/hora */}
              <div>
                <label className="label">
                  Precio / hora
                  <span className="text-[10px] text-slate-600 font-normal ml-1">decimal: (.)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-field text-sm py-2"
                  placeholder="Ej: 1500.50"
                  value={r.precio_hora || ''}
                  onChange={(e) => update(r.id, 'precio_hora', Number(e.target.value))}
                />
              </div>

              {/* Personas */}
              <div>
                <label className="label">Personas</label>
                <input
                  type="number"
                  min="1"
                  className="input-field text-sm py-2"
                  value={r.cantidad}
                  onChange={(e) => update(r.id, 'cantidad', Number(e.target.value))}
                />
              </div>

              {/* Horas totales */}
              <div>
                <label className="label">Horas totales</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="input-field text-sm py-2"
                  placeholder="0"
                  value={r.horas || ''}
                  onChange={(e) => update(r.id, 'horas', Number(e.target.value))}
                />
              </div>

              {/* Colación toggle */}
              <div>
                <label className="label">Colación</label>
                <div className="flex items-center gap-2 h-10">
                  <Toggle value={r.colacion} onChange={() => update(r.id, 'colacion', !r.colacion)} />
                  <span className="text-slate-400 text-xs">{r.colacion ? 'Sí' : 'No'}</span>
                </div>
              </div>

              {/* Valor colación */}
              <div>
                <label className="label">Valor colación</label>
                <input
                  type="number"
                  min="0"
                  className={`input-field text-sm py-2 transition-opacity ${r.colacion ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
                  placeholder="Por persona"
                  value={r.valor_colacion || ''}
                  onChange={(e) => update(r.id, 'valor_colacion', Number(e.target.value))}
                  disabled={!r.colacion}
                />
              </div>

              {/* Subtotal + eliminar */}
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Subtotal</p>
                  <p className="text-blue-400 font-semibold text-sm">{fmt(calcRoleTotal(r))}</p>
                </div>
                <button
                  onClick={() => removeRole(r.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors mb-0.5"
                  title="Eliminar cargo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desglose por persona */}
            {(r.precio_hora > 0 || r.horas > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>HH: {fmt(Number(r.precio_hora) * Number(r.horas))} × {r.cantidad} persona(s) = {fmt(Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad))}</span>
                {r.colacion && r.valor_colacion > 0 && (
                  <span>Colación: {fmt(r.valor_colacion)} × {r.cantidad} = {fmt(Number(r.valor_colacion) * Number(r.cantidad))}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <div className="bg-slate-900 rounded-lg px-5 py-3 flex items-center gap-4">
          <span className="text-slate-400 text-sm">Total Horas Hombre:</span>
          <span className="text-blue-400 font-bold text-lg">{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}
