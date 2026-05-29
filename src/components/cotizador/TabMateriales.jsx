import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { obtenerCatalogo } from '../../firebase/firestore'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export const emptyMaterial = () => ({
  id: Date.now() + Math.random(),
  nombre: '', proveedor: '', formato: '', cantidad: 1, precio_unitario: 0,
})

export const emptySubproducto = (nombre = 'MATERIALES') => ({
  id: Date.now() + Math.random(),
  nombre,
  items: [],
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
  const rho = densidad / 1e9
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

// ── Verificador de precios de referencia ─────────────────────────────────────
const PRECIO_REF_KG = [
  { keywords: ['a36', 'a572', 'gr50', 'estructural'],                         min: 700,   max: 2500,  label: 'Acero A36 / estructural' },
  { keywords: ['inox 304', 'inoxidable 304', 'inox 316', 'inoxidable 316', 'acero inox', 'inoxidable'], min: 2500, max: 10000, label: 'Acero inoxidable' },
  { keywords: ['aluminio', 'aluminum', 'al 6061', 'al 5052'],                 min: 2000,  max: 8000,  label: 'Aluminio' },
  { keywords: ['cobre'],                                                       min: 7000,  max: 22000, label: 'Cobre' },
  { keywords: ['bronce'],                                                      min: 5000,  max: 20000, label: 'Bronce' },
  { keywords: ['fundicion', 'fundición', 'hierro fundido', 'fierro fundido'], min: 500,   max: 2000,  label: 'Fundición' },
]

function detectarAviso(nombre, formato, precio) {
  if (!nombre || !precio || precio <= 0) return null
  const n = nombre.toLowerCase()
  const f = (formato || '').toLowerCase()
  // Solo avisar cuando la unidad indica precio por kg
  if (!f.includes('kg') && !n.includes('/kg')) return null
  for (const ref of PRECIO_REF_KG) {
    if (!ref.keywords.some(k => n.includes(k))) continue
    if (precio < ref.min * 0.45) return { nivel: 'error', label: ref.label, min: ref.min, max: ref.max }
    if (precio < ref.min * 0.8)  return { nivel: 'warn',  label: ref.label, min: ref.min, max: ref.max }
    if (precio > ref.max * 2.5)  return { nivel: 'warn',  label: ref.label, min: ref.min, max: ref.max }
    return null
  }
  return null
}

function PrecioAviso({ aviso }) {
  const [visible, setVisible] = useState(false)
  if (!aviso) return null
  const isErr = aviso.nivel === 'error'
  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <svg
        className="w-4 h-4 cursor-help"
        style={{ color: isErr ? '#f87171' : '#facc15' }}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {visible && (
        <div style={{
          position: 'absolute', right: 0, bottom: '100%', marginBottom: 8,
          width: 260, zIndex: 9999, pointerEvents: 'none',
        }}>
          <div style={{
            borderRadius: 8, padding: '10px 12px', fontSize: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            background: isErr ? '#1c0a0a' : '#1c1500',
            border: `1px solid ${isErr ? 'rgba(239,68,68,0.5)' : 'rgba(234,179,8,0.5)'}`,
            color: isErr ? '#fca5a5' : '#fde68a',
          }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>
              {isErr ? '🚨 Precio muy bajo' : '⚠️ Precio inusual'} — {aviso.label}
            </p>
            <p>Referencia Chile: <strong>{fmt(aviso.min)} – {fmt(aviso.max)} /kg</strong></p>
            <p style={{ marginTop: 4, opacity: 0.8 }}>Verifica que sea $/kg y no haya error de tipeo.</p>
          </div>
        </div>
      )}
    </div>
  )
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
    onAgregar({ nombre: `${mat.label} — ${geom.label}`, formato: `${pesoTotal.toFixed(2)} kg`, cantidad: Number(cantidad) || 1 })
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
                <input type="number" min="0" className="input-field text-sm" placeholder="0"
                  value={dims[campo] || ''}
                  onChange={e => setDims(d => ({ ...d, [campo]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Cantidad (piezas)</label>
              <input type="number" min="1" className="input-field text-sm" value={cantidad} onChange={e => setCantidad(e.target.value)} />
            </div>
          </div>
          {pesoUnit > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div>
                <p className="text-emerald-300 text-sm font-semibold">
                  Peso unitario: <span className="text-white">{pesoUnit.toFixed(3)} kg</span>
                  {Number(cantidad) > 1 && <span className="text-slate-400"> × {cantidad} = <span className="text-white">{pesoTotal.toFixed(3)} kg total</span></span>}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{mat.label} · {mat.densidad} kg/m³</p>
              </div>
              <button onClick={handleAgregar} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Agregar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de sub-producto ───────────────────────────────────────────────────
function SubproductoCard({ sp, isOnly, onUpdateNombre, onRemove, onAddItem, onRemoveItem, onUpdateItem }) {
  const total = (sp.items || []).reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-500 rounded-full flex-shrink-0" />
        <input
          type="text"
          className="input-field py-1.5 font-semibold flex-1"
          placeholder="Nombre del grupo (ej: Material Base, Pintura, EPP...)"
          value={sp.nombre}
          onChange={e => onUpdateNombre(e.target.value)}
        />
        {!isOnly && (
          <button onClick={onRemove} className="text-slate-500 hover:text-red-400 text-xs border border-slate-700 hover:border-red-500/40 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Eliminar grupo
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="table-header">
              <th className="text-left px-3 py-3 rounded-l-lg">Material</th>
              <th className="text-left px-3 py-3 w-28">Proveedor</th>
              <th className="text-left px-3 py-3 w-24">Formato</th>
              <th className="text-right px-3 py-3 w-28">Cant.</th>
              <th className="text-right px-3 py-3 w-40">P. Unit.</th>
              <th className="text-right px-3 py-3 w-28">Total</th>
              <th className="px-3 py-3 rounded-r-lg w-8" />
            </tr>
          </thead>
          <tbody>
            {(sp.items || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                  Sin materiales. Agrega una fila o usa las herramientas de arriba.
                </td>
              </tr>
            ) : (
              (sp.items || []).map((m) => (
                <tr key={m.id} className="border-b border-slate-700">
                  <td className="px-3 py-2"><input type="text" className="input-field py-1.5 text-sm w-full" placeholder="Nombre" value={m.nombre} onChange={e => onUpdateItem(m.id, 'nombre', e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="text" className="input-field py-1.5 text-sm w-full" placeholder="Proveedor" value={m.proveedor} onChange={e => onUpdateItem(m.id, 'proveedor', e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="text" className="input-field py-1.5 text-sm w-full" placeholder="Ej: kg, m" value={m.formato} onChange={e => onUpdateItem(m.id, 'formato', e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="number" min="0" step="0.01" className="input-field py-1.5 text-sm text-right w-full" value={m.cantidad} onChange={e => onUpdateItem(m.id, 'cantidad', Number(e.target.value))} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <input type="number" min="0" className="input-field py-1.5 text-sm text-right min-w-0 flex-1" placeholder="0" value={m.precio_unitario || ''} onChange={e => onUpdateItem(m.id, 'precio_unitario', Number(e.target.value))} />
                      <PrecioAviso aviso={detectarAviso(m.nombre, m.formato, m.precio_unitario)} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-blue-400 font-medium whitespace-nowrap">{fmt(m.cantidad * m.precio_unitario || 0)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => onRemoveItem(m.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600">
              <td colSpan={5} className="px-3 py-2 text-right text-slate-400 text-sm font-medium">Subtotal:</td>
              <td className="px-3 py-2 text-right text-blue-400 font-semibold">{fmt(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <button onClick={onAddItem} className="btn-secondary text-sm py-1.5">+ Agregar fila</button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TabMateriales({ materiales, setMateriales }) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm]   = useState('')
  const [searching, setSearching]     = useState(false)
  const [results, setResults]         = useState([])
  const [searchError, setSearchError] = useState('')
  const [catalogo, setCatalogo]       = useState([])
  const [catSearch, setCatSearch]     = useState('')
  const [catOpen, setCatOpen]         = useState(false)
  const [iaOpen, setIaOpen]           = useState(false)
  const [targetSpId, setTargetSpId]   = useState(() => materiales[0]?.id ?? null)

  useEffect(() => {
    if (!user) return
    obtenerCatalogo(user.uid, user.email).then(setCatalogo).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!targetSpId && materiales.length > 0) setTargetSpId(materiales[0].id)
  }, [materiales, targetSpId])

  // ── Sub-producto ops ──────────────────────────────────────────────────────
  const addSubproducto = () => {
    const sp = emptySubproducto('NUEVO GRUPO')
    setMateriales(prev => [...prev, sp])
    setTargetSpId(sp.id)
  }

  const removeSubproducto = (id) => {
    setMateriales(prev => {
      const next = prev.filter(sp => sp.id !== id)
      return next.length === 0 ? [{ ...emptySubproducto('MATERIALES'), items: [emptyMaterial()] }] : next
    })
    setTargetSpId(prev => {
      if (prev !== id) return prev
      const remaining = materiales.filter(sp => sp.id !== id)
      return remaining[0]?.id ?? null
    })
  }

  const updateSpNombre = (id, nombre) =>
    setMateriales(prev => prev.map(sp => sp.id === id ? { ...sp, nombre } : sp))

  // ── Item ops ──────────────────────────────────────────────────────────────
  const addItem = (spId) =>
    setMateriales(prev => prev.map(sp => sp.id === spId ? { ...sp, items: [...(sp.items || []), emptyMaterial()] } : sp))

  const removeItem = (spId, itemId) =>
    setMateriales(prev => prev.map(sp => sp.id === spId ? { ...sp, items: sp.items.filter(m => m.id !== itemId) } : sp))

  const updateItem = (spId, itemId, field, value) =>
    setMateriales(prev => prev.map(sp => sp.id === spId ? { ...sp, items: sp.items.map(m => m.id === itemId ? { ...m, [field]: value } : m) } : sp))

  // ── Add from tools (calculadora / IA / catálogo) ──────────────────────────
  const addFromTool = (item) => {
    const spId = targetSpId || materiales[0]?.id
    if (!spId) return
    setMateriales(prev => prev.map(sp =>
      sp.id === spId ? { ...sp, items: [...(sp.items || []), { ...emptyMaterial(), ...item }] } : sp
    ))
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

  const totalGeneral = materiales.flatMap(sp => sp.items || []).reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)

  return (
    <div className="space-y-6">

      {/* Calculadora de peso */}
      <PesoCalculadora onAgregar={addFromTool} />

      {/* Catálogo guardado */}
      {catalogo.length > 0 && (
        <div className="card border-violet-500/30 bg-slate-800">
          <button className="w-full flex items-center justify-between" onClick={() => setCatOpen(v => !v)}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-violet-600/30 border border-violet-500/30 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-violet-400">Desde catálogo</h3>
              <span className="text-xs text-slate-500">({catalogo.length} items)</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${catOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {catOpen && (
            <div className="mt-4 space-y-3">
              <input type="text" className="input-field" placeholder="Filtrar catálogo..." value={catSearch} onChange={e => setCatSearch(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {catalogo
                  .filter(i => i.nombre?.toLowerCase().includes(catSearch.toLowerCase()) || i.proveedor?.toLowerCase().includes(catSearch.toLowerCase()))
                  .map(i => (
                    <button key={i.id} onClick={() => addFromTool({ nombre: i.nombre, proveedor: i.proveedor || '', formato: i.formato || '', precio_unitario: i.precio_unitario || 0 })}
                      className="text-left bg-slate-950 border border-slate-600 hover:border-violet-500/50 rounded-lg p-3 transition-colors">
                      <p className="text-white font-medium text-sm leading-tight">{i.nombre}</p>
                      {i.proveedor && <p className="text-slate-400 text-xs mt-0.5">{i.proveedor}</p>}
                      <p className="text-violet-400 font-semibold text-xs mt-1">{fmt(i.precio_unitario)}{i.unidad ? ` / ${i.unidad}` : ''}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Búsqueda IA */}
      <div className="card border-blue-500/30 bg-slate-800">
        <button className="w-full flex items-center justify-between" onClick={() => setIaOpen(v => !v)}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-blue-400">Buscar material con IA (Claude)</h3>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${iaOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {iaOpen && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input type="text" className="input-field flex-1" placeholder="Ej: acero A36, tubo cuadrado 40x40..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchWithAI()} />
              <button onClick={searchWithAI} className="btn-primary px-5 whitespace-nowrap" disabled={searching}>
                {searching ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Buscando...</span> : 'Buscar'}
              </button>
            </div>
            {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
            {results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {results.map((r, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-600 rounded-lg p-3">
                    <p className="text-white font-medium text-sm leading-tight">{r.nombre}</p>
                    <p className="text-slate-400 text-xs mt-1">{r.proveedor}</p>
                    <p className="text-slate-500 text-xs">Formato: {r.formato}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-blue-400 font-semibold text-sm">{fmt(r.precio_unitario)}</span>
                      <button onClick={() => addFromTool({ nombre: r.nombre, proveedor: r.proveedor, formato: r.formato, precio_unitario: r.precio_unitario })}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors">+ Agregar</button>
                    </div>
                    {r.url && (() => {
                      let domain = r.url
                      try { domain = new URL(r.url).hostname.replace(/^www\./, '') } catch {}
                      return (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {domain}
                        </a>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selector de grupo destino (solo si hay múltiples sub-productos) */}
      {materiales.length > 1 && (
        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5">
          <span className="text-slate-400 text-sm whitespace-nowrap">Agregar herramientas al grupo:</span>
          <select className="input-field py-1.5 flex-1 max-w-xs text-sm" value={targetSpId || ''} onChange={e => setTargetSpId(e.target.value)}>
            {materiales.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.nombre || 'Sin nombre'}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-productos */}
      {materiales.map(sp => (
        <SubproductoCard
          key={sp.id}
          sp={sp}
          isOnly={materiales.length === 1}
          onUpdateNombre={nombre => updateSpNombre(sp.id, nombre)}
          onRemove={() => removeSubproducto(sp.id)}
          onAddItem={() => addItem(sp.id)}
          onRemoveItem={itemId => removeItem(sp.id, itemId)}
          onUpdateItem={(itemId, field, value) => updateItem(sp.id, itemId, field, value)}
        />
      ))}

      {/* Agregar sub-producto */}
      <button onClick={addSubproducto}
        className="w-full bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/40 hover:border-amber-500/70 text-amber-500 hover:text-amber-400 rounded-xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 group">
        <span className="w-6 h-6 rounded-full bg-amber-600/30 group-hover:bg-amber-600/50 flex items-center justify-center flex-shrink-0 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </span>
        Agregar grupo de materiales
        <span className="text-amber-600/60 text-xs font-normal">(Material Base, Pintura, EPP, etc.)</span>
      </button>

      {/* Total general (solo si hay múltiples sub-productos) */}
      {materiales.length > 1 && (
        <div className="flex justify-end">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3">
            <span className="text-slate-400 text-sm mr-3">Total materiales:</span>
            <span className="text-blue-400 font-bold text-lg">{fmt(totalGeneral)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
