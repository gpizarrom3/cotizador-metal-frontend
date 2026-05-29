const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export const DEFAULT_CONSUMIBLES = [
  { id: 1,  nombre: 'Electrodo E6011 3/32"',        unidad: 'kg',     precio_unitario: 4500,  cantidad: 0 },
  { id: 2,  nombre: 'Hilo MIG ER70S-6 0.9mm',       unidad: 'kg',     precio_unitario: 4200,  cantidad: 0 },
  { id: 3,  nombre: 'Hilo TIG ER308L 2.4mm',        unidad: 'kg',     precio_unitario: 18000, cantidad: 0 },
  { id: 4,  nombre: 'Disco de corte 4½" × 1mm',     unidad: 'unid',   precio_unitario: 850,   cantidad: 0 },
  { id: 5,  nombre: 'Disco de desbaste 4½" × 6mm',  unidad: 'unid',   precio_unitario: 1200,  cantidad: 0 },
  { id: 6,  nombre: 'Disco flap 4½" Gr.40',         unidad: 'unid',   precio_unitario: 1800,  cantidad: 0 },
  { id: 7,  nombre: 'Disco flap 4½" Gr.80',         unidad: 'unid',   precio_unitario: 1800,  cantidad: 0 },
  { id: 8,  nombre: 'Gas argón / mix 75-25',        unidad: 'm³',     precio_unitario: 9000,  cantidad: 0 },
  { id: 9,  nombre: 'Oxígeno industrial',           unidad: 'm³',     precio_unitario: 3500,  cantidad: 0 },
  { id: 10, nombre: 'Acetileno',                    unidad: 'kg',     precio_unitario: 14000, cantidad: 0 },
  { id: 11, nombre: 'Lija en hoja Gr.80',           unidad: 'pliego', precio_unitario: 700,   cantidad: 0 },
  { id: 12, nombre: 'Lija en hoja Gr.120',          unidad: 'pliego', precio_unitario: 700,   cantidad: 0 },
  { id: 13, nombre: 'Broca HSS 10mm',               unidad: 'unid',   precio_unitario: 5000,  cantidad: 0 },
  { id: 14, nombre: 'Inserto CNMG (torneado)',      unidad: 'unid',   precio_unitario: 9500,  cantidad: 0 },
  { id: 15, nombre: 'Fresa 10mm HSS-Co',            unidad: 'unid',   precio_unitario: 22000, cantidad: 0 },
  { id: 16, nombre: 'Pintura anticorrosivo',        unidad: 'litro',  precio_unitario: 12000, cantidad: 0 },
  { id: 17, nombre: 'Thinner estándar',             unidad: 'litro',  precio_unitario: 3800,  cantidad: 0 },
  { id: 18, nombre: 'Masilla plana',               unidad: 'kg',     precio_unitario: 4500,  cantidad: 0 },
]

const emptyConsumible = () => ({
  id: Date.now() + Math.random(),
  nombre: '', unidad: 'unid', precio_unitario: 0, cantidad: 1,
})

export default function TabConsumibles({ consumibles, setConsumibles }) {
  const update = (id, field, value) =>
    setConsumibles(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))

  const remove = (id) =>
    setConsumibles(prev => prev.filter(c => c.id !== id))

  const addRow = () =>
    setConsumibles(prev => [...prev, emptyConsumible()])

  const total = consumibles.reduce(
    (acc, c) => acc + ((Number(c.cantidad) * Number(c.precio_unitario)) || 0), 0
  )

  return (
    <div className="space-y-5">
      {/* Banner informativo */}
      <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl px-5 py-4 flex gap-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-amber-300 text-sm leading-relaxed">
          <strong>Cotización sin materiales:</strong> el cliente suministra el material. Registra aquí los consumibles del taller que se usarán en el trabajo — forman parte de la base de cálculo para los gastos generales.
        </p>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-white">Consumibles de taller</h2>
          {total > 0 && (
            <span className="text-amber-400 font-bold text-base">{fmt(total)}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="table-header">
                <th className="text-left px-3 py-3 rounded-l-lg">Consumible</th>
                <th className="text-left px-3 py-3 w-24">Unidad</th>
                <th className="text-right px-3 py-3 w-24">Cantidad</th>
                <th className="text-right px-3 py-3 w-32">P. Unit.</th>
                <th className="text-right px-3 py-3 w-28">Total</th>
                <th className="px-3 py-3 rounded-r-lg w-8" />
              </tr>
            </thead>
            <tbody>
              {consumibles.map((c) => {
                const subtotal = (Number(c.cantidad) * Number(c.precio_unitario)) || 0
                const activo   = Number(c.cantidad) > 0
                return (
                  <tr key={c.id} className={`border-b border-stone-700 transition-opacity ${activo ? '' : 'opacity-40'}`}>
                    <td className="px-3 py-2">
                      <input type="text" className="input-field py-1.5 text-sm w-full"
                        placeholder="Nombre del consumible"
                        value={c.nombre}
                        onChange={e => update(c.id, 'nombre', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" className="input-field py-1.5 text-sm w-full"
                        placeholder="unid"
                        value={c.unidad}
                        onChange={e => update(c.id, 'unidad', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.1" className="input-field py-1.5 text-sm text-right w-full"
                        placeholder="0"
                        value={c.cantidad || ''}
                        onChange={e => update(c.id, 'cantidad', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" className="input-field py-1.5 text-sm text-right w-full"
                        placeholder="0"
                        value={c.precio_unitario || ''}
                        onChange={e => update(c.id, 'precio_unitario', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                      {subtotal > 0
                        ? <span className="text-amber-400">{fmt(subtotal)}</span>
                        : <span className="text-stone-700">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => remove(c.id)} className="text-stone-600 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {total > 0 && (
              <tfoot>
                <tr className="border-t border-stone-600">
                  <td colSpan={4} className="px-3 py-3 text-right text-stone-400 text-sm font-medium">Total consumibles:</td>
                  <td className="px-3 py-3 text-right text-amber-400 font-bold text-base">{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <button onClick={addRow} className="btn-secondary text-sm py-1.5 mt-3">+ Agregar consumible</button>
      </div>

      {/* Tips */}
      <div className="bg-stone-800/50 border border-stone-700 rounded-xl px-5 py-4">
        <h3 className="text-stone-300 text-sm font-semibold mb-2">Referencia de consumo típico</h3>
        <ul className="text-stone-500 text-xs space-y-1.5 leading-relaxed">
          <li>• <strong className="text-stone-400">Electrodos / hilo MIG:</strong> 0.1–0.2 kg por kg de material soldado (considera eficiencia de deposición ~85%)</li>
          <li>• <strong className="text-stone-400">Gas argón/mix:</strong> 8–15 L/min según diámetro de tobera. 1 hora de arco ≈ 0.5–0.9 m³</li>
          <li>• <strong className="text-stone-400">Discos de corte 4½":</strong> duran ~3–6 min de corte continuo en A36. Estima cantidad real, no la teórica</li>
          <li>• <strong className="text-stone-400">Insertos de torno CNMG:</strong> proratea el costo: si un inserto dura 10 piezas, carga 10% por pieza</li>
          <li>• <strong className="text-stone-400">Pintura:</strong> rendimiento típico 8–12 m²/litro según espesor de capa y tipo de superficie</li>
        </ul>
      </div>
    </div>
  )
}
