import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const SERVICIOS_LABELS = {
  corte_plasma: 'Corte Plasma', corte_laser: 'Corte Láser', oxicorte: 'Oxicorte',
  tratamiento_termico: 'Tratamiento Térmico', plegado: 'Servicio de Plegado', cilindrado: 'Servicio de Cilindrado',
}

const CONDICIONES_OPCIONES = [
  '30 días factura', '60 días factura', 'Contado', '50% anticipo — 50% contra entrega', '100% anticipo', 'A convenir',
]

const ESTADOS_COT = ['Borrador', 'Enviada', 'En revisión', 'Aprobada', 'Rechazada', 'En producción', 'Entregada']

export default function TabResumen({
  cliente, setCliente, clientes = [],
  estado, setEstado,
  totalMateriales, totalHH, totalServicios, totalBases, totalEmbalaje = 0,
  bases,
  cantidadLotes, setCantidadLotes,
  unidadesPorLote, setUnidadesPorLote,
  config, setConfigField,
  servicios,
  numeroCot,
  saving, saveSuccess, saveError,
  onGuardar, onExportPDF, exportando,
  onExportFicha, exportandoFicha,
}) {
  const {
    flete = 0, incluyeIVA = false, validezDias = 30,
    condicionesPago = '', plazoEntrega = '', notas = '',
    descuento = 0, tipoDescuento = 'porcentaje',
    moneda = 'CLP', tipoCambio = 1,
  } = config

  const tc = Number(tipoCambio) || 1
  const fmtM = (n) => {
    const v = Number(n) || 0
    if (moneda === 'USD') return `USD ${(v / tc).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (moneda === 'UF')  return `${(v / tc).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`
    return fmt(v)
  }

  const baseCalculo = totalMateriales + totalHH
  const costoSinDescuento = totalMateriales + totalHH + totalServicios + totalBases + totalEmbalaje
  const descuentoMonto = tipoDescuento === 'porcentaje'
    ? costoSinDescuento * (Number(descuento) || 0) / 100
    : Number(descuento) || 0
  const costoTotal = costoSinDescuento - descuentoMonto
  const totalNeto = costoTotal + Number(flete)
  const totalIVA = incluyeIVA ? totalNeto * 0.19 : 0
  const totalFinal = totalNeto + totalIVA
  const costoTotalLotes = totalFinal * cantidadLotes
  const totalUnidades = cantidadLotes * unidadesPorLote
  const costoUnitario = totalUnidades > 0 ? costoTotalLotes / totalUnidades : 0
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
            <select className="input-field" value={estado || 'Borrador'}
              onChange={(e) => setEstado(e.target.value)}>
              {ESTADOS_COT.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Lotes y unidades */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Lotes y unidades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Cantidad de lotes</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" className="input-field" value={cantidadLotes}
                onChange={(e) => setCantidadLotes(Math.max(1, Number(e.target.value)))} />
              <span className="text-slate-400 text-sm whitespace-nowrap">lote(s)</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">Los costos ingresados corresponden a 1 lote.</p>
          </div>
          <div>
            <label className="label">Unidades por lote</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" className="input-field" value={unidadesPorLote}
                onChange={(e) => setUnidadesPorLote(Math.max(1, Number(e.target.value)))} />
              <span className="text-slate-400 text-sm whitespace-nowrap">unid.</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">Ej: 10 bombas por lote → costo unitario.</p>
          </div>
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
          <SRow label="Materiales" value={totalMateriales} fmtFn={fmtM} />
          <SRow label="Horas Hombre" value={totalHH} fmtFn={fmtM} />

          {activeServicios.length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-1">Servicios</p>
              {activeServicios.map(([k, s]) => (
                <SRow key={k} label={SERVICIOS_LABELS[k]} value={s.precio || 0} indent fmtFn={fmtM} />
              ))}
              <SRow label="Subtotal servicios" value={totalServicios} fmtFn={fmtM} />
            </div>
          )}

          {bases.filter(b => Number(b.porcentaje) > 0).length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-1">% sobre base (Mat. + HH)</p>
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

      {/* Totales finales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-blue-500/40 bg-blue-600/5">
          <p className="text-blue-300 font-semibold mb-1">
            Total — {cantidadLotes} {cantidadLotes === 1 ? 'lote' : 'lotes'}
          </p>
          {cantidadLotes > 1 && (
            <p className="text-slate-500 text-xs mb-2">{fmtM(totalFinal)} × {cantidadLotes} lotes</p>
          )}
          <p className="text-blue-400 font-bold text-3xl">{fmtM(costoTotalLotes)}</p>
          {incluyeIVA && <p className="text-slate-500 text-xs mt-1">IVA incluido</p>}
          {moneda !== 'CLP' && <p className="text-slate-500 text-xs mt-1">{fmt(costoTotalLotes)} CLP</p>}
        </div>
        <div className="card border-emerald-500/40 bg-emerald-600/5">
          <p className="text-emerald-300 font-semibold mb-1">Costo por unidad</p>
          <p className="text-slate-500 text-xs mb-2">
            {fmtM(costoTotalLotes)} ÷ {totalUnidades} unid.
          </p>
          <p className="text-emerald-400 font-bold text-3xl">{fmtM(costoUnitario)}</p>
          {moneda !== 'CLP' && <p className="text-slate-500 text-xs mt-1">{fmt(costoUnitario)} CLP</p>}
        </div>
      </div>

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
        <button onClick={onExportPDF} className="btn-secondary" disabled={exportando}>
          {exportando ? 'Generando PDF...' : 'Exportar PDF'}
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
