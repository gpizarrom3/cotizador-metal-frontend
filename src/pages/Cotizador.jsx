import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import TabMateriales, { emptyMaterial, emptySubproducto, calcPesoFromPesoData } from '../components/cotizador/TabMateriales'
import TabConsumibles, { DEFAULT_CONSUMIBLES } from '../components/cotizador/TabConsumibles'
import TabHorasHombre from '../components/cotizador/TabHorasHombre'
import TabServicios from '../components/cotizador/TabServicios'
import TabBases from '../components/cotizador/TabBases'
import TabEmbalaje from '../components/cotizador/TabEmbalaje'
import TabResumen from '../components/cotizador/TabResumen'
import CotizacionPrintView from '../components/cotizador/CotizacionPrintView'
import FichaCostosPrintView from '../components/cotizador/FichaCostosPrintView'
import MecanicoIA from '../components/cotizador/MecanicoIA'
import { useAuth } from '../hooks/useAuth'
import {
  guardarCotizacion, actualizarCotizacion, obtenerClientes,
  guardarPlantilla as guardarPlantillaFS,
  obtenerPlantillas as obtenerPlantillasFS,
  eliminarPlantilla as eliminarPlantillaFS,
} from '../firebase/firestore'
import { exportPDF } from '../utils/exportPDF'
import { getConfigDefaults } from '../utils/configDefaults'
import { useUserData } from '../contexts/UserDataContext'


const makeDefaultRoles = (cfg) => {
  const first = cfg.roles[0]
  if (!first) return []
  return [{ id: 1, nombre: first.nombre, precio_hora: first.precio_hora, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 }]
}

const makeDefaultServicios = () => ({ custom: [] })

const makeDefaultBases = (cfg) =>
  cfg.bases.map((b, i) => ({ id: i + 1, nombre: b.nombre, porcentaje: b.porcentaje }))

// Migración: si hay servicios guardados del formato antiguo (con claves fijas),
// descarta los toggles y solo preserva el array custom
const mergeServicios = (saved) => ({
  custom: Array.isArray(saved?.custom) ? saved.custom : [],
})

const DEFAULT_CONFIG = {
  flete: 0, incluyeIVA: false, validezDias: 30,
  condicionesPago: '', plazoEntrega: '', notas: '',
  descuento: 0, tipoDescuento: 'porcentaje',
  moneda: 'CLP', tipoCambio: 1,
  descripcion: '', numeroReferencia: '',
  markupServicios: 0,
}

const DEFAULT_CLIENTE = { nombre: '', rut: '', email: '', telefono: '' }

const DEFAULT_EMBALAJE = {
  activo: true,
  tipoEnvio: 'sin_especificar',
  pallets: [],
  caja: { tipo: '', notas: '' },
  materiales: [],
  costoEnvio: '', ciudadOrigen: '', ciudadDestino: '', notas: '',
}

const DRAFT_KEY      = 'cotizador_draft'
const PLANTILLAS_KEY = 'cotizador_plantillas'

const getDraft      = () => { try { const s = localStorage.getItem(DRAFT_KEY);      return s ? JSON.parse(s) : {} } catch { return {} } }
const getPlantillas = () => { try { const s = localStorage.getItem(PLANTILLAS_KEY); return s ? JSON.parse(s) : [] } catch { return [] } }

const normCliente = (raw) => {
  if (!raw) return { ...DEFAULT_CLIENTE }
  if (typeof raw === 'string') return { nombre: raw, rut: '', email: '', telefono: '' }
  return raw
}

// Migrate old flat materials array → sub-products format
// Always ensures at least one group with one empty row
const migrarMateriales = (mats) => {
  if (!mats || mats.length === 0) return [{ ...emptySubproducto('MATERIALES'), items: [emptyMaterial()] }]
  if (Array.isArray(mats[0]?.items)) return mats  // already new format
  return [{ id: Date.now() + Math.random(), nombre: 'MATERIALES', items: mats }]
}

