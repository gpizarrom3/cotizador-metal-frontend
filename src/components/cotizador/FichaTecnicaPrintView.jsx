export default function FichaTecnicaPrintView({ empresa = {}, ficha = {}, numeroCot = '' }) {
  const {
    nombreProducto = '', tagReferencia = '', numeroMaterial = '',
    numeroPlano = '', revisionPlano = '', cantidad = '', criterioDiseno = '',
    tipoComponente = '', denominacionCompleta = '', usoDesignado = '', funcionPrincipal = '',
    componentes = [],
    aplicacion = '', carga = '', ambiente = '', temperaturaServicio = '',
    geometria = '', dimensiones = '', normaTolerancia = '',
    procesoFabricacion = '', detalleRosca = '', eliminacionRebabas = '', terminacionAcabado = '',
    inspeccionDimensional = '', inspeccionVisual = '', controlEspecial = '', trazabilidad = '',
    observaciones = '',
    imagenReferencial = '', notaImagen = '',
  } = ficha

  const fecha = new Date().toLocaleDateString('es-CL')
  const hasAny = (vals) => vals.some(v => v && v.toString().trim())

  return (
    <div id="ficha-tecnica-print" style={{ background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: '11px', width: '794px', padding: '40px', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '14px', borderBottom: '3px solid #1e3a5f' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{empresa.nombre || 'Empresa'}</div>
          {empresa.rut       && <div style={{ color: '#64748b', fontSize: '10px' }}>RUT: {empresa.rut}</div>}
          {empresa.giro      && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.giro}</div>}
          {empresa.direccion && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.direccion}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '1px' }}>FICHA TÉCNICA</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', marginTop: '3px' }}>{nombreProducto || '—'}</div>
          {tagReferencia && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{tagReferencia}</div>}
          {numeroCot && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Cotización: {numeroCot}</div>}
          <div style={{ fontSize: '10px', color: '#64748b' }}>Fecha: {fecha}</div>
        </div>
      </div>

      {/* 1. Identificación */}
      <Section num="1" title="Identificación del Producto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <IRow label="Nombre del Producto"   value={nombreProducto} />
            <IRow label="TAG / Referencia"       value={tagReferencia} />
            <IRow label="Número de Material"     value={numeroMaterial} />
            <IRow label="Número de Plano"        value={numeroPlano} />
            <IRow label="Revisión de Plano"      value={revisionPlano} />
            <IRow label="Cantidad"               value={cantidad} />
            <IRow label="Criterio de Diseño"     value={criterioDiseno} last />
          </tbody>
        </table>
      </Section>

      {/* 2. Descripción General */}
      {hasAny([tipoComponente, denominacionCompleta, usoDesignado, funcionPrincipal]) && (
        <Section num="2" title="Descripción General">
          <BulletList items={[
            tipoComponente        && { label: 'Tipo de Componente',    text: tipoComponente },
            denominacionCompleta  && { label: 'Denominación Completa', text: denominacionCompleta },
            usoDesignado          && { label: 'Uso Designado',         text: usoDesignado },
            funcionPrincipal      && { label: 'Función Principal',     text: funcionPrincipal },
            tagReferencia         && { label: 'Identificación (TAG)',   text: tagReferencia },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 3. Especificaciones de Material */}
      {componentes.length > 0 && (
        <Section num="3" title="Especificaciones de Material">
          {componentes.map((comp, idx) => (
            <div key={comp.id} style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', marginBottom: '6px' }}>
                Componente {idx + 1}{comp.nombre ? `: ${comp.nombre}` : ''}
              </div>
              <BulletList items={[
                comp.material     && { label: 'Material',               text: comp.material },
                comp.norma        && { label: 'Norma Material',         text: comp.norma },
                comp.descripcion  && { label: 'Descripción',            text: comp.descripcion },
                comp.recubrimiento && { label: 'Recubrimiento',         text: comp.recubrimiento },
                comp.terminacion  && { label: 'Terminación Superficial',text: comp.terminacion },
              ].filter(Boolean)} />

              {comp.propiedades?.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>
                    Propiedades Mecánicas — {comp.nombre || `Componente ${idx + 1}`}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1e3a5f' }}>
                        <th style={thStyle}>Propiedad</th>
                        <th style={thStyle}>Valor</th>
                        <th style={thStyle}>Norma / Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.propiedades.map((p, i) => (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                          <td style={tdStyle}>{p.propiedad || '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{p.valor || '—'}</td>
                          <td style={tdStyle}>{p.norma || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* 4. Condiciones de Servicio */}
      {hasAny([aplicacion, carga, ambiente, temperaturaServicio]) && (
        <Section num="4" title="Condiciones de Servicio">
          <BulletList items={[
            aplicacion           && { label: 'Aplicación',             text: aplicacion },
            carga                && { label: 'Carga',                  text: carga },
            ambiente             && { label: 'Ambiente',               text: ambiente },
            temperaturaServicio  && { label: 'Temperatura de Servicio',text: temperaturaServicio },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 5. Dimensiones y Tolerancias */}
      {hasAny([geometria, dimensiones, normaTolerancia]) && (
        <Section num="5" title="Dimensiones y Tolerancias">
          <BulletList items={[
            geometria       && { label: 'Geometría',          text: geometria },
            dimensiones     && { label: 'Dimensiones',        text: dimensiones },
            normaTolerancia && { label: 'Norma de Tolerancias',text: normaTolerancia },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 6. Fabricación y Acabado */}
      {hasAny([procesoFabricacion, detalleRosca, eliminacionRebabas, terminacionAcabado]) && (
        <Section num="6" title="Fabricación y Acabado">
          <BulletList items={[
            procesoFabricacion && { label: 'Proceso de Fabricación',   text: procesoFabricacion },
            detalleRosca       && { label: 'Rosca / Unión',            text: detalleRosca },
            eliminacionRebabas && { label: 'Eliminación de Rebabas',   text: eliminacionRebabas },
            terminacionAcabado && { label: 'Terminación',              text: terminacionAcabado },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 7. Control de Calidad */}
      {hasAny([inspeccionDimensional, inspeccionVisual, controlEspecial, trazabilidad]) && (
        <Section num="7" title="Control de Calidad">
          <BulletList items={[
            inspeccionDimensional && { label: 'Inspección Dimensional', text: inspeccionDimensional },
            inspeccionVisual      && { label: 'Inspección Visual',      text: inspeccionVisual },
            controlEspecial       && { label: 'Control Especial',       text: controlEspecial },
            trazabilidad          && { label: 'Trazabilidad',           text: trazabilidad },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 8. Observaciones Técnicas */}
      {observaciones && (
        <Section num="8" title="Observaciones Técnicas">
          <div style={{ color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{observaciones}</div>
        </Section>
      )}

      {/* 9. Figura Referencial */}
      <Section num="9" title="Figura Referencial">
        {imagenReferencial ? (
          <div style={{ textAlign: 'center' }}>
            <img src={imagenReferencial} alt="Figura referencial" style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }} />
            {notaImagen && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px', fontStyle: 'italic' }}>{notaImagen}</div>}
          </div>
        ) : (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>
            (Adjuntar plano o imagen de referencia del producto)
          </div>
        )}
      </Section>

      {/* Footer */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '9px' }}>
        <span>Ficha Técnica — {nombreProducto || '—'} {tagReferencia ? `| ${tagReferencia}` : ''}</span>
        <span>{empresa.nombre || ''} — {fecha}</span>
      </div>
    </div>
  )
}

const thStyle = { color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '5px 10px', textAlign: 'left' }
const tdStyle  = { padding: '4px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '10px', color: '#1e293b' }

function Section({ num, title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #cbd5e1' }}>
        <div style={{ background: '#1e3a5f', color: '#fff', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>{num}</div>
        <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: '#1e3a5f', letterSpacing: '0.5px' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function IRow({ label, value, last }) {
  return (
    <tr style={{ borderBottom: last ? 'none' : '1px solid #f1f5f9' }}>
      <td style={{ padding: '4px 10px', fontWeight: 'bold', color: '#64748b', fontSize: '10px', width: '200px', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '4px 10px', color: '#1e293b', fontSize: '11px' }}>{value || '—'}</td>
    </tr>
  )
}

function BulletList({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          <span style={{ color: '#1e3a5f', fontWeight: 'bold', marginTop: '1px', flexShrink: 0 }}>•</span>
          <div>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>{item.label}: </span>
            <span style={{ color: '#475569' }}>{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
