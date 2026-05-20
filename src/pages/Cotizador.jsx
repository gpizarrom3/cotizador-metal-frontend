import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import TabMateriales from '../components/cotizador/TabMateriales'
import TabHorasHombre from '../components/cotizador/TabHorasHombre'
import TabServicios from '../components/cotizador/TabServicios'
import TabBases from '../components/cotizador/TabBases'
import TabEmbalaje from '../components/cotizador/TabEmbalaje'
import TabResumen from '../components/cotizador/TabResumen'
import CotizacionPrintView from '../components/cotizador/CotizacionPrintView'
import FichaCostosPrintView from '../components/cotizador/FichaCostosPrintView'
import { useAuth } from '../hooks/useAuth'
import { guardarCotizacion, actualizarCotizacion } from '../firebase/firestore'
import { getEmpresa } from '../utils/empresa'
import { exportPDF } from '../utils/exportPDF'

const TABS = [
  { id: 'materiales', label: 'Materiales' },
  { id: 'hh', label: 'Horas Hombre' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'bases', label: '% Bases' },
  { id: 'embalaje', label: 'Embalaje y Envío' },
  { id: 'resumen', label: 'Resumen' },
]

const DEFAULT_ROLES = [
  { id: 1, nombre: 'Soldador',   precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 },
  { id: 2, nombre: 'Ayudante',   precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 },
  { id: 3, nombre: 'Fresador',   precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 },
  { id: 4, nombre: 'Tornero',    precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 },
  { id: 5, nombre: 'Ingeniero',  precio_hora: 0, cantidad: 1, horas: 0, colacion: false, valor_colacion: 0 },
]

const DEFAULT_SERVICIOS = {
  corte_plasma:        { activo: false, precio: 0 },
  corte_laser:         { activo: false, precio: 0 },
  oxicorte:            { activo: false, precio: 0 },
  tratamiento_termico: { activo: false, tipo: '', precio: 0 },
  plegado:             { activo: false, precio: 0 },
  cilindrado:          { activo: false, precio: 0 },
}

const DEFAULT_BASES = [
  { id: 1, nombre: 'Gastos Generales',   porcentaje: 20 },
  { id: 2, nombre: 'Utilidades',         porcentaje: 0 },
  { id: 3, nombre: 'Costos Financieros', porcentaje: 0 },
  { id: 4, nombre: 'Imprevistos',        porcentaje: 0 },
]

const DEFAULT_CONFIG = {
  flete: 0, incluyeIVA: false, validezDias: 30,
  condicionesPago: '', plazoEntrega: '', notas: '',
  descuento: 0, tipoDescuento: 'porcentaje',
  moneda: 'CLP', tipoCambio: 1,
}

const DEFAULT_CLIENTE = { nombre: '', rut: '', email: '', telefono: '' }

const DEFAULT_EMBALAJE_MATERIALES = [
  { id: 3,  nombre: 'Strech film 500mm × 300m (23 µm)',           unidad: 'rollo',   precio_ref: 4200,  cantidad: 1, precio_unitario: 4200 },
  { id: 4,  nombre: 'Cinta de zuncho plástico 16mm × 200m',       unidad: 'rollo',   precio_ref: 9800,  cantidad: 1, precio_unitario: 9800 },
  { id: 5,  nombre: 'Cantonera de cartón 35×35×3mm (x100 unid.)', unidad: 'paquete', precio_ref: 5200,  cantidad: 1, precio_unitario: 5200 },
  { id: 6,  nombre: 'Zuncho metálico 19mm (rollo 200m)',           unidad: 'rollo',   precio_ref: 28500, cantidad: 0, precio_unitario: 28500 },
  { id: 7,  nombre: 'Lámina de cartón corrugado 1200×1000 mm',    unidad: 'unid.',   precio_ref: 850,   cantidad: 4, precio_unitario: 850 },
  { id: 8,  nombre: 'Espuma polietileno 10mm (plancha 1×2m)',      unidad: 'unid.',   precio_ref: 3200,  cantidad: 0, precio_unitario: 3200 },
  { id: 9,  nombre: 'Bolsa VCI anticorrosión 1200×1000mm',         unidad: 'unid.',   precio_ref: 1800,  cantidad: 0, precio_unitario: 1800 },
  { id: 10, nombre: 'Silica gel 100g (caja x25 sobres)',           unidad: 'caja',    precio_ref: 4500,  cantidad: 0, precio_unitario: 4500 },
  { id: 11, nombre: 'Caja de cartón corrugado (triple pared)',     unidad: 'unid.',   precio_ref: 3500,  cantidad: 0, precio_unitario: 3500 },
  { id: 12, nombre: 'Flejes metálicos con hebillas (x100)',        unidad: 'kit',     precio_ref: 6800,  cantidad: 0, precio_unitario: 6800 },
]

