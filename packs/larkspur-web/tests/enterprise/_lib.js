// What the company's checks share: starting a fresh server, calling the API, loading a page module, reading source. Do not change this file.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(HERE, '..', '..')

// Every case starts its own server (state lives in the server process, so cases do not affect each other) and calls close() at the end
export async function startServer() {
  const { createApp } = await import(pathToFileURL(path.join(ROOT, 'server', 'app.js')).href)
  const srv = createApp()
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve))
  srv.unref() // a server nobody close()d (an assertion failed before close) must not keep the test process alive
  const base = `http://127.0.0.1:${srv.address().port}`
  const req = async (method, p, body) => {
    const res = await fetch(base + p, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* not JSON */ }
    return { status: res.status, json, text, type: res.headers.get('content-type') || '' }
  }
  return {
    get: (p) => req('GET', p),
    post: (p, body = {}) => req('POST', p, body),
    put: (p, body = {}) => req('PUT', p, body),
    del: (p) => req('DELETE', p),
    close: () => new Promise((resolve) => srv.close(resolve)),
  }
}

// The API route table (`routes` exported by server/routes/index.js)
export async function routes() {
  const file = path.join(ROOT, 'server', 'routes', 'index.js')
  if (!fs.existsSync(file)) return []
  return (await import(pathToFileURL(file).href)).routes || []
}

// The registered pages: [{ name, title, module }]
export async function pages() {
  const file = path.join(ROOT, 'web', 'pages', 'index.js')
  if (!fs.existsSync(file)) return []
  const { pages: list } = await import(pathToFileURL(file).href)
  const out = []
  for (const [name, p] of Object.entries(list || {})) {
    out.push({ name, title: p.title, module: await import(pathToFileURL(path.join(ROOT, 'web', 'pages', `${name}.js`)).href) })
  }
  return out
}

export const read = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), 'utf8') : '')

export function files(rel, exts) {
  const out = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (exts.some((x) => ent.name.endsWith(x))) out.push({ file: path.relative(ROOT, p), text: fs.readFileSync(p, 'utf8') })
    }
  }
  walk(path.join(ROOT, rel))
  return out
}

// A colour value written into a style: #fff, #7c3aed, rgb(…), rgba(…), hsl(…) (Brand Standard: colours only from the variables in tokens.css)
export const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(\s*\d/
// A full US phone number: 415-555-0134, (415) 555-0134, 415.555.0134, +1 415 555 0134 (a masked ***-***-0134 does not count)
export const FULL_PHONE = /(?<![\d*])(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}(?!\d)/
