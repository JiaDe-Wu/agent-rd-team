// Reference implementation: the API.
import { HttpError } from '../lib/http.js'
import { check, finalPrice, linePrice, quote } from '../lib/pricing.js'

const view = (ctx) => ({ ...check(ctx.state.config, ctx.data), status: ctx.state.status })

export const routes = [
  { method: 'GET', path: '/api/time', handler: (ctx) => ({ now: new Date(ctx.now()).toISOString() }) },
  {
    method: 'GET', path: '/api/campaign', handler: (ctx) => {
      const c = ctx.state.config
      return {
        campaign: { name: c.name, start: c.start, end: c.end, status: ctx.state.status, fullReduction: c.fullReduction },
        items: c.items.map((i) => {
          const p = ctx.data.products.find((x) => x.sku === i.sku)
          return { sku: i.sku, name: p.name, category: p.category, price: p.price, linePrice: linePrice(i.sku, ctx.data, c),
            final: finalPrice(p.price, i.pct), pct: i.pct, fullReduction: i.fullReduction, stock: p.stock }
        }),
      }
    },
  },
  { method: 'GET', path: '/api/campaign/check', handler: (ctx) => view(ctx) },
  {
    method: 'PUT', path: '/api/campaign/items/:sku', handler: async (ctx) => {
      const body = (await ctx.body()) || {}
      const item = ctx.state.config.items.find((i) => i.sku === ctx.params.sku)
      if (!item) throw new HttpError(404, 'not_found', 'No such item')
      if (ctx.state.status === 'live') throw new HttpError(409, 'live', 'The sale is live: it can no longer be changed')
      if ('pct' in body && !(Number.isInteger(body.pct) && body.pct >= 50 && body.pct <= 100)) throw new HttpError(400, 'invalid_pct', 'The discount must be a whole number from 50 to 100')
      if ('fullReduction' in body && typeof body.fullReduction !== 'boolean') throw new HttpError(400, 'invalid_fr', 'The spend-and-save switch must be true or false')
      if ('pct' in body) item.pct = body.pct
      if ('fullReduction' in body) item.fullReduction = body.fullReduction
      return view(ctx)
    },
  },
  {
    method: 'POST', path: '/api/campaign/launch', handler: (ctx) => {
      if (ctx.state.status === 'live') throw new HttpError(409, 'live', 'The sale is already live')
      const r = check(ctx.state.config, ctx.data)
      if (!r.canLaunch) throw new HttpError(409, 'blocked', `Cannot launch: ${r.blockers.join('; ')}`)
      ctx.state.status = 'live'
      const c = ctx.state.config
      return { campaign: { name: c.name, start: c.start, end: c.end, status: 'live', fullReduction: c.fullReduction } }
    },
  },
  {
    method: 'POST', path: '/api/cart/quote', handler: async (ctx) => {
      const body = (await ctx.body()) || {}
      const items = body.items
      if (!Array.isArray(items) || !items.length || !items.every((i) => i && typeof i.sku === 'string' && Number.isInteger(i.qty) && i.qty > 0)) {
        throw new HttpError(400, 'invalid_items', 'The cart needs items, and each quantity must be a positive whole number')
      }
      for (const i of items) if (!ctx.state.config.items.some((x) => x.sku === i.sku)) throw new HttpError(404, 'not_found', `No such item: ${i.sku}`)
      if (ctx.state.status !== 'live') throw new HttpError(409, 'not_live', 'The sale is not live yet: nothing can be ordered at the sale price')
      return quote(items, ctx.state.config, ctx.data)
    },
  },
]
