import { useEffect, useMemo } from 'react'
import Toggle from '../ui/Toggle'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const PALLETS_STD = [
  { id: 'euro',      nombre: 'EUR/EPAL',       largo: 1200, ancho: 800,  alto_max: 1500, carga_max: 1500, uso: 'Exportación europea, transporte intermodal, uso general' },
  { id: 'iso',       nombre: 'ISO 1',           largo: 1200, ancho: 1000, alto_max: 1800, carga_max: 1200, uso: 'Uso general industria, bodegaje, camiones nacionales' },
  { id: 'americano', nombre: 'GMA / Americano', largo: 1219, ancho: 1016, alto_max: 1800, carga_max: 1000, uso: "Exportación EE.UU., contenedor 20'/40'" },
  { id: 'custom',    nombre: 'Pallet a medida', largo: 0,    ancho: 0,    alto_max: 0,    carga_max: 0,    uso: '' },
]

const CIUDADES_CHILE = [
  'Arica', 'Iquique', 'Antofagasta', 'Calama', 'Copiapó', 'La Serena', 'Coquimbo',
  'Valparaíso', 'Viña del Mar', 'Santiago', 'Rancagua', 'Talca', 'Chillán',
  'Concepción', 'Los Ángeles', 'Temuco', 'Valdivia', 'Osorno', 'Puerto Montt',
  'Coyhaique', 'Punta Arenas',
]

// Distancias aproximadas por carretera desde Santiago (km)
const KM_DESDE_STG = {
  'Arica': 2050, 'Iquique': 1850, 'Antofagasta': 1370, 'Calama': 1530,
  'Copiapó': 810, 'La Serena': 470, 'Coquimbo': 480,
  'Valparaíso': 120, 'Viña del Mar': 115, 'Santiago': 0,
  'Rancagua': 85, 'Talca': 255, 'Chillán': 400,
  'Concepción': 520, 'Los Ángeles': 535,
  'Temuco': 680, 'Valdivia': 840, 'Osorno': 950,
  'Puerto Montt': 1020, 'Coyhaique': 1500, 'Punta Arenas': 3100,
}

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

// ── Recomendación de pallet ───────────────────────────────────────────────────
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

// ── Madera para fabricar el pallet (según dimensiones del pallet en mm) ───────
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

  // Tablones de cubierta: 22×145mm corriendo a lo ancho, separados ~140mm a lo largo
  const nTableros = Math.ceil(largoMm / 140)
  const piezasPorTabla = Math.max(1, Math.floor(2400 / anchoMm))
  const tablasNecesarias = Math.ceil(nTableros / piezasPorTabla)

  // Largueros: 3 cuartones 75×100mm del largo completo del pallet
  const piezasPorCuarton = Math.max(1, Math.floor(2400 / largoMm))
  const cuartonesNecesarios = Math.ceil(3 / piezasPorCuarton)

  return [
    {
      id: 'pw1',
      nombre: 'Tabla pino sin cepillar 22×145mm × 2.4m',
      unidad: 'unid.',
      cantidad: Math.max(1, tablasNecesarias),
      precio_unitario: 3800,
      nota: `${nTableros} tablones de ${anchoMm} mm (cubierta superior/inferior)`,
    },
    {
      id: 'pw2',
      nombre: 'Cuartón pino 75×100mm × 2.4m',
      unidad: 'unid.',
      cantidad: Math.max(1, cuartonesNecesarios),
      precio_unitario: 6500,
      nota: `3 largueros de ${largoMm} mm`,
    },
    {
      id: 'pw3',
      nombre: 'Clavos construcción 3" (75mm)',
      unidad: 'kg',
      cantidad: 0.3,
      precio_unitario: 2800,
      nota: 'Fijación tablones',
    },
  ]
}