// Migrate old single-pallet embalaje → pallets array format
const migrarEmbalaje = (emb) => {
  if (!emb) return { ...DEFAULT_EMBALAJE }
  if (Array.isArray(emb.pallets)) {
    const hasPalletData = (emb.pallets || []).some(p => p.palletId || p.cargaKg || p.largoCm)
    const tipoEnvio = emb.tipoEnvio ?? (hasPalletData ? 'pallet' : 'sin_especificar')
    return {
      ...DEFAULT_EMBALAJE,
      ...emb,
      tipoEnvio,
      caja: emb.caja ?? DEFAULT_EMBALAJE.caja,
      materiales: emb.materiales ?? [],
    }
  }
  const { palletId, cargaKg, largoCm, anchoCm, alturaCm, largo, ancho, alto_max, carga_max, materialesPallet, ...rest } = emb
  const hasPallet = palletId || cargaKg || largoCm || anchoCm || alturaCm
  return {
    ...DEFAULT_EMBALAJE,
    ...rest,
    tipoEnvio: emb.tipoEnvio ?? (hasPallet ? 'pallet' : 'sin_especificar'),
    caja: emb.caja ?? DEFAULT_EMBALAJE.caja,
    materiales: emb.materiales ?? [],
    pallets: hasPallet ? [{
      id: Date.now() + Math.random(),
      palletId: palletId || '', cargaKg: cargaKg || '',
      largoCm: largoCm || '', anchoCm: anchoCm || '', alturaCm: alturaCm || '',
      largo: largo || '', ancho: ancho || '', alto_max: alto_max || '', carga_max: carga_max || '',
      materialesPallet: materialesPallet || [],
    }] : [],
  }
}