const DEFAULT_EMBALAJE = {
  palletId: '', cargaKg: '', largoCm: '', anchoCm: '', alturaCm: '',
  materiales: DEFAULT_EMBALAJE_MATERIALES, materialesPallet: [],
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

export default function Cotizador() {
  const { user } = useAuth()
  const printRef  = useRef(null)

  const [activeTab,      setActiveTab]      = useState('materiales')
  const [cliente,        setCliente]        = useState(() => normCliente(getDraft().cliente))
  const [estado,         setEstado]         = useState(() => getDraft().estado ?? 'Borrador')
  const [materiales,     setMateriales]     = useState(() => getDraft().materiales ?? [])
  const [roles,          setRoles]          = useState(() => getDraft().roles ?? DEFAULT_ROLES)
  const [servicios,      setServicios]      = useState(() => getDraft().servicios ?? DEFAULT_SERVICIOS)
  const [bases,          setBases]          = useState(() => getDraft().bases ?? DEFAULT_BASES)
  const [cantidadLotes,  setCantidadLotes]  = useState(() => getDraft().cantidadLotes ?? 1)
  const [unidadesPorLote,setUnidadesPorLote]= useState(() => getDraft().unidadesPorLote ?? 1)
  const [config,         setConfig]         = useState(() => ({ ...DEFAULT_CONFIG, ...(getDraft().config ?? {}) }))
  const [embalaje,       setEmbalaje]       = useState(() => {
    const d = getDraft().embalaje
    return d
      ? { ...DEFAULT_EMBALAJE, ...d, materiales: d.materiales ?? DEFAULT_EMBALAJE_MATERIALES, materialesPallet: d.materialesPallet ?? [] }
      : DEFAULT_EMBALAJE
  })
  const [numeroCot,      setNumeroCot]      = useState(() => getDraft().numeroCot ?? '')
  const [cotizacionId,   setCotizacionId]   = useState(() => getDraft().cotizacionId ?? '')

  const [saving,         setSaving]         = useState(false)
  const [saveSuccess,    setSaveSuccess]    = useState(false)
  const [saveError,      setSaveError]      = useState('')
  const [exportando,     setExportando]     = useState(false)
  const [showPrint,      setShowPrint]      = useState(false)
  const [exportandoFicha,setExportandoFicha]= useState(false)
  const [showFicha,      setShowFicha]      = useState(false)

  // Plantillas
  const [plantillas,          setPlantillas]          = useState(getPlantillas)
  const [showPlantillas,      setShowPlantillas]      = useState(false)
  const [showGuardarPlantilla,setShowGuardarPlantilla]= useState(false)
  const [nombrePlantilla,     setNombrePlantilla]     = useState('')

  const setConfigField = (field, value) => setConfig((c) => ({ ...c, [field]: value }))

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      cliente, estado, materiales, roles, servicios, bases,
      cantidadLotes, unidadesPorLote, config, embalaje, numeroCot, cotizacionId,
    }))
  }, [cliente, estado, materiales, roles, servicios, bases, cantidadLotes, unidadesPorLote, config, embalaje, numeroCot, cotizacionId])

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setCliente({ ...DEFAULT_CLIENTE })
    setEstado('Borrador')
    setMateriales([]);  setRoles(DEFAULT_ROLES); setServicios(DEFAULT_SERVICIOS)
    setBases(DEFAULT_BASES); setCantidadLotes(1); setUnidadesPorLote(1)
    setConfig(DEFAULT_CONFIG); setEmbalaje(DEFAULT_EMBALAJE); setNumeroCot(''); setCotizacionId('')
    setSaveSuccess(false); setSaveError('')
  }

  // Plantillas handlers
  const handleGuardarPlantilla = () => {
    if (!nombrePlantilla.trim()) return
    const nueva = {
      id: Date.now(),
      nombre: nombrePlantilla.trim(),
      materiales, roles, servicios, bases,
      config: { ...config, flete: 0, condicionesPago: '', plazoEntrega: '', notas: '' },
      cantidadLotes, unidadesPorLote,
    }
    const actualizadas = [...plantillas, nueva]
    localStorage.setItem(PLANTILLAS_KEY, JSON.stringify(actualizadas))
    setPlantillas(actualizadas)
    setNombrePlantilla('')
    setShowGuardarPlantilla(false)
  }

  const handleCargarPlantilla = (p) => {
    setMateriales(p.materiales || [])
    setRoles(p.roles || DEFAULT_ROLES)
    setServicios(p.servicios || DEFAULT_SERVICIOS)
    setBases(p.bases || DEFAULT_BASES)
    setConfig((c) => ({ ...c, ...(p.config || {}) }))
    setCantidadLotes(p.cantidadLotes || 1)
    setUnidadesPorLote(p.unidadesPorLote || 1)
    setShowPlantillas(false)
    setShowGuardarPlantilla(false)
  }

  const handleEliminarPlantilla = (id) => {
    const actualizadas = plantillas.filter(p => p.id !== id)
    localStorage.setItem(PLANTILLAS_KEY, JSON.stringify(actualizadas))
    setPlantillas(actualizadas)
  }

  // Calculations
  const totalMateriales = materiales.reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0)
  const totalHH = roles.reduce((acc, r) => {
    const hh  = (Number(r.precio_hora) * Number(r.horas) * Number(r.cantidad)) || 0
    const col = r.colacion ? (Number(r.valor_colacion) * Number(r.cantidad)) || 0 : 0
    return acc + hh + col
  }, 0)
  const totalServicios = Object.values(servicios).reduce((acc, s) => acc + (s.activo ? Number(s.precio) || 0 : 0), 0)
  const totalEmbalaje  =
    (embalaje.materiales     || []).reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0) +
    (embalaje.materialesPallet || []).reduce((acc, m) => acc + (Number(m.cantidad) * Number(m.precio_unitario) || 0), 0) +
    (Number(embalaje.costoEnvio) || 0)
  const baseCalculo        = totalMateriales + totalHH + totalServicios + totalEmbalaje
  const totalBases         = bases.reduce((acc, b) => acc + (baseCalculo * (Number(b.porcentaje) || 0) / 100), 0)
  const costoSinDescuento  = totalMateriales + totalHH + totalServicios + totalBases + totalEmbalaje
  const descuentoMonto     = config.tipoDescuento === 'porcentaje'
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
    totalMateriales, totalHH, totalServicios, totalBases, totalEmbalaje,
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
        await actualizarCotizacion(user.uid, cotizacionId, { ...cotizacionData, empresa: getEmpresa() })
      } else {
        const { numero } = await guardarCotizacion(user.uid, { ...cotizacionData, empresa: getEmpresa() })
        setNumeroCot(numero)
        setCotizacionId('')
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
    await new Promise((r) => setTimeout(r, 300))
    const filename = `${numeroCot || 'cotizacion'}_${cliente.nombre || 'cliente'}.pdf`
    await exportPDF('cotizacion-print', filename)
    setShowPrint(false)
    setExportando(false)
  }

  const handleExportFicha = async () => {
    setExportandoFicha(true)
    setShowFicha(true)
    await new Promise((r) => setTimeout(r, 300))
    const filename = `ficha_costos_${numeroCot || 'borrador'}_${cliente.nombre || 'interno'}.pdf`
    await exportPDF('ficha-costos-print', filename)
    setShowFicha(false)
    setExportandoFicha(false)
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {cotizacionId ? `Editando ${numeroCot || 'cotización'}` : 'Nueva Cotización'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {cotizacionId ? 'Guardará los cambios en la cotización existente' : 'El borrador se guarda automáticamente'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
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
            onClick={clearDraft}
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

      {activeTab === 'materiales' && <TabMateriales materiales={materiales} setMateriales={setMateriales} />}
      {activeTab === 'hh'         && <TabHorasHombre roles={roles} setRoles={setRoles} />}
      {activeTab === 'servicios'  && <TabServicios servicios={servicios} setServicios={setServicios} />}
      {activeTab === 'bases'      && <TabBases bases={bases} setBases={setBases} totalMateriales={totalMateriales} totalHH={totalHH} />}
      {activeTab === 'embalaje'   && <TabEmbalaje embalaje={embalaje} setEmbalaje={setEmbalaje} />}
      {activeTab === 'resumen'    && (
        <TabResumen
          cliente={cliente} setCliente={setCliente}
          estado={estado} setEstado={setEstado}
          totalMateriales={totalMateriales} totalHH={totalHH}
          totalServicios={totalServicios} totalBases={totalBases} totalEmbalaje={totalEmbalaje}
          bases={bases}
          cantidadLotes={cantidadLotes} setCantidadLotes={setCantidadLotes}
          unidadesPorLote={unidadesPorLote} setUnidadesPorLote={setUnidadesPorLote}
          config={config} setConfigField={setConfigField}
          servicios={servicios}
          numeroCot={numeroCot}
          saving={saving} saveSuccess={saveSuccess} saveError={saveError}
          onGuardar={handleGuardar} onExportPDF={handleExportPDF} exportando={exportando}
          onExportFicha={handleExportFicha} exportandoFicha={exportandoFicha}
        />
      )}

      {/* Hidden PDF templates */}
      {showPrint && (
        <div ref={printRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <CotizacionPrintView empresa={getEmpresa()} cot={cotizacionData} />
        </div>
      )}
      {showFicha && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <FichaCostosPrintView empresa={getEmpresa()} cot={cotizacionData} />
        </div>
      )}
    </DashboardLayout>
  )
}
