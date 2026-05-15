import { useState } from 'react'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const emptyMaterial = () => ({
  id: Date.now() + Math.random(),
  nombre: '',
  proveedor: '',
  formato: '',
  cantidad: 1,
  precio_unitario: 0,
})

export default function TabMateriales({ materiales, setMateriales }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [searchError, setSearchError] = useState('')

  const addRow = () => setMateriales([...materiales, emptyMaterial()])
  const removeRow = (id) => setMateriales(materiales.filter((m) => m.id !== id))
  const updateRow = (id, field, value) =>
    setMateriales(materiales.map((m) => (m.id === id ? { ...m, [field]: value } : m)))

  const searchWithAI = async () => {
    if (!searchTerm.trim()) return
    setSearching(true)
    setSearchError('')
    setResults([])
    try {
      const res = await fetch('/api/search-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      })
      const data = await res.json()
      if (data.error) {
        setSearchError(`Error: ${data.error}`)
      } else {
        setResults(data.results || [])
      }
    } catch {
      setSearchError('Error al conectar con el servicio de búsqueda.')
    } finally {
      setSearching(false)
    }
  }

  const addFromResult = (r) => {
    setMateriales([
      ...materiales,
      { id: Date.now() + Math.random(), nombre: r.nombre, proveedor: r.proveedor, formato: r.formato, cantidad: 1, precio_unitario: r.precio_unitario },
    ])
  }

  const total = materiales.reduce((acc, m) => acc + (m.cantidad * m.precio_unitario || 0), 0)

  return (
    <div className="space-y-6">
      {/* AI Search */}
      <div className="card border-blue-500/30 bg-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-blue-400">Buscar material con IA (Claude)</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Ej: acero A36, tubo cuadrado 40x40, plancha inoxidable 304..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchWithAI()}
          />
          <button onClick={searchWithAI} className="btn-primary px-5 whitespace-nowrap" disabled={searching}>
            {searching ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Buscando...
              </span>
            ) : 'Buscar'}
          </button>
        </div>

        {searchError && <p className="text-red-400 text-sm mt-2">{searchError}</p>}

        {results.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {results.map((r, i) => (
              <div key={i} className="bg-slate-950 border border-slate-600 rounded-lg p-3">
                <p className="text-white font-medium text-sm leading-tight">{r.nombre}</p>
                <p className="text-slate-400 text-xs mt-1">{r.proveedor}</p>
                <p className="text-slate-500 text-xs">Formato: {r.formato}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-blue-400 font-semibold text-sm">{fmt(r.precio_unitario)}</span>
                  <button
                    onClick={() => addFromResult(r)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Lista de materiales</h2>
          <button onClick={addRow} className="btn-secondary text-sm py-2">+ Agregar fila</button>
        </div>

        {materiales.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">Sin materiales. Agrega uno manualmente o usa el buscador IA.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-3 py-3 rounded-l-lg">Material</th>
                  <th className="text-left px-3 py-3">Proveedor</th>
                  <th className="text-left px-3 py-3">Formato de venta</th>
                  <th className="text-right px-3 py-3">Cantidad</th>
                  <th className="text-right px-3 py-3">Precio unit.</th>
                  <th className="text-right px-3 py-3">Precio total</th>
                  <th className="px-3 py-3 rounded-r-lg w-8"></th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m) => (
                  <tr key={m.id} className="border-b border-slate-700">
                    <td className="px-3 py-2">
                      <input type="text" className="input-field py-1.5 text-sm min-w-36" placeholder="Nombre del material" value={m.nombre} onChange={(e) => updateRow(m.id, 'nombre', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" className="input-field py-1.5 text-sm min-w-28" placeholder="Proveedor" value={m.proveedor} onChange={(e) => updateRow(m.id, 'proveedor', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" className="input-field py-1.5 text-sm min-w-24" placeholder="Ej: Kg, Barra 6m" value={m.formato} onChange={(e) => updateRow(m.id, 'formato', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01" className="input-field py-1.5 text-sm text-right w-20" value={m.cantidad} onChange={(e) => updateRow(m.id, 'cantidad', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" className="input-field py-1.5 text-sm text-right w-28" placeholder="0" value={m.precio_unitario || ''} onChange={(e) => updateRow(m.id, 'precio_unitario', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2 text-right text-blue-400 font-medium whitespace-nowrap">
                      {fmt(m.cantidad * m.precio_unitario || 0)}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeRow(m.id)} className="text-slate-500 hover:text-red-400 transition-colors">
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
                  <td colSpan={5} className="px-3 py-3 text-right text-slate-400 font-medium">Total materiales:</td>
                  <td className="px-3 py-3 text-right text-blue-400 font-bold text-base">{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
