import { useState, useRef, useEffect } from 'react'

const SUGERENCIAS = [
  '¿Están bien los precios de esta cotización?',
  '¿Qué materiales o ítems podría faltarme?',
  '¿Es rentable esta cotización?',
  '¿El margen de ganancia es razonable?',
]

export default function MecanicoIA({ contexto }) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      if (messages.length === 0) inputRef.current?.focus()
    }
  }, [messages, open])

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const next = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/chat-mecanico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, contexto }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError('Error al conectar con Carlos. Intenta de nuevo.')
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

  const clearChat = () => {
    setMessages([])
    setError('')
  }

  return (
    <>
      {/* ── Panel de chat ── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 w-96 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          style={{ maxHeight: 'min(70vh, 560px)' }}
        >
          {/* Cabecera */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-700 flex-shrink-0">
            <div className="w-9 h-9 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-100 font-semibold text-sm leading-tight">Carlos</p>
              <p className="text-stone-500 text-xs">Mecánico experto · 25 años de experiencia</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-stone-600 hover:text-stone-400 transition-colors p-1 rounded"
                  title="Nueva conversación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-stone-300 transition-colors p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 select-none">
                  C
                </div>
                <p className="text-stone-200 text-sm font-semibold">Hola, soy Carlos</p>
                <p className="text-stone-500 text-xs mt-1.5 leading-relaxed max-w-64 mx-auto">
                  Te doy mi opinión sobre tu cotización: precios, rentabilidad, lo que te falta. Pregúntame lo que quieras.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5 select-none">
                      C
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-amber-600 text-white rounded-br-sm'
                        : 'bg-stone-800 text-stone-200 rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none">
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

          {/* Sugerencias rápidas */}
          {messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGERENCIAS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="text-xs bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-300 border border-stone-700 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-colors text-left leading-tight"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 flex gap-2 flex-shrink-0 border-t border-stone-800">
            <input
              ref={inputRef}
              type="text"
              className="input-field flex-1 text-sm py-2"
              placeholder="Pregúntale a Carlos..."
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
        </div>
      )}

      {/* ── Botón flotante ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Cerrar chat' : 'Consultar con Carlos (IA Mecánico)'}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 select-none ${
          open
            ? 'bg-stone-700 hover:bg-stone-600 text-stone-300'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
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
