const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function CotizacionPrintView({ empresa = {}, cot }) {
  const {
    numero, fecha,
    cliente: clienteRaw = '',
    materiales = [], servicios = {},
    embalaje = {},
    unidadesPorLote = 1,
    totalMateriales = 0, totalHH = 0, totalServicios = 0, totalBases = 0, totalEmbalaje = 0,
    config = {},
    estado = '',
    conMaterial,
    totalConsumibles = 0,
  } = cot

  const clienteData = typeof clienteRaw === 'object' && clienteRaw !== null
    ? clienteRaw
    : { nombre: clienteRaw, rut: '', email: '', telefono: '' }

  const {
    flete = 0, incluyeIVA = false, validezDias = 30,
    condicionesPago = '', plazoEntrega = '', notas = '',
    descuento = 0, tipoDescuento = 'porcentaje',
    moneda = 'CLP', tipoCambio = 1,
    markupServicios = 0,
    descripcion = '', numeroReferencia = '',
  } = config

  const tc = moneda !== 'CLP' ? Number(tipoCambio) || 1 : 1
  const fmtM = (n) => {
    const v = Number(n) / tc
    if (moneda === 'USD') return `USD ${v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (moneda === 'UF')  return `${v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`
    return fmt(n)
  }

  const baseSubtotal = conMaterial === false ? totalConsumibles : totalMateriales
  const totalMarkupServicios = totalServicios > 0 ? totalServicios * (Number(markupServicios) || 0) / 100 : 0
  const costoSinDescuento = baseSubtotal + totalHH + totalServicios + totalMarkupServicios + totalBases + totalEmbalaje
  const descuentoMonto = tipoDescuento === 'porcentaje'
    ? costoSinDescuento * (Number(descuento) || 0) / 100
    : Number(descuento) || 0
  const costoTotal = costoSinDescuento - descuentoMonto
  const totalNeto = costoTotal + Number(flete)
  const totalIVA = incluyeIVA ? totalNeto * 0.19 : 0
  const totalFinal = totalNeto + totalIVA
  const totalUnidades = Number(unidadesPorLote) || 1
  const costoUnitario = totalUnidades > 0 ? totalFinal / totalUnidades : 0

  const fechaEmision = fecha || new Date().toLocaleDateString('es-CL')
  const fechaVencimiento = (() => {
    const d = new Date(); d.setDate(d.getDate() + Number(validezDias)); return d.toLocaleDateString('es-CL')
  })()

  const isSubprod = materiales.length > 0 && Array.isArray(materiales[0]?.items)
  const flatMateriales = isSubprod ? materiales.flatMap(sp => sp.items || []) : materiales
  const customServicios = (servicios.custom || []).filter(s => (Number(s.cantidad) || 1) * (Number(s.precio_ref) || 0) > 0)
  const tieneEmbalaje = totalEmbalaje > 0

  // Build flat line-item list for unified table
  const lineItems = []

  if (conMaterial !== false) {
    if (isSubprod && materiales.length > 1) {
      materiales.forEach((sp) => {
        const items = (sp.items || []).filter(m => Number(m.cantidad) > 0)
        if (!items.length) return
        lineItems.push({ type: 'group', label: sp.nombre })
        items.forEach(m => lineItems.push({
          type: 'item', desc: m.nombre, sub: m.formato || '',
          cant: m.cantidad, precioUnit: m.precio_unitario,
          total: Number(m.cantidad) * Number(m.precio_unitario),
        }))
      })
    } else {
      flatMateriales.filter(m => Number(m.cantidad) > 0).forEach(m => lineItems.push({
        type: 'item', desc: m.nombre, sub: m.formato || '',
        cant: m.cantidad, precioUnit: m.precio_unitario,
        total: Number(m.cantidad) * Number(m.precio_unitario),
      }))
    }
  }

  if (totalHH > 0) {
    lineItems.push({ type: 'item', desc: 'Mano de obra', sub: '', cant: null, precioUnit: null, total: totalHH })
  }

  customServicios.forEach(s => {
    const total = (Number(s.cantidad) || 1) * (Number(s.precio_ref) || 0)
    lineItems.push({ type: 'item', desc: s.nombre, sub: '', cant: Number(s.cantidad) || 1, precioUnit: Number(s.precio_ref) || 0, total })
  })

  if (totalMarkupServicios > 0) {
    lineItems.push({ type: 'item', desc: `Gestión / coordinación de servicios (${markupServicios}%)`, sub: '', cant: null, precioUnit: null, total: totalMarkupServicios })
  }

  if (tieneEmbalaje) {
    lineItems.push({ type: 'item', desc: 'Embalaje y envío', sub: '', cant: null, precioUnit: null, total: totalEmbalaje })
  }

  let rowIdx = 0

  return (
    <div id="cotizacion-print" style={{ background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: '11px', width: '794px', padding: '40px', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #1e3a5f' }}>
        <div>
          {empresa.logo && <img src={empresa.logo} alt="Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '8px' }} />}
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{empresa.nombre || 'Empresa'}</div>
          {empresa.rut       && <div style={{ color: '#64748b', fontSize: '10px' }}>RUT: {empresa.rut}</div>}
          {empresa.giro      && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.giro}</div>}
          {empresa.direccion && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.direccion}</div>}
          {empresa.telefono  && <div style={{ color: '#64748b', fontSize: '10px' }}>Tel: {empresa.telefono}</div>}
          {empresa.email     && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.email}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '2px' }}>COTIZACIÓN</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>{numero || 'COT-BORRADOR'}</div>
          {estado && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', display: 'inline-block' }}>{estado}</div>}
          <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px' }}>Emisión: {fechaEmision}</div>
          <div style={{ color: '#64748b', fontSize: '10px' }}>Válida hasta: {fechaVencimiento}</div>
          {moneda !== 'CLP' && <div style={{ color: '#64748b', fontSize: '10px' }}>Moneda: {moneda} (1 {moneda} = {fmt(tipoCambio)} CLP)</div>}
        </div>
      </div>

      {/* Cliente + Referencia */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Cliente</div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{clienteData.nombre || '—'}</div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
            {clienteData.rut      && <span style={{ color: '#64748b', fontSize: '10px' }}>RUT: {clienteData.rut}</span>}
            {clienteData.email    && <span style={{ color: '#64748b', fontSize: '10px' }}>{clienteData.email}</span>}
            {clienteData.telefono && <span style={{ color: '#64748b', fontSize: '10px' }}>Tel: {clienteData.telefono}</span>}
          </div>
        </div>
        {(numeroReferencia || descripcion) && (
          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Referencia</div>
            {numeroReferencia && <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{numeroReferencia}</div>}
            {descripcion && <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>{descripcion}</div>}
          </div>
        )}
      </div>

      {/* Detalle */}
      {lineItems.length > 0 && (
        <Section title="Detalle de la cotización">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                <th style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '6px 8px', textAlign: 'center', width: '32px' }}>N°</th>
                <th style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '6px 8px', textAlign: 'left' }}>Descripción</th>
                <th style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '6px 8px', textAlign: 'right', width: '60px' }}>Cant.</th>
                <th style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '6px 8px', textAlign: 'right', width: '100px' }}>P. Unit.</th>
                <th style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '6px 8px', textAlign: 'right', width: '110px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => {
                if (item.type === 'group') {
                  return (
                    <tr key={idx}>
                      <td colSpan={5} style={{ padding: '5px 8px', background: '#e2e8f0', fontWeight: 'bold', fontSize: '10px', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.label}
                      </td>
                    </tr>
                  )
                }
                const n = ++rowIdx
                const bg = n % 2 === 1 ? '#f8fafc' : '#fff'
                return (
                  <tr key={idx} style={{ background: bg }}>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '10px', borderBottom: '1px solid #f1f5f9' }}>{n}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>{item.desc}</div>
                      {item.sub && <div style={{ color: '#94a3b8', fontSize: '9px', marginTop: '1px' }}>{item.sub}</div>}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                      {item.cant !== null ? item.cant : '—'}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                      {item.precioUnit !== null ? fmtM(item.precioUnit) : '—'}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9' }}>
                      {fmtM(item.total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <div style={{ width: '280px' }}>
          <div style={{ borderTop: '2px solid #1e3a5f', paddingTop: '10px' }}>
            {conMaterial !== false && totalMateriales > 0 && <TotRow label="Materiales" value={fmtM(totalMateriales)} />}
            {totalHH > 0 && <TotRow label="Horas Hombre" value={fmtM(totalHH)} />}
            {(totalServicios + totalMarkupServicios) > 0 && <TotRow label="Servicios" value={fmtM(totalServicios + totalMarkupServicios)} />}
            {totalEmbalaje > 0 && <TotRow label="Embalaje y envío" value={fmtM(totalEmbalaje)} />}
            {totalBases > 0 && <TotRow label="Gastos generales" value={fmtM(totalBases)} />}
            {descuentoMonto > 0 && (
              <>
                <TotRow label="Subtotal" value={fmtM(costoSinDescuento)} />
                <TotRow label={`Descuento${tipoDescuento === 'porcentaje' ? ` (${descuento}%)` : ''}`} value={`- ${fmtM(descuentoMonto)}`} accent />
              </>
            )}
            {Number(flete) > 0 && <TotRow label="Flete / transporte" value={fmtM(flete)} />}
            <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '4px', paddingTop: '4px' }}>
            <TotRow label="NETO" value={fmtM(totalNeto)} bold />
            {incluyeIVA && <TotRow label="IVA (19%)" value={fmtM(totalIVA)} />}
            </div>
            <div style={{ background: '#1e3a5f', borderRadius: '4px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>TOTAL</span>
              <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '15px' }}>{fmtM(totalFinal)}</span>
            </div>
            {totalUnidades > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 2px 0', color: '#64748b', fontSize: '10px' }}>
                <span>Precio por unidad ({totalUnidades} unidades)</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>{fmtM(costoUnitario)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Condiciones comerciales */}
      {(condicionesPago || plazoEntrega || notas) && (
        <Section title="Condiciones comerciales">
          {condicionesPago && <InfoRow label="Condiciones de pago" value={condicionesPago} />}
          {plazoEntrega    && <InfoRow label="Plazo de entrega"    value={plazoEntrega} />}
          {notas && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Notas</div>
              <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{notas}</div>
            </div>
          )}
        </Section>
      )}

      {/* Firma */}
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
        <SignatureBox label={empresa.nombre || 'Empresa'} />
        <SignatureBox label={clienteData.nombre || 'Cliente'} />
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

function TotRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 2px', color: accent ? '#dc2626' : (bold ? '#1e293b' : '#475569') }}>
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
