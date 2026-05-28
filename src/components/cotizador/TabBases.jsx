const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const BASES_SIN_MATERIAL = [
  { nombre: 'Gastos Generales',    porcentaje: 45 },
  { nombre: 'Utilidades',          porcentaje: 25 },
  { nombre: 'Costos Financieros',  porcentaje: 5  },
  { nombre: 'Imprevistos',         porcentaje: 5  },
]

// ── Análisis de márgenes ─────────────────────────────────────────────────────
function analizarBases(bases, conMaterial) {
  const avisos = []
  const totalPct = bases.reduce((acc, b) => acc + (Number(b.porcentaje) || 0), 0)
  if (bases.length === 0 || totalPct === 0) return avisos

  const gg   = bases.find(b => /gastos\s*(gen|general)/i.test(b.nombre))
  const util = bases.find(b => /utilidad/i.test(b.nombre))

  if (conMaterial === false) {
    // Sin material — base reducida, márgenes deben ser más altos
    if (gg) {
      const pct = Number(gg.porcentaje) || 0
      if (pct < 25)
        avisos.push({
          nivel: pct < 15 ? 'error' : 'warn',
          msg: `Gastos Generales al ${pct}% puede ser insuficiente. Sin material en la base, se recomienda mínimo 35–45% para cubrir herramientas, depreciación de maquinaria y overhead del taller.`,
        })
    }
    if (util) {
      const pct = Number(util.porcentaje) || 0
      if (pct < 10)
        avisos.push({
          nivel: 'warn',
          msg: `Utilidades al ${pct}% — se recomienda mínimo 12–15% para sostener el negocio a largo plazo.`,
        })
    }
    if (totalPct < 50)
      avisos.push({
        nivel: totalPct < 35 ? 'error' : 'warn',
        msg: `Total de bases ${totalPct.toFixed(1)}% parece bajo. Con base reducida (sin material) el rango recomendado es 55–90% para cubrir todos los costos indirectos y margen de utilidad.`,
      })
  } else {
    // Con material incluido en la base
    if (gg) {
      const pct = Number(gg.porcentaje) || 0
      if (pct < 15)
        avisos.push({
          nivel: pct < 8 ? 'error' : 'warn',
          msg: `Gastos Generales al ${pct}% puede ser muy bajo. Con material incluido en la base, el rango habitual es 20–45%.`,
        })
    }
    if (util) {
      const pct = Number(util.porcentaje) || 0
      if (pct < 8)
        avisos.push({
          nivel: 'warn',
          msg: `Utilidades al ${pct}% — considera al menos 10–15% para cubrir riesgo de proyecto y crecimiento del taller.`,
        })
    }
    if (totalPct < 25)
      avisos.push({
        nivel: totalPct < 15 ? 'error' : 'warn',
        msg: `Total de bases ${totalPct.toFixed(1)}% puede ser insuficiente. Con material en la base, el rango habitual es 30–60%.`,
      })
  }

  return avisos
}

export default function TabBases({ bases, setBases, totalMateriales, totalHH, conMaterial, totalConsumibles = 0 }) {
  const baseSubtotal = conMaterial === false ? totalConsumibles : totalMateriales
  const baseCalculo  = baseSubtotal + totalHH

  const addBase = () =>
    setBases([...bases, { id: Date.now(), nombre: 'Nuevo ítem', porcentaje: 0 }])
  const removeBase = (id) => setBases(bases.filter((b) => b.id !== id))
  const update = (id, field, value) =>
    setBases(bases.map((b) => (b.id === id ? { ...b, [field]: value } : b)))

  const aplicarBasesSugeridas = () =>
    setBases(BASES_SIN_MATERIAL.map((b, i) => ({ id: i + 1, ...b })))

  const totalPct   = bases.reduce((acc, b) => acc + (Number(b.porcentaje) || 0), 0)
  const totalMonto = bases.reduce((acc, b) => acc + (baseCalculo * (Number(b.porcentaje) || 0) / 100), 0)

  const avisos = analizarBases(bases, conMaterial)

  return (
    <div className="space-y-5">

      {/* Aviso sin material */}
      {conMaterial === false && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl px-5 py-4 flex gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-300 text-sm font-semibold mb-1">Cotización sin materiales — base reducida</p>
            <p className="text-blue-400/80 text-sm leading-relaxed">
              La base se calcula sobre <strong>Consumibles + HH</strong>. Sin el costo del material de base,
              los porcentajes de gastos generales deben ser más altos (40–60%) para cubrir herramientas,
              depreciación de maquinaria y overhead del taller.
            </p>
            <button
              onClick={aplicarBasesSugeridas}
              className="mt-3 inline-flex items-center gap-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-400/60 text-blue-300 hover:text-blue-200 px-3.5 py-2 rounded-lg transition-all font-semibold"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Aplicar bases sugeridas — GG 45% · Util. 25% · CF 5% · Imprev. 5%
            </button>
          </div>
        </div>
      )}

      {/* Base de cálculo */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Base de cálculo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-stone-900 rounded-lg p-4">
            <p className="text-stone-400 text-xs mb-1">
              {conMaterial === false ? 'Subtotal Consumibles' : 'Subtotal Materiales'}
            </p>
            <p className="text-white font-semibold">{fmt(baseSubtotal)}</p>
          </div>
          <div className="bg-stone-900 rounded-lg p-4">
            <p className="text-stone-400 text-xs mb-1">Subtotal Horas Hombre</p>
            <p className="text-white font-semibold">{fmt(totalHH)}</p>
          </div>
          <div className="bg-stone-900 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-400 text-xs mb-1">
              {conMaterial === false ? 'Base (Consumibles + HH)' : 'Base (Materiales + HH)'}
            </p>
            <p className="text-amber-400 font-bold text-lg">{fmt(baseCalculo)}</p>
          </div>
        </div>
        <p className="text-stone-500 text-xs mt-3">
          Los servicios externos y el embalaje <strong className="text-stone-400">no forman parte de la base</strong> — se suman directamente al precio final.
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
                <tr key={b.id} className="border-b border-stone-700">
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
                      <span className="text-stone-400 text-sm">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-amber-400 font-medium">
                    {fmt(baseCalculo * (Number(b.porcentaje) || 0) / 100)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeBase(b.id)}
                      className="text-stone-500 hover:text-red-400 transition-colors"
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
              <tr className="border-t-2 border-stone-600">
                <td className="px-4 py-3 text-stone-400 font-medium">Total</td>
                <td className="px-4 py-3 text-right text-stone-300 font-semibold">{totalPct.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-amber-400 font-bold text-base">{fmt(totalMonto)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Avisos de márgenes insuficientes */}
      {avisos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {avisos.map((a, i) => {
            const isErr = a.nivel === 'error'
            return (
              <div key={i} style={{
                borderRadius: 12, padding: '14px 20px', display: 'flex', gap: 12,
                background: isErr ? 'rgba(127,29,29,0.55)' : 'rgba(120,53,15,0.55)',
                border: `1px solid ${isErr ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.7)'}`,
              }}>
                <svg style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, color: isErr ? '#ff8080' : '#fbbf24' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: isErr ? '#ffb3b3' : '#fde68a', textShadow: '0 1px 3px #000, 0 0 6px rgba(0,0,0,0.8)' }}>
                    {isErr ? 'Margen probablemente insuficiente' : 'Revisa los márgenes'}
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: isErr ? '#ffd5d5' : '#fef3c7', textShadow: '0 1px 2px #000, 0 0 4px rgba(0,0,0,0.7)' }}>
                    {a.msg}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
