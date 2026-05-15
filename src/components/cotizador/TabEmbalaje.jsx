const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

// Pallets estándar según normas chilenas / Agunsa Chile
const PALLETS_STD = [
  { id: 'euro', nombre: 'EUR/EPAL (Euro pallet)', largo: 1200, ancho: 800, alto_max: 1500, carga_max: 1500, uso: 'Carga general, exportación europea, transporte intermodal' },
  { id: 'iso', nombre: 'ISO 1 (Pallet estándar)', largo: 1200, ancho: 1000, alto_max: 1800, carga_max: 1200, uso: 'Uso general industria, bodegaje, camiones nacionales' },
  { id: 'americano', nombre: 'GMA / Americano', largo: 1219, ancho: 1016, alto_max: 1800, carga_max: 1000, uso: 'Compatibilidad exportación EEUU, contenedor 20\'/40\'' },
  { id: 'custom', nombre: 'Pallet personalizado', largo: 0, ancho: 0, alto_max: 0, carga_max: 0, uso: '' },
]

// Materiales de embalaje con precios mercado chileno (referencia, mayo 2026)
const MATERIALES_DEFAULT = [
  { id: 1, nombre: 'Pallet de madera 1200×800 mm (EPAL)', unidad: 'unid.', precio_ref: 8500, cantidad: 1, precio_unitario: 8500 },
  { id: 2, nombre: 'Pallet de madera 1200×1000 mm (ISO)', unidad: 'unid.', precio_ref: 9500, cantidad: 0, precio_unitario: 9500 },
  { id: 3, nombre: 'Strech film 500mm × 300m (23 µm)', unidad: 'rollo', precio_ref: 4200, cantidad: 1, precio_unitario: 4200 },
  { id: 4, nombre: 'Cinta de zuncho plástico 16mm × 200m', unidad: 'rollo', precio_ref: 9800, cantidad: 1, precio_unitario: 9800 },
  { id: 5, nombre: 'Cantonera de cartón 35×35×3mm (x100 unid.)', unidad: 'paquete', precio_ref: 5200, cantidad: 1, precio_unitario: 5200 },
  { id: 6, nombre: 'Zuncho metálico 19mm (rollo 200m)', unidad: 'rollo', precio_ref: 28500, cantidad: 0, precio_unitario: 28500 },
  { id: 7, nombre: 'Lámina de cartón corrugado 1200×1000 mm', unidad: 'unid.', precio_ref: 850, cantidad: 4, precio_unitario: 850 },
  { id: 8, nombre: 'Espuma polietileno 10mm (plancha 1×2m)', unidad: 'unid.', precio_ref: 3200, cantidad: 0, precio_unitario: 3200 },
  { id: 9, nombre: 'Bolsa VCI anticorrosión 1200×1000mm', unidad: 'unid.', precio_ref: 1800, cantidad: 0, precio_unitario: 1800 },
  { id: 10, nombre: 'Silica gel 100g (caja x25 sobres)', unidad: 'caja', precio_ref: 4500, cantidad: 0, precio_unitario: 4500 },
  { id: 11, nombre: 'Caja de cartón corrugado (triple pared)', unidad: 'unid.', precio_ref: 3500, cantidad: 0, precio_unitario: 3500 },
  { id: 12, nombre: 'Flejes metálicos con hebillas (x100)', unidad: 'kit', precio_ref: 6800, cantidad: 0, precio_unitario: 6800 },
]

