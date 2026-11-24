// Company web template: reads the data files (JSON) under server/data/. The data comes from the knowledge base; this only reads and never changes it.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = fileURLToPath(new URL('../data/', import.meta.url))

// { <file name>: contents }: server/data/employees.json is read as data.employees; with no data files it is {}
export function loadData() {
  if (!existsSync(DIR)) return {}
  const out = {}
  for (const name of readdirSync(DIR)) {
    if (name.endsWith('.json')) out[name.slice(0, -5)] = JSON.parse(readFileSync(DIR + name, 'utf8'))
  }
  return out
}
