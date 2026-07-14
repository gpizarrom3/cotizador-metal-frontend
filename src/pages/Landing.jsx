import { Link } from 'react-router-dom'

const PRECIO_PRO = '$14.990'

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
            <Link to="/register" className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Registro gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          El cotizador hecho para talleres metalmecánicos chilenos
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Deja de estimar a ojo.<br />
          <span className="text-amber-400">Calcula con precisión.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Pesos de materiales, m² de superficie, km de traslado con Google Maps, mano de obra, colaciones y PDF profesional. Todo en un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/register" className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-amber-900/40 w-full sm:w-auto">
            Crear cuenta gratis →
          </Link>
          <Link to="/login" className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-8 py-3.5 rounded-xl text-base transition-colors border border-slate-700 w-full sm:w-auto">
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-slate-600 text-sm mt-5">Sin tarjeta de crédito · Plan gratuito siempre disponible</p>
      </section>

      {/* ── Mockup principal ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden shadow-2xl shadow-black/60">
          {/* Barra de título */}
          <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 bg-slate-700 rounded mx-4 px-3 py-1 text-slate-400 text-xs">
              cotizametal.cl/cotizador
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">COT-2026-015</span>
          </div>

          {/* Tabs del cotizador */}
          <div className="flex gap-1 bg-slate-950 px-4 pt-3 pb-2 overflow-x-auto">
            {['Materiales', 'Horas Hombre', 'Traslados', 'Servicios', '% Bases', 'Embalaje', 'Resumen'].map((t, i) => (
              <div key={t} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${i === 0 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{t}</div>
            ))}
          </div>

          {/* Contenido del mockup */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tabla de materiales */}
            <div className="space-y-2">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">Materiales — Grupo ESTRUCTURA</p>
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-slate-700">
                  <span className="text-slate-500 text-[10px] col-span-2">Material</span>
                  <span className="text-slate-500 text-[10px] text-right">Kg/unidad</span>
                  <span className="text-slate-500 text-[10px] text-right">Cant.</span>
                  <span className="text-slate-500 text-[10px] text-right">Subtotal</span>
                </div>
                {[
                  { mat: 'Plancha 3mm (2×6)', fmt: 'Plancha', kg: '28.8', cant: '4', sub: '$124.800' },
                  { mat: 'Tubo cuadrado 40×40', fmt: 'Tubo cuadrado', kg: '3.7', cant: '6', sub: '$48.300' },
                  { mat: 'Ángulo 50×50×5mm', fmt: 'Ángulo', kg: '3.8', cant: '8', sub: '$62.000' },
                ].map((r) => (
                  <div key={r.mat} className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-slate-700/50 last:border-0">
                    <div className="col-span-2">
                      <p className="text-slate-200 text-xs">{r.mat}</p>
                      <p className="text-slate-600 text-[10px]">{r.fmt}</p>
                    </div>
                    <span className="text-emerald-400 text-xs text-right">{r.kg} kg</span>
                    <span className="text-slate-400 text-xs text-right">{r.cant}</span>
                    <span className="text-amber-400 text-xs text-right font-medium">{r.sub}</span>
                  </div>
                ))}
              </div>
              {/* Peso y m² calculados */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-400 text-xs font-medium mb-0.5">Peso total estimado</p>
                  <p className="text-white font-bold text-lg">187.6 <span className="text-slate-400 text-sm font-normal">kg</span></p>
                  <p className="text-slate-500 text-[10px]">Calculado por perfil y dimensiones</p>
                </div>
                <div className="bg-sky-600/10 border border-sky-500/20 rounded-lg p-3">
                  <p className="text-sky-400 text-xs font-medium mb-0.5">Superficie para pintura</p>
                  <p className="text-white font-bold text-lg">14.3 <span className="text-slate-400 text-sm font-normal">m²</span></p>
                  <p className="text-slate-500 text-[10px]">Calculado por geometría del perfil</p>
                </div>
              </div>
            </div>

            {/* Traslado con mapa */}
            <div className="space-y-2">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">Traslados — Ruta calculada</p>
              <div className="bg-slate-800 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-slate-300 text-xs">Pasaje Los Aromos 456, Pudahuel</span>
                </div>
                {/* Mapa simulado */}
                <div className="rounded-lg overflow-hidden h-24 bg-slate-950 relative border border-slate-700">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 30% 60%, #334155 1px, transparent 1px), radial-gradient(circle at 70% 30%, #334155 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 96" preserveAspectRatio="none">
                    <path d="M30 70 Q80 40 140 50 Q200 60 270 25" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <circle cx="30" cy="70" r="5" fill="#22c55e" />
                    <circle cx="270" cy="25" r="5" fill="#ef4444" />
                  </svg>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                    327 km — calculado con Google Maps
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-slate-300 text-xs">Av. Balmaceda 1234, Calama</span>
                </div>
                <div className="border-t border-slate-700 pt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-slate-500 text-[10px]">Vehículo</p>
                    <p className="text-slate-200 text-xs font-medium">SUV / 4×4</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Combustible</p>
                    <p className="text-slate-200 text-xs font-medium">Gasolina 95</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Costo</p>
                    <p className="text-orange-400 text-xs font-bold">$64.800</p>
                  </div>
                </div>
              </div>
              {/* Total resumen */}
              <div className="bg-slate-800 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                  <span>Materiales</span><span>$235.100</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                  <span>Horas Hombre</span><span>$108.000</span>
                </div>
                <div className="flex justify-between items-center text-xs text-orange-400/80 mb-2">
                  <span>└ Combustible y traslados</span><span>$64.800</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                  <span className="text-white text-sm font-semibold">Total estimado</span>
                  <span className="text-amber-400 font-bold text-base">$469.900</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lo que nadie más tiene ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Diferenciadores</span>
          <h2 className="text-3xl font-bold text-white mt-2 mb-3">Lo que ningún otro cotizador tiene</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Funciones diseñadas específicamente para metalmecánica. No es una planilla Excel. No es un ERP. Es una herramienta que entiende tu trabajo.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Pesos automáticos */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-emerald-600/15 text-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Peso automático por perfil</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Ingresa las dimensiones de una barra, plancha, tubo o ángulo y el sistema calcula automáticamente el peso en kg/unidad. Sin tablas, sin calculadora aparte.</p>
            <div className="mt-4 bg-slate-800 rounded-lg p-2.5 text-xs">
              <div className="flex justify-between text-slate-300"><span>Plancha 3mm 1200×2400</span><span className="text-emerald-400 font-medium">27.1 kg</span></div>
              <div className="flex justify-between text-slate-400 mt-1"><span>Tubo rect. 100×50×3mm × 6m</span><span className="text-emerald-400 font-medium">21.2 kg</span></div>
            </div>
          </div>

          {/* m² para pintura */}
          <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-sky-600/15 text-sky-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">m² de superficie calculados</h3>
            <p className="text-slate-400 text-sm leading-relaxed">El resumen incluye los m² totales de la estructura para cotizar pintura o tratamientos superficiales. Se calcula automáticamente por geometría del perfil.</p>
            <div className="mt-4 bg-slate-800 rounded-lg p-2.5 text-xs">
              <div className="flex justify-between text-slate-300"><span>Peso total estructura</span><span className="text-white font-medium">187.6 kg</span></div>
              <div className="flex justify-between text-slate-400 mt-1"><span>Superficie estimada pintura</span><span className="text-sky-400 font-medium">14.3 m²</span></div>
            </div>
          </div>

          {/* Mapa Google */}
          <div className="bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-orange-600/15 text-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Mapa con Google Maps integrado</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Ingresa cualquier dirección chilena —hasta el pasaje y el número— y el sistema calcula los km reales de ruta. Soporte para múltiples traslados por proyecto.</p>
            <div className="mt-4 bg-slate-800 rounded-lg p-2.5 text-xs space-y-1">
              <div className="flex justify-between text-slate-300"><span>Pudahuel → Calama</span><span className="text-orange-400 font-medium">327 km</span></div>
              <div className="flex justify-between text-slate-400"><span>2 viajes · SUV 11 km/L</span><span className="text-orange-400 font-medium">$64.800</span></div>
            </div>
          </div>

          {/* IA Carlos */}
          <div className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-violet-600/15 text-violet-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Asistente IA Carlos (Pro)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">IA especializada en metalmecánica. Busca materiales, sugiere precios de mercado en Chile y los agrega directamente a tu cotización con un clic.</p>
            <div className="mt-4 bg-slate-800 rounded-lg p-2.5 text-xs italic text-slate-400">
              "Agrega 4 unidades de plancha ASTM A36 3mm con precio de mercado RM"
            </div>
          </div>

          {/* Directos vs indirectos */}
          <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-blue-600/15 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Análisis directo vs. indirecto</h3>
            <p className="text-slate-400 text-sm leading-relaxed">El resumen desglosa qué porcentaje de tu cotización son costos directos (materiales, HH) vs. indirectos (gastos generales, utilidad). Para saber exactamente cuánto ganas.</p>
            <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700 flex">
              <div className="bg-blue-500 w-[72%]" />
              <div className="bg-amber-500 w-[28%]" />
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
              <span><span className="text-blue-400">■</span> 72% Directos</span>
              <span><span className="text-amber-400">■</span> 28% Indirectos</span>
            </div>
          </div>

          {/* Ficha interna + PDF */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-amber-600/15 text-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Dos documentos PDF</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Genera la <strong className="text-slate-300">cotización para el cliente</strong> (precio final, logo, condiciones) y una <strong className="text-slate-300">ficha de costos interna</strong> con el desglose real para tu taller. Documentos separados.</p>
          </div>

          {/* HH grupos + colación */}
          <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-blue-600/15 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/25 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Mano de obra por grupos y etapas</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Organiza la HH en grupos: Fabricación, Montaje, Instalación. Agrega colación calculada automáticamente por días trabajados. Diferencia taller vs. terreno.</p>
          </div>

          {/* Modo sin materiales */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-slate-700/60 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-600/60 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Modo "sin materiales"</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Cuando el cliente trae el material, activa el modo servicio. Cotizas solo mano de obra, consumibles del taller (electrodos, discos, gases) y servicios externos.</p>
          </div>

          {/* Plantillas y catálogo */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-6 transition-colors group">
            <div className="w-11 h-11 bg-slate-700/60 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-600/60 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Plantillas y catálogo de precios</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Guarda una cotización completa como plantilla para reutilizarla. Mantén un catálogo de materiales y servicios frecuentes con sus precios actualizados.</p>
          </div>

        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="bg-slate-900/50 border-y border-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Así de simple</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: '1', title: 'Crea tu cuenta gratis', desc: 'Regístrate con email o Google. En menos de un minuto tienes tu taller listo con datos de empresa y logo.' },
              { num: '2', title: 'Ingresa el proyecto', desc: 'Agrega materiales (pesos automáticos), mano de obra, traslados con mapa y servicios. El total se calcula solo.' },
              { num: '3', title: 'Exporta y envía', desc: 'Genera el PDF con tu logo y envíalo al cliente. Guarda la ficha interna con el desglose real de costos.' },
            ].map((step, i) => (
              <div key={step.num} className="text-center relative">
                {i < 2 && <div className="hidden md:block absolute top-6 left-3/4 w-1/2 border-t border-dashed border-slate-700" />}
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
        <h2 className="text-3xl font-bold text-center text-white mb-3">Precio simple y transparente</h2>
        <p className="text-slate-400 text-center mb-12">Empieza gratis. Actualiza cuando lo necesites.</p>

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
              {[
                'Hasta 10 cotizaciones',
                'Exportar PDF profesional',
                'Cálculo de pesos y m²',
                'Mapa de traslados (Google Maps)',
                'Historial y clientes',
                'Plantillas reutilizables',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-slate-900 border-2 border-blue-500/60 rounded-2xl p-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold bg-blue-600 text-white px-4 py-1 rounded-full shadow">RECOMENDADO</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 mt-2">Pro</h3>
            <p className="text-slate-400 text-sm mb-5">Para talleres en crecimiento</p>
            <div className="mb-7">
              <span className="text-4xl font-extrabold text-white">{PRECIO_PRO}</span>
              <span className="text-slate-500 ml-2 text-sm">CLP / mes</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Cotizaciones ilimitadas',
                'Todo lo del plan gratuito',
                'Modo avanzado (embalaje, pallets)',
                'Múltiples traslados por proyecto',
                'Ficha de costos interna PDF',
                'Compartir cotizaciones con colaboradores',
                'Asistente IA Carlos (metalmecánica)',
                'Catálogos de precios ilimitados',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-200">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/30">
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
            Deja de adivinar. Empieza a calcular.
          </h2>
          <p className="text-slate-400 mb-8">
            Pesos, m², km, horas hombre y precio final. Todo en una herramienta hecha para tu taller.
          </p>
          <Link to="/register" className="inline-block bg-amber-600 hover:bg-amber-500 text-white font-semibold px-10 py-4 rounded-xl text-base transition-colors shadow-lg shadow-amber-900/40">
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
