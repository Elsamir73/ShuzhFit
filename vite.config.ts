import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { ApiRequest, ApiResponse } from './server/lib/http.js'
import { dispatchApiRequest } from './server/router.js'

function localApi(): import('vite').Plugin {
  return {
    name: 'shuzhfit-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          const rawBody = Buffer.concat(chunks).toString('utf8')
          const headers = Object.fromEntries(
            Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value]),
          )
          const apiReq = Object.assign(req, {
            headers,
            url: `/api${req.url ?? '/'}`,
            body: rawBody && headers['content-type']?.startsWith('application/json') ? JSON.parse(rawBody) : undefined,
          })
          const apiRes = res as typeof res & ApiResponse
          apiRes.status = (code) => { res.statusCode = code; return apiRes }
          apiRes.json = (body) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(body))
            return apiRes
          }
          await dispatchApiRequest(apiReq as unknown as ApiRequest, apiRes as unknown as ApiResponse)
          if (!res.writableEnded) res.end()
        } catch (error) {
          if (!res.writableEnded) {
            res.statusCode = error instanceof SyntaxError ? 400 : 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: { message: error instanceof SyntaxError ? 'Invalid JSON request body.' : 'Local API request failed.' } }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['DATABASE_URL', 'JWT_SECRET'] as const) {
    if (!process.env[key] && env[key]) process.env[key] = env[key]
  }
  return {
    plugins: [react(), localApi()],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'router-vendor', test: /node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/, priority: 20 },
              { name: 'shared-vendor', test: /node_modules[\\/]/, minShareCount: 2, minSize: 20000, priority: 5 },
            ],
          },
        },
      },
    },
  }
})
