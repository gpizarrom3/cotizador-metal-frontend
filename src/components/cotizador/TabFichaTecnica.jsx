import { useRef } from 'react'

const emptyProp  = () => ({ id: Date.now() + Math.random(), propiedad: '', valor: '', norma: '' })
const emptyComp  = () => ({
  id: Date.now() + Math.random(),
  nombre: '',
  material: '',
  norma: '',
  descripcion: '',
  recubrimiento: '',
  terminacion: '',
  propiedades: [
    { id: 1, propiedad: 'Resistencia a la Tracción', valor: '', norma: '' },
    { id: 2, propiedad: 'Límite de Fluencia',        valor: '', norma: '' },
    { id: 3, propiedad: 'Dureza',                    valor: '', norma: '' },
    { id: 4, propiedad: 'Elongación',                valor: '', norma: '' },
  ],
})

export const DEFAULT_FICHA_TECNICA = {
  // 1. Identificación
  nombreProducto: '', tagReferencia: '', numeroMaterial: '',
  numeroPlano: '', revisionPlano: '', cantidad: '', criterioDiseno: '',
  // 2. Descripción General
  tipoComponente: '', denominacionCompleta: '', usoDesignado: '', funcionPrincipal: '',
  // 3. Componentes / Materiales
  componentes: [],
  // 4. Condiciones de Servicio
  aplicacion: '', carga: '', ambiente: '', temperaturaServicio: '',
  // 5. Dimensiones y Tolerancias
  geometria: '', dimensiones: '', normaTolerancia: '',
  // 6. Fabricación y Acabado
  procesoFabricacion: '', detalleRosca: '', eliminacionRebabas: '', terminacionAcabado: '',
  // 7. Control de Calidad
  inspeccionDimensional: '', inspeccionVisual: '', controlEspecial: '', trazabilidad: '',
  // 8. Observaciones
  observaciones: '',
  // 9. Figura
  imagenReferencial: '', notaImagen: '',
}

function SectionHeader({ num, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{num}</span>
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}{hint && <span className="text-slate-500 font-normal ml-1 text-xs">({hint})</span>}</label>
      {children}
    </div>
  )
}

