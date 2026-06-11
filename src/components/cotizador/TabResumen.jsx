import Toggle from '../ui/Toggle'
import { calcM2FromPesoData } from './TabMateriales'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const SERVICIOS_LABELS = {
  corte_plasma: 'Corte Plasma', corte_laser: 'Corte Láser', oxicorte: 'Oxicorte',
  tratamiento_termico: 'Tratamiento Térmico', plegado: 'Servicio de Plegado', cilindrado: 'Servicio de Cilindrado',
}

const CONDICIONES_OPCIONES = [
  '30 días factura', '60 días factura', 'Contado', '50% anticipo — 50% contra entrega', '100% anticipo', 'A convenir',
]

const ESTADOS_COT = ['Pendiente', 'Aprobada', 'Entregada']

export default function TabResumen({
  cliente, setCliente, clientes = [],
  estado, setEstado,
  totalMateriales, totalHH, totalServicios, totalBases, totalEmbalaje = 0,
  bases,
  unidadesPorLote, setUnidadesPorLote,
  config, setConfigField,
  servicios,
  numeroCot,
  saving, saveSuccess, saveError,
  onGuardar, onExportPDF, exportando,
  onExportFicha, exportandoFicha,
  onVerCotizacion,
  conMaterial, totalConsumibles = 0,
  pesoMateriales = 0, pesoServicios = 0,
  materiales = [],
  roles = [],
}) {
  const {
    flete = 0, incluyeIVA = false, validezDias = 30,
    condicionesPago = '', plazoEntrega = '', notas = '',
    descuento = 0, tipoDescuento = 'porcentaje',
    moneda = 'CLP', tipoCambio = 1,
    descripcion = '', numeroReferencia = '',
    markupServicios = 0,
  } = config

  const tc = Number(tipoCambio) || 1
  const fmtM = (n) => {
    const v = Number(n) || 0
    if (moneda === 'USD') return `USD ${(v / tc).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (moneda === 'UF')  return `${(v / tc).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`
    return fmt(v)
  }

  const baseSubtotal         = conMaterial === false ? totalConsumibles : totalMateriales
  const baseCalculo          = baseSubtotal + totalHH
  const totalMarkupServicios = totalServicios > 0 ? totalServicios * (Number(markupServicios) || 0) / 100 : 0
  const costoSinDescuento    = baseSubtotal + totalHH + totalServicios + totalMarkupServicios + totalBases + totalEmbalaje
  const descuentoMonto = tipoDescuento === 'porcentaje'
    ? costoSinDescuento * (Number(descuento) || 0) / 100
    : Number(descuento) || 0
  const costoTotal = costoSinDescuento - descuentoMonto
  const totalNeto = costoTotal + Number(flete)
  const totalIVA = incluyeIVA ? totalNeto * 0.19 : 0
  const totalFinal = totalNeto + totalIVA
  const totalUnidades = Number(unidadesPorLote) || 1
  const costoUnitario = totalUnidades > 0 ? totalFinal / totalUnidades : 0
  const activeServicios = Object.entries(servicios).filter(([, s]) => s.activo)

  return (
    <div className="space-y-5">
      {/* Datos cotización */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Datos de la cotización</h2>
          {numeroCot && (
            <span className="text-blue-400 font-mono font-bold text-sm bg-blue-600/10 border border-blue-500/30 px-3 py-1 rounded-lg">
              {numeroCot}
            </span>
          )}
        </div>

        {/* Selector de cliente guardado */}
        {clientes.length > 0 && (
          <div className="mb-4">
            <label className="label">Seleccionar cliente guardado</label>
            <select
              className="input-field"
              value=""
              onChange={(e) => {
                const c = clientes.find((cl) => cl.id === e.target.value)
                if (c) setCliente({ nombre: c.nombre || '', rut: c.rut || '', email: c.email || '', telefono: c.telefono || '' })
              }}
            >
              <option value="">— Elige un cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{c.rut ? ` · ${c.rut}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Cliente / Empresa</label>
            <input type="text" className="input-field" placeholder="Nombre del cliente"
              value={cliente.nombre || ''}
              onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
          </div>
          <div>
            <label className="label">RUT</label>
            <input type="text" className="input-field" placeholder="Ej: 12.345.678-9"
              value={cliente.rut || ''}
              onChange={(e) => setCliente({ ...cliente, rut: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" placeholder="contacto@empresa.cl"
              value={cliente.email || ''}
              onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input type="text" className="input-field" placeholder="+56 9 1234 5678"
              value={cliente.telefono || ''}
              onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Descripción</label>
            <input type="text" className="input-field" placeholder="Ej: Fabricación estructura metálica..."
              value={descripcion}
              onChange={(e) => setConfigField('descripcion', e.target.value)} />
          </div>
          <div>
            <label className="label">N° Referencia cliente</label>
            <input type="text" className="input-field" placeholder="Ej: OC-2025-1234, Licitación N°..."
              value={numeroReferencia}
              onChange={(e) => setConfigField('numeroReferencia', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Validez</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" className="input-field" value={validezDias}
                onChange={(e) => setConfigField('validezDias', Number(e.target.value))} />
              <span className="text-slate-400 text-sm whitespace-nowrap">días</span>
            </div>
          </div>
          <div>
            <label className="label">Plazo de entrega</label>
            <input type="text" className="input-field" placeholder="Ej: 15 días hábiles"
              value={plazoEntrega}
              onChange={(e) => setConfigField('plazoEntrega', e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input-field" value={estado || 'Pendiente'}
              onChange={(e) => setEstado(e.target.value)}>
              {ESTADOS_COT.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Unidades */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-1">Alcance de la cubicación</h2>
        <p className="text-slate-500 text-xs mb-4">
          Los materiales, HH y servicios ingresados corresponden a la fabricación de:
        </p>
        <div className="flex items-center gap-3">
          <input type="number" min="1" className="input-field max-w-[96px] text-center text-lg font-bold" value={unidadesPorLote}
            onChange={(e) => setUnidadesPorLote(Math.max(1, Number(e.target.value)))} />
          <span className="text-slate-300 text-sm font-medium">unidades</span>
          {unidadesPorLote > 1 && (
            <span className="text-slate-500 text-xs">→ se calculará el costo por unidad</span>
          )}
        </div>
      </div>

      {/* Moneda */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Moneda de presentación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label">Moneda</label>
            <select className="input-field" value={moneda}
              onChange={(e) => setConfigField('moneda', e.target.value)}>
              <option value="CLP">CLP — Peso chileno</option>
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="UF">UF — Unidad de Fomento</option>
            </select>
          </div>
          {moneda !== 'CLP' && (
            <div className="sm:col-span-2">
              <label className="label">Tipo de cambio (1 {moneda} = ? CLP)</label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" step="0.01" className="input-field"
                  placeholder={moneda === 'USD' ? 'Ej: 950' : 'Ej: 37500'}
                  value={tipoCambio || ''}
                  onChange={(e) => setConfigField('tipoCambio', Number(e.target.value))} />
                <span className="text-slate-400 text-sm whitespace-nowrap">CLP / {moneda}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-5">Desglose de costos — 1 lote</h2>
        <div className="space-y-1.5">
          {conMaterial === false
            ? <SRow label="Consumibles de taller" value={totalConsumibles} fmtFn={fmtM} />
            : <SRow label="Materiales" value={totalMateriales} fmtFn={fmtM} />
          }
          <SRow label="Horas Hombre" value={totalHH} fmtFn={fmtM} />
          {(() => {
            const grupos = [...new Set(roles.map(r => r.grupo).filter(Boolean))]
            if (grupos.length === 0) return null
            const calcRoleTotal = (r) => {
              const hh = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
              const col = r.colacion ? (Number(r.valor_colacion) * Number(r.cantidad)) || 0 : 0
              return hh + col
            }
            return grupos.map(g => {
              const subtotal = roles.filter(r => r.grupo === g).reduce((acc, r) => acc + calcRoleTotal(r), 0)
              const horas = roles.filter(r => r.grupo === g).reduce((acc, r) => acc + (Number(r.horas) * Number(r.cantidad) || 0), 0)
              return (
                <div key={g} className="flex justify-between items-center py-1 pl-5">
                  <span className="text-slate-500 text-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 flex-shrink-0" />
                    {g}
                    <span className="text-slate-600 text-xs">({horas.toFixed(1)} h)</span>
                  </span>
                  <span className="text-slate-500 font-medium text-sm">{fmtM(subtotal)}</span>
                </div>
              )
            })
          })()}

          {totalServicios > 0 && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-1">Servicios externos</p>
              {activeServicios.map(([k, s]) => (
                <SRow key={k} label={SERVICIOS_LABELS[k]} value={s.precio || 0} indent fmtFn={fmtM} />
              ))}
              {(servicios.custom || []).map(s => (
                <SRow key={s.id} label={s.nombre} value={(s.cantidad || 1) * (s.precio_ref || 0)} indent fmtFn={fmtM} />
              ))}
              <SRow label="Subtotal servicios" value={totalServicios} fmtFn={fmtM} />
              {/* Markup de gestión */}
              <div className="flex items-center justify-between py-1.5 pl-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-stone-500 text-sm">Gestión / coordinación</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0" max="50" step="0.5"
                      className="input-field text-xs py-1 w-16 text-right"
                      placeholder="0"
                      value={markupServicios || ''}
                      onChange={e => setConfigField('markupServicios', Number(e.target.value))}
                    />
                    <span className="text-stone-500 text-xs">%</span>
                  </div>
                </div>
                <span className={`font-medium text-sm ${totalMarkupServicios > 0 ? 'text-slate-300' : 'text-stone-700'}`}>
                  {totalMarkupServicios > 0 ? fmtM(totalMarkupServicios) : '—'}
                </span>
              </div>
            </div>
          )}

          {bases.filter(b => Number(b.porcentaje) > 0).length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-1">
                % sobre base ({conMaterial === false ? 'Consumibles + HH' : 'Mat. + HH'})
              </p>
              {bases.filter(b => Number(b.porcentaje) > 0).map(b => (
                <SRow key={b.id} label={`${b.nombre} (${b.porcentaje}%)`} value={baseCalculo * b.porcentaje / 100} indent fmtFn={fmtM} />
              ))}
              <SRow label="Subtotal % bases" value={totalBases} fmtFn={fmtM} />
            </div>
          )}

          {totalEmbalaje > 0 && (
            <div className="pt-1">
              <SRow label="Embalaje y Envío" value={totalEmbalaje} fmtFn={fmtM} />
            </div>
          )}

          {/* Descuento */}
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-slate-400 text-sm">Descuento</span>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg overflow-hidden border border-slate-600">
                  <button
                    onClick={() => setConfigField('tipoDescuento', 'porcentaje')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${tipoDescuento === 'porcentaje' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    %
                  </button>
                  <button
                    onClick={() => setConfigField('tipoDescuento', 'monto')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${tipoDescuento === 'monto' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    $
                  </button>
                </div>
                <input
                  type="number" min="0"
                  className="input-field text-sm py-1.5 w-28 text-right"
                  placeholder="0"
                  value={descuento || ''}
                  onChange={(e) => setConfigField('descuento', Number(e.target.value))}
                />
              </div>
            </div>
            {descuentoMonto > 0 && (
              <div className="flex justify-between items-center py-1.5 mt-1">
                <span className="text-red-400 text-sm pl-1">
                  — Descuento {tipoDescuento === 'porcentaje' ? `(${descuento}%)` : '(monto fijo)'}
                </span>
                <span className="text-red-400 font-medium">− {fmtM(descuentoMonto)}</span>
              </div>
            )}
          </div>

          {/* Flete */}
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Flete / transporte</span>
              <input
                type="number" min="0"
                className="input-field text-sm py-1.5 w-36 text-right"
                placeholder="0"
                value={flete || ''}
                onChange={(e) => setConfigField('flete', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Neto */}
          <div className="border-t border-slate-600 pt-3 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">Neto (1 lote)</span>
              <span className="text-white font-bold text-lg">{fmtM(totalNeto)}</span>
            </div>
          </div>

          {/* IVA toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Toggle value={incluyeIVA} onChange={() => setConfigField('incluyeIVA', !incluyeIVA)} />
              <span className="text-slate-300 text-sm font-medium">Incluir IVA (19%)</span>
            </div>
            {incluyeIVA && <span className="text-slate-300 font-medium">{fmtM(totalIVA)}</span>}
          </div>
        </div>
      </div>

      {/* Directos vs Indirectos */}
      {costoSinDescuento > 0 && (() => {
        const totalDirectos   = baseSubtotal + totalHH + totalServicios + totalMarkupServicios + totalEmbalaje
        const totalIndirectos = totalBases
        const pctD = totalDirectos   / costoSinDescuento * 100
        const pctI = totalIndirectos / costoSinDescuento * 100
        return (
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Costos directos vs. indirectos</h2>
            {/* barra proporcional */}
            <div className="flex h-2.5 rounded-full overflow-hidden mb-4 bg-slate-700">
              <div className="bg-blue-500 transition-all" style={{ width: `${pctD}%` }} />
              <div className="bg-amber-500 transition-all" style={{ width: `${pctI}%` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Directos */}
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-blue-300 font-medium text-sm">Costos Directos</span>
                  <span className="ml-auto text-blue-300/60 text-xs">{pctD.toFixed(1)}%</span>
                </div>
                <div className="space-y-1 text-xs">
                  {conMaterial === false
                    ? <div className="flex justify-between text-slate-400"><span>Consumibles</span><span>{fmtM(totalConsumibles)}</span></div>
                    : <div className="flex justify-between text-slate-400"><span>Materiales</span><span>{fmtM(totalMateriales)}</span></div>
                  }
                  <div className="flex justify-between text-slate-400"><span>Horas Hombre</span><span>{fmtM(totalHH)}</span></div>
                  {(totalServicios + totalMarkupServicios) > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Servicios ext.{totalMarkupServicios > 0 ? ' + gestión' : ''}</span>
                      <span>{fmtM(totalServicios + totalMarkupServicios)}</span>
                    </div>
                  )}
                  {totalEmbalaje > 0 && (
                    <div className="flex justify-between text-slate-400"><span>Embalaje y Envío</span><span>{fmtM(totalEmbalaje)}</span></div>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-blue-500/20 flex justify-between items-baseline">
                  <span className="text-blue-200 text-sm font-semibold">Total directos</span>
                  <span className="text-blue-200 font-bold">{fmtM(totalDirectos)}</span>
                </div>
              </div>
              {/* Indirectos */}
              <div className="p-3 bg-amber-600/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-amber-300 font-medium text-sm">Costos Indirectos</span>
                  <span className="ml-auto text-amber-300/60 text-xs">{pctI.toFixed(1)}%</span>
                </div>
                <div className="space-y-1 text-xs">
                  {bases.filter(b => Number(b.porcentaje) > 0).length > 0
                    ? bases.filter(b => Number(b.porcentaje) > 0).map(b => (
                        <div key={b.id} className="flex justify-between text-slate-400">
                          <span>{b.nombre} ({b.porcentaje}%)</span>
                          <span>{fmtM(baseCalculo * b.porcentaje / 100)}</span>
                        </div>
                      ))
                    : <p className="text-slate-600 text-xs italic">Sin % bases configurados</p>
                  }
                </div>
                <div className="mt-3 pt-2 border-t border-amber-500/20 flex justify-between items-baseline">
                  <span className="text-amber-200 text-sm font-semibold">Total indirectos</span>
                  <span className="text-amber-200 font-bold">{fmtM(totalIndirectos)}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Totales finales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-blue-500/40 bg-blue-600/5">
          <p className="text-blue-300 font-semibold mb-1">Total cotización</p>
          <p className="text-blue-400 font-bold text-3xl">{fmtM(totalFinal)}</p>
          {incluyeIVA && <p className="text-slate-500 text-xs mt-1">IVA incluido</p>}
          {moneda !== 'CLP' && <p className="text-slate-500 text-xs mt-1">{fmt(totalFinal)} CLP</p>}
        </div>
        <div className="card border-emerald-500/40 bg-emerald-600/5">
          <p className="text-emerald-300 font-semibold mb-1">Costo por unidad</p>
          {totalUnidades > 1 && (
            <p className="text-slate-500 text-xs mb-2">
              {fmtM(totalFinal)} ÷ {totalUnidades} unid.
            </p>
          )}
          <p className="text-emerald-400 font-bold text-3xl">{fmtM(costoUnitario)}</p>
          {moneda !== 'CLP' && <p className="text-slate-500 text-xs mt-1">{fmt(costoUnitario)} CLP</p>}
        </div>
      </div>

      {/* Peso estimado */}
      {(pesoMateriales > 0 || pesoServicios > 0) && (() => {
        const pesoTotal   = pesoMateriales + pesoServicios
        const totalUnid   = Number(unidadesPorLote) || 1
        const pesoUnitario = totalUnid > 0 ? pesoTotal / totalUnid : 0
        return (
          <div className="card border-emerald-500/20 bg-emerald-600/5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <h3 className="text-sm font-semibold text-emerald-400">Peso estimado de la estructura</h3>
            </div>
            <div className="flex gap-8 flex-wrap">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Peso total (todos los lotes)</p>
                <p className="text-white font-bold text-2xl">{pesoTotal.toFixed(2)} <span className="text-slate-400 text-sm font-normal">kg</span></p>
              </div>
              {totalUnid > 1 && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Peso por unidad ({totalUnid} un.)</p>
                  <p className="text-emerald-400 font-bold text-2xl">{pesoUnitario.toFixed(2)} <span className="text-emerald-600 text-sm font-normal">kg/un.</span></p>
                </div>
              )}
            </div>
            {pesoMateriales > 0 && pesoServicios > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-500/10 flex gap-6 flex-wrap text-xs text-slate-500">
                <span>Materiales: <span className="text-slate-300">{pesoMateriales.toFixed(2)} kg</span></span>
                <span>Servicios: <span className="text-emerald-400">{pesoServicios.toFixed(2)} kg</span></span>
              </div>
            )}
          </div>
        )
      })()}

      {/* Superficie estimada para pintura */}
      {(() => {
        const m2Grupos = materiales.map(sp => ({
          nombre: sp.nombre,
          m2: (sp.items || []).reduce((acc, m) => acc + calcM2FromPesoData(m.pesoData) * (Number(m.cantidad) || 1), 0)
        })).filter(g => g.m2 > 0)
        const m2Total = m2Grupos.reduce((acc, g) => acc + g.m2, 0)
        if (m2Total <= 0) return null
        const totalUnid = Number(unidadesPorLote) || 1
        return (
          <div className="card border-sky-500/20 bg-sky-600/5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16" />
              </svg>
              <h3 className="text-sm font-semibold text-sky-400">Superficie estimada para pintura</h3>
            </div>
            <div className="flex gap-8 flex-wrap">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Total</p>
                <p className="text-white font-bold text-2xl">{m2Total.toFixed(3)} <span className="text-slate-400 text-sm font-normal">m²</span></p>
              </div>
              {totalUnid > 1 && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Por unidad ({totalUnid} un.)</p>
                  <p className="text-sky-400 font-bold text-2xl">{(m2Total / totalUnid).toFixed(3)} <span className="text-sky-600 text-sm font-normal">m²/un.</span></p>
                </div>
              )}
            </div>
            {m2Grupos.length > 1 && (
              <div className="mt-3 pt-3 border-t border-sky-500/10 flex gap-6 flex-wrap text-xs text-slate-500">
                {m2Grupos.map(g => (
                  <span key={g.nombre}>{g.nombre}: <span className="text-slate-300">{g.m2.toFixed(3)} m²</span></span>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Condiciones de pago */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Condiciones comerciales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Condiciones de pago</label>
            <select
              className="input-field"
              value={CONDICIONES_OPCIONES.includes(condicionesPago) ? condicionesPago : (condicionesPago ? 'custom' : '')}
              onChange={(e) => { if (e.target.value !== 'custom') setConfigField('condicionesPago', e.target.value) }}
            >
              <option value="">Seleccionar...</option>
              {CONDICIONES_OPCIONES.map(o => <option key={o} value={o}>{o}</option>)}
              <option value="custom">Personalizado...</option>
            </select>
            <input
              type="text"
              className="input-field mt-2 text-sm"
              placeholder="O escribe las condiciones..."
              value={condicionesPago}
              onChange={(e) => setConfigField('condicionesPago', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notas / Observaciones</label>
            <textarea
              className="input-field text-sm resize-none"
              rows={4}
              placeholder="Condiciones técnicas, exclusiones, aclaraciones..."
              value={notas}
              onChange={(e) => setConfigField('notas', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {saveSuccess && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cotización guardada con número <strong>{numeroCot}</strong>
        </div>
      )}
      {saveError && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3">{saveError}</div>
      )}

      <div className="flex justify-end gap-3 flex-wrap">
        <button onClick={onExportFicha} className="btn-secondary" disabled={exportandoFicha}
          title="Documento interno con desglose completo de costos">
          {exportandoFicha ? 'Generando...' : 'Ficha de costos interna'}
        </button>
        <button onClick={onVerCotizacion} className="btn-secondary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Ver cotización PDF
        </button>
        <button onClick={onGuardar} className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cotización'}
        </button>
      </div>
    </div>
  )
}

function SRow({ label, value, indent, fmtFn }) {
  const display = fmtFn ? fmtFn(value) : fmt(value)
  return (
    <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-5' : ''}`}>
      <span className={`text-sm ${indent ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <span className={`font-medium ${indent ? 'text-slate-500' : 'text-slate-200'}`}>{display}</span>
    </div>
  )
}
