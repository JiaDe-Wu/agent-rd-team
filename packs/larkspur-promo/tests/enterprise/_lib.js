// What the company's checks share: a copy of the knowledge-base data, the reference algorithm written from the knowledge-base rules, starting a fresh server, loading a page module, reading source. Do not change this file.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(HERE, '..', '..')
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
export const CANON = {
  products: json(path.join(HERE, 'data', 'products.json')),
  orders: json(path.join(HERE, 'data', 'orders.json')),
  campaign: json(path.join(HERE, 'data', 'campaign.json')),
}
const BY = new Map(CANON.products.map((p) => [p.sku, p]))
export const LIMIT = 20000
export const SERVER_NOW = '2026-11-27T20:00:00-05:00' // the sale's first evening, US Eastern Time

// The campaign configuration in the project now (if the person at the gate changed it, the changed one)
export function currentConfig() {
  const file = path.join(ROOT, 'server', 'config', 'campaign.json')
  if (!fs.existsSync(file)) throw new Error('There is no campaign configuration yet: server/config/campaign.json (copy it from the knowledge base, "Black Friday to Cyber Monday campaign plan")')
  return json(file)
}
export const withPct = (config, pcts) => ({ ...config, items: config.items.map((i) => (i.sku in pcts ? { ...i, pct: pcts[i.sku] } : i)) })

// ---- The reference algorithm: from the knowledge base's Pricing and Promotion Compliance Standard, Margin and Pricing Rules and Price-Adjustment Guarantee Rules ----

// The date (US Eastern Time, YYYY-MM-DD) n days before the day the sale starts
export function dayBefore(startIso, n) {
  const et = new Date(Date.parse(startIso) - 5 * 3600 * 1000)
  return new Date(Date.UTC(et.getUTCFullYear(), et.getUTCMonth(), et.getUTCDate()) - n * 86400000).toISOString().slice(0, 10)
}
const done = (o, from, to) => o.status === 'Completed' && o.date >= from && o.date <= to

export const refFinal = (price, pct) => Math.floor((price * pct + 50) / 100) // MGN-1, rounded to the dollar
export function refLine(sku, config) { // PRC-1
  const from = dayBefore(config.start, 7), to = dayBefore(config.start, 1)
  const seen = CANON.orders.filter((o) => o.sku === sku && done(o, from, to)).map((o) => o.paid)
  return seen.length ? Math.min(...seen) : BY.get(sku).price
}
export function refCheck(config) { // PRC-5
  const marginFrom = dayBefore(config.start, 30), payFrom = dayBefore(config.start, 14), to = dayBefore(config.start, 1)
  const items = config.items.map((i) => {
    const p = BY.get(i.sku)
    const final = refFinal(p.price, i.pct)
    const lowest = i.fullReduction ? Math.floor((final * 9 + 5) / 10) : final
    return { sku: i.sku, name: p.name, price: p.price, cost: p.cost, pct: i.pct, final, linePrice: refLine(i.sku, config),
      linePriceInput: i.linePriceInput, fullReduction: i.fullReduction, lowest, floor: p.cost * 1.08, marginOk: lowest * 100 >= p.cost * 108 }
  })
  const fin = new Map(items.map((i) => [i.sku, i.final]))
  const bySku = items.map((i) => ({ sku: i.sku, name: i.name, orders: 0, amount: 0 }))
  const at = new Map(bySku.map((s) => [s.sku, s]))
  const units = new Map()
  for (const o of CANON.orders) {
    if (!fin.has(o.sku)) continue
    if (done(o, marginFrom, to)) units.set(o.sku, (units.get(o.sku) || 0) + o.qty)
    if (done(o, payFrom, to) && BY.get(o.sku).priceProtect && o.paid > fin.get(o.sku)) { // PP-1
      const s = at.get(o.sku)
      s.orders += 1
      s.amount += (o.paid - fin.get(o.sku)) * o.qty
    }
  }
  const amount = bySku.reduce((n, s) => n + s.amount, 0)
  const orders = bySku.reduce((n, s) => n + s.orders, 0)
  const rate = (price) => { // MGN-3
    let gain = 0, sales = 0
    for (const i of items) {
      const u = units.get(i.sku) || 0
      gain += (price(i) - i.cost) * u
      sales += price(i) * u
    }
    return Math.round((gain / sales) * 1000) / 10
  }
  const low = items.filter((i) => !i.marginOk)
  return {
    items, priceProtect: { orders, amount, limit: LIMIT, needsCfo: amount > LIMIT, bySku },
    margin: { usual: rate((i) => i.price), campaign: rate((i) => i.final) },
    low: low.map((i) => i.sku), blockers: low.length + (amount > LIMIT ? 1 : 0),
  }
}

// ---- Calling the project's code ----

export const pricing = () => import(pathToFileURL(path.join(ROOT, 'server', 'lib', 'pricing.js')).href)
export const page = (name) => import(pathToFileURL(path.join(ROOT, 'web', 'pages', `${name}.js`)).href)
export const motion = () => import(pathToFileURL(path.join(ROOT, 'web', 'motion', 'motion.js')).href)
export const read = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), 'utf8') : '')

// Every case starts its own server (the campaign configuration and status live in the server process, so cases do not affect each other) and calls close() at the end. Without `config` it uses the project's
export async function startServer({ config } = {}) {
  const { createApp } = await import(pathToFileURL(path.join(ROOT, 'server', 'app.js')).href)
  const srv = createApp(config ? { config: structuredClone(config), clock: () => Date.parse(SERVER_NOW) } : { clock: () => Date.parse(SERVER_NOW) })
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
    let data = null
    try { data = JSON.parse(text) } catch { /* not JSON */ }
    return { status: res.status, json: data, text }
  }
  return {
    get: (p) => req('GET', p),
    post: (p, body = {}) => req('POST', p, body),
    put: (p, body = {}) => req('PUT', p, body),
    close: () => new Promise((resolve) => srv.close(resolve)),
  }
}

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

// A colour value written into a style (Brand Standard: colours only from the variables in tokens.css)
export const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(\s*\d/
// In a piece of HTML: the part from each data-sku to the next data-sku
export function bySku(html) {
  const out = new Map()
  const marks = [...html.matchAll(/data-sku="([^"]+)"/g)]
  marks.forEach((m, i) => { if (!out.has(m[1])) out.set(m[1], html.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : html.length)) })
  return out
}
// The number in an element ($4,319 → 4319)
export const num = (s) => Number(String(s).replace(/[^\d.-]/g, ''))
export const textOf = (seg, attr) => (seg.match(new RegExp(`${attr}[^>]*>([^<]*)`)) || [])[1] ?? null
