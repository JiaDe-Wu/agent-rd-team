// Frontend Engineering Standard UX-1 and Brand Standard BR-1, BR-3: brand motion (web/motion/).
import test from 'node:test'
import assert from 'node:assert/strict'
import { motion, read, RAW_COLOR } from './_lib.js'

test('UX-1: motion respects "reduce motion", and the interface is the one in the README', async () => {
  const js = read('web/motion/motion.js')
  const css = read('web/motion/motion.css')
  assert.match(js, /prefers-reduced-motion/, 'motion.js must check prefers-reduced-motion')
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/, 'motion.css must have @media (prefers-reduced-motion: reduce)')
  const m = await motion()
  for (const fn of ['prefersReduced', 'flip', 'reveal', 'bump', 'celebrate']) assert.equal(typeof m[fn], 'function', `motion.js must export ${fn}`)
})

test('BR-3: keyframes animate only transform and opacity', () => {
  const css = read('web/motion/motion.css')
  const frames = css.match(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g) || []
  assert.ok(frames.length > 0, 'motion.css has no animation yet (@keyframes)')
  for (const f of frames) {
    const props = [...f.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
    const bad = props.filter((p) => !['transform', 'opacity', 'offset', 'animation-timing-function'].includes(p))
    assert.deepEqual(bad, [], `${f.split('{')[0].trim()} animates ${bad.join(', ')} (only transform and opacity)`)
  }
})

test('BR-1: motion colours come from the brand variables and are not hard-coded', () => {
  const bad = [...read('web/motion/motion.css').split('\n'), ...read('web/motion/motion.js').split('\n')].filter((ln) => RAW_COLOR.test(ln))
  assert.deepEqual(bad, [], 'a colour is hard-coded in the motion: in CSS use var(--brand-…); on a canvas read the --brand-… variable with getComputedStyle')
})
