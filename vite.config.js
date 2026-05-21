import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const CLAUDE_PROMPT = (query) =>
  `Eres un experto en materiales metalmecánicos en Chile. El usuario busca: "${query}".
Proporciona exactamente 3 opciones de este material disponibles en el mercado chileno.
Responde SOLO con un JSON array con esta estructura exacta (sin markdown, sin texto adicional):
[
  {
    "nombre": "nombre técnico del material",
    "proveedor": "empresa distribuidora real en Chile",
    "formato": "formato de venta (ej: Barra 6m, Plancha 2000x1000mm, Kg)",
    "precio_unitario": 12000,
    "unidad": "unidad de medida (ej: unidad, kg, metro)"
  }
]
Los precios deben ser en pesos chilenos (CLP) con valores realistas del mercado actual.`

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
                  },
                  body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: CLAUDE_PROMPT(query) }],
                  }),
                })
                const data = await response.json()
                if (data.error) throw new Error(data.error.message)
                const text = data.content?.[0]?.text || ''
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
