import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { apiBase } from '../../utils/apiBase.js'

// Mensaje inicial estático — no consume API, aparece instantáneo al abrir
const MENSAJE_BIENVENIDA = {
  role: 'assistant',
  content: `Buenos días. Soy Carlos, especialista en cotizaciones metalmecánicas con más de 25 años de experiencia en la industria chilena.

Antes de revisar los números de su cotización, necesito entender el proyecto. Por favor, descríbame brevemente:

• ¿Qué está fabricando o construyendo? (tipo de estructura, pieza o maquinaria)
• Material principal que contempla usar
• Dimensiones aproximadas y cantidad de unidades
• Uso final del producto

Con esa descripción, junto con lo que ya tiene ingresado en la cotización, podré darle un análisis preciso sobre materiales, mano de obra, servicios y precios de mercado.

Si aún no tiene nada ingresado, no se preocupe — con la descripción del proyecto puedo ayudarle a definir la estructura de costos completa.`,
}

// Sugerencias que aparecen DESPUÉS de que el usuario ya dio el contexto
const SUGERENCIAS_SEGUIMIENTO = [
  '¿Qué ítems me faltarían agregar?',
  '¿Los precios están acorde al mercado?',
  '¿El margen de utilidad es adecuado?',
  '¿Qué servicios debería considerar?',
]

export default function MecanicoIA({ contexto, isPro }) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([MENSAJE_BIENVENIDA])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Focus en input al abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const next = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch(`${apiBase}/api/chat-mecanico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos el historial completo (incluye el mensaje de bienvenida como contexto de Carlos)
        body: JSON.stringify({ messages: next, contexto }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Error al conectar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Reiniciar al mensaje de bienvenida
  const clearChat = () => {
    setMessages([MENSAJE_BIENVENIDA])
    setError('')
  }

  // Mostrar sugerencias de seguimiento solo después del primer intercambio real
  // messages: [bienvenida, user, carlos, ...] → length >= 3
  const showFollowUp = messages.length >= 3 && !loading

  // Placeholder dinámico
  const placeholder = messages.length === 1
    ? 'Describa el proyecto aquí...'
    : 'Consulte a Carlos...'

  return (
    <>
      {/* ── Panel ── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 w-96 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          style={{ maxHeight: 'min(72vh, 580px)' }}
        >
          {/* Cabecera */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-700 flex-shrink-0">
            <div className="w-9 h-9 bg-amber-800 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-100 font-semibold text-sm leading-tight">Carlos</p>
              <p className="text-stone-500 text-xs">Especialista en cotizaciones metalmecánicas</p>
            </div>
            <div className="flex items-center gap-1">
              {isPro && messages.length > 1 && (
                <button
                  onClick={clearChat}
                  className="text-stone-600 hover:text-stone-400 transition-colors p-1.5 rounded"
                  title="Nueva consulta"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-stone-300 transition-colors p-1.5 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Upsell para Free */}
          {!isPro ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm mb-1">Función exclusiva del plan Pro</p>
              <p className="text-stone-400 text-xs mb-5 leading-relaxed">
                Consulta con Carlos, nuestro especialista IA en cotizaciones metalmecánicas. Analiza materiales, mano de obra y precios de mercado en tiempo real.
              </p>
              <NavLink
                to="/planes"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ver planes
              </NavLink>
            </div>
          ) : (
            <>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 bg-amber-800 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5 select-none">
                        C
                      </div>
                    )}
                    <div
                      className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-amber-600 text-white rounded-br-sm'
                          : 'bg-stone-800 text-stone-200 rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 bg-amber-800 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none">
                      C
                    </div>
                    <div className="bg-stone-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-xs text-center py-1">{error}</p>
                )}
                <div ref={endRef} />
              </div>

              {showFollowUp && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-stone-800 pt-2.5">
                  {SUGERENCIAS_SEGUIMIENTO.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 hover:border-amber-600/40 rounded-full px-3 py-1.5 transition-colors text-left leading-tight"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 pb-3 pt-2.5 flex gap-2 flex-shrink-0 border-t border-stone-800">
                <input
                  ref={inputRef}
                  type="text"
                  className="input-field flex-1 text-sm py-2"
                  placeholder={placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white p-2 rounded-lg transition-colors flex-shrink-0"
                  title="Enviar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Botón flotante ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Cerrar' : 'Consultar con Carlos (Asesor IA)'}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 select-none ${
          open
            ? 'bg-stone-700 hover:bg-stone-600 text-stone-300'
            : 'bg-amber-700 hover:bg-amber-800 text-white'
        }`}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="flex flex-col items-center leading-none">
            <span className="font-bold text-lg">C</span>
            <span className="text-[9px] font-medium opacity-90 -mt-0.5">IA</span>
          </div>
        )}
      </button>
    </>
  )
}
