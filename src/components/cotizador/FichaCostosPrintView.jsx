const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const pct = (n) => `${Number(n) || 0}%`

const SERVICIOS_LABELS = {
  corte_plasma: 'Corte Plasma', corte_laser: 'Corte Láser', oxicorte: 'Oxicorte',
  tratamiento_termico: 'Tratamiento Térmico', plegado: 'Servicio de Plegado', cilindrado: 'Servicio de Cilindrado',
}

export default function FichaCostosPrintView({ empresa = {}, cot }) {
  const {
    numero, fecha,
    cliente: clienteRaw = '',
    materiales = [], roles = [], servicios = {}, bases = [],
    embalaje = {},
    cantidadLotes = 1, unidadesPorLote = 1,
    totalMateriales = 0, totalHH = 0, totalServicios = 0, totalBases = 0, totalEmbalaje = 0,
    config = {},
    estado = '',
  } = cot

  const clienteData = typeof clienteRaw === 'object' && clienteRaw !== null
    ? clienteRaw
    : { nombre: clienteRaw, rut: '', email: '', telefono: '' }

  const { flete = 0, incluyeIVA = false, descuento = 0, tipoDescuento = 'porcentaje', condicionesPago = '', plazoEntrega = '', notas = '' } = config

  const baseCalculo        = totalMateriales + totalHH + totalServicios + totalEmbalaje
  const costoSinDescuento  = totalMateriales + totalHH + totalServicios + totalBases + totalEmbalaje
  const descuentoMonto     = tipoDescuento === 'porcentaje' ? costoSinDescuento * (Number(descuento) || 0) / 100 : Number(descuento) || 0
  const costoTotal         = costoSinDescuento - descuentoMonto
  const totalNeto          = costoTotal + Number(flete)
  const totalIVA           = incluyeIVA ? totalNeto * 0.19 : 0
  const totalFinal         = totalNeto + totalIVA
  const totalUnidades      = cantidadLotes * unidadesPorLote
  const costoUnitario      = totalUnidades > 0 ? totalFinal / totalUnidades : 0
  const costoPorLote       = cantidadLotes > 1 ? totalFinal / cantidadLotes : 0

  const activeServicios       = Object.entries(servicios).filter(([, s]) => s.activo)
  const embalajeMatActivos    = (embalaje.materiales      || []).filter(m => Number(m.cantidad) > 0)
  const embalajePalletActivos = (embalaje.materialesPallet || []).filter(m => Number(m.cantidad) > 0)
  const tieneEmbalaje         = totalEmbalaje > 0

  const rolesActivos = roles.filter(r => Number(r.horas) > 0 || Number(r.precio_hora) > 0)

  return (
    <div id="ficha-costos-print" style={{ background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: '11px', width: '794px', padding: '40px', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '14px', borderBottom: '3px solid #991b1b' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{empresa.nombre || 'Empresa'}</div>
          {empresa.rut       && <div style={{ color: '#64748b', fontSize: '10px' }}>RUT: {empresa.rut}</div>}
          {empresa.giro      && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.giro}</div>}
          {empresa.direccion && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.direccion}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b', letterSpacing: '1px' }}>FICHA DE COSTOS INTERNA</div>
          <div style={{ display: 'inline-block', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '9px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '12px', marginTop: '4px', letterSpacing: '1px' }}>
            USO INTERNO — CONFIDENCIAL
          </div>
          <div style={{ marginTop: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>{numero || 'BORRADOR'}</span>
            {estado && <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px', background: '#f1f5f9', padding: '1px 6px', borderRadius: '10px' }}>{estado}</span>}
          </div>
          <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>Fecha: {fecha || new Date().toLocaleDateString('es-CL')}</div>
        </div>
      </div>

      {/* Cliente + Lotes */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
        <div style={{ flex: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Cliente</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{clienteData.nombre || '—'}</div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '3px', flexWrap: 'wrap' }}>
            {clienteData.rut      && <span style={{ color: '#64748b', fontSize: '10px' }}>RUT: {clienteData.rut}</span>}
            {clienteData.email    && <span style={{ color: '#64748b', fontSize: '10px' }}>{clienteData.email}</span>}
            {clienteData.telefono && <span style={{ color: '#64748b', fontSize: '10px' }}>Tel: {clienteData.telefono}</span>}
          </div>
        </div>
        <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Producción</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px' }}><strong>Lotes:</strong> {cantidadLotes}</span>
            <span style={{ fontSize: '11px' }}><strong>Unid./lote:</strong> {unidadesPorLote}</span>
            <span style={{ fontSize: '11px' }}><strong>Total unidades:</strong> {totalUnidades}</span>
          </div>
        </div>
      </div>

      {/* Materiales */}
      {materiales.length > 0 && (
        <Section title="1. Materiales" color="#1e3a5f">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                {['Material', 'Proveedor', 'Formato', 'Cant.', 'P. Unitario', 'Total'].map((c, i) => (
                  <th key={i} style={{ color: '#fff', fontSize: '10px', padding: '5px 8px', textAlign: i >= 3 ? 'right' : 'left' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materiales.map((m, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <Td>{m.nombre || '—'}</Td>
                  <Td>{m.proveedor || '—'}</Td>
                  <Td>{m.formato || '—'}</Td>
                  <Td right>{m.cantidad}</Td>
                  <Td right>{fmt(m.precio_unitario)}</Td>
                  <Td right bold>{fmt(Number(m.cantidad) * Number(m.precio_unitario))}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <SubtotalRow label="SUBTOTAL MATERIALES" value={fmt(totalMateriales)} />
        </Section>
      )}

      {/* Horas Hombre */}
      {rolesActivos.length > 0 && (
        <Section title="2. Mano de Obra (Horas Hombre)" color="#1e3a5f">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                {['Cargo', 'Tarifa/hora', 'Personas', 'Horas', 'Subtotal HH', 'Colación', 'Total'].map((c, i) => (
                  <th key={i} style={{ color: '#fff', fontSize: '10px', padding: '5px 8px', textAlign: i >= 1 ? 'right' : 'left' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rolesActivos.map((r, i) => {
                const hh  = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
                const col = r.colacion ? (Number(r.valor_colacion) * Number(r.cantidad)) || 0 : 0
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <Td>{r.nombre}</Td>
                    <Td right>{fmt(r.precio_hora)}</Td>
                    <Td right>{r.cantidad}</Td>
                    <Td right>{r.horas}</Td>
                    <Td right>{fmt(hh)}</Td>
                    <Td right>{r.colacion ? fmt(col) : '—'}</Td>
                    <Td right bold>{fmt(hh + col)}</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <SubtotalRow label="SUBTOTAL MANO DE OBRA" value={fmt(totalHH)} />
        </Section>
      )}

      {/* Servicios */}
      {activeServicios.length > 0 && (
        <Section title="3. Servicios Externos" color="#1e3a5f">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                {['Servicio', 'Monto'].map((c, i) => (
                  <th key={i} style={{ color: '#fff', fontSize: '10px', padding: '5px 8px', textAlign: i === 1 ? 'right' : 'left' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeServicios.map(([key, s], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <Td>{SERVICIOS_LABELS[key] || key}</Td>
                  <Td right bold>{fmt(s.precio)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <SubtotalRow label="SUBTOTAL SERVICIOS" value={fmt(totalServicios)} />
        </Section>
      )}

      {/* Embalaje */}
      {tieneEmbalaje && (
        <Section title="4. Embalaje y Envío" color="#1e3a5f">
          {embalajePalletActivos.length > 0 && (
            <>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontStyle: 'italic' }}>Fabricación de pallet</div>
              <EmbalajeTable items={embalajePalletActivos} />
            </>
          )}
          {embalajeMatActivos.length > 0 && (
            <>
              <div style={{ fontSize: '10px', color: '#64748b', margin: '6px 0 4px', fontStyle: 'italic' }}>Materiales de embalaje</div>
              <EmbalajeTable items={embalajeMatActivos} />
            </>
          )}
          {Number(embalaje.costoEnvio) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f8fafc', marginTop: '4px' }}>
              <span>Envío{embalaje.ciudadOrigen && embalaje.ciudadDestino ? ` (${embalaje.ciudadOrigen} → ${embalaje.ciudadDestino})` : ''}</span>
              <strong>{fmt(embalaje.costoEnvio)}</strong>
            </div>
          )}
          <SubtotalRow label="SUBTOTAL EMBALAJE Y ENVÍO" value={fmt(totalEmbalaje)} />
        </Section>
      )}

      {/* Bases / Overhead */}
      {bases.some(b => Number(b.porcentaje) > 0) && (
        <Section title="5. Gastos de Estructura (% Bases)" color="#1e3a5f">
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 12px', marginBottom: '6px', fontSize: '10px', color: '#64748b' }}>
            Base de cálculo (Materiales + HH + Servicios + Embalaje): <strong style={{ color: '#1e293b' }}>{fmt(baseCalculo)}</strong>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                {['Concepto', 'Base', '%', 'Monto'].map((c, i) => (
                  <th key={i} style={{ color: '#fff', fontSize: '10px', padding: '5px 8px', textAlign: i >= 1 ? 'right' : 'left' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bases.filter(b => Number(b.porcentaje) > 0).map((b, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <Td>{b.nombre}</Td>
                  <Td right>{fmt(baseCalculo)}</Td>
                  <Td right>{pct(b.porcentaje)}</Td>
                  <Td right bold>{fmt(baseCalculo * Number(b.porcentaje) / 100)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <SubtotalRow label="SUBTOTAL GASTOS DE ESTRUCTURA" value={fmt(totalBases)} />
        </Section>
      )}

      {/* Resumen final de costos */}
      <Section title="6. Resumen de Costos" color="#991b1b">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <SummaryRow label="Materiales"           value={fmt(totalMateriales)} />
            <SummaryRow label="Mano de Obra (HH)"    value={fmt(totalHH)} />
            {totalServicios > 0 && <SummaryRow label="Servicios Externos"  value={fmt(totalServicios)} />}
            {tieneEmbalaje      && <SummaryRow label="Embalaje y Envío"    value={fmt(totalEmbalaje)} />}
            {totalBases > 0     && <SummaryRow label="Gastos de Estructura" value={fmt(totalBases)} />}
            {descuentoMonto > 0 && <SummaryRow label={`Descuento${tipoDescuento === 'porcentaje' ? ` (${descuento}%)` : ''}`} value={`-${fmt(descuentoMonto)}`} color="#dc2626" />}
            {Number(flete) > 0  && <SummaryRow label="Flete / Transporte"  value={fmt(flete)} />}
            <tr><td colSpan={2} style={{ borderBottom: '2px solid #991b1b', padding: '2px 0' }} /></tr>
            <SummaryRow label="NETO"     value={fmt(totalNeto)} bold />
            {incluyeIVA && <SummaryRow label="IVA (19%)" value={fmt(totalIVA)} />}
            <tr style={{ background: '#991b1b' }}>
              <td style={{ padding: '8px 12px', color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                TOTAL {cantidadLotes > 1 ? `(${cantidadLotes} lotes)` : ''}
              </td>
              <td style={{ padding: '8px 12px', color: '#fca5a5', fontWeight: 'bold', fontSize: '14px', textAlign: 'right' }}>
                {fmt(totalFinal * cantidadLotes)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Costo unitario */}
        {(totalUnidades > 1 || cantidadLotes > 1) && (
          <div style={{ marginTop: '10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '10px 14px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#9a3412', textTransform: 'uppercase', marginBottom: '6px' }}>Desglose por unidad</div>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {cantidadLotes > 1 && (
                <div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>Costo por lote</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{fmt(costoPorLote)}</div>
                </div>
              )}
              {totalUnidades > 1 && (
                <div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>Costo por unidad ({totalUnidades} und.)</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{fmt(costoUnitario)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Condiciones internas */}
      {(condicionesPago || plazoEntrega || notas) && (
        <Section title="7. Notas Internas" color="#64748b">
          {condicionesPago && <InfoRow label="Condiciones de pago" value={condicionesPago} />}
          {plazoEntrega    && <InfoRow label="Plazo de entrega"    value={plazoEntrega} />}
          {notas           && <InfoRow label="Notas"               value={notas} />}
        </Section>
      )}

      <div style={{ marginTop: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '9px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
        Ficha de costos interna — {empresa.nombre || ''} — {numero || ''} — Generada el {new Date().toLocaleDateString('es-CL')} — DOCUMENTO CONFIDENCIAL
      </div>
    </div>
  )
}

function Section({ title, color = '#1e3a5f', children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color, letterSpacing: '1px', marginBottom: '6px', paddingBottom: '3px', borderBottom: `2px solid ${color}` }}>
        {title}
      </div>
      {children}
    </div>
  )
}
function Td({ children, right, bold }) {
  return <td style={{ padding: '4px 8px', textAlign: right ? 'right' : 'left', fontWeight: bold ? 'bold' : 'normal', borderBottom: '1px solid #f1f5f9', fontSize: '10px' }}>{children ?? '—'}</td>
}
function SubtotalRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '6px', paddingTop: '5px', borderTop: '1px solid #e2e8f0' }}>
      <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '11px' }}>{label}:</span>
      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '11px' }}>{value}</span>
    </div>
  )
}
function SummaryRow({ label, value, bold, color }) {
  return (
    <tr>
      <td style={{ padding: '4px 12px', fontWeight: bold ? 'bold' : 'normal', color: color || (bold ? '#1e293b' : '#475569'), fontSize: '11px' }}>{label}</td>
      <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: bold ? 'bold' : 'normal', color: color || (bold ? '#1e293b' : '#475569'), fontSize: '11px' }}>{value}</td>
    </tr>
  )
}
function EmbalajeTable({ items }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
      <thead>
        <tr style={{ background: '#334155' }}>
          {['Material', 'Unid.', 'Cant.', 'P. Unit.', 'Total'].map((c, i) => (
            <th key={i} style={{ color: '#fff', fontSize: '10px', padding: '4px 8px', textAlign: i >= 2 ? 'right' : 'left' }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((m, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
            <Td>{m.nombre}</Td><Td>{m.unidad}</Td>
            <Td right>{m.cantidad}</Td>
            <Td right>{fmt(m.precio_unitario)}</Td>
            <Td right bold>{fmt(Number(m.cantidad) * Number(m.precio_unitario))}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
      <span style={{ fontWeight: 'bold', color: '#64748b', minWidth: '160px', fontSize: '10px' }}>{label}:</span>
      <span style={{ color: '#475569', fontSize: '10px' }}>{value}</span>
    </div>
  )
}
