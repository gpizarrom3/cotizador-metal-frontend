import { useState } from 'react'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const emptyMaterial = () => ({
  id: Date.now() + Math.random(),
  nombre: '', proveedor: '', formato: '', cantidad: 1, precio_unitario: 0,
})

// ── Calculadora de peso ───────────────────────────────────────────────────────
const MATERIALES_PESO = [
  { label: 'Acero A36',        densidad: 7850 },
  { label: 'Acero A572 Gr50',  densidad: 7850 },
  { label: 'Acero Inox 304',   densidad: 7900 },
  { label: 'Acero Inox 316',   densidad: 7980 },
  { label: 'Aluminio 6061',    densidad: 2700 },
  { label: 'Aluminio 5052',    densidad: 2680 },
  { label: 'Cobre',            densidad: 8960 },
  { label: 'Bronce',           densidad: 8500 },
  { label: 'Fundición gris',   densidad: 7200 },
]

const GEOMETRIAS = [
  { id: 'plancha',       label: 'Plancha / Lámina',     campos: ['largo', 'ancho', 'espesor'] },
  { id: 'barra_redonda', label: 'Barra redonda',        campos: ['diametro', 'largo'] },
  { id: 'barra_cuad',   label: 'Barra cuadrada',       campos: ['lado', 'largo'] },
  { id: 'barra_plana',  label: 'Barra plana / Rect.',  campos: ['ancho', 'espesor', 'largo'] },
  { id: 'tubo_redondo', label: 'Tubo redondo',         campos: ['diametro_ext', 'espesor_pared', 'largo'] },
  { id: 'tubo_cuad',    label: 'Tubo cuadrado',        campos: ['lado_ext', 'espesor_pared', 'largo'] },
  { id: 'perfil_l',     label: 'Perfil L (Ángulo)',    campos: ['ala1', 'ala2', 'espesor', 'largo'] },
]

const CAMPO_LABELS = {
  largo: 'Largo (mm)', ancho: 'Ancho (mm)', espesor: 'Espesor (mm)',
  diametro: 'Diámetro (mm)', lado: 'Lado (mm)',
  diametro_ext: 'Diám. ext (mm)', espesor_pared: 'Espesor pared (mm)',
  lado_ext: 'Lado ext (mm)',
  ala1: 'Ala 1 (mm)', ala2: 'Ala 2 (mm)',
}

function calcPesoKg(geomId, dims, densidad) {
  const d = (k) => Number(dims[k]) || 0
  const rho = densidad / 1e9 // kg/mm³
  let vol = 0
  if (geomId === 'plancha')       vol = d('largo') * d('ancho') * d('espesor')
  if (geomId === 'barra_redonda') vol = Math.PI / 4 * d('diametro') ** 2 * d('largo')
  if (geomId === 'barra_cuad')    vol = d('lado') ** 2 * d('largo')
  if (geomId === 'barra_plana')   vol = d('ancho') * d('espesor') * d('largo')
  if (geomId === 'tubo_redondo') {
    const ri = d('diametro_ext') / 2 - d('espesor_pared')
    vol = Math.PI * (Math.pow(d('diametro_ext') / 2, 2) - Math.pow(Math.max(0, ri), 2)) * d('largo')
  }
  if (geomId === 'tubo_cuad') {
    const li = d('lado_ext') - 2 * d('espesor_pared')
    vol = (d('lado_ext') ** 2 - Math.max(0, li) ** 2) * d('largo')
  }
  if (geomId === 'perfil_l') vol = (d('ala1') + d('ala2') - d('espesor')) * d('espesor') * d('largo')
  return vol * rho
}

