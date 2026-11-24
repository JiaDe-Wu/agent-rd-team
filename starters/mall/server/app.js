// Company store campaign template: the server skeleton. It serves the API (/api/*) and the web pages (static files under web/).
// The route table is in routes/index.js; you usually do not change this file.

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError, matchRoute, readJson, sendJson } from './lib/http.js'
import { loadData, loadConfig } from "./lib/data.js"
import { now } from "./lib/clock.js"
import { routes } from './routes/index.js'

const WEB = fileURLToPath(new URL('../web/', import.meta.url))
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
}
// The company security baseline: every response carries these headers (scripts only from this site, no inline scripts)
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
}

// data, config and clock can be passed in (the company checks do); without them it reads server/data/, server/config/ and the server time
export function createApp({ data = loadData(), config = loadConfig(), clock = now } = {}) {
  // The campaign configuration (a copy; the back office changes this one) and status of this server process; a restart goes back to server/config/campaign.json
  const state = { config: config ? structuredClone(config) : null, status: 'draft' }
  return createServer(async (req, res) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v)
    const url = new URL(req.url, 'http://localhost')
    try {
      if (url.pathname.startsWith("/api/")) return await api(req, res, url, data, state, clock)
      return await staticFile(req, res, url)
    } catch (err) {
      if (err instanceof HttpError) return sendJson(res, err.status, { error: { code: err.code, message: err.message } })
      console.error(err)
      return sendJson(res, 500, { error: { code: 'internal', message: 'Something went wrong on our side. Please try again later.' } })
    }
  })
}

async function api(req, res, url, data, state, clock) {
  const hit = matchRoute(routes, req.method, url.pathname)
  if (!hit) throw new HttpError(404, 'not_found', 'No such endpoint')
  let body
  const ctx = {
    req,
    res,
    data,
    state,
    now: clock,
    params: hit.params,
    query: url.searchParams,
    // Read the request body when you need it: await ctx.body()
    body: async () => (body === undefined ? (body = await readJson(req)) : body),
    send: (status, data) => sendJson(res, status, data),
  }
  const out = await hit.route.handler(ctx)
  if (res.writableEnded) return
  if (out === undefined) {
    res.writeHead(204)
    res.end()
  } else sendJson(res, 200, out)
}

async function staticFile(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'method_not_allowed', 'This method is not supported')
  let rel
  try {
    rel = decodeURIComponent(url.pathname)
  } catch {
    throw new HttpError(404, 'not_found', 'Page not found')
  }
  if (rel === '/' || rel === '') rel = '/index.html'
  const file = normalize(WEB + rel)
  if (!file.startsWith(WEB) || file.includes(`${sep}..${sep}`)) throw new HttpError(404, 'not_found', 'Page not found')
  let data
  try {
    data = await readFile(file)
  } catch {
    throw new HttpError(404, 'not_found', 'Page not found')
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  res.end(req.method === 'HEAD' ? undefined : data)
}
