import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const CLAUDE_PROMPT = (query) =>
  `Eres un experto en materiales metalmecánicos en Chile. El usuario busca: "${query}".

Usa la herramienta de búsqueda web para encontrar precios REALES en páginas de proveedores chilenos como CINTAC, Fester, Dimetal, Aceros AZA, Brasimet, Acma, Metalcon, Tupac Amaru, Solmet, INACESA, Maplast, u otros distribuidores reales.

Busca el precio actual de este material navegando páginas web reales. Retorna exactamente 3 opciones encontradas con sus URLs reales.

Responde SOLO con un JSON array (sin markdown, sin texto adicional):
[
  {
    "nombre": "nombre técnico exacto del material",
    "proveedor": "nombre del proveedor",
    "formato": "formato de venta (ej: Barra 6m, Plancha 2000x1000mm, Kg)",
    "precio_unitario": 12000,
    "unidad": "unidad de medida (ej: unidad, kg, metro)",
    "url": "URL exacta de la página del producto o lista de precios donde encontraste este precio"
  }
]

Los precios deben ser en pesos chilenos (CLP). La URL debe ser la página real del producto, no Google.`

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    build: {
      rollupOptions: {
        output: {
    manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react-vendor'
            if (id.includes('node_modules/firebase')) return 'firebase-vendor'
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'anthropic-search-api',
        configureServer(server) {
          server.middlewares.use('/api/search-material', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', (chunk) => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { query } = JSON.parse(body)
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'anthropic-beta': 'web-search-2025-03-05',
                  },
                  body: JSON.stringify({
                    model: 'claude-sonnet-4-6',
                    max_tokens: 4096,
                    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
                    messages: [{ role: 'user', content: CLAUDE_PROMPT(query) }],
                  }),
                })
                const data = await response.json()
                if (data.error) throw new Error(data.error.message)
                // Con web search el contenido tiene múltiples bloques; tomamos el último texto
                const textBlocks = (data.content || []).filter(b => b.type === 'text')
                const text = textBlocks[textBlocks.length - 1]?.text || ''
                const match = text.match(/\[[\s\S]*\]/)
                if (!match) throw new Error('Respuesta inesperada del modelo')
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ results: JSON.parse(match[0]) }))
              } catch (err) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})
