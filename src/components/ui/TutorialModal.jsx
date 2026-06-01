import { useState, useEffect } from 'react'

const TUTORIAL_KEY = 'cotizametal_tutorial_visto'

const PASOS = [
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'text-amber-400',
    fondo: 'bg-amber-600/20 border-amber-500/30',
    titulo: '¡Bienvenido a CotizaMetal!',
    descripcion: 'Esta es tu herramienta para crear cotizaciones metalmecánicas de forma rápida y profesional. En los siguientes pasos te explicamos para qué sirve cada sección.',
    seccion: null,
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    color: 'text-blue-400',
    fondo: 'bg-blue-600/20 border-blue-500/30',
    titulo: 'Dashboard',
    descripcion: 'Tu vista general. Muestra el resumen de cotizaciones por estado (pendientes, aprobadas, entregadas), el monto total acumulado y las últimas cotizaciones creadas. Ideal para tener un vistazo rápido del estado de tu negocio.',
    seccion: 'Dashboard',
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-amber-400',
    fondo: 'bg-amber-600/20 border-amber-500/30',
    titulo: 'Cotizador',
    descripcion: 'Aquí creas tus cotizaciones. Ingresa materiales, horas hombre por cargo, servicios externos, consumibles de taller y bases de cálculo (utilidades, gastos generales, etc.). Al finalizar puedes exportar el documento en PDF para enviar al cliente.',
    seccion: 'Cotizador',
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: 'text-green-400',
    fondo: 'bg-green-600/20 border-green-500/30',
    titulo: 'Historial',
    descripcion: 'Todas tus cotizaciones guardadas en un solo lugar. Puedes buscarlas por cliente o número, filtrar por estado, ordenar por fecha o precio, y volver a abrirlas para editarlas o duplicarlas. También puedes descargar el PDF desde aquí.',
    seccion: 'Historial',
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    color: 'text-violet-400',
    fondo: 'bg-violet-600/20 border-violet-500/30',
    titulo: 'Catálogo de Materiales',
    descripcion: 'Guarda los materiales que usas frecuentemente con su precio de referencia. La próxima vez que cotices, puedes agregarlos con un clic sin tener que ingresar los datos desde cero. Mantén los precios actualizados para cotizar más rápido.',
    seccion: 'Catálogo',
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-teal-400',
    fondo: 'bg-teal-600/20 border-teal-500/30',
    titulo: 'Catálogo de Servicios',
    descripcion: 'Similar al catálogo de materiales pero para servicios externos: corte láser, plegado, pintura, transporte, etc. Guarda los servicios con su precio unitario y agrégalos rápidamente a tus cotizaciones.',
    seccion: 'Cat. Servicios',
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-pink-400',
    fondo: 'bg-pink-600/20 border-pink-500/30',
    titulo: 'Clientes',
    descripcion: 'Administra tu lista de clientes con su nombre, RUT, email y teléfono. Al crear una cotización puedes seleccionar un cliente directamente desde aquí, evitando ingresar los datos cada vez.',
    seccion: 'Clientes',
  },
  {
    icono: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    color: 'text-slate-300',
    fondo: 'bg-slate-600/20 border-slate-500/30',
    titulo: 'Configuración',
    descripcion: 'Ingresa los datos de tu empresa (nombre, RUT, dirección, logo) que aparecerán en el encabezado de los PDF. También define los cargos con sus precios por hora y los porcentajes de bases predeterminados para nuevas cotizaciones.',
    seccion: 'Configuración',
  },
]

export default function TutorialModal() {
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      setVisible(true)
    }
    const abrir = () => { setPaso(0); setVisible(true) }
    window.addEventListener('abrirTutorial', abrir)
    return () => window.removeEventListener('abrirTutorial', abrir)
  }, [])

  const cerrar = () => {
    localStorage.setItem(TUTORIAL_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const actual = PASOS[paso]
  const esPrimero = paso === 0
  const esUltimo  = paso === PASOS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <span className="text-stone-500 text-xs font-medium">
            {paso + 1} / {PASOS.length}
          </span>
          <button
            onClick={cerrar}
            className="text-stone-500 hover:text-stone-300 transition-colors text-xs"
          >
            Saltar tutorial
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 ${actual.fondo} ${actual.color}`}>
            {actual.icono}
          </div>

          {actual.seccion && (
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1 block">
              {actual.seccion}
            </span>
          )}
          <h2 className="text-xl font-bold text-white mb-3">{actual.titulo}</h2>
          <p className="text-stone-300 text-sm leading-relaxed">{actual.descripcion}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {PASOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setPaso(i)}
              className={`rounded-full transition-all duration-200 ${
                i === paso
                  ? 'w-5 h-2 bg-amber-500'
                  : 'w-2 h-2 bg-stone-600 hover:bg-stone-500'
              }`}
            />
          ))}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 px-6 pb-6 pt-3">
          {!esPrimero && (
            <button
              onClick={() => setPaso(p => p - 1)}
              className="btn-secondary flex-1 text-sm py-2"
            >
              Anterior
            </button>
          )}
          {!esUltimo ? (
            <button
              onClick={() => setPaso(p => p + 1)}
              className="btn-primary flex-1 text-sm py-2"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={cerrar}
              className="btn-primary flex-1 text-sm py-2"
            >
              ¡Comenzar!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
