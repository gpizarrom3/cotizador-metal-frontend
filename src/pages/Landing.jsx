import { Link } from 'react-router-dom'

const PRECIO_PRO = '$14.990'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'PDF profesional al instante',
    desc: 'Genera cotizaciones PDF con tu logo y datos de empresa. Listas para enviar al cliente en segundos.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h7" />
      </svg>
    ),
    title: 'Materiales con cálculo automático',
    desc: 'Planchas, tubos, barras y perfiles. Calcula pesos y m² automáticamente al ingresar dimensiones.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Control de mano de obra',
    desc: 'Agrega cargos (soldador, tornero, etc.) con precio/hora y horas trabajadas. Colaciones incluidas.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: 'Catálogo de precios',
    desc: 'Guarda materiales y servicios frecuentes. Insértalos en nuevas cotizaciones con un clic.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Historial de cotizaciones',
    desc: 'Busca, duplica y gestiona todas tus cotizaciones anteriores. Nunca pierdas una referencia de precio.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Asistente IA Carlos (Pro)',
    desc: 'Tu asistente de metalmecánica con IA. Consulta materiales, procesos, costos y más.',
  },
]

const steps = [
  {
    num: '1',
    title: 'Crea tu cuenta gratis',
    desc: 'Regístrate con email o Google. En menos de un minuto tienes tu taller listo.',
  },
  {
    num: '2',
    title: 'Ingresa el proyecto',
    desc: 'Agrega materiales, horas hombre y servicios. Los cálculos se hacen automáticamente.',
  },
  {
    num: '3',
    title: 'Exporta y envía el PDF',
    desc: 'Genera el PDF con tu logo y datos, y envíalo directamente al cliente.',
  },
]

const freeFeatures = [
  'Hasta 10 cotizaciones',
  'Exportar PDF profesional',
  'Catálogo básico (2 ítems)',
  'Historial y clientes',
  'Plantillas reutilizables',
]

const proFeatures = [
  'Cotizaciones ilimitadas',
  'Exportar PDF profesional',
  'Catálogos ilimitados',
  'Historial y clientes',
  'Plantillas reutilizables',
  'Modo avanzado (embalaje, pallets)',
  'Compartir cotizaciones',
  'Asistente IA Carlos',
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Navbar ── */}
      <header className="border-b border-slate-800/60 sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white">CotizaMetal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Registro gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Cotizador profesional para metalmecánica chilena
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Cotiza como profesional,<br />
          <span className="text-amber-400">cobra lo que mereces</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Crea cotizaciones detalladas con materiales, mano de obra y servicios.
          Genera PDF con tu logo en segundos. Diseñado para talleres metalmecánicos en Chile.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-amber-900/40 w-full sm:w-auto"
          >
            Crear cuenta gratis →
          </Link>
          <Link
            to="/login"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-8 py-3.5 rounded-xl text-base transition-colors border border-slate-700 w-full sm:w-auto"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-slate-600 text-sm mt-5">Sin tarjeta de crédito · Plan gratuito siempre disponible</p>
      </section>

      {/* ── App mockup ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden shadow-2xl shadow-black/50">
          <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-600" />
              <div className="w-3 h-3 rounded-full bg-slate-600" />
              <div className="w-3 h-3 rounded-full bg-slate-600" />
            </div>
            <div className="flex-1 bg-slate-700 rounded mx-4 px-3 py-1 text-slate-400 text-xs">
              cotizametal.cl/cotizador
            </div>
          </div>
          <div className="p-5 grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-1.5">
              {['Dashboard', 'Cotizador', 'Historial', 'Catálogo', 'Clientes'].map((item, i) => (
                <div
                  key={item}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    i === 1
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-500'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="col-span-3 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-semibold text-sm">Nueva cotización</p>
                <span className="bg-amber-600/20 text-amber-400 text-xs px-2 py-0.5 rounded-md border border-amber-500/20">
                  COT-2026-007
                </span>
              </div>
              {[
                { label: 'Plancha 3mm 2×6 — 4 unidades', val: '$124.800' },
                { label: 'Tubo cuadrado 40×40 — 6 m', val: '$48.300' },
                { label: 'Soldador — 12 hrs', val: '$108.000' },
                { label: 'Pintura epóxica + mano', val: '$35.000' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                  <span className="text-slate-300 text-xs">{row.label}</span>
                  <span className="text-amber-400 text-xs font-medium">{row.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2.5 border border-slate-600/60">
                <span className="text-white text-xs font-semibold">Total estimado</span>
                <span className="text-amber-400 text-sm font-bold">$316.100</span>
              </div>
              <div className="flex gap-2 pt-1">
                <div className="flex-1 bg-blue-600/20 text-blue-400 text-xs text-center py-2 rounded-lg border border-blue-500/30 cursor-default">
                  Guardar cotización
                </div>
                <div className="flex-1 bg-amber-600/20 text-amber-400 text-xs text-center py-2 rounded-lg border border-amber-500/30 cursor-default">
                  Exportar PDF
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-3">
          Todo lo que necesitas para cotizar
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          Desde materiales hasta mano de obra, CotizaMetal cubre todo el proceso de cotización metalmecánica.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="w-11 h-11 bg-amber-600/15 text-amber-500 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-900/50 border-y border-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Así de simple</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={step.num} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-3/4 w-1/2 border-t border-dashed border-slate-700" />
                )}
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 relative z-10">
                  {step.num}
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-3">
          Precio simple y transparente
        </h2>
        <p className="text-slate-400 text-center mb-12">
          Empieza gratis. Actualiza cuando lo necesites.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-1">Gratuito</h3>
            <p className="text-slate-500 text-sm mb-5">Para empezar sin compromiso</p>
            <div className="mb-7">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-slate-500 ml-2 text-sm">/ siempre gratis</span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-slate-900 border-2 border-blue-500/60 rounded-2xl p-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold bg-blue-600 text-white px-4 py-1 rounded-full shadow">
                RECOMENDADO
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 mt-2">Pro</h3>
            <p className="text-slate-400 text-sm mb-5">Para talleres en crecimiento</p>
            <div className="mb-7">
              <span className="text-4xl font-extrabold text-white">{PRECIO_PRO} CLP</span>
              <span className="text-slate-500 ml-2 text-sm">/ mes</span>
            </div>
            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-200">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/30"
            >
              Empezar con Pro
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Pagos procesados de forma segura por MercadoPago · Puedes cancelar en cualquier momento
        </p>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-amber-600/10 border-y border-amber-500/20 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Listo para cotizar mejor
          </h2>
          <p className="text-slate-400 mb-8">
            Únete a los talleres metalmecánicos que ya usan CotizaMetal para ganar más tiempo y cobrar con confianza.
          </p>
          <Link
            to="/register"
            className="inline-block bg-amber-600 hover:bg-amber-500 text-white font-semibold px-10 py-4 rounded-xl text-base transition-colors shadow-lg shadow-amber-900/40"
          >
            Crear mi cuenta gratis →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-amber-600 rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm font-medium">CotizaMetal</span>
            <span className="text-slate-700 text-sm">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/terminos" className="text-slate-500 hover:text-slate-300 transition-colors">Términos</Link>
            <Link to="/privacidad" className="text-slate-500 hover:text-slate-300 transition-colors">Privacidad</Link>
            <a href="mailto:gpizarrom.3@gmail.com?subject=Soporte CotizaMetal" className="text-slate-500 hover:text-slate-300 transition-colors">Soporte</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
