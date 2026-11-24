// Company template: small HTTP helpers. No dependencies, only Node's own modules.
// A route handler throws HttpError, and app.js writes it in the one error format:
//   { "error": { "code": "<short code>", "message": "<plain English for the user>" } }

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const BODY_LIMIT = 16 * 1024 // request body limit 16KB; over it returns 413

export function sendJson(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  })
  res.end(text)
}

// Read a JSON request body: over the limit throws 413, invalid JSON throws 400.
export function readJson(req, limit = BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new HttpError(413, 'body_too_large', 'The request is too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (!text.trim()) return resolve(undefined)
      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new HttpError(400, 'invalid_json', 'The request is not valid JSON'))
      }
    })
    req.on('error', reject)
  })
}

// A path in the route table can take parameters: '/api/products/:id'. A match returns { route, params }.
export function matchRoute(routes, method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue
    const want = route.path.split('/')
    const got = pathname.split('/')
    if (want.length !== got.length) continue
    const params = {}
    let ok = true
    for (let i = 0; i < want.length; i++) {
      if (want[i].startsWith(':')) {
        try {
          params[want[i].slice(1)] = decodeURIComponent(got[i])
        } catch {
          ok = false
          break
        }
      } else if (want[i] !== got[i]) {
        ok = false
        break
      }
    }
    if (ok) return { route, params }
  }
  return null
}