function PesoCalculadora({ onAgregar }) {
  const [open, setOpen] = useState(false)
  const [matIdx, setMatIdx] = useState(0)
  const [geomId, setGeomId] = useState('plancha')
  const [dims, setDims] = useState({})
  const [cantidad, setCantidad] = useState(1)

  const geom = GEOMETRIAS.find(g => g.id === geomId)
  const mat  = MATERIALES_PESO[matIdx]
  const pesoUnit = calcPesoKg(geomId, dims, mat.densidad)
  const pesoTotal = pesoUnit * (Number(cantidad) || 1)

  const handleAgregar = () => {
    if (pesoTotal <= 0) return
    onAgregar({
      nombre: `${mat.label} — ${geom.label}`,
      formato: `${pesoTotal.toFixed(2)} kg`,
      cantidad: Number(cantidad) || 1,
    })
    setDims({})
    setCantidad(1)
  }

  return (
    <div className="card border-emerald-500/20 bg-slate-800">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-600/30 border border-emerald-500/30 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-emerald-400">Calculadora de peso de materiales</h3>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Material</label>
              <select className="input-field" value={matIdx} onChange={e => setMatIdx(Number(e.target.value))}>
                {MATERIALES_PESO.map((m, i) => <option key={i} value={i}>{m.label} ({m.densidad} kg/m³)</option>)}
              </select>
            </div>
            <div>
              <label className="label">Geometría</label>
              <select className="input-field" value={geomId} onChange={e => { setGeomId(e.target.value); setDims({}) }}>
                {GEOMETRIAS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {geom.campos.map(campo => (
              <div key={campo}>
                <label className="label">{CAMPO_LABELS[campo] || campo}</label>
                <input type="number" min="0" className="input-field text-sm"
                  placeholder="0"
                  value={dims[campo] || ''}
                  onChange={e => setDims(d => ({ ...d, [campo]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Cantidad (piezas)</label>
              <input type="number" min="1" className="input-field text-sm"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)} />
            </div>
          </div>

          {pesoUnit > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div>
                <p className="text-emerald-300 text-sm font-semibold">
                  Peso unitario: <span className="text-white">{pesoUnit.toFixed(3)} kg</span>
                  {Number(cantidad) > 1 && <span className="text-slate-400"> × {cantidad} piezas = <span className="text-white">{pesoTotal.toFixed(3)} kg total</span></span>}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{mat.label} · {mat.densidad} kg/m³</p>
              </div>
              <button onClick={handleAgregar}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Agregar
              </button>
            </div>
          )}
          {pesoUnit <= 0 && geom.campos.every(c => dims[c]) && (
            <p className="text-slate-500 text-xs">Ingresa todas las dimensiones para calcular el peso.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function TabMateriales({ materiales, setMateriales }) {
  const [searchTerm, setSearchTerm]   = useState('')
  const [searching, setSearching]     = useState(false)
  const [results, setResults]         = useState([])
  const [searchError, setSearchError] = useState('')

  const addRow    = ()             => setMateriales([...materiales, emptyMaterial()])
  const removeRow = (id)           => setMateriales(materiales.filter((m) => m.id !== id))
  const updateRow = (id, field, v) => setMateriales(materiales.map((m) => (m.id === id ? { ...m, [field]: v } : m)))

  const handleAddFromWeight = ({ nombre, formato, cantidad }) => {
    setMateriales([...materiales, { ...emptyMaterial(), nombre, formato, cantidad }])
  }

  const searchWithAI = async () => {
    if (!searchTerm.trim()) return
    setSearching(true); setSearchError(''); setResults([])
    try {
      const res  = await fetch('/api/search-material', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchTerm }) })
      const data = await res.json()
      if (data.error) setSearchError(`Error: ${data.error}`)
      else setResults(data.results || [])
    } catch { setSearchError('Error al conectar con el servicio de búsqueda.') }
    finally { setSearching(false) }
  }

  const addFromResult = (r) => setMateriales([...materiales, { id: Date.now() + Math.random(), nombre: r.nombre, proveedor: r.proveedor, formato: r.formato, cantidad: 1, precio_unitario: r.precio_unitario }])

  const total = materiales.reduce((acc, m) => acc + (m.cantidad * m.precio_unitario || 0), 0)

  return (
    <div className="space-y-6">

      {/* Calculadora de peso */}
      <PesoCalculadora onAgregar={handleAddFromWeight} />

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
          <input type="text" className="input-field flex-1"
            placeholder="Ej: acero A36, tubo cuadrado 40x40, plancha inoxidable 304..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchWithAI()} />
          <button onClick={searchWithAI} className="btn-primary px-5 whitespace-nowrap" disabled={searching}>
            {searching ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Buscando...</span> : 'Buscar'}
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
                  <button onClick={() => addFromResult(r)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors">+ Agregar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabla de materiales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Lista de materiales</h2>
          <button onClick={addRow} className="btn-secondary text-sm py-2">+ Agregar fila</button>
        </div>

        {materiales.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">Sin materiales. Agrega uno manualmente, usa la calculadora de peso o el buscador IA.</p>
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
                    <td className="px-3 py-2"><input type="text" className="input-field py-1.5 text-sm min-w-36" placeholder="Nombre del material" value={m.nombre} onChange={(e) => updateRow(m.id, 'nombre', e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="text" className="input-field py-1.5 text-sm min-w-28" placeholder="Proveedor" value={m.proveedor} onChange={(e) => updateRow(m.id, 'proveedor', e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="text" className="input-field py-1.5 text-sm min-w-24" placeholder="Ej: Kg, Barra 6m" value={m.formato} onChange={(e) => updateRow(m.id, 'formato', e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" className="input-field py-1.5 text-sm text-right w-20" value={m.cantidad} onChange={(e) => updateRow(m.id, 'cantidad', Number(e.target.value))} /></td>
                    <td className="px-3 py-2"><input type="number" min="0" className="input-field py-1.5 text-sm text-right w-28" placeholder="0" value={m.precio_unitario || ''} onChange={(e) => updateRow(m.id, 'precio_unitario', Number(e.target.value))} /></td>
                    <td className="px-3 py-2 text-right text-blue-400 font-medium whitespace-nowrap">{fmt(m.cantidad * m.precio_unitario || 0)}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeRow(m.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
