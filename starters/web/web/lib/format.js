// Company web template: building HTML and formatting.
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

// 2026-10-11T12:30:05.000Z → 12:30:05 (local time)
export const clock = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour12: false })
