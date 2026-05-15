const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const SERVICIOS_LABELS = {
  corte_plasma: 'Corte Plasma', corte_laser: 'Corte Láser', oxicorte: 'Oxicorte',
  tratamiento_termico: 'Tratamiento Térmico', plegado: 'Servicio de Plegado', cilindrado: 'Servicio de Cilindrado',
}

export default function CotizacionPrintView({ empresa = {}, cot }) {
  const {
    numero, fecha, cliente,
    materiales = [], roles = [], servicios = {}, bases = [],
    cantidadLotes = 1, unidadesPorLote = 1,
    totalMateriales = 0, totalHH = 0, totalServicios = 0, totalBases = 0,
    config = {},
  } = cot

  const { flete = 0, incluyeIVA = false, validezDias = 30, condicionesPago = '', plazoEntrega = '', notas = '' } = config
  const costoTotal = totalMateriales + totalHH + totalServicios + totalBases
  const totalNeto = costoTotal + Number(flete)
  const totalIVA = incluyeIVA ? totalNeto * 0.19 : 0
  const totalFinal = totalNeto + totalIVA
  const totalUnidades = cantidadLotes * unidadesPorLote
  const costoUnitario = totalUnidades > 0 ? totalFinal * cantidadLotes / totalUnidades : 0
  const activeServicios = Object.entries(servicios).filter(([, s]) => s.activo)

  const fechaEmision = fecha || new Date().toLocaleDateString('es-CL')
  const fechaVencimiento = (() => {
    const d = new Date(); d.setDate(d.getDate() + Number(validezDias)); return d.toLocaleDateString('es-CL')
  })()

  return (
    <div id="cotizacion-print" style={{ background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: '11px', width: '794px', padding: '40px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #1e3a5f' }}>
        <div>
          {empresa.logo && <img src={empresa.logo} alt="Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '8px' }} />}
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{empresa.nombre || 'Empresa'}</div>
          {empresa.rut && <div style={{ color: '#64748b', fontSize: '10px' }}>RUT: {empresa.rut}</div>}
          {empresa.giro && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.giro}</div>}
          {empresa.direccion && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.direccion}</div>}
          {empresa.telefono && <div style={{ color: '#64748b', fontSize: '10px' }}>Tel: {empresa.telefono}</div>}
          {empresa.email && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.email}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '2px' }}>COTIZACIÓN</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>{numero || 'COT-BORRADOR'}</div>
          <div style={{ color: '#64748b', fontSize: '10px', marginTop: '8px' }}>Fecha: {fechaEmision}</div>
          <div style={{ color: '#64748b', fontSize: '10px' }}>Válida hasta: {fechaVencimiento}</div>
        </div>
      </div>

      {/* Cliente */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Cliente</div>
        <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '2px' }}>{cliente || '—'}</div>
      </div>

      {/* Materiales */}
      {materiales.length > 0 && (
        <Section title="Materiales">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <Th cols={['Material', 'Proveedor', 'Formato', 'Cant.', 'P. Unit.', 'Total']} />
            </thead>
            <tbody>
              {materiales.map((m, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <Td>{m.nombre}</Td><Td>{m.proveedor}</Td><Td>{m.formato}</Td>
                  <Td right>{m.cantidad}</Td><Td right>{fmt(m.precio_unitario)}</Td>
                  <Td right bold>{fmt(m.cantidad * m.precio_unitario)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <TotalRow label="Subtotal materiales" value={fmt(totalMateriales)} />
        </Section>
      )}

      {/* Horas Hombre */}
      {roles.some(r => r.horas > 0) && (
        <Section title="Horas Hombre">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><Th cols={['Cargo', 'P./hora', 'Personas', 'Horas', 'Colación', 'Total']} /></thead>
            <tbody>
              {roles.filter(r => r.horas > 0 || r.precio_hora > 0).map((r, i) => {
                const hh = (r.precio_hora * r.horas * r.cantidad) || 0
                const col = r.colacion ? (r.valor_colacion * r.cantidad) || 0 : 0
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <Td>{r.nombre}</Td><Td right>{fmt(r.precio_hora)}</Td>
                    <Td right>{r.cantidad}</Td><Td right>{r.horas}</Td>
                    <Td right>{r.colacion ? fmt(r.valor_colacion) : '—'}</Td>
                    <Td right bold>{fmt(hh + col)}</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <TotalRow label="Subtotal HH" value={fmt(totalHH)} />
        </Section>
      )}

      {/* Servicios */}
      {activeServicios.length > 0 && (
        <Section title="Servicios">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><Th cols={['Servicio', 'Monto']} /></thead>
            <tbody>
              {activeServicios.map(([key, s], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <Td>{SERVICIOS_LABELS[key]}</Td><Td right bold>{fmt(s.precio)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <TotalRow label="Subtotal servicios" value={fmt(totalServicios)} />
        </Section>
      )}

      {/* Resumen de costos */}
      <Section title="Resumen de costos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <CostRow label="Materiales" value={fmt(totalMateriales)} />
          <CostRow label="Horas Hombre" value={fmt(totalHH)} />
          {activeServicios.length > 0 && <CostRow label="Servicios" value={fmt(totalServicios)} />}
          {bases.filter(b => b.porcentaje > 0).map(b => (
            <CostRow key={b.id} label={`${b.nombre} (${b.porcentaje}%)`} value={fmt((totalMateriales + totalHH) * b.porcentaje / 100)} indent />
          ))}
          {totalBases > 0 && <CostRow label="Subtotal % bases" value={fmt(totalBases)} />}
          {Number(flete) > 0 && <CostRow label="Flete / transporte" value={fmt(flete)} />}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '4px', paddingTop: '6px' }}>
            <CostRow label="NETO" value={fmt(totalNeto)} bold />
          </div>
          {incluyeIVA && <CostRow label="IVA (19%)" value={fmt(totalIVA)} />}
          <div style={{ background: '#1e3a5f', borderRadius: '4px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>TOTAL {cantidadLotes > 1 ? `(${cantidadLotes} lotes)` : ''}</span>
            <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '15px' }}>{fmt(totalFinal * cantidadLotes)}</span>
          </div>
          {totalUnidades > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748b' }}>
              <span>Precio por unidad ({totalUnidades} unidades)</span>
              <span style={{ fontWeight: 'bold', color: '#059669' }}>{fmt(costoUnitario)}</span>
            </div>
          )}
        </div>
      </Section>

      {/* Condiciones */}
      {(condicionesPago || plazoEntrega || notas) && (
        <Section title="Condiciones">
          {condicionesPago && <InfoRow label="Condiciones de pago" value={condicionesPago} />}
          {plazoEntrega && <InfoRow label="Plazo de entrega" value={plazoEntrega} />}
          {notas && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Notas / Observaciones</div>
              <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{notas}</div>
            </div>
          )}
        </Section>
      )}

      {/* Firma */}
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
        <SignatureBox label={empresa.nombre || 'Empresa'} />
        <SignatureBox label="Cliente" />
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: '#1e3a5f', letterSpacing: '1px', marginBottom: '6px', paddingBottom: '3px', borderBottom: '1px solid #cbd5e1' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Th({ cols }) {
  return (
    <tr style={{ background: '#1e3a5f' }}>
      {cols.map((c, i) => (
        <th key={i} style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '5px 8px', textAlign: i >= cols.length - 2 ? 'right' : 'left' }}>{c}</th>
      ))}
    </tr>
  )
}

function Td({ children, right, bold }) {
  return <td style={{ padding: '4px 8px', textAlign: right ? 'right' : 'left', fontWeight: bold ? 'bold' : 'normal', borderBottom: '1px solid #f1f5f9' }}>{children}</td>
}

function TotalRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
      <span style={{ color: '#64748b', fontWeight: 'bold' }}>{label}:</span>
      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{value}</span>
    </div>
  )
}

function CostRow({ label, value, bold, indent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', paddingLeft: indent ? '16px' : '0', color: bold ? '#1e293b' : '#475569' }}>
      <span style={{ fontWeight: bold ? 'bold' : 'normal' }}>{label}</span>
      <span style={{ fontWeight: bold ? 'bold' : 'normal' }}>{value}</span>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
      <span style={{ fontWeight: 'bold', color: '#64748b', minWidth: '140px' }}>{label}:</span>
      <span style={{ color: '#475569' }}>{value}</span>
    </div>
  )
}

function SignatureBox({ label }) {
  return (
    <div style={{ textAlign: 'center', width: '200px' }}>
      <div style={{ borderBottom: '1px solid #94a3b8', marginBottom: '6px', height: '40px' }} />
      <div style={{ fontSize: '10px', color: '#64748b' }}>{label}</div>
    </div>
  )
}
