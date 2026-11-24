// Company store campaign template: the page shell and routing. You usually do not change it.
//   #/        the Black Friday campaign page (pages/campaign.js), for shoppers
//   #/admin   the operations back office (pages/admin.js): change discounts, see the pre-launch check, launch
import { api } from './lib/api.js'
import * as motion from './motion/motion.js'
import * as campaign from './pages/campaign.js'
import * as admin from './pages/admin.js'

const PAGES = { campaign, admin }
const root = document.getElementById('app')
const fx = document.getElementById('fx')
let cleanup = null

function current() {
  return location.hash.startsWith('#/admin') ? 'admin' : 'campaign'
}

function show() {
  if (typeof cleanup === 'function') cleanup()
  const name = current()
  for (const a of document.querySelectorAll('[data-nav]')) a.classList.toggle('is-active', a.dataset.nav === name)
  root.replaceChildren()
  cleanup = PAGES[name].mount(root, { api, motion, fx, navigate: (hash) => { location.hash = hash } })
}

window.addEventListener('hashchange', show)
show()