const RECOMENDACIONES = [
  { titulo: 'Peso por pallet', detalle: 'Agunsa Chile indica que el peso bruto máximo por pallet no debe superar la capacidad nominal. Se recomienda no exceder el 80% de la carga máxima para seguridad en manipulación con horquilla.' },
  { titulo: 'Altura máxima del pallet armado', detalle: 'La altura total (pallet + carga) no debe superar 1.80 m para operaciones normales de bodega, ni 2.20 m en operaciones de exportación. Verificar altura de container si es carga marítima.' },
  { titulo: 'Centro de gravedad', detalle: 'La carga más pesada debe ubicarse en la parte inferior. El centro de gravedad no debe superar 2/3 de la altura del pallet armado. Distribuir el peso simétricamente respecto al eje central.' },
  { titulo: 'Envolver con stretch film', detalle: 'Mínimo 3 pasadas completas desde la base, solapando 50% en cada vuelta. Incluir la cubierta superior. Para piezas metálicas utilizar strech de alta resistencia (≥ 23 µm).' },
  { titulo: 'Protección de aristas y esquinas', detalle: 'Instalar cantoneras de cartón o PVC en las 4 esquinas verticales antes de zunchar. El zuncho no debe ejercer presión directa sobre la carga sin cantoneras.' },
  { titulo: 'Zunchado', detalle: 'Mínimo 2 zunchos horizontales y 2 en diagonal si la carga lo permite. Tensar con herramienta de zunchado. Para cargas > 500 kg usar zuncho metálico en lugar de plástico.' },
  { titulo: 'Marcado y etiquetado', detalle: 'Identificar con: razón social, n° de OT/cotización, descripción, peso bruto y neto, cantidad, punto de izado. Etiquetas en al menos 2 caras del pallet. Para exportación incluir país de origen.' },
  { titulo: 'Piezas metálicas / anticorrosión', detalle: 'Para piezas maquinadas o con acabado superficial crítico: envolver individualmente con papel VCI o bolsa VCI. Añadir sobres de sílica gel en espacios cerrados. Evitar contacto metal-madera sin protección.' },
  { titulo: 'Documentación', detalle: 'Adjuntar packing list pegado en la cara exterior del embalaje dentro de un sobre plástico. El documento debe incluir el número de cotización/guía de despacho.' },
]

