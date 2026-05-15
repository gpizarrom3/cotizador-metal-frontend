import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const SERVICIOS_LABELS = {
  corte_plasma: 'Corte Plasma', corte_laser: 'Corte Láser', oxicorte: 'Oxicorte',
  tratamiento_termico: 'Tratamiento Térmico', plegado: 'Servicio de Plegado', cilindrado: 'Servicio de Cilindrado',
}

const CONDICIONES_OPCIONES = [
  '30 días factura', '60 días factura', 'Contado', '50% anticipo — 50% contra entrega', '100% anticipo', 'A convenir',
]

export default function TabResumen({
  cliente, setCliente,
  totalMateriales, totalHH, totalServicios, totalBases, totalEmbalaje = 0,
  bases, baseCalculo, costoTotal,
  cantidadLotes, setCantidadLotes,
  unidadesPorLote, setUnidadesPorLote,
  config, setConfigField,
  servicios,
  numeroCot,
  saving, saveSuccess, saveError,
  onGuardar, onExportPDF, exportando,
}) {
  const { flete = 0, incluyeIVA = false, validezDias = 30, condicionesPago = '', plazoEntrega = '', notas = '' } = config

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Cliente / Empresa</label>
            <input type="text" className="input-field" placeholder="Nombre del cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div>
            <label className="label">Validez de la cotización</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" className="input-field" value={validezDias} onChange={(e) => setConfigField('validezDias', Number(e.target.value))} />
              <span className="text-slate-400 text-sm whitespace-nowrap">días</span>
            </div>
          </div>
          <div>
            <label className="label">Plazo de entrega</label>
            <input type="text" className="input-field" placeholder="Ej: 15 días hábiles" value={plazoEntrega} onChange={(e) => setConfigField('plazoEntrega', e.target.value)} />
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
              <input type="number" min="1" className="input-field" value={cantidadLotes} onChange={(e) => setCantidadLotes(Math.max(1, Number(e.target.value)))} />
              <span className="text-slate-400 text-sm whitespace-nowrap">lote(s)</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">Los costos ingresados corresponden a 1 lote.</p>
          </div>
          <div>
            <label className="label">Unidades por lote</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" className="input-field" value={unidadesPorLote} onChange={(e) => setUnidadesPorLote(Math.max(1, Number(e.target.value)))} />
              <span className="text-slate-400 text-sm whitespace-nowrap">unid.</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">Ej: 10 bombas por lote → costo unitario.</p>
          </div>
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-5">Desglose de costos — 1 lote</h2>
        <div className="space-y-1.5">
          <SRow label="Materiales" value={totalMateriales} />
          <SRow label="Horas Hombre" value={totalHH} />
          {activeServicios.length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-1">Servicios</p>
              {activeServicios.map(([k, s]) => <SRow key={k} label={SERVICIOS_LABELS[k]} value={s.precio || 0} indent />)}
              <SRow label="Subtotal servicios" value={totalServicios} />
            </div>
          )}
          {bases.filter(b => Number(b.porcentaje) > 0).length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-1">% sobre base (Mat. + HH)</p>
              {bases.filter(b => Number(b.porcentaje) > 0).map(b => (
                <SRow key={b.id} label={`${b.nombre} (${b.porcentaje}%)`} value={baseCalculo * b.porcentaje / 100} indent />
              ))}
              <SRow label="Subtotal % bases" value={totalBases} />
            </div>
          )}

          {totalEmbalaje > 0 && (
            <div className="pt-1">
              <SRow label="Embalaje y Envío" value={totalEmbalaje} />
            </div>
          )}

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
              <span className="text-white font-bold text-lg">{fmt(totalNeto)}</span>
            </div>
          </div>

          {/* IVA toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Toggle value={incluyeIVA} onChange={() => setConfigField('incluyeIVA', !incluyeIVA)} />
              <span className="text-slate-300 text-sm font-medium">Incluir IVA (19%)</span>
            </div>
            {incluyeIVA && <span className="text-slate-300 font-medium">{fmt(totalIVA)}</span>}
          </div>
        </div>
      </div>

      {/* Totales finales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-blue-500/40 bg-blue-600/5">
          <p className="text-blue-300 font-semibold mb-1">
            Total — {cantidadLotes} {cantidadLotes === 1 ? 'lote' : 'lotes'}
          </p>
          {cantidadLotes > 1 && <p className="text-slate-500 text-xs mb-2">{fmt(totalFinal)} × {cantidadLotes} lotes</p>}
          <p className="text-blue-400 font-bold text-3xl">{fmt(costoTotalLotes)}</p>
          {incluyeIVA && <p className="text-slate-500 text-xs mt-1">IVA incluido</p>}
        </div>
        <div className="card border-emerald-500/40 bg-emerald-600/5">
          <p className="text-emerald-300 font-semibold mb-1">Costo por unidad</p>
          <p className="text-slate-500 text-xs mb-2">
            {fmt(costoTotalLotes)} ÷ {totalUnidades} unid.
          </p>
          <p className="text-emerald-400 font-bold text-3xl">{fmt(costoUnitario)}</p>
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
              value={CONDICIONES_OPCIONES.includes(condicionesPago) ? condicionesPago : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') setConfigField('condicionesPago', e.target.value)
              }}
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

      <div className="flex justify-end gap-3">
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

function SRow({ label, value, indent }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-5' : ''}`}>
      <span className={`text-sm ${indent ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <span className={`font-medium ${indent ? 'text-slate-500' : 'text-slate-200'}`}>{fmt(value)}</span>
    </div>
  )
}
