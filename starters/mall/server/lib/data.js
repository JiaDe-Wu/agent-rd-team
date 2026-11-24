// Company store campaign template: reads the data and the campaign configuration. The data comes from the knowledge base into server/data/, the configuration goes in server/config/; this only reads.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DATA = fileURLToPath(new URL('../data/', import.meta.url))
const CONFIG = fileURLToPath(new URL('../config/', import.meta.url))

function read(dir, name, empty) {
  const file = dir + name
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : empty
}

// { products: [...], orders: [...] }: the fields are in the README, "Data"
export function loadData() {
  return { products: read(DATA, 'products.json', []), orders: read(DATA, 'orders.json', []) }
}

// The campaign configuration (server/config/campaign.json): the plan Operations submitted; the fields are in the README, "Campaign configuration". null when there is none yet
export function loadConfig() {
  return read(CONFIG, 'campaign.json', null)
}
