const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function TabBases({ bases, setBases, totalMateriales, totalHH }) {
  const baseCalculo = totalMateriales + totalHH

  const addBase = () =>
    setBases([...bases, { id: Date.now(), nombre: 'Nuevo ítem', porcentaje: 0 }])
  const removeBase = (id) => setBases(bases.filter((b) => b.id !== id))
  const update = (id, field, value) =>
    setBases(bases.map((b) => (b.id === id ? { ...b, [field]: value } : b)))

  const totalPct = bases.reduce((acc, b) => acc + (Number(b.porcentaje) || 0), 0)
  const totalMonto = bases.reduce((acc, b) => acc + (baseCalculo * (Number(b.porcentaje) || 0) / 100), 0)

  return (
    <div className="space-y-5">
      {/* Base de cálculo */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Base de cálculo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Subtotal Materiales</p>
            <p className="text-white font-semibold">{fmt(totalMateriales)}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Subtotal Horas Hombre</p>
            <p className="text-white font-semibold">{fmt(totalHH)}</p>
          </div>
          <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-xs mb-1">Base (Materiales + HH)</p>
            <p className="text-blue-400 font-bold text-lg">{fmt(baseCalculo)}</p>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-3">
          Los servicios no forman parte de la base para los porcentajes.
        </p>
      </div>

      {/* Porcentajes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Porcentajes sobre base</h2>
          <button onClick={addBase} className="btn-secondary text-sm py-2">+ Agregar ítem</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">Concepto</th>
                <th className="text-right px-4 py-3 w-32">Porcentaje</th>
                <th className="text-right px-4 py-3 w-40">Monto calculado</th>
                <th className="px-4 py-3 rounded-r-lg w-10"></th>
              </tr>
            </thead>
            <tbody>
              {bases.map((b) => (
                <tr key={b.id} className="border-b border-slate-700">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="input-field text-sm py-1.5"
                      value={b.nombre}
                      onChange={(e) => update(b.id, 'nombre', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="input-field text-sm py-1.5 w-20 text-right"
                        value={b.porcentaje || ''}
                        placeholder="0"
                        onChange={(e) => update(b.id, 'porcentaje', Number(e.target.value))}
                      />
                      <span className="text-slate-400 text-sm">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-blue-400 font-medium">
                    {fmt(baseCalculo * (Number(b.porcentaje) || 0) / 100)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeBase(b.id)}
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
                <td className="px-4 py-3 text-slate-400 font-medium">Total</td>
                <td className="px-4 py-3 text-right text-slate-300 font-semibold">{totalPct.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-blue-400 font-bold text-base">{fmt(totalMonto)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
