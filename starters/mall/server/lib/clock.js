// Company store campaign template: server time. Everything that needs "what time is it" takes it from here (Pricing and Promotion Compliance Standard PRC-4: server time rules).
//
// The demo convention: the environment variable DEMO_NOW (or `now` in server/config/clock.json) gives a moment. When the
// server starts it sets "now" to that moment and then runs on in real time; with neither it is the real time. So a demo on any day sees the sale running.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FILE = fileURLToPath(new URL('../config/clock.json', import.meta.url))
const boot = Date.now()
const configured = process.env.DEMO_NOW || (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')).now : '')
const start = configured ? Date.parse(configured) : NaN

// Now (milliseconds)
export function now() {
  return Number.isFinite(start) ? start + (Date.now() - boot) : Date.now()
}