export default function TabEmbalaje({ embalaje, setEmbalaje }) {
  const { palletId, cargaKg, alturaCm, materiales, notas } = embalaje

  const setPalletId = (v) => setEmbalaje((e) => ({ ...e, palletId: v }))
  const setCargaKg = (v) => setEmbalaje((e) => ({ ...e, cargaKg: v }))
  const setAlturaCm = (v) => setEmbalaje((e) => ({ ...e, alturaCm: v }))
  const setNotas = (v) => setEmbalaje((e) => ({ ...e, notas: v }))

  const updateMaterial = (id, field, value) =>
    setEmbalaje((e) => ({
      ...e,
      materiales: e.materiales.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }))

  const addMaterial = () =>
    setEmbalaje((e) => ({
      ...e,
      materiales: [...e.materiales, { id: Date.now(), nombre: '', unidad: 'unid.', precio_ref: 0, cantidad: 1, precio_unitario: 0 }],
    }))

  const removeMaterial = (id) =>
    setEmbalaje((e) => ({ ...e, materiales: e.materiales.filter((m) => m.id !== id) }))

  const palletSeleccionado = PALLETS_STD.find((p) => p.id === palletId)
  const materialesActivos = materiales.filter((m) => Number(m.cantidad) > 0)
  const totalEmbalaje = materialesActivos.reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)

  const getAlerta = () => {
    if (!palletSeleccionado || palletId === 'custom') return null
    const alerts = []
    if (cargaKg && Number(cargaKg) > palletSeleccionado.carga_max)
      alerts.push(`⚠ El peso (${cargaKg} kg) supera la carga máxima del pallet (${palletSeleccionado.carga_max} kg).`)
    if (alturaCm && Number(alturaCm) > palletSeleccionado.alto_max / 10)
      alerts.push(`⚠ La altura total (${alturaCm} cm) supera el máximo recomendado (${palletSeleccionado.alto_max / 10} cm).`)
    return alerts
  }

  const alertas = getAlerta()

  return (
    <div className="space-y-5">
      {/* Datos de la carga */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Datos de la carga a embalar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Peso estimado de la carga (kg)</label>
            <input
              type="number" min="0" className="input-field"
              placeholder="Ej: 350"
              value={cargaKg || ''}
              onChange={(e) => setCargaKg(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Altura total estimada con embalaje (cm)</label>
            <input
              type="number" min="0" className="input-field"
              placeholder="Ej: 120"
              value={alturaCm || ''}
              onChange={(e) => setAlturaCm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Selección de pallet */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-1">Selección de pallet</h2>
        <p className="text-slate-500 text-xs mb-4">Según normativa Agunsa Chile y estándares ISO 6780 / EPAL</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PALLETS_STD.map((p) => {
            const isSelected = palletId === p.id
            const overPeso = p.id !== 'custom' && cargaKg && Number(cargaKg) > p.carga_max
            const overAltura = p.id !== 'custom' && alturaCm && Number(alturaCm) > p.alto_max / 10
            return (
              <button
                key={p.id}
                onClick={() => setPalletId(p.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-semibold text-sm ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>{p.nombre}</p>
                    {p.id !== 'custom' && (
                      <>
                        <p className="text-slate-400 text-xs mt-1">{p.largo} × {p.ancho} mm — hasta {p.alto_max / 10} cm alto</p>
                        <p className="text-slate-500 text-xs">Carga máx: {p.carga_max} kg</p>
                        <p className="text-slate-500 text-xs mt-1">{p.uso}</p>
                      </>
                    )}
                    {p.id === 'custom' && (
                      <p className="text-slate-400 text-xs mt-1">Ingresar dimensiones manualmente</p>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {(overPeso || overAltura) && (
                  <p className="text-amber-400 text-xs mt-2">⚠ Supera límite para este pallet</p>
                )}
              </button>
            )
          })}
        </div>

        {/* Custom pallet dimensions */}
        {palletId === 'custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            {['largo', 'ancho', 'alto_max', 'carga_max'].map((field) => (
              <div key={field}>
                <label className="label capitalize">{field.replace('_', ' ')} {field === 'carga_max' ? '(kg)' : '(mm)'}</label>
                <input
                  type="number" min="0" className="input-field text-sm"
                  value={embalaje[field] || ''}
                  onChange={(e) => setEmbalaje((em) => ({ ...em, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        {alertas && alertas.length > 0 && (
          <div className="mt-4 space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className="bg-amber-900/30 border border-amber-500/40 text-amber-400 text-sm rounded-lg px-4 py-2">{a}</div>
            ))}
          </div>
        )}
      </div>

      {/* Materiales de embalaje */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Materiales de embalaje</h2>
          <button onClick={addMaterial} className="btn-secondary text-sm py-2">+ Agregar material</button>
        </div>
        <p className="text-slate-500 text-xs mb-4">Precios de referencia mercado chileno (mayo 2026). Edita las cantidades y precios según tu cotización real.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">Material</th>
                <th className="text-center px-4 py-3 w-24">Unidad</th>
                <th className="text-center px-4 py-3 w-24">Cantidad</th>
                <th className="text-right px-4 py-3 w-40">Precio unit. (CLP)</th>
                <th className="text-right px-4 py-3 w-40">Total</th>
                <th className="px-4 py-3 rounded-r-lg w-10"></th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => (
                <tr key={m.id} className={`border-b border-slate-700 ${Number(m.cantidad) === 0 ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2">
                    <input
                      type="text" className="input-field text-sm py-1.5"
                      value={m.nombre}
                      onChange={(e) => updateMaterial(m.id, 'nombre', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text" className="input-field text-sm py-1.5 text-center"
                      value={m.unidad}
                      onChange={(e) => updateMaterial(m.id, 'unidad', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number" min="0" step="0.1" className="input-field text-sm py-1.5 text-center"
                      value={m.cantidad || ''}
                      placeholder="0"
                      onChange={(e) => updateMaterial(m.id, 'cantidad', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number" min="0" className="input-field text-sm py-1.5 text-right"
                      value={m.precio_unitario || ''}
                      placeholder="0"
                      onChange={(e) => updateMaterial(m.id, 'precio_unitario', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-200">
                    {fmt(Number(m.cantidad) * Number(m.precio_unitario))}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeMaterial(m.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-600">
                <td colSpan={4} className="px-4 py-3 text-slate-400 font-medium">Total embalaje</td>
                <td className="px-4 py-3 text-right text-blue-400 font-bold text-base">{fmt(totalEmbalaje)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Recomendaciones Agunsa Chile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-amber-600/20 border border-amber-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Recomendaciones de palletizado</h2>
            <p className="text-slate-500 text-xs">Basado en estándares Agunsa Chile y normas IRAM / ISO</p>
          </div>
        </div>
        <div className="space-y-3">
          {RECOMENDACIONES.map((r, i) => (
            <div key={i} className="flex gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="text-slate-200 text-sm font-medium">{r.titulo}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{r.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notas de embalaje */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-3">Notas de embalaje / instrucciones especiales</h2>
        <textarea
          className="input-field text-sm resize-none w-full"
          rows={3}
          placeholder="Ej: Frágil, no apilar, requiere manipulación con puente grúa, instrucciones de orientación..."
          value={notas || ''}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {/* Resumen costo */}
      {totalEmbalaje > 0 && (
        <div className="card border-amber-500/30 bg-amber-600/5">
          <p className="text-amber-300 font-semibold mb-1">Costo total de embalaje y envío</p>
          <p className="text-amber-400 font-bold text-3xl">{fmt(totalEmbalaje)}</p>
          <p className="text-slate-500 text-xs mt-1">Este monto se sumará al resumen de costos</p>
        </div>
      )}
    </div>
  )
}
