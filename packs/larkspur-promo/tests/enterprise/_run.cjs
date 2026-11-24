// Runs every check under tests/, the files the kirocrew-team test wall recognises. Works on Node 18 to 24
// (from Node 22, `node --test tests/` no longer takes a directory).
//
//   node tests/enterprise/_run.cjs            all of them
//   node tests/enterprise/_run.cjs android    only paths containing "android"
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const TESTS = path.resolve(__dirname, '..')
const ROOT = path.dirname(TESTS)
const TEST_FILE = /(\.test|[-_]test)\.[cm]?js$|^test([-_].*)?\.[cm]?js$/

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((ent) => {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) return ent.name.startsWith('.') || ent.name === 'node_modules' ? [] : files(p)
    return ent.isFile() && TEST_FILE.test(ent.name) ? [p] : []
  })
}

const only = process.argv.slice(2)
const list = files(TESTS)
  .map((f) => path.relative(ROOT, f))
  .filter((f) => !only.length || only.some((s) => f.includes(s)))
  .sort()
if (!list.length) {
  console.error('No check files found')
  process.exit(1)
}
// At most 30 seconds per case; exit when done instead of waiting for a server or timer nobody closed (Node 22 and later)
const [major] = process.versions.node.split('.').map(Number)
const extra = major >= 22 ? ['--test-force-exit', '--test-timeout=30000'] : []
const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...extra, ...list], { cwd: ROOT, stdio: 'inherit' })
process.exit(r.status === null ? 1 : r.status)
