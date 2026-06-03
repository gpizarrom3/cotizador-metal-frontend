import { useMemo } from 'react'
import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const PALLETS_STD = [
  { id: 'euro',      nombre: 'EUR/EPAL',       largo: 1200, ancho: 800,  alto_max: 1500, carga_max: 1500, uso: 'Exportación europea, transporte intermodal, uso general' },
  { id: 'iso',       nombre: 'ISO 1',           largo: 1200, ancho: 1000, alto_max: 1800, carga_max: 1200, uso: 'Uso general industria, bodegaje, camiones nacionales' },
  { id: 'americano', nombre: 'GMA / Americano', largo: 1219, ancho: 1016, alto_max: 1800, carga_max: 1000, uso: "Exportación EE.UU., contenedor 20'/40'" },
  { id: 'custom',    nombre: 'Pallet a medida', largo: 0,    ancho: 0,    alto_max: 0,    carga_max: 0,    uso: '' },
]


const RECOMENDACIONES = [
  { titulo: 'Peso por pallet', detalle: 'No exceder el 80% de la carga máxima nominal para seguridad en manipulación con horquilla.' },
  { titulo: 'Altura máxima', detalle: 'No superar 1.80 m en bodega ni 2.20 m en exportación. Verificar altura de container si es carga marítima.' },
  { titulo: 'Centro de gravedad', detalle: 'Carga más pesada en la parte inferior. CG no debe superar 2/3 de la altura total. Distribuir simétricamente.' },
  { titulo: 'Stretch film', detalle: 'Mínimo 3 pasadas desde la base con 50% de solape. Incluir cubierta superior. Para metales usar ≥ 23 µm.' },
  { titulo: 'Cantoneras', detalle: 'Instalar en las 4 esquinas verticales antes de zunchar. El zuncho no debe ejercer presión directa sobre la carga.' },
  { titulo: 'Zunchado', detalle: '2 zunchos horizontales + 2 en diagonal mínimo. Para cargas > 500 kg usar zuncho metálico.' },
  { titulo: 'Marcado y etiquetado', detalle: 'Razón social, n° OT, descripción, peso bruto/neto, cantidad, punto de izado. Etiquetas en ≥ 2 caras. Exportación: país de origen.' },
  { titulo: 'Anticorrosión', detalle: 'Para piezas maquinadas: papel VCI o bolsa VCI + silica gel. Evitar contacto metal-madera sin barrera.' },
  { titulo: 'Documentación', detalle: 'Packing list en sobre plástico pegado en cara exterior. Incluir n° cotización/guía de despacho.' },
]

function recomendarPallet(largoCm, anchoCm, pesoKg, altoCm) {
  const L = Number(largoCm) || 0
  const A = Number(anchoCm) || 0
  const W = Number(pesoKg) || 0
  const H = Number(altoCm) || 0
  if (!L && !A && !W) return null
  for (const p of PALLETS_STD.filter((p) => p.id !== 'custom')) {
    const fitsDim =
      (L <= p.largo / 10 && A <= p.ancho / 10) ||
      (A <= p.largo / 10 && L <= p.ancho / 10)
    const fitsWeight = !W || W <= p.carga_max * 0.8
    const fitsHeight = !H || H <= p.alto_max / 10
    if (fitsDim && fitsWeight && fitsHeight)
      return { palletId: p.id, razon: `Carga${L && A ? ` ${L}×${A} cm` : ''}${W ? `, ${W} kg` : ''} — cabe con margen de seguridad` }
  }
  return { palletId: 'custom', razon: 'Dimensiones o peso superan los estándares disponibles — se recomienda pallet a medida' }
}

