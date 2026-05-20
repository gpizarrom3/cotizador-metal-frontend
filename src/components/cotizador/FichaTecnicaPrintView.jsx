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
    <div id="ficha-tecnica-print" style={{
      background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif',
      fontSize: '11px', width: '794px', padding: '44px 48px', boxSizing: 'border-box',
      lineHeight: '1.55',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', paddingBottom: '16px', borderBottom: '3px solid #1e3a5f',
      }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{empresa.nombre || 'Empresa'}</div>
          {empresa.rut       && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>RUT: {empresa.rut}</div>}
          {empresa.giro      && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.giro}</div>}
          {empresa.direccion && <div style={{ color: '#64748b', fontSize: '10px' }}>{empresa.direccion}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '1px' }}>FICHA TÉCNICA</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>{nombreProducto || '—'}</div>
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
            <div key={comp.id} style={{ marginBottom: idx < componentes.length - 1 ? '20px' : '0' }}>
              <div style={{
                fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px',
                marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0',
              }}>
                Componente {idx + 1}{comp.nombre ? `: ${comp.nombre}` : ''}
              </div>
              <BulletList items={[
                comp.material      && { label: 'Material',                text: comp.material },
                comp.norma         && { label: 'Norma Material',          text: comp.norma },
                comp.descripcion   && { label: 'Descripción',             text: comp.descripcion },
                comp.recubrimiento && { label: 'Recubrimiento',           text: comp.recubrimiento },
                comp.terminacion   && { label: 'Terminación Superficial', text: comp.terminacion },
              ].filter(Boolean)} />

              {comp.propiedades?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>
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
          <TwoColGrid items={[
            aplicacion          && { label: 'Aplicación',              text: aplicacion },
            carga               && { label: 'Carga',                   text: carga },
            ambiente            && { label: 'Ambiente de Operación',   text: ambiente },
            temperaturaServicio && { label: 'Temperatura de Servicio', text: temperaturaServicio },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 5. Dimensiones y Tolerancias */}
      {hasAny([geometria, dimensiones, normaTolerancia]) && (
        <Section num="5" title="Dimensiones y Tolerancias">
          <BulletList items={[
            geometria       && { label: 'Geometría',            text: geometria },
            dimensiones     && { label: 'Dimensiones',          text: dimensiones },
            normaTolerancia && { label: 'Norma de Tolerancias', text: normaTolerancia },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 6. Fabricación y Acabado */}
      {hasAny([procesoFabricacion, detalleRosca, eliminacionRebabas, terminacionAcabado]) && (
        <Section num="6" title="Fabricación y Acabado">
          <BulletList items={[
            procesoFabricacion && { label: 'Proceso de Fabricación',  text: procesoFabricacion },
            detalleRosca       && { label: 'Rosca / Unión',           text: detalleRosca },
            eliminacionRebabas && { label: 'Eliminación de Rebabas',  text: eliminacionRebabas },
            terminacionAcabado && { label: 'Terminación',             text: terminacionAcabado },
          ].filter(Boolean)} />
        </Section>
      )}

      {/* 7. Control de Calidad */}
      {hasAny([inspeccionDimensional, inspeccionVisual, controlEspecial, trazabilidad]) && (
        <Section num="7" title="Control de Calidad">
          <TwoColGrid items={[
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
          <div style={{
            color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', overflowWrap: 'break-word',
            background: '#f8fafc', borderRadius: '4px', padding: '10px 12px',
            fontSize: '10.5px',
          }}>
            {observaciones}
          </div>
        </Section>
      )}

      {/* 9. Figura Referencial */}
      <Section num="9" title="Figura Referencial" last>
        {imagenReferencial ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <img
              src={imagenReferencial}
              alt="Figura referencial"
              style={{
                maxWidth: '80%', maxHeight: '260px', objectFit: 'contain',
                border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px',
                display: 'block', margin: '0 auto',
              }}
            />
            {notaImagen && (
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '8px', fontStyle: 'italic' }}>
                {notaImagen}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px',
            padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '10px',
          }}>
            (Adjuntar plano o imagen de referencia del producto)
          </div>
        )}
      </Section>

      {/* Footer */}
      <div style={{
        marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '10px',
        display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '9px',
      }}>
        <span>Ficha Técnica — {nombreProducto || '—'} {tagReferencia ? `| ${tagReferencia}` : ''}</span>
        <span>{empresa.nombre || ''} — {fecha}</span>
      </div>
    </div>
  )
}

/* ── shared table styles ─────────────────────────────────── */
const thStyle = {
  color: '#fff', fontSize: '10px', fontWeight: 'bold',
  padding: '6px 10px', textAlign: 'left',
}
const tdStyle = {
  padding: '5px 10px', borderBottom: '1px solid #f1f5f9',
  fontSize: '10px', color: '#1e293b',
  wordBreak: 'break-word', overflowWrap: 'break-word',
}

/* ── Section ─────────────────────────────────────────────── */
function Section({ num, title, children, last = false }) {
  return (
    <div style={{ marginBottom: last ? '0' : '32px' }}>
      {/* section header — full white row above so scanner can cut here */}
      <div style={{ paddingTop: '4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid #cbd5e1',
        }}>
          <div style={{
            background: '#1e3a5f', color: '#fff', borderRadius: '4px',
            width: '20px', height: '20px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0,
          }}>
            {num}
          </div>
          <div style={{
            fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase',
            color: '#1e3a5f', letterSpacing: '0.5px',
          }}>
            {title}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── IRow (identificación table) ─────────────────────────── */
function IRow({ label, value, last }) {
  return (
    <tr style={{ borderBottom: last ? 'none' : '1px solid #f1f5f9' }}>
      <td style={{
        padding: '5px 10px', fontWeight: 'bold', color: '#64748b',
        fontSize: '10px', width: '190px', whiteSpace: 'nowrap', verticalAlign: 'top',
      }}>
        {label}
      </td>
      <td style={{
        padding: '5px 10px', color: '#1e293b', fontSize: '11px',
        wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.55',
      }}>
        {value || '—'}
      </td>
    </tr>
  )
}

/* ── BulletList ──────────────────────────────────────────── */
function BulletList({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
          <span style={{ color: '#1e3a5f', fontWeight: 'bold', marginTop: '1px', flexShrink: 0 }}>•</span>
          <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.6' }}>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>{item.label}: </span>
            <span style={{ color: '#475569' }}>{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── TwoColGrid (2-column label/value layout) ────────────── */
function TwoColGrid({ items }) {
  const pairs = []
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1] || null])
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {pairs.map((pair, pi) => (
        <div key={pi} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0',
          borderBottom: pi < pairs.length - 1 ? '1px solid #f1f5f9' : 'none',
        }}>
          {pair.map((item, ii) => item ? (
            <div key={ii} style={{
              padding: '6px 10px',
              borderRight: ii === 0 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ fontWeight: 'bold', color: '#64748b', fontSize: '10px', marginBottom: '2px' }}>
                {item.label}
              </div>
              <div style={{
                color: '#1e293b', fontSize: '10.5px', lineHeight: '1.55',
                wordBreak: 'break-word', overflowWrap: 'break-word',
              }}>
                {item.text}
              </div>
            </div>
          ) : <div key={ii} />)}
        </div>
      ))}
    </div>
  )
}