export default function Cotizador() {
  const { user } = useAuth()
  const { empresa, configDefaults } = useUserData()
  const printRef  = useRef(null)

  // Skip landing when navigating from Historial "Editar"; show it in all other cases
  const [cotizadorIniciado, setCotizadorIniciado] = useState(() => {
    const fromEdit = localStorage.getItem('cotizador_from_edit')
    if (fromEdit) { localStorage.removeItem('cotizador_from_edit'); return true }
    return false
  })

  const [conMaterial, setConMaterial] = useState(() => {
    const d = getDraft()
    return d.conMaterial !== undefined ? d.conMaterial : null
  })
  const [consumibles, setConsumibles] = useState(() => getDraft().consumibles ?? DEFAULT_CONSUMIBLES)
  const [versionGuardada, setVersionGuardada] = useState(() => {
    try {
      const v = localStorage.getItem('cotizador_original')
      if (v) { localStorage.removeItem('cotizador_original'); return JSON.parse(v) }
      return null
    } catch { return null }
  })
  const [showVersionGuardada, setShowVersionGuardada] = useState(false)

  const [activeTab,      setActiveTab]      = useState(() => getDraft().conMaterial === false ? 'consumibles' : 'materiales')
  const [cliente,        setCliente]        = useState(() => normCliente(getDraft().cliente))
  const [estado,         setEstado]         = useState(() => getDraft().estado ?? 'Pendiente')
  const [materiales,     setMateriales]     = useState(() => migrarMateriales(getDraft().materiales ?? []))
  const [roles,          setRoles]          = useState(() => getDraft().roles          ?? makeDefaultRoles(getConfigDefaults()))
  const [servicios,      setServicios]      = useState(() => mergeServicios(getDraft().servicios))
  const [bases,          setBases]          = useState(() => getDraft().bases          ?? makeDefaultBases(getConfigDefaults()))
  const cantidadLotes = 1
  const [unidadesPorLote,setUnidadesPorLote]= useState(() => getDraft().unidadesPorLote ?? 1)
  const [config,         setConfig]         = useState(() => ({ ...DEFAULT_CONFIG, ...(getDraft().config ?? {}) }))
  const [embalaje,       setEmbalaje]       = useState(() => migrarEmbalaje(getDraft().embalaje))
  const [numeroCot,      setNumeroCot]      = useState(() => getDraft().numeroCot ?? '')
  const [cotizacionId,   setCotizacionId]   = useState(() => getDraft().cotizacionId ?? '')
  const [ownerUid,       setOwnerUid]       = useState(() => getDraft().ownerUid ?? null)

  const [clientes, setClientes] = useState([])

  useEffect(() => {
    if (!user) return
    obtenerClientes(user.uid).then(setClientes).catch(() => {})
  }, [user])

  const [saving,      setSaving]      = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [exportando,  setExportando]  = useState(false)
  const [showPrint,   setShowPrint]   = useState(false)
  const [exportandoFicha, setExportandoFicha] = useState(false)
  const [showFicha,       setShowFicha]       = useState(false)
  const [showCotizacionPreview, setShowCotizacionPreview] = useState(false)

  // Plantillas
  const [plantillas,           setPlantillas]           = useState([])
  const [showPlantillas,       setShowPlantillas]       = useState(false)
  const [showGuardarPlantilla, setShowGuardarPlantilla] = useState(false)
  const [nombrePlantilla,      setNombrePlantilla]      = useState('')

  useEffect(() => {
    if (!user) return
    obtenerPlantillasFS(user.uid).then(setPlantillas).catch(() => {})
  }, [user])

  const setConfigField = (field, value) => setConfig((c) => ({ ...c, [field]: value }))

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      cliente, estado, materiales, roles, servicios, bases,
      cantidadLotes, unidadesPorLote, config, embalaje, numeroCot, cotizacionId,
      conMaterial, consumibles, ownerUid,
    }))
  }, [cliente, estado, materiales, roles, servicios, bases, cantidadLotes, unidadesPorLote, config, embalaje, numeroCot, cotizacionId, conMaterial, consumibles, ownerUid])

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setCliente({ ...DEFAULT_CLIENTE })
    setEstado('Pendiente')
    setMateriales([{ ...emptySubproducto('MATERIALES'), items: [emptyMaterial()] }])
    setRoles(makeDefaultRoles(configDefaults))
    setServicios(makeDefaultServicios(configDefaults))
    setBases(makeDefaultBases(configDefaults))
    setUnidadesPorLote(1)
    setConfig(DEFAULT_CONFIG)
    setEmbalaje({ ...DEFAULT_EMBALAJE })
    setNumeroCot('')
    setCotizacionId('')
    setOwnerUid(null)
    setSaveSuccess(false)
    setSaveError('')
    setConMaterial(null)
    setConsumibles([...DEFAULT_CONSUMIBLES])
  }

  // Plantillas handlers
  const handleGuardarPlantilla = async () => {
    if (!nombrePlantilla.trim() || !user) return
    const datos = {
      nombre: nombrePlantilla.trim(),
      materiales, roles, servicios, bases,
      config: { ...config, flete: 0, condicionesPago: '', plazoEntrega: '', notas: '' },
      cantidadLotes, unidadesPorLote,
    }
    try {
      const id = await guardarPlantillaFS(user.uid, datos)
      setPlantillas((prev) => [{ id, ...datos }, ...prev])
    } catch { /* silently ignore */ }
    setNombrePlantilla('')
    setShowGuardarPlantilla(false)
  }

  const handleCargarPlantilla = (p) => {
    setMateriales(migrarMateriales(p.materiales || []))
    setRoles(p.roles || makeDefaultRoles(configDefaults))
    setServicios(p.servicios || makeDefaultServicios())
    setBases(p.bases || makeDefaultBases(configDefaults))
    setConfig((c) => ({ ...c, ...(p.config || {}) }))
    setUnidadesPorLote(p.unidadesPorLote || 1)
    setShowPlantillas(false)
    setShowGuardarPlantilla(false)
  }

  const handleEliminarPlantilla = async (id) => {
    if (!user) return
    try {
      await eliminarPlantillaFS(user.uid, id)
      setPlantillas((prev) => prev.filter((p) => p.id !== id))
    } catch { /* silently ignore */ }
  }

  // Calculations
  const flatMateriales = materiales.flatMap(sp => sp.items || [])
  const totalMateriales   = flatMateriales.reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)
  const totalConsumibles  = consumibles.reduce((acc, c) => acc + ((Number(c.cantidad) * Number(c.precio_unitario)) || 0), 0)
  const totalHH = roles.reduce((acc, r) => {
    const hh  = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
    const col = r.colacion ? (Number(r.valor_colacion) * Number(r.cantidad)) || 0 : 0
    return acc + hh + col
  }, 0)
  const totalServicios      = (servicios.custom || []).reduce((acc, s) => acc + (Number(s.cantidad) * Number(s.precio_ref) || 0), 0)
  const pesoServicios       = (servicios.custom || []).filter(s => s.agregaPeso).reduce((acc, s) => acc + (Number(s.pesoKg) || 0), 0)
  const pesoTotalEstructura = flatMateriales.reduce((acc, m) => {
    if (!m.pesoData) return acc
    return acc + calcPesoFromPesoData(m.pesoData) * (Number(m.cantidad) || 1)
  }, 0)
  const totalEmbalaje = (embalaje.activo === false) ? 0 : (
    (embalaje.materiales || []).reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0) +
    (embalaje.pallets || []).reduce((accP, p) =>
      accP + (p.materialesPallet || []).reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0), 0) +
    (Number(embalaje.costoEnvio) || 0)
  )
  // Sin material: consumibles replace materials in the base calculation
  // Base = Mat (o Consumibles) + HH — los servicios externos NO forman parte de la base
  const baseSubtotal         = conMaterial === false ? totalConsumibles : totalMateriales
  const baseCalculo          = baseSubtotal + totalHH
  const totalBases           = bases.reduce((acc, b) => acc + (baseCalculo * (Number(b.porcentaje) || 0) / 100), 0)
  const totalMarkupServicios = totalServicios > 0 ? totalServicios * (Number(config.markupServicios) || 0) / 100 : 0
  const costoSinDescuento    = baseSubtotal + totalHH + totalServicios + totalMarkupServicios + totalBases + totalEmbalaje
  const descuentoMonto    = config.tipoDescuento === 'porcentaje'
    ? costoSinDescuento * (Number(config.descuento) || 0) / 100
    : Number(config.descuento) || 0
  const costoTotal = costoSinDescuento - descuentoMonto
  const totalNeto  = costoTotal + Number(config.flete || 0)
  const totalIVA   = config.incluyeIVA ? totalNeto * 0.19 : 0
  const totalFinal = totalNeto + totalIVA

  const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

  const cotizacionData = {
    cliente, estado,
    materiales, roles, servicios, bases, config, embalaje,
    cantidadLotes, unidadesPorLote,
    conMaterial,
    consumibles: conMaterial === false ? consumibles : [],
    totalMateriales: conMaterial === false ? 0 : totalMateriales,
    totalConsumibles: conMaterial === false ? totalConsumibles : 0,
    totalHH, totalServicios, totalMarkupServicios, totalBases, totalEmbalaje,
    costoSinDescuento, descuentoMonto,
    totalNeto, totalIVA, totalFinal,
    numero: numeroCot,
    fecha: new Date().toLocaleDateString('es-CL'),
  }

  const handleGuardar = async () => {
    if (!user) return
    setSaving(true); setSaveError(''); setSaveSuccess(false)
    try {
      if (cotizacionId) {
        // ownerUid presente cuando se edita una cotización compartida como editor
        await actualizarCotizacion(ownerUid || user.uid, cotizacionId, { ...cotizacionData, empresa })
      } else {
        const { id, numero } = await guardarCotizacion(user.uid, { ...cotizacionData, empresa })
        setNumeroCot(numero)
        setCotizacionId(id)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 5000)
    } catch (err) {
      setSaveError('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    setExportando(true)
    setShowPrint(true)
    await new Promise((r) => setTimeout(r, 600))
    const filename = `${numeroCot || 'cotizacion'}_${cliente.nombre || 'cliente'}.pdf`
    await exportPDF('cotizacion-print', filename)
    setShowPrint(false)
    setExportando(false)
  }

  const handleExportFicha = async () => {
    setExportandoFicha(true)
    setShowFicha(true)
    await new Promise((r) => setTimeout(r, 600))
    const filename = `ficha_costos_${numeroCot || 'borrador'}_${cliente.nombre || 'interno'}.pdf`
    await exportPDF('ficha-costos-print', filename)
    setShowFicha(false)
    setExportandoFicha(false)
  }

  // ── Landing screen ──────────────────────────────────────────────────────────
  if (!cotizadorIniciado) {
    const d = getDraft()
    const hasDraft = !!(d.cotizacionId || (d.materiales && d.materiales.length > 0) || (d.cliente && d.cliente.nombre) || d.conMaterial !== undefined)

    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-600/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Cotizador</h1>
            <p className="text-stone-400 text-sm max-w-sm">
              Crea cotizaciones profesionales con materiales, mano de obra, servicios y embalaje.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={() => { clearDraft(); setCotizadorIniciado(true) }}
              className="btn-primary px-10 py-3.5 text-base font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Cotización
            </button>

            {hasDraft && (
              <button
                onClick={() => setCotizadorIniciado(true)}
                className="btn-secondary px-8 py-3.5 text-base flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Seguir editando
              </button>
            )}
          </div>

          {hasDraft && (
            <p className="text-stone-600 text-xs">
              Tienes un borrador guardado.
              {d.numeroCot && <span className="text-stone-500 ml-1">{d.numeroCot}</span>}
              {d.conMaterial === false && <span className="text-amber-600 ml-1">· Sin materiales</span>}
              {d.conMaterial === true && <span className="text-stone-500 ml-1">· Con materiales</span>}
            </p>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // ── Type selector ──────────────────────────────────────────────────────────
  if (cotizadorIniciado && conMaterial === null) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8">
          <div className="text-center">
            <p className="text-stone-500 text-xs uppercase tracking-widest mb-3 font-medium">Paso 1 de 1</p>
            <h1 className="text-2xl font-bold text-white mb-2">¿Qué tipo de cotización es?</h1>
            <p className="text-stone-400 text-sm max-w-md">
              Define si tú provees el material o si el cliente lo suministra. Esto ajusta las pestañas y la base de cálculo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
            {/* Con materiales */}
            <button
              onClick={() => { setConMaterial(true); setActiveTab('materiales') }}
              className="card border-2 border-transparent hover:border-amber-500/50 text-left group transition-all hover:bg-stone-800/80 p-6 cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-600/20 border border-amber-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600/30 transition-colors">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Con materiales</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-3">
                Tú suministras el material. La cotización incluye plancha, perfiles, acero u otros materiales que compras e incorporas al trabajo.
              </p>
              <ul className="space-y-1.5">
                <li className="text-stone-500 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
                  Tab <strong className="text-stone-400">Materiales</strong> habilitado
                </li>
                <li className="text-stone-500 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
                  Bases calculan sobre Mat. + HH
                </li>
                <li className="text-stone-500 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
                  Gastos generales ~15–25%
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Seleccionar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            {/* Sin materiales */}
            <button
              onClick={() => { setConMaterial(false); setActiveTab('consumibles') }}
              className="card border-2 border-transparent hover:border-blue-500/50 text-left group transition-all hover:bg-stone-800/80 p-6 cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Sin materiales</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-3">
                El cliente suministra el material. Cotizas solo mano de obra, servicios y consumibles del taller (electrodos, discos, gases, etc.).
              </p>
              <ul className="space-y-1.5">
                <li className="text-stone-500 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 flex-shrink-0" />
                  Tab <strong className="text-stone-400">Consumibles</strong> reemplaza Materiales
                </li>
                <li className="text-stone-500 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 flex-shrink-0" />
                  Bases calculan sobre Consumibles + HH
                </li>
                <li className="text-stone-500 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 flex-shrink-0" />
                  Se sugieren % más altos (40–60%)
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-blue-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Seleccionar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          </div>

          <button
            onClick={() => setCotizadorIniciado(false)}
            className="text-stone-600 hover:text-stone-400 text-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // ── Full cotizador ──────────────────────────────────────────────────────────
  const TABS = [
    conMaterial === false
      ? { id: 'consumibles', label: 'Consumibles' }
      : { id: 'materiales',  label: 'Materiales'  },
    { id: 'hh',        label: 'Horas Hombre' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'bases',     label: '% Bases' },
    { id: 'embalaje',  label: 'Embalaje y Envío' },
    { id: 'resumen',   label: 'Resumen' },
  ]

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {cotizacionId ? `Editando ${numeroCot || 'cotización'}` : 'Nueva Cotización'}
            </h1>
            {conMaterial === false && (
              <span className="text-xs font-semibold bg-blue-600/20 border border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-full">
                Sin materiales
              </span>
            )}
            {conMaterial !== null && (
              <button
                onClick={() => {
                  const next = !conMaterial
                  setConMaterial(next)
                  setActiveTab(next ? 'materiales' : 'consumibles')
                }}
                className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-full transition-colors"
                title={conMaterial ? 'Cambiar a sin materiales' : 'Cambiar a con materiales'}
              >
                {conMaterial ? 'Transformar a sin materiales' : 'Transformar a con materiales'}
              </button>
            )}
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            {cotizacionId ? 'Guardará los cambios en la cotización existente' : 'El borrador se guarda automáticamente'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* Ver versión guardada */}
          {versionGuardada && (
            <button
              onClick={() => setShowVersionGuardada(true)}
              className="text-amber-400 hover:text-amber-300 text-xs border border-amber-500/30 hover:border-amber-500/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ver versión guardada
            </button>
          )}

          {/* Plantillas */}
          <div className="relative">
            <button
              onClick={() => { setShowPlantillas(!showPlantillas); setShowGuardarPlantilla(false) }}
              className="text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-700 hover:border-slate-600 px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Plantillas{plantillas.length > 0 ? ` (${plantillas.length})` : ''}
            </button>

            {showPlantillas && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-3">
                {plantillas.length === 0 && !showGuardarPlantilla && (
                  <p className="text-slate-500 text-xs text-center py-2">No hay plantillas guardadas.</p>
                )}
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {plantillas.map(p => (
                    <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-slate-700/60 last:border-0">
                      <button
                        onClick={() => handleCargarPlantilla(p)}
                        className="text-slate-200 text-sm hover:text-blue-400 transition-colors text-left flex-1 truncate"
                        title={p.nombre}
                      >
                        {p.nombre}
                      </button>
                      <button
                        onClick={() => handleEliminarPlantilla(p.id)}
                        className="text-slate-600 hover:text-red-400 flex-shrink-0 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {showGuardarPlantilla ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="input-field text-sm py-1.5 flex-1"
                      placeholder="Nombre de la plantilla..."
                      value={nombrePlantilla}
                      onChange={(e) => setNombrePlantilla(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGuardarPlantilla()}
                      autoFocus
                    />
                    <button onClick={handleGuardarPlantilla} className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">
                      Guardar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGuardarPlantilla(true)}
                    className="mt-2 w-full text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/60 rounded-lg py-2 transition-colors"
                  >
                    + Guardar cotizador actual como plantilla
                  </button>
                )}
              </div>
            )}
          </div>

          {totalFinal > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-right">
              <p className="text-slate-400 text-xs">Total estimado</p>
              <p className="text-blue-400 font-bold text-lg">{fmt(totalFinal)}</p>
            </div>
          )}
          <button
            onClick={() => { clearDraft(); setCotizadorIniciado(false) }}
            className="text-slate-500 hover:text-red-400 text-xs transition-colors border border-slate-700 hover:border-red-500/40 px-3 py-2 rounded-lg"
          >
            Limpiar borrador
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'materiales'  && <TabMateriales materiales={materiales} setMateriales={setMateriales} />}
      {activeTab === 'consumibles' && <TabConsumibles consumibles={consumibles} setConsumibles={setConsumibles} />}
      {activeTab === 'hh'          && <TabHorasHombre roles={roles} setRoles={setRoles} configRoles={configDefaults.roles} />}
      {activeTab === 'servicios'   && <TabServicios servicios={servicios} setServicios={setServicios} />}
      {activeTab === 'bases'       && (
        <TabBases
          bases={bases} setBases={setBases}
          totalMateriales={totalMateriales} totalHH={totalHH}
          conMaterial={conMaterial} totalConsumibles={totalConsumibles}
        />
      )}
      {activeTab === 'embalaje'    && <TabEmbalaje embalaje={embalaje} setEmbalaje={setEmbalaje} />}
      {activeTab === 'resumen'     && (
        <TabResumen
          cliente={cliente} setCliente={setCliente} clientes={clientes}
          estado={estado} setEstado={setEstado}
          totalMateriales={totalMateriales} totalHH={totalHH}
          totalServicios={totalServicios} totalBases={totalBases} totalEmbalaje={totalEmbalaje}
          bases={bases}
          unidadesPorLote={unidadesPorLote} setUnidadesPorLote={setUnidadesPorLote}
          config={config} setConfigField={setConfigField}
          servicios={servicios}
          numeroCot={numeroCot}
          saving={saving} saveSuccess={saveSuccess} saveError={saveError}
          onGuardar={handleGuardar} onExportPDF={handleExportPDF} exportando={exportando}
          onExportFicha={handleExportFicha} exportandoFicha={exportandoFicha}
          onVerCotizacion={() => setShowCotizacionPreview(true)}
          conMaterial={conMaterial} totalConsumibles={totalConsumibles}
          pesoMateriales={pesoTotalEstructura} pesoServicios={pesoServicios}
        />
      )}

      {/* Hidden PDF templates */}
      {showPrint && (
        <div ref={printRef} style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
          <CotizacionPrintView empresa={empresa} cot={cotizacionData} />
        </div>
      )}
      {showFicha && (
        <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
          <FichaCostosPrintView empresa={empresa} cot={cotizacionData} />
        </div>
      )}

      {/* IA Mecánico Carlos — flotante */}
      <MecanicoIA
        contexto={{
          cliente, numeroCot,
          materiales, roles, servicios, bases, config,
          totalMateriales: conMaterial === false ? 0 : totalMateriales,
          totalConsumibles: conMaterial === false ? totalConsumibles : 0,
          consumibles: conMaterial === false ? consumibles : [],
          conMaterial,
          totalHH, totalServicios, totalBases, totalEmbalaje, totalFinal,
        }}
      />

      {/* Modal: preview cotización actual */}
      {showCotizacionPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm">
                Cotización — <span className="text-blue-400 font-mono">{numeroCot || 'BORRADOR'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowCotizacionPreview(false); handleExportPDF() }}
                disabled={exportando}
                className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar PDF
              </button>
              <button onClick={() => setShowCotizacionPreview(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center">
            <div className="w-full max-w-4xl">
              <CotizacionPrintView empresa={empresa} cot={cotizacionData} />
            </div>
          </div>
        </div>
      )}

      {/* Modal: versión guardada */}
      {showVersionGuardada && versionGuardada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-semibold text-sm">
                Versión guardada —{' '}
                <span className="text-amber-400 font-mono">{versionGuardada.numero || 'BORRADOR'}</span>
              </span>
              <span className="text-slate-500 text-xs">(antes de editar)</span>
            </div>
            <button onClick={() => setShowVersionGuardada(false)} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center">
            <div className="w-full max-w-4xl">
              <CotizacionPrintView empresa={versionGuardada.empresa || empresa} cot={versionGuardada} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