function calcMaderaPallet(palletId, customLargoMm, customAnchoMm) {
  let largoMm, anchoMm
  if (palletId === 'custom') {
    largoMm = Number(customLargoMm) || 0
    anchoMm = Number(customAnchoMm) || 0
  } else {
    const p = PALLETS_STD.find((p) => p.id === palletId)
    if (!p) return []
    largoMm = p.largo
    anchoMm = p.ancho
  }
  if (!largoMm || !anchoMm) return []

  const nTableros = Math.ceil(largoMm / 140)
  const piezasPorTabla = Math.max(1, Math.floor(2400 / anchoMm))
  const tablasNecesarias = Math.ceil(nTableros / piezasPorTabla)

  const piezasPorCuarton = Math.max(1, Math.floor(2400 / largoMm))
  const cuartonesNecesarios = Math.ceil(3 / piezasPorCuarton)

  return [
    { id: 'pw1', nombre: 'Tabla pino sin cepillar 22×145mm × 2.4m', unidad: 'unid.', cantidad: Math.max(1, tablasNecesarias), precio_unitario: 3800, nota: `${nTableros} tablones de ${anchoMm} mm` },
    { id: 'pw2', nombre: 'Cuartón pino 75×100mm × 2.4m',             unidad: 'unid.', cantidad: Math.max(1, cuartonesNecesarios), precio_unitario: 6500, nota: `3 largueros de ${largoMm} mm` },
    { id: 'pw3', nombre: 'Clavos construcción 3" (75mm)',              unidad: 'kg',    cantidad: 0.3, precio_unitario: 2800, nota: 'Fijación tablones' },
  ]
}

function calcCantidadesEmbalaje(palletId, palletLargoMm, palletAnchoMm, altoCm, pesoKg) {
  let Lm, Am
  if (palletId === 'custom') {
    Lm = (Number(palletLargoMm) || 0) / 1000
    Am = (Number(palletAnchoMm) || 0) / 1000
  } else {
    const p = PALLETS_STD.find((p) => p.id === palletId)
    if (!p) return null
    Lm = p.largo / 1000
    Am = p.ancho / 1000
  }
  const Hm = Number(altoCm) / 100
  const W  = Number(pesoKg) || 0
  if (!Lm || !Am || !Hm) return null

  const perimetro = 2 * (Lm + Am)
  const vueltas = Math.ceil(Hm / 0.25) * 3 + 2
  const rollosFilm = Math.max(1, Math.ceil((vueltas * perimetro) / 300))
  const metrosZuncho = perimetro * 2 + (perimetro + Hm * 2) * 2
  const usaMetal = W > 500
  const rollosZunchoPlastico = usaMetal ? 0 : Math.max(1, Math.ceil(metrosZuncho / 200))
  const rollosZunchoMetal    = usaMetal ? Math.max(1, Math.ceil(metrosZuncho / 200)) : 0

  return { rollosFilm, rollosZunchoPlastico, rollosZunchoMetal, cantoneras: 1, usaMetal }
}


export const newPallet = () => ({
  id: Date.now() + Math.random(),
  palletId: '', cargaKg: '', largoCm: '', anchoCm: '', alturaCm: '',
  largo: '', ancho: '', alto_max: '', carga_max: '',
  materialesPallet: [],
})