// ── Cantidades automáticas de materiales de embalaje ─────────────────────────
function calcCantidadesEmbalaje(palletId, palletLargoMm, palletAnchoMm, altoCm, pesoKg) {
  let Lm, Am
  if (palletId === 'custom') {
    Lm = (Number(palletLargoMm) || 0) / 1000   // mm → metros
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

  // Stretch film 500mm×300m: 3 capas, 50% solape → paso efectivo 0.25 m
  const vueltas = Math.ceil(Hm / 0.25) * 3 + 2
  const rollosFilm = Math.max(1, Math.ceil((vueltas * perimetro) / 300))

  // Zuncho: >500 kg → metálico; 2 horizontales + 2 diagonales
  const metrosZuncho = perimetro * 2 + (perimetro + Hm * 2) * 2
  const usaMetal = W > 500
  const rollosZunchoPlastico = usaMetal ? 0 : Math.max(1, Math.ceil(metrosZuncho / 200))
  const rollosZunchoMetal    = usaMetal ? Math.max(1, Math.ceil(metrosZuncho / 200)) : 0

  return { rollosFilm, rollosZunchoPlastico, rollosZunchoMetal, cantoneras: 1, usaMetal }
}

// ── Estimación de precio de envío (tarifas referenciales mayo 2026) ───────────
function calcPrecioEnvio(origen, destino, pesoRealKg, largoCm, anchoCm, altoCm) {
  if (!origen || !destino || origen === destino) return null
  const kmO = KM_DESDE_STG[origen]
  const kmD = KM_DESDE_STG[destino]
  if (kmO === undefined || kmD === undefined) return null

  const distKm = Math.abs(kmO - kmD)

  // Peso volumétrico terrestre Chile: L×A×H (cm) / 6000
  const L = Number(largoCm) || 0
  const A = Number(anchoCm) || 0
  const H = Number(altoCm) || 0
  const pesoVol      = L && A && H ? Math.ceil((L * A * H) / 6000) : 0
  const pesoReal     = Number(pesoRealKg) || 0
  const pesoFacturado = Math.max(pesoReal, pesoVol)
  if (!pesoFacturado) return null

  // Tarifas referenciales por tramo (Pullman Cargo / Starken, carga general, servicio normal)
  let precioPorKg, minimo, zona
  if      (distKm <= 100)  { precioPorKg = 420;  minimo = 9000;   zona = 'Corta distancia' }
  else if (distKm <= 300)  { precioPorKg = 600;  minimo = 14000;  zona = 'Media distancia' }
  else if (distKm <= 600)  { precioPorKg = 800;  minimo = 20000;  zona = 'Larga distancia' }
  else if (distKm <= 900)  { precioPorKg = 1000; minimo = 28000;  zona = 'Muy larga distancia' }
  else if (distKm <= 1200) { precioPorKg = 1300; minimo = 38000;  zona = 'Interregional' }
  else if (distKm <= 1700) { precioPorKg = 1700; minimo = 52000;  zona = 'Gran distancia' }
  else if (distKm <= 2200) { precioPorKg = 2300; minimo = 72000;  zona = 'Extremo norte' }
  else                     { precioPorKg = 4200; minimo = 160000; zona = 'Patagonia / Magallanes' }

  const estimado = Math.max(minimo, pesoFacturado * precioPorKg)
  return { pesoReal, pesoVol, pesoFacturado, distKm, zona, precioPorKg, minimo, estimado, usaVolumetrico: pesoVol > pesoReal }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TabEmbalaje({ embalaje, setEmbalaje }) {
  const {
    activo = true,
    palletId = '', cargaKg = '', largoCm = '', anchoCm = '', alturaCm = '',
    materiales = [], materialesPallet = [],
    costoEnvio = '', ciudadOrigen = '', ciudadDestino = '',
    notas = '',
  } = embalaje

  const set = (field) => (v) => setEmbalaje((e) => ({ ...e, [field]: v }))

  const updateMaterial    = (id, f, v) => setEmbalaje((e) => ({ ...e, materiales:       e.materiales.map((m)       => (m.id === id ? { ...m, [f]: v } : m)) }))
  const updateMatPallet   = (id, f, v) => setEmbalaje((e) => ({ ...e, materialesPallet: (e.materialesPallet || []).map((m) => (m.id === id ? { ...m, [f]: v } : m)) }))
  const addMaterial       = ()         => setEmbalaje((e) => ({ ...e, materiales: [...e.materiales, { id: Date.now(), nombre: '', unidad: 'unid.', cantidad: 1, precio_unitario: 0 }] }))
  const removeMaterial    = (id)       => setEmbalaje((e) => ({ ...e, materiales: e.materiales.filter((m) => m.id !== id) }))

  // Recomendación automática de pallet
  const recomendacion = useMemo(() => recomendarPallet(largoCm, anchoCm, cargaKg, alturaCm), [largoCm, anchoCm, cargaKg, alturaCm])

  // Recalcular madera cuando cambia el pallet seleccionado o dimensiones custom
  useEffect(() => {
    if (!palletId) return
    setEmbalaje((e) => ({ ...e, materialesPallet: calcMaderaPallet(palletId, e.largo, e.ancho) }))
  }, [palletId, embalaje.largo, embalaje.ancho]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recalcular cantidades de materiales de embalaje
  useEffect(() => {
    if (!palletId) return
    const auto = calcCantidadesEmbalaje(palletId, embalaje.largo, embalaje.ancho, alturaCm, cargaKg)
    if (!auto) return
    setEmbalaje((e) => ({
      ...e,
      materiales: e.materiales.map((m) => {
        if (m.id === 3) return { ...m, cantidad: auto.rollosFilm }
        if (m.id === 4) return { ...m, cantidad: auto.rollosZunchoPlastico }
        if (m.id === 5) return { ...m, cantidad: auto.cantoneras }
        if (m.id === 6) return { ...m, cantidad: auto.rollosZunchoMetal }
        return m
      }),
    }))
  }, [palletId, alturaCm, cargaKg, embalaje.largo, embalaje.ancho]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Peso volumétrico terrestre (÷6000, estándar cargo terrestre Chile)
  const volumenCm3 = largoCm && anchoCm && alturaCm
    ? Number(largoCm) * Number(anchoCm) * Number(alturaCm)
    : 0
  const pesoVolTerrestre = volumenCm3 ? Math.ceil(volumenCm3 / 6000) : 0

  // Estimación de envío
  const envioEstimado = useMemo(
    () => calcPrecioEnvio(ciudadOrigen, ciudadDestino, cargaKg, largoCm, anchoCm, alturaCm),
    [ciudadOrigen, ciudadDestino, cargaKg, largoCm, anchoCm, alturaCm],
  )

  const totalMat    = (materiales || []).reduce((a, m) => a + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)
  const totalPallet = (materialesPallet || []).reduce((a, m) => a + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)
  const totalEnvio  = Number(costoEnvio) || 0
  const totalGral   = totalMat + totalPallet + totalEnvio

  return (
    <div className="space-y-5">

      {/* Toggle de activación */}
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
          <p className="text-slate-500 text-xs mt-1">Actívala si el producto requiere embalaje o envío.</p>
        </div>
      )}

      {activo && <>

      {/* ── 1. Datos de la carga ── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Datos de la carga</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <label className="label">Alto total con embalaje (cm)</label>
            <input type="number" min="0" className="input-field" placeholder="Ej: 120"
              value={alturaCm} onChange={(e) => set('alturaCm')(e.target.value)} />
          </div>
        </div>
        {volumenCm3 > 0 && (
          <p className="text-slate-500 text-xs mt-3">
            Volumen: <span className="text-slate-300">{(volumenCm3 / 1000000).toFixed(3)} m³</span>
            {' · '}Peso volumétrico terrestre (÷6000): <span className="text-slate-300">{pesoVolTerrestre} kg</span>
            {cargaKg && (
              <span className="text-amber-400">
                {' · '}Se factura por {Number(cargaKg) >= pesoVolTerrestre ? 'peso real' : 'peso volumétrico'}
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── 2. Selección de pallet ── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-1">Pallet</h2>
        <p className="text-slate-500 text-xs mb-3">Normativa Agunsa Chile / ISO 6780 / EPAL · El pallet se fabricará internamente</p>

        {recomendacion && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <span className="text-blue-300 text-xl flex-shrink-0">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-blue-300 text-sm font-medium">
                Recomendado: {PALLETS_STD.find((p) => p.id === recomendacion.palletId)?.nombre}
              </p>
              <p className="text-blue-400/70 text-xs mt-0.5">{recomendacion.razon}</p>
            </div>
            {recomendacion.palletId !== palletId ? (
              <button onClick={() => setEmbalaje((e) => ({ ...e, palletId: recomendacion.palletId }))}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                Aplicar
              </button>
            ) : (
              <span className="flex-shrink-0 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">Aplicado</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PALLETS_STD.map((p) => {
            const isSelected = palletId === p.id
            const isRec = recomendacion?.palletId === p.id
            return (
              <button key={p.id} onClick={() => setEmbalaje((e) => ({ ...e, palletId: p.id }))}
                className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-blue-500 bg-blue-600/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>{p.nombre}</p>
                      {isRec && <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded px-1.5 py-0.5">Recomendado</span>}
                    </div>
                    {p.id !== 'custom' ? (
                      <>
                        <p className="text-slate-400 text-xs mt-1">{p.largo} × {p.ancho} mm · hasta {p.alto_max / 10} cm alto</p>
                        <p className="text-slate-500 text-xs">Carga máx: {p.carga_max} kg</p>
                        <p className="text-slate-500 text-xs mt-1">{p.uso}</p>
                      </>
                    ) : (
                      <p className="text-slate-400 text-xs mt-1">Ingresar dimensiones — madera calculada automáticamente</p>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Dimensiones pallet a medida */}
        {palletId === 'custom' && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-xs mb-3">Ingresa las dimensiones del pallet — los materiales de madera se actualizarán automáticamente</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { field: 'largo',     label: 'Largo (mm)' },
                { field: 'ancho',     label: 'Ancho (mm)' },
                { field: 'alto_max',  label: 'Alto máx (mm)' },
                { field: 'carga_max', label: 'Carga máx (kg)' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  <input type="number" min="0" className="input-field text-sm"
                    value={embalaje[field] || ''}
                    onChange={(e) => setEmbalaje((em) => ({ ...em, [field]: e.target.value }))} />
                </div>
              ))}
            </div>
            {embalaje.largo && embalaje.ancho && (
              <p className="text-emerald-400 text-xs mt-2">
                ✓ Pallet {embalaje.largo} × {embalaje.ancho} mm · Materiales de madera recalculados automáticamente
              </p>
            )}
          </div>
        )}

        {alertas.length > 0 && (
          <div className="mt-3 space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className="bg-amber-900/30 border border-amber-500/40 text-amber-400 text-sm rounded-lg px-4 py-2">{a}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Fabricación de pallet ── */}
      {palletId && (materialesPallet || []).length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Fabricación de pallet</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Madera calculada según normas AGUNSA · Pino sin cepillar · Precios ref. mercado chileno (mayo 2026)
              </p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-2 py-1 flex-shrink-0">
              Fabricación propia
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 rounded-l-lg">Material</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">Detalle</th>
                  <th className="text-center px-4 py-3 w-20">Unid.</th>
                  <th className="text-center px-4 py-3 w-24">Cant.</th>
                  <th className="text-right px-4 py-3 w-36">Precio unit.</th>
                  <th className="text-right px-4 py-3 rounded-r-lg w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {(materialesPallet || []).map((m) => (
                  <tr key={m.id} className="border-b border-slate-700">
                    <td className="px-4 py-2">
                      <input type="text" className="input-field text-sm py-1.5"
                        value={m.nombre} onChange={(e) => updateMatPallet(m.id, 'nombre', e.target.value)} />
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs hidden sm:table-cell">{m.nota || ''}</td>
                    <td className="px-4 py-2">
                      <input type="text" className="input-field text-sm py-1.5 text-center"
                        value={m.unidad} onChange={(e) => updateMatPallet(m.id, 'unidad', e.target.value)} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" step="0.1" className="input-field text-sm py-1.5 text-center"
                        value={m.cantidad} onChange={(e) => updateMatPallet(m.id, 'cantidad', e.target.value)} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" className="input-field text-sm py-1.5 text-right"
                        value={m.precio_unitario} onChange={(e) => updateMatPallet(m.id, 'precio_unitario', e.target.value)} />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-200">
                      {fmt(Number(m.cantidad) * Number(m.precio_unitario))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600">
                  <td colSpan={5} className="px-4 py-3 text-slate-400 font-medium">Total fabricación pallet</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{fmt(totalPallet)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Materiales de embalaje ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Materiales de embalaje</h2>
            {palletId && alturaCm && (
              <p className="text-xs text-blue-400 mt-0.5">✓ Cantidades calculadas automáticamente según dimensiones y peso</p>
            )}
          </div>
          <button onClick={addMaterial} className="btn-secondary text-sm py-2">+ Agregar</button>
        </div>
        <p className="text-slate-500 text-xs mb-4">Precios referencia mercado chileno (mayo 2026) · Edita según tu cotización real</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 rounded-l-lg">Material</th>
                <th className="text-center px-4 py-3 w-24">Unidad</th>
                <th className="text-center px-4 py-3 w-24">Cantidad</th>
                <th className="text-right px-4 py-3 w-40">Precio unit. (CLP)</th>
                <th className="text-right px-4 py-3 w-36">Total</th>
                <th className="px-4 py-3 rounded-r-lg w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(materiales || []).map((m) => (
                <tr key={m.id} className={`border-b border-slate-700 ${Number(m.cantidad) === 0 ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2">
                    <input type="text" className="input-field text-sm py-1.5"
                      value={m.nombre} onChange={(e) => updateMaterial(m.id, 'nombre', e.target.value)} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" className="input-field text-sm py-1.5 text-center"
                      value={m.unidad} onChange={(e) => updateMaterial(m.id, 'unidad', e.target.value)} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.1" className="input-field text-sm py-1.5 text-center"
                      value={m.cantidad || ''} placeholder="0"
                      onChange={(e) => updateMaterial(m.id, 'cantidad', e.target.value)} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" className="input-field text-sm py-1.5 text-right"
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
      </div>

      {/* ── 5. ENVÍOS ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Envíos</h2>
            <p className="text-slate-500 text-xs">Estimación automática + cotizador Pullman Cargo</p>
          </div>
        </div>

        {/* Resumen de la carga */}
        {(cargaKg || largoCm || anchoCm || alturaCm) && (
          <div className="mb-4 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Datos de la carga</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {[
                { label: 'Peso real', value: cargaKg ? `${cargaKg} kg` : null },
                { label: 'Largo',    value: largoCm  ? `${largoCm} cm`  : null },
                { label: 'Ancho',    value: anchoCm  ? `${anchoCm} cm`  : null },
                { label: 'Alto',     value: alturaCm ? `${alturaCm} cm` : null },
              ].map(({ label, value }) => value && (
                <div key={label} className="bg-slate-800 rounded-lg p-2 text-center">
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className="text-white font-bold text-sm">{value}</p>
                </div>
              ))}
            </div>
            {pesoVolTerrestre > 0 && cargaKg && (
              <p className="text-xs text-slate-500">
                Peso volumétrico terrestre (÷6000): <span className="text-slate-300">{pesoVolTerrestre} kg</span>
                {' · '}Peso facturado: <span className="text-amber-300 font-medium">{Math.max(Number(cargaKg), pesoVolTerrestre)} kg</span>
                <span className="text-slate-500"> ({Number(cargaKg) >= pesoVolTerrestre ? 'peso real' : 'peso volumétrico'})</span>
              </p>
            )}
          </div>
        )}

        {/* Origen / Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Ciudad de origen</label>
            <select className="input-field" value={ciudadOrigen} onChange={(e) => set('ciudadOrigen')(e.target.value)}>
              <option value="">Seleccionar ciudad...</option>
              {CIUDADES_CHILE.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ciudad de destino</label>
            <select className="input-field" value={ciudadDestino} onChange={(e) => set('ciudadDestino')(e.target.value)}>
              <option value="">Seleccionar ciudad...</option>
              {CIUDADES_CHILE.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Estimación automática */}
        {envioEstimado && (
          <div className="mb-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-purple-300 font-semibold text-sm">Estimación referencial de flete</p>
                <p className="text-purple-400/70 text-xs mt-0.5">
                  {ciudadOrigen} → {ciudadDestino} · {envioEstimado.distKm} km aprox · {envioEstimado.zona}
                </p>
              </div>
              <p className="text-purple-200 font-bold text-2xl flex-shrink-0">~{fmt(envioEstimado.estimado)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-slate-500">Peso facturado</p>
                <p className="text-slate-200 font-semibold">{envioEstimado.pesoFacturado} kg</p>
                {envioEstimado.usaVolumetrico && <p className="text-amber-400">volumétrico</p>}
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-slate-500">Tarifa/kg</p>
                <p className="text-slate-200 font-semibold">{fmt(envioEstimado.precioPorKg)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-slate-500">Mínimo cobro</p>
                <p className="text-slate-200 font-semibold">{fmt(envioEstimado.minimo)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-purple-400/60 text-xs">Tarifas referenciales Pullman Cargo / Starken (mayo 2026). Confirmar precio real antes de cotizar.</p>
              <button
                onClick={() => set('costoEnvio')(String(envioEstimado.estimado))}
                className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Usar este valor
              </button>
            </div>
          </div>
        )}

        {/* Link Pullman Cargo */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex-1">
            <p className="text-slate-300 text-sm font-medium">Cotizador oficial Pullman Cargo</p>
            <p className="text-slate-500 text-xs mt-0.5">Confirma el precio real ingresando los datos en su sitio web</p>
          </div>
          <a href="https://www.pullmancargo.cl" target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            Ir al sitio →
          </a>
        </div>

        {/* Costo manual */}
        <div>
          <label className="label">
            Costo de envío confirmado (CLP)
            {ciudadOrigen && ciudadDestino && (
              <span className="text-slate-400 normal-case font-normal"> — {ciudadOrigen} → {ciudadDestino}</span>
            )}
          </label>
          <input type="number" min="0" className="input-field"
            placeholder="Ingresa el valor real de Pullman Cargo"
            value={costoEnvio}
            onChange={(e) => set('costoEnvio')(e.target.value)} />
          {envioEstimado && !costoEnvio && (
            <p className="text-slate-500 text-xs mt-1">Estimado: ~{fmt(envioEstimado.estimado)} · Usa el botón "Usar este valor" para pre-rellenar</p>
          )}
        </div>
      </div>

      {/* ── 6. Recomendaciones Agunsa ── */}
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

      {/* ── 7. Notas ── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-3">Notas / instrucciones especiales</h2>
        <textarea className="input-field text-sm resize-none w-full" rows={3}
          placeholder="Ej: Frágil, no apilar, requiere puente grúa, instrucciones de orientación..."
          value={notas} onChange={(e) => set('notas')(e.target.value)} />
      </div>

      {/* ── 8. Resumen de costos ── */}
      {totalGral > 0 && (
        <div className="card border-amber-500/30 bg-amber-600/5">
          <p className="text-amber-300 font-semibold mb-3">Resumen de embalaje y envío</p>
          <div className="space-y-2 text-sm">
            {totalPallet > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Fabricación de pallet</span>
                <span className="font-medium">{fmt(totalPallet)}</span>
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
                <span>Envío{ciudadOrigen && ciudadDestino && <span className="text-slate-500"> ({ciudadOrigen} → {ciudadDestino})</span>}</span>
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
