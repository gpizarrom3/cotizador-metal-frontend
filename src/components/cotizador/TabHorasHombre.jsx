import { useState } from 'react'
import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const calcDiasTrabajados = (r) => Math.ceil(Number(r.horas) / 8) || 0

const calcRoleTotal = (r) => {
  const hh = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
  const dias = calcDiasTrabajados(r)
  const col = r.colacion ? (dias * Number(r.cantidad) * Number(r.valor_colacion)) || 0 : 0
  return hh + col
}

const newRole = () => ({ id: Date.now() + Math.random(), nombre: '', precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0, grupo: '', ubicacion: 'taller' })

const FUEL_ICON = (
  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

function CombustibleCard({ combustible, setCombustible }) {
  const upd = (field, val) => setCombustible(c => ({ ...c, [field]: val }))
  const valorDia  = (Number(combustible.precio_litro) * Number(combustible.litros_dia)) || 0
  const total     = valorDia * (Number(combustible.total_dias) || 0)

  return (
    <div className="card border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
          <h3 className="text-white font-semibold flex items-center gap-2">
            Combustible
          </h3>
          {total > 0 && (
            <span className="text-orange-400 font-bold text-sm">{fmt(total)}</span>
          )}
        </div>
        <Toggle value={combustible.activo} onChange={() => upd('activo', !combustible.activo)} />
      </div>

      {!combustible.activo && (
        <p className="text-slate-600 text-xs mt-2">Activa para registrar el costo de combustible del proyecto.</p>
      )}

      {combustible.activo && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Valor combustible ($/litro)</label>
              <input
                type="number" min="0"
                className="input-field text-sm py-2"
                placeholder="Ej: 1200"
                value={combustible.precio_litro || ''}
                onChange={e => upd('precio_litro', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Litros por día</label>
              <input
                type="number" min="0" step="0.5"
                className="input-field text-sm py-2"
                placeholder="Ej: 40"
                value={combustible.litros_dia || ''}
                onChange={e => upd('litros_dia', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Total de días</label>
              <input
                type="number" min="0"
                className="input-field text-sm py-2"
                placeholder="Ej: 5"
                value={combustible.total_dias || ''}
                onChange={e => upd('total_dias', Number(e.target.value))}
              />
            </div>
          </div>

          {valorDia > 0 && (
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 pt-1 border-t border-slate-700">
              <span>
                Valor por día:{' '}
                <span className="text-orange-300 font-semibold">{fmt(valorDia)}</span>
                {combustible.litros_dia > 0 && (
                  <span className="text-slate-600 ml-1">
                    ({combustible.litros_dia} L × {fmt(combustible.precio_litro)}/L)
                  </span>
                )}
              </span>
              {combustible.total_dias > 0 && (
                <span>
                  Total:{' '}
                  <span className="text-orange-400 font-bold">{fmt(total)}</span>
                  <span className="text-slate-600 ml-1">
                    ({fmt(valorDia)}/día × {combustible.total_dias} días)
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TabHorasHombre({ roles, setRoles, configRoles = [], grupos = [], combustible = {}, setCombustible = () => {} }) {
  const update = (id, field, value) =>
    setRoles(roles.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const updateMulti = (id, fields) =>
    setRoles(roles.map((r) => (r.id === id ? { ...r, ...fields } : r)))
  const removeRole = (id) => setRoles(roles.filter((r) => r.id !== id))

  const addRoleToGroup = (grupo) =>
    setRoles([...roles, { ...newRole(), grupo }])

  const total = roles.reduce((acc, r) => acc + calcRoleTotal(r), 0)

  // Grupos activos = grupos de materiales que tienen al menos 1 cargo, más los usados
  const gruposActivos = grupos.length > 0
    ? grupos
    : [...new Set(roles.map(r => r.grupo).filter(Boolean))]

  const rolesSinGrupo = roles.filter(r => !r.grupo)

  const renderCargo = (r) => (
    <div key={r.id} className="bg-slate-950 border border-slate-700 rounded-lg p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3 items-end">
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
            type="number" min="0"
            className="input-field text-sm py-2"
            placeholder="Ej: 1500"
            value={r.precio_hora || ''}
            onChange={(e) => update(r.id, 'precio_hora', Number(e.target.value))}
          />
        </div>

        {/* Personas */}
        <div>
          <label className="label">Personas</label>
          <input
            type="number" min="1"
            className="input-field text-sm py-2"
            value={r.cantidad}
            onChange={(e) => update(r.id, 'cantidad', Number(e.target.value))}
          />
        </div>

        {/* Horas totales */}
        <div>
          <label className="label">Horas totales</label>
          <input
            type="number" min="0" step="0.5"
            className="input-field text-sm py-2"
            placeholder="0"
            value={r.horas || ''}
            onChange={(e) => update(r.id, 'horas', Number(e.target.value))}
          />
        </div>

        {/* Ubicación */}
        <div>
          <label className="label">Ubicación</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-600 h-10">
            <button
              type="button"
              onClick={() => update(r.id, 'ubicacion', 'taller')}
              className={`flex-1 text-xs font-medium transition-colors px-2 ${r.ubicacion !== 'terreno' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Taller
            </button>
            <button
              type="button"
              onClick={() => update(r.id, 'ubicacion', 'terreno')}
              className={`flex-1 text-xs font-medium transition-colors px-2 ${r.ubicacion === 'terreno' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Terreno
            </button>
          </div>
        </div>

        {/* Colación */}
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
            type="number" min="0"
            className={`input-field text-sm py-2 transition-opacity ${r.colacion ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
            placeholder="Por persona/día"
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
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {(r.precio_hora > 0 || r.horas > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>HH: {fmt(Number(r.precio_hora) * Number(r.horas))} × {r.cantidad} persona(s) = {fmt(Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad))}</span>
          {r.colacion && r.valor_colacion > 0 && (() => {
            const dias = calcDiasTrabajados(r)
            return (
              <span className="text-amber-500/80">
                Colación: {dias} día(s) × {r.cantidad} pers. × {fmt(r.valor_colacion)} = {fmt(dias * Number(r.cantidad) * Number(r.valor_colacion))}
              </span>
            )
          })()}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Grupos de materiales como contenedores */}
      {gruposActivos.map((grupo) => {
        const rolesGrupo = roles.filter(r => r.grupo === grupo)
        const subtotal = rolesGrupo.reduce((acc, r) => acc + calcRoleTotal(r), 0)
        const horasTotal = rolesGrupo.reduce((acc, r) => acc + (Number(r.horas) * Number(r.cantidad) || 0), 0)

        return (
          <div key={grupo} className="card border border-slate-700">
            {/* Header del grupo */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <h3 className="text-white font-semibold">{grupo}</h3>
                {rolesGrupo.length > 0 && (
                  <span className="text-xs text-slate-500">{horasTotal.toFixed(1)} hrs·persona</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {rolesGrupo.length > 0 && (
                  <span className="text-blue-400 font-bold">{fmt(subtotal)}</span>
                )}
                <button
                  onClick={() => addRoleToGroup(grupo)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  + Agregar cargo
                </button>
              </div>
            </div>

            {rolesGrupo.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">
                Sin cargos asignados — haz click en "+ Agregar cargo"
              </p>
            ) : (
              <div className="space-y-3">
                {rolesGrupo.map(renderCargo)}
              </div>
            )}
          </div>
        )
      })}

      {/* Cargos sin grupo (si los hay) */}
      {rolesSinGrupo.length > 0 && (
        <div className="card border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0" />
              <h3 className="text-slate-400 font-semibold">Sin grupo</h3>
            </div>
            <span className="text-slate-400 font-bold">
              {fmt(rolesSinGrupo.reduce((acc, r) => acc + calcRoleTotal(r), 0))}
            </span>
          </div>
          <div className="space-y-3">
            {rolesSinGrupo.map(renderCargo)}
          </div>
        </div>
      )}

      {/* Botón para agregar cargo sin grupo cuando no hay grupos de materiales */}
      {grupos.length === 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Horas Hombre por cargo</h2>
            <button onClick={() => setRoles([...roles, { ...newRole() }])} className="btn-secondary text-sm py-2">
              + Agregar cargo
            </button>
          </div>
          <div className="space-y-3">
            {roles.map(renderCargo)}
          </div>
        </div>
      )}

      {/* Combustible */}
      <CombustibleCard combustible={combustible} setCombustible={setCombustible} />

      {/* Total general */}
      {(() => {
        const totalCombustible = combustible.activo
          ? (Number(combustible.precio_litro) * Number(combustible.litros_dia) * Number(combustible.total_dias)) || 0
          : 0
        const totalConCombustible = total + totalCombustible
        return (
          <div className="flex justify-end">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 flex items-center gap-4 flex-wrap justify-end">
              {totalCombustible > 0 && (
                <span className="text-slate-500 text-xs">
                  HH {fmt(total)} + Combustible {fmt(totalCombustible)}
                </span>
              )}
              <span className="text-slate-400 text-sm">Total HH:</span>
              <span className="text-blue-400 font-bold text-lg">{fmt(totalConCombustible)}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