// ── PalletCard ────────────────────────────────────────────────────────────────
function PalletCard({ pallet, onChange, onRemove, showRemove, index }) {
  const {
    palletId = '', cargaKg = '', largoCm = '', anchoCm = '', alturaCm = '',
    materialesPallet = [],
  } = pallet

  const set = (field) => (v) => onChange({ ...pallet, [field]: v })

  const handlePalletSelect = (pid) => {
    let updated = { ...pallet, palletId: pid, materialesPallet: calcMaderaPallet(pid, pallet.largo, pallet.ancho) }
    if (pid === 'custom') {
      updated = {
        ...updated,
        largo:    String(Number(largoCm) * 10  || ''),
        ancho:    String(Number(anchoCm) * 10  || ''),
        alto_max: String(Number(alturaCm) * 10 || ''),
        carga_max: String(cargaKg || ''),
      }
      updated.materialesPallet = calcMaderaPallet('custom', updated.largo, updated.ancho)
    }
    onChange(updated)
  }

  const handleCustomDim = (field, v) => {
    const updated = { ...pallet, [field]: v }
    if (pallet.palletId === 'custom') {
      updated.materialesPallet = calcMaderaPallet('custom', updated.largo, updated.ancho)
    }
    onChange(updated)
  }

  const updateMatPallet = (id, f, v) => onChange({
    ...pallet,
    materialesPallet: materialesPallet.map((m) => (m.id === id ? { ...m, [f]: v } : m)),
  })
  const addMatPallet = () => onChange({
    ...pallet,
    materialesPallet: [...materialesPallet, { id: Date.now() + Math.random(), nombre: '', unidad: 'unid.', cantidad: 1, precio_unitario: 0 }],
  })
  const removeMatPallet = (id) => onChange({
    ...pallet,
    materialesPallet: materialesPallet.filter((m) => m.id !== id),
  })

  const recomendacion = useMemo(
    () => recomendarPallet(largoCm, anchoCm, cargaKg, alturaCm),
    [largoCm, anchoCm, cargaKg, alturaCm],
  )

  const palletSel = PALLETS_STD.find((p) => p.id === palletId)

  const alertas = useMemo(() => {
    if (!palletSel || palletId === 'custom') return []
    const a = []
    if (cargaKg && Number(cargaKg) > palletSel.carga_max)
      a.push(`⚠ Peso (${cargaKg} kg) supera la carga máxima del pallet (${palletSel.carga_max} kg)`)
    if (alturaCm && Number(alturaCm) > palletSel.alto_max / 10)
      a.push(`⚠ Altura total (${alturaCm} cm) supera el máximo recomendado (${palletSel.alto_max / 10} cm)`)
    if (largoCm && anchoCm) {
      const cabe =
        (Number(largoCm) <= palletSel.largo / 10 && Number(anchoCm) <= palletSel.ancho / 10) ||
        (Number(anchoCm) <= palletSel.largo / 10 && Number(largoCm) <= palletSel.ancho / 10)
      if (!cabe) a.push(`⚠ La carga (${largoCm}×${anchoCm} cm) no cabe en este pallet`)
    }
    return a
  }, [palletId, cargaKg, alturaCm, largoCm, anchoCm, palletSel])

  const volumenCm3 = largoCm && anchoCm && alturaCm
    ? Number(largoCm) * Number(anchoCm) * Number(alturaCm) : 0
  const pesoVolTerrestre = volumenCm3 ? Math.ceil(volumenCm3 / 6000) : 0
  const totalPallet = materialesPallet.reduce((a, m) => a + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-700">
        <p className="text-white font-semibold text-sm">Pallet {index + 1}</p>
        {showRemove && (
          <button onClick={onRemove} className="text-slate-500 hover:text-red-400 text-xs border border-slate-700 hover:border-red-500/40 px-2.5 py-1 rounded-lg transition-colors">
            × Eliminar
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Datos de la carga */}
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Datos de la carga</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" min="0" className="input-field" placeholder="Ej: 350"
                value={cargaKg} onChange={(e) => set('cargaKg')(e.target.value)} />
            </div>
            <div>
              <label className="label">Largo (cm)</label>
              <input type="number" min="0" className="input-field" placeholder="Ej: 100"
                value={largoCm} onChange={(e) => set('largoCm')(e.target.value)} />
            </div>
            <div>
              <label className="label">Ancho (cm)</label>
              <input type="number" min="0" className="input-field" placeholder="Ej: 80"
                value={anchoCm} onChange={(e) => set('anchoCm')(e.target.value)} />
            </div>
            <div>
              <label className="label">Alto total (cm)</label>
              <input type="number" min="0" className="input-field" placeholder="Ej: 120"
                value={alturaCm} onChange={(e) => set('alturaCm')(e.target.value)} />
            </div>
          </div>
          {volumenCm3 > 0 && (
            <p className="text-slate-500 text-xs mt-2">
              Volumen: <span className="text-slate-300">{(volumenCm3 / 1000000).toFixed(3)} m³</span>
              {' · '}Peso vol. terrestre: <span className="text-slate-300">{pesoVolTerrestre} kg</span>
              {cargaKg && (
                <span className="text-amber-400">
                  {' · '}Factura por {Number(cargaKg) >= pesoVolTerrestre ? 'peso real' : 'peso vol.'}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Tipo de pallet */}
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Tipo de pallet</p>

          {recomendacion && (
            <div className="mb-3 flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <span className="text-blue-300 text-xl flex-shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-blue-300 text-sm font-medium">
                  Recomendado: {PALLETS_STD.find((p) => p.id === recomendacion.palletId)?.nombre}
                </p>
                <p className="text-blue-400/70 text-xs mt-0.5">{recomendacion.razon}</p>
              </div>
              {recomendacion.palletId !== palletId ? (
                <button
                  onClick={() => handlePalletSelect(recomendacion.palletId)}
                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                  Aplicar
                </button>
              ) : (
                <span className="flex-shrink-0 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">Aplicado</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PALLETS_STD.map((p) => {
              const isSelected = palletId === p.id
              const isRec = recomendacion?.palletId === p.id
              return (
                <button key={p.id} onClick={() => handlePalletSelect(p.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-blue-500 bg-blue-600/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-semibold text-xs ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>{p.nombre}</p>
                        {isRec && <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded px-1 py-0.5">Rec.</span>}
                      </div>
                      {p.id !== 'custom' ? (
                        <p className="text-slate-400 text-xs mt-0.5">{p.largo}×{p.ancho} mm · máx {p.carga_max} kg</p>
                      ) : (
                        <p className="text-slate-400 text-xs mt-0.5">Ingresar dimensiones propias</p>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {palletId === 'custom' && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-slate-400 text-xs mb-2">Dimensiones del pallet (mm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { field: 'largo',     label: 'Largo (mm)' },
                  { field: 'ancho',     label: 'Ancho (mm)' },
                  { field: 'alto_max',  label: 'Alto máx (mm)' },
                  { field: 'carga_max', label: 'Carga máx (kg)' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input type="number" min="0" className="input-field text-sm"
                      value={pallet[field] || ''}
                      onChange={(e) => handleCustomDim(field, e.target.value)} />
                  </div>
                ))}
              </div>
              {pallet.largo && pallet.ancho && (
                <p className="text-emerald-400 text-xs mt-2">✓ Madera recalculada para pallet {pallet.largo}×{pallet.ancho} mm</p>
              )}
            </div>
          )}

          {alertas.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {alertas.map((a, i) => (
                <div key={i} className="bg-amber-900/30 border border-amber-500/40 text-amber-400 text-sm rounded-lg px-4 py-2">{a}</div>
              ))}
            </div>
          )}
        </div>

        {/* Fabricación de pallet */}
        {palletId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Fabricación de pallet</p>
              <div className="flex items-center gap-2">
                {totalPallet > 0 && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-2 py-0.5">
                    Subtotal: {fmt(totalPallet)}
                  </span>
                )}
                <button onClick={addMatPallet} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 rounded-lg px-2.5 py-1 transition-colors">
                  + Agregar ítem
                </button>
              </div>
            </div>
            {materialesPallet.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-lg py-6 text-center">
                <p className="text-slate-500 text-sm">Sin ítems. Selecciona un tipo de pallet para autocompletar, o agrega manualmente.</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-3 py-2 rounded-l-lg">Material</th>
                    <th className="text-center px-3 py-2 w-24">Unid.</th>
                    <th className="text-center px-3 py-2 w-24">Cant.</th>
                    <th className="text-right px-3 py-2 w-36">P. Unit.</th>
                    <th className="text-right px-3 py-2 w-28">Total</th>
                    <th className="px-2 py-2 rounded-r-lg w-8" />
                  </tr>
                </thead>
                <tbody>
                  {materialesPallet.map((m) => (
                    <tr key={m.id} className="border-b border-slate-700">
                      <td className="px-3 py-2">
                        <input type="text" className="input-field text-sm py-1.5 w-full"
                          placeholder="Nombre" value={m.nombre} onChange={(e) => updateMatPallet(m.id, 'nombre', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" className="input-field text-sm py-1.5 text-center w-full"
                          value={m.unidad} onChange={(e) => updateMatPallet(m.id, 'unidad', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="0.1" className="input-field text-sm py-1.5 text-center w-full"
                          value={m.cantidad} onChange={(e) => updateMatPallet(m.id, 'cantidad', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" className="input-field text-sm py-1.5 text-right w-full"
                          value={m.precio_unitario} onChange={(e) => updateMatPallet(m.id, 'precio_unitario', e.target.value)} />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-200">
                        {fmt(Number(m.cantidad) * Number(m.precio_unitario))}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => removeMatPallet(m.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const TIPOS_ENVIO = [
  { id: 'pallet',          label: 'Pallet',        icon: '🏗' },
  { id: 'caja',            label: 'Caja / Cajón',  icon: '📦' },
  { id: 'sin_especificar', label: 'Sin especificar', icon: '—' },
]

const TIPOS_CAJA = [
  'Caja de cartón',
  'Cajón de madera',
  'Crate metálico',
  'Maletín / estuche',
  'Otro',
]

export default function TabEmbalaje({ embalaje, setEmbalaje }) {
  const {
    activo = true,
    tipoEnvio = 'sin_especificar',
    pallets = [],
    caja = {},
    materiales = [], costoEnvio = '', notas = '',
  } = embalaje

  const set = (field) => (v) => setEmbalaje((e) => ({ ...e, [field]: v }))
  const setCaja = (field) => (v) => setEmbalaje((e) => ({ ...e, caja: { ...(e.caja || {}), [field]: v } }))

  const addPallet    = () => setEmbalaje((e) => ({ ...e, pallets: [...(e.pallets || []), newPallet()] }))
  const removePallet = (id) => setEmbalaje((e) => ({ ...e, pallets: (e.pallets || []).filter((p) => p.id !== id) }))
  const updatePallet = (id, updated) => setEmbalaje((e) => ({ ...e, pallets: (e.pallets || []).map((p) => (p.id === id ? updated : p)) }))

  const updateMaterial  = (id, f, v) => setEmbalaje((e) => ({ ...e, materiales: (e.materiales || []).map((m) => (m.id === id ? { ...m, [f]: v } : m)) }))
  const addMaterial     = ()          => setEmbalaje((e) => ({ ...e, materiales: [...(e.materiales || []), { id: Date.now(), nombre: '', unidad: 'unid.', cantidad: 1, precio_unitario: 0 }] }))
  const removeMaterial  = (id)        => setEmbalaje((e) => ({ ...e, materiales: (e.materiales || []).filter((m) => m.id !== id) }))

  const totalPallets  = pallets.reduce((acc, p) =>
    acc + (p.materialesPallet || []).reduce((a, m) => a + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0), 0)
  const totalMat  = (materiales || []).reduce((a, m) => a + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)
  const totalEnvio = Number(costoEnvio) || 0
  const totalGral  = totalPallets + totalMat + totalEnvio

  return (
    <div className="space-y-5">

      {/* Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Embalaje y Envío</p>
            <p className="text-slate-400 text-sm mt-0.5">
              {activo ? 'Activo — se suma al costo total' : 'Desactivado — no se incluye en el costo'}
            </p>
          </div>
          <Toggle value={activo} onChange={() => set('activo')(!activo)} />
        </div>
      </div>

      {!activo && (
        <div className="card border-slate-700 bg-slate-800/30 text-center py-10">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-slate-400 text-sm">Esta sección está desactivada y no afecta el costo de la cotización.</p>
        </div>
      )}

      {activo && <>

      {/* ── Tipo de envío ── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-1">Tipo de envío</h2>
        <p className="text-slate-500 text-xs mb-4">Selecciona el contenedor principal de despacho</p>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS_ENVIO.map((t) => {
            const isSelected = tipoEnvio === t.id
            return (
              <button key={t.id} onClick={() => set('tipoEnvio')(t.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${isSelected ? 'border-blue-500 bg-blue-600/10 text-blue-300' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>
                <span className="text-lg leading-none">{t.icon}</span>
                <span>{t.label}</span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Pallets (solo si tipoEnvio === 'pallet') ── */}
      {tipoEnvio === 'pallet' && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Pallets</h2>
          <p className="text-slate-500 text-xs">Normativa Agunsa Chile / ISO 6780 / EPAL · Fabricación propia</p>
        </div>

        {pallets.length === 0 && (
          <div className="card border-dashed border-slate-600 bg-slate-800/20 text-center py-8">
            <p className="text-slate-500 text-sm">No hay pallets configurados.</p>
            <p className="text-slate-600 text-xs mt-1">Agrega un pallet para configurar embalaje estructural.</p>
          </div>
        )}

        {pallets.map((p, i) => (
          <PalletCard
            key={p.id}
            pallet={p}
            index={i}
            showRemove={pallets.length > 1}
            onChange={(updated) => updatePallet(p.id, updated)}
            onRemove={() => removePallet(p.id)}
          />
        ))}

        <button
          onClick={addPallet}
          className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500/50 text-slate-500 hover:text-blue-400 rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar pallet
        </button>
      </div>
      )}

      {/* ── Caja / Cajón ── */}
      {tipoEnvio === 'caja' && (
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Caja / Cajón</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de contenedor <span className="text-slate-600 font-normal">(opcional)</span></label>
            <select className="input-field"
              value={caja.tipo || ''}
              onChange={(e) => setCaja('tipo')(e.target.value)}>
              <option value="">Seleccionar...</option>
              {TIPOS_CAJA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notas <span className="text-slate-600 font-normal">(opcional)</span></label>
            <input type="text" className="input-field"
              placeholder="Ej: frágil, no apilar, requiere grúa..."
              value={caja.notas || ''}
              onChange={(e) => setCaja('notas')(e.target.value)} />
          </div>
        </div>
        <p className="text-slate-600 text-xs mt-4">El costo de envío se ingresa en la sección Envíos más abajo.</p>
      </div>
      )}

      {/* ── Materiales de embalaje ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Materiales de embalaje</h2>
          <button onClick={addMaterial} className="btn-secondary text-sm py-2">+ Agregar</button>
        </div>

        {(materiales || []).length === 0 ? (
          <div className="border-2 border-dashed border-slate-700 rounded-xl text-center py-8 mb-2">
            <p className="text-slate-500 text-sm">No hay materiales agregados.</p>
            <p className="text-slate-600 text-xs mt-1">Ej: stretch film, zuncho, cantoneras, silica gel…</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">Material</th>
                <th className="text-center px-4 py-3 w-28">Unidad</th>
                <th className="text-center px-4 py-3 w-28">Cantidad</th>
                <th className="text-right px-4 py-3 w-40">Precio unit. (CLP)</th>
                <th className="text-right px-4 py-3 w-36">Total</th>
                <th className="px-4 py-3 rounded-r-lg w-10" />
              </tr>
            </thead>
            <tbody>
              {(materiales || []).map((m) => (
                <tr key={m.id} className="border-b border-slate-700">
                  <td className="px-4 py-2">
                    <input type="text" className="input-field text-sm py-1.5 w-full"
                      placeholder="Nombre del material"
                      value={m.nombre} onChange={(e) => updateMaterial(m.id, 'nombre', e.target.value)} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" className="input-field text-sm py-1.5 text-center w-full"
                      value={m.unidad} onChange={(e) => updateMaterial(m.id, 'unidad', e.target.value)} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.1" className="input-field text-sm py-1.5 text-center w-full"
                      value={m.cantidad || ''} placeholder="0"
                      onChange={(e) => updateMaterial(m.id, 'cantidad', e.target.value)} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" className="input-field text-sm py-1.5 text-right w-full"
                      value={m.precio_unitario || ''} placeholder="0"
                      onChange={(e) => updateMaterial(m.id, 'precio_unitario', e.target.value)} />
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-200">
                    {fmt(Number(m.cantidad) * Number(m.precio_unitario))}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => removeMaterial(m.id)} className="text-slate-500 hover:text-red-400 transition-colors">
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
                <td colSpan={4} className="px-4 py-3 text-slate-400 font-medium">Total materiales de embalaje</td>
                <td className="px-4 py-3 text-right text-blue-400 font-bold">{fmt(totalMat)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        )}
      </div>

      {/* ── Envíos ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Envíos</h2>
            <p className="text-slate-500 text-xs">Ingresa el costo de envío según cotización del transportista</p>
          </div>
        </div>

        <div>
          <label className="label">Costo de envío (CLP)</label>
          <input type="number" min="0" className="input-field"
            placeholder="Ej: 35000"
            value={costoEnvio}
            onChange={(e) => set('costoEnvio')(e.target.value)} />
        </div>
      </div>

      {/* ── Recomendaciones ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-amber-600/20 border border-amber-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Recomendaciones Agunsa Chile</h2>
            <p className="text-slate-500 text-xs">Estándares IRAM / ISO para palletizado</p>
          </div>
        </div>
        <div className="space-y-2">
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

      {/* ── Notas ── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-3">Notas / instrucciones especiales</h2>
        <textarea className="input-field text-sm resize-none w-full" rows={3}
          placeholder="Ej: Frágil, no apilar, requiere puente grúa, instrucciones de orientación..."
          value={notas} onChange={(e) => set('notas')(e.target.value)} />
      </div>

      {/* ── Resumen ── */}
      {totalGral > 0 && (
        <div className="card border-amber-500/30 bg-amber-600/5">
          <p className="text-amber-300 font-semibold mb-3">Resumen de embalaje y envío</p>
          <div className="space-y-2 text-sm">
            {totalPallets > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Fabricación de pallets ({pallets.length})</span>
                <span className="font-medium">{fmt(totalPallets)}</span>
              </div>
            )}
            {totalMat > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Materiales de embalaje</span>
                <span className="font-medium">{fmt(totalMat)}</span>
              </div>
            )}
            {totalEnvio > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Envío</span>
                <span className="font-medium">{fmt(totalEnvio)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-amber-500/20 mt-3 pt-3 flex items-end justify-between">
            <div>
              <p className="text-amber-300 font-semibold">Total</p>
              <p className="text-slate-500 text-xs mt-0.5">Se suma al resumen de costos</p>
            </div>
            <p className="text-amber-400 font-bold text-3xl">{fmt(totalGral)}</p>
          </div>
        </div>
      )}

      </>}
    </div>
  )
}
