// Company store campaign template: building HTML and formatting.
//   html`<p>${name}</p>`  values put in are escaped automatically (an array is joined item by item; a nested html`` is not escaped again)
//   raw(s)                an HTML fragment known to be safe (only for the template's own constants)

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c])

class Safe {
  constructor(s) {
    this.s = s
  }
  toString() {
    return this.s
  }
}
export const raw = (s) => new Safe(String(s))

function part(v) {
  if (v instanceof Safe) return v.s
  if (Array.isArray(v)) return v.map(part).join('')
  if (v === false || v === null || v === undefined) return ''
  return escape(v)
}

export function html(strings, ...values) {
  let out = strings[0]
  values.forEach((v, i) => {
    out += part(v) + strings[i + 1]
  })
  return new Safe(out)
}

// 4319 → $4,319 (dollars, rounded to the dollar)
export const usd = (n) => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`

// 85 → 15% off, 80 → 20% off, 100 → No discount
export const pctOff = (pct) => (pct >= 100 ? 'No discount' : `${100 - pct}% off`)

// milliseconds → { d, h, m, s } (for a countdown; a negative number counts as 0)
export function parts(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 }
}