export default function TabFichaTecnica({ ficha, setFicha }) {
  const imgRef = useRef(null)

  const set = (field, value) => setFicha(f => ({ ...f, [field]: value }))

  // Componentes
  const addComp = () => setFicha(f => ({ ...f, componentes: [...f.componentes, emptyComp()] }))
  const removeComp = (id) => setFicha(f => ({ ...f, componentes: f.componentes.filter(c => c.id !== id) }))
  const updateComp = (id, field, val) => setFicha(f => ({
    ...f,
    componentes: f.componentes.map(c => c.id === id ? { ...c, [field]: val } : c),
  }))

  // Propiedades mecánicas
  const addProp = (compId) => setFicha(f => ({
    ...f,
    componentes: f.componentes.map(c => c.id === compId
      ? { ...c, propiedades: [...c.propiedades, emptyProp()] }
      : c),
  }))
  const removeProp = (compId, propId) => setFicha(f => ({
    ...f,
    componentes: f.componentes.map(c => c.id === compId
      ? { ...c, propiedades: c.propiedades.filter(p => p.id !== propId) }
      : c),
  }))
  const updateProp = (compId, propId, field, val) => setFicha(f => ({
    ...f,
    componentes: f.componentes.map(c => c.id === compId
      ? { ...c, propiedades: c.propiedades.map(p => p.id === propId ? { ...p, [field]: val } : p) }
      : c),
  }))

  // Imagen
  const handleImagen = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('imagenReferencial', ev.target.result)
    reader.readAsDataURL(file)
  }

  const ta = 'input-field text-sm resize-none'

  return (
    <div className="space-y-6">

      {/* 1. Identificación */}
      <div className="card">
        <SectionHeader num="1" title="Identificación del Producto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre del Producto">
            <input className="input-field" value={ficha.nombreProducto} onChange={e => set('nombreProducto', e.target.value)} placeholder="Ej: CÁNCAMO TIPO C3" />
          </Field>
          <Field label="TAG / Referencia">
            <input className="input-field" value={ficha.tagReferencia} onChange={e => set('tagReferencia', e.target.value)} placeholder="Ej: PLNIG1-15849" />
          </Field>
          <Field label="Número de Material">
            <input className="input-field" value={ficha.numeroMaterial} onChange={e => set('numeroMaterial', e.target.value)} placeholder="Ej: 000000000001045207" />
          </Field>
          <Field label="Número de Plano">
            <input className="input-field" value={ficha.numeroPlano} onChange={e => set('numeroPlano', e.target.value)} placeholder="Ej: IG1-15849" />
          </Field>
          <Field label="Revisión de Plano">
            <input className="input-field" value={ficha.revisionPlano} onChange={e => set('revisionPlano', e.target.value)} placeholder="Ej: REV 5" />
          </Field>
          <Field label="Cantidad">
            <input className="input-field" value={ficha.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="Ej: 22 Unidades" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Criterio de Diseño">
              <textarea className={ta} rows={2} value={ficha.criterioDiseno} onChange={e => set('criterioDiseno', e.target.value)} placeholder="Ej: De acuerdo a plano IG1-15849 Rev. 5..." />
            </Field>
          </div>
        </div>
      </div>

      {/* 2. Descripción General */}
      <div className="card">
        <SectionHeader num="2" title="Descripción General" />
        <div className="grid grid-cols-1 gap-4">
          <Field label="Tipo de Componente">
            <textarea className={ta} rows={2} value={ficha.tipoComponente} onChange={e => set('tipoComponente', e.target.value)} placeholder="Descripción del tipo de componente, materiales y función..." />
          </Field>
          <Field label="Denominación Completa">
            <textarea className={ta} rows={2} value={ficha.denominacionCompleta} onChange={e => set('denominacionCompleta', e.target.value)} placeholder="Nombre técnico completo según plano..." />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Uso Designado">
              <textarea className={ta} rows={2} value={ficha.usoDesignado} onChange={e => set('usoDesignado', e.target.value)} placeholder="Aplicación específica del producto..." />
            </Field>
            <Field label="Función Principal">
              <textarea className={ta} rows={2} value={ficha.funcionPrincipal} onChange={e => set('funcionPrincipal', e.target.value)} placeholder="Función que cumple el componente..." />
            </Field>
          </div>
        </div>
      </div>

      {/* 3. Especificaciones de Material */}
      <div className="card">
        <SectionHeader num="3" title="Especificaciones de Material" />
        <div className="space-y-6">
          {ficha.componentes.map((comp, idx) => (
            <div key={comp.id} className="border border-slate-700 rounded-xl p-4 space-y-4 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-blue-400">Componente {idx + 1}</span>
                <button onClick={() => removeComp(comp.id)} className="text-slate-500 hover:text-red-400 text-xs transition-colors">Eliminar</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre del Componente">
                  <input className="input-field text-sm" value={comp.nombre} onChange={e => updateComp(comp.id, 'nombre', e.target.value)} placeholder="Ej: Cuerpo Interior — Acero SAE 1020" />
                </Field>
                <Field label="Material">
                  <input className="input-field text-sm" value={comp.material} onChange={e => updateComp(comp.id, 'material', e.target.value)} placeholder="Ej: Acero SAE 1020" />
                </Field>
                <Field label="Norma del Material">
                  <input className="input-field text-sm" value={comp.norma} onChange={e => updateComp(comp.id, 'norma', e.target.value)} placeholder="Ej: SAE 1020 / AISI 1020 / ASTM A29" />
                </Field>
                <Field label="Recubrimiento / Protección">
                  <input className="input-field text-sm" value={comp.recubrimiento} onChange={e => updateComp(comp.id, 'recubrimiento', e.target.value)} placeholder="Ej: Galvanizado en caliente ASTM A123" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Descripción del Material">
                    <textarea className={ta} rows={2} value={comp.descripcion} onChange={e => updateComp(comp.id, 'descripcion', e.target.value)} placeholder="Descripción técnica del material, propiedades generales..." />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Terminación Superficial">
                    <textarea className={ta} rows={1} value={comp.terminacion} onChange={e => updateComp(comp.id, 'terminacion', e.target.value)} placeholder="Ej: Eliminación de rebabas y aristas vivas, según plano..." />
                  </Field>
                </div>
              </div>

              {/* Propiedades mecánicas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Propiedades Mecánicas</label>
                  <button onClick={() => addProp(comp.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">+ Agregar fila</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left px-3 py-2 rounded-l-lg">Propiedad</th>
                        <th className="text-left px-3 py-2">Valor</th>
                        <th className="text-left px-3 py-2">Norma / Referencia</th>
                        <th className="px-3 py-2 rounded-r-lg w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.propiedades.map(p => (
                        <tr key={p.id} className="border-b border-slate-700/50">
                          <td className="px-2 py-1.5">
                            <input className="input-field py-1 text-xs" value={p.propiedad} onChange={e => updateProp(comp.id, p.id, 'propiedad', e.target.value)} placeholder="Resistencia a la Tracción" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input className="input-field py-1 text-xs" value={p.valor} onChange={e => updateProp(comp.id, p.id, 'valor', e.target.value)} placeholder="≥ 415 MPa" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input className="input-field py-1 text-xs" value={p.norma} onChange={e => updateProp(comp.id, p.id, 'norma', e.target.value)} placeholder="ASTM A53" />
                          </td>
                          <td className="px-2 py-1.5">
                            <button onClick={() => removeProp(comp.id, p.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addComp} className="btn-secondary text-sm w-full">
            + Agregar componente / material
          </button>
        </div>
      </div>

      {/* 4. Condiciones de Servicio */}
      <div className="card">
        <SectionHeader num="4" title="Condiciones de Servicio" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aplicación">
            <textarea className={ta} rows={2} value={ficha.aplicacion} onChange={e => set('aplicacion', e.target.value)} placeholder="Uso específico del componente en el sistema..." />
          </Field>
          <Field label="Carga">
            <textarea className={ta} rows={2} value={ficha.carga} onChange={e => set('carga', e.target.value)} placeholder="Tipo y magnitud de cargas esperadas..." />
          </Field>
          <Field label="Ambiente de Operación">
            <textarea className={ta} rows={2} value={ficha.ambiente} onChange={e => set('ambiente', e.target.value)} placeholder="Condiciones ambientales (humedad, corrosión, temperatura...)..." />
          </Field>
          <Field label="Temperatura de Servicio">
            <input className="input-field text-sm" value={ficha.temperaturaServicio} onChange={e => set('temperaturaServicio', e.target.value)} placeholder="Ej: Temperatura ambiente industrial, máx. 370°C" />
          </Field>
        </div>
      </div>

      {/* 5. Dimensiones y Tolerancias */}
      <div className="card">
        <SectionHeader num="5" title="Dimensiones y Tolerancias" />
        <div className="grid grid-cols-1 gap-4">
          <Field label="Geometría">
            <textarea className={ta} rows={2} value={ficha.geometria} onChange={e => set('geometria', e.target.value)} placeholder="Forma y geometría según plano..." />
          </Field>
          <Field label="Dimensiones Generales">
            <textarea className={ta} rows={2} value={ficha.dimensiones} onChange={e => set('dimensiones', e.target.value)} placeholder="Cotas principales, diámetros, pasos de rosca..." />
          </Field>
          <Field label="Norma de Tolerancias">
            <textarea className={ta} rows={2} value={ficha.normaTolerancia} onChange={e => set('normaTolerancia', e.target.value)} placeholder="Ej: ISO 2768 clase media (m). Tolerancia rosca: clase 2A ASME B1.1..." />
          </Field>
        </div>
      </div>

      {/* 6. Fabricación y Acabado */}
      <div className="card">
        <SectionHeader num="6" title="Fabricación y Acabado" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Proceso de Fabricación">
              <textarea className={ta} rows={2} value={ficha.procesoFabricacion} onChange={e => set('procesoFabricacion', e.target.value)} placeholder="Operaciones de mecanizado, soldadura, corte, roscado..." />
            </Field>
          </div>
          <Field label="Detalle de Rosca / Unión">
            <input className="input-field text-sm" value={ficha.detalleRosca} onChange={e => set('detalleRosca', e.target.value)} placeholder={'Ej: Roscado 5/8"-11 UNC-2A derecho, según ASME B1.1'} />
          </Field>
          <Field label="Eliminación de Rebabas">
            <input className="input-field text-sm" value={ficha.eliminacionRebabas} onChange={e => set('eliminacionRebabas', e.target.value)} placeholder="Ej: Obligatorio. Todas las aristas deben ser eliminadas." />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Terminación Superficial / Acabado">
              <textarea className={ta} rows={2} value={ficha.terminacionAcabado} onChange={e => set('terminacionAcabado', e.target.value)} placeholder="Pintado, galvanizado, granallado, pulido..." />
            </Field>
          </div>
        </div>
      </div>

      {/* 7. Control de Calidad */}
      <div className="card">
        <SectionHeader num="7" title="Control de Calidad" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Inspección Dimensional">
            <textarea className={ta} rows={2} value={ficha.inspeccionDimensional} onChange={e => set('inspeccionDimensional', e.target.value)} placeholder="Verificación de cotas con instrumentos calibrados..." />
          </Field>
          <Field label="Inspección Visual">
            <textarea className={ta} rows={2} value={ficha.inspeccionVisual} onChange={e => set('inspeccionVisual', e.target.value)} placeholder="Control visual 100%, superficie libre de fisuras..." />
          </Field>
          <Field label="Control Especial">
            <textarea className={ta} rows={2} value={ficha.controlEspecial} onChange={e => set('controlEspecial', e.target.value)} placeholder="Control de rosca con calibres, ensayos END..." />
          </Field>
          <Field label="Trazabilidad">
            <textarea className={ta} rows={2} value={ficha.trazabilidad} onChange={e => set('trazabilidad', e.target.value)} placeholder="Certificados de material, registros de inspección..." />
          </Field>
        </div>
      </div>

      {/* 8. Observaciones Técnicas */}
      <div className="card">
        <SectionHeader num="8" title="Observaciones Técnicas" />
        <Field label="Observaciones">
          <textarea className={ta} rows={5} value={ficha.observaciones} onChange={e => set('observaciones', e.target.value)} placeholder="Notas, advertencias y requisitos especiales de fabricación..." />
        </Field>
      </div>

      {/* 9. Figura Referencial */}
      <div className="card">
        <SectionHeader num="9" title="Figura Referencial" />
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => imgRef.current?.click()}
          >
            {ficha.imagenReferencial ? (
              <div>
                <img src={ficha.imagenReferencial} alt="Figura referencial" className="max-h-48 mx-auto rounded-lg object-contain mb-2" />
                <p className="text-slate-400 text-xs">Click para cambiar imagen</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 text-sm">Click para subir imagen o plano</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG — se incluirá en la ficha técnica PDF</p>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
          </div>
          {ficha.imagenReferencial && (
            <div className="flex gap-2">
              <Field label="Nota de la figura">
                <input className="input-field text-sm" value={ficha.notaImagen} onChange={e => set('notaImagen', e.target.value)} placeholder="Ej: Figura referencial — Plano IG1-15849 Rev.5" />
              </Field>
              <div className="flex items-end pb-0.5">
                <button onClick={() => { set('imagenReferencial', ''); set('notaImagen', '') }} className="text-slate-500 hover:text-red-400 text-xs transition-colors whitespace-nowrap px-3 py-2 border border-slate-700 rounded-lg">
                  Quitar imagen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
