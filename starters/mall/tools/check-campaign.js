// The pre-launch check (comes with the template): runs the price engine's check() on server/config/campaign.json and server/data/ and prints the result in plain English.
//
//   npm run check-campaign            the verdict and the reasons
//   npm run check-campaign -- --json  the result of check() as it is
//
// Compliance review, the deploy engineer and the head of Operations all use it to see whether the sale can launch. It fails while the price engine (server/lib/pricing.js) is not implemented.
import { loadData, loadConfig } from '../server/lib/data.js'
import { check } from '../server/lib/pricing.js'

const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const config = loadConfig()
if (!config) {
  console.error('There is no campaign configuration yet: server/config/campaign.json')
  process.exit(1)
}
const r = check(config, loadData())
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(r, null, 2))
  process.exit(0)
}
const adjusted = r.items.filter((i) => i.linePrice !== i.linePriceInput)
const low = r.items.filter((i) => !i.marginOk)
const pp = r.priceProtect
console.log(`${r.campaign.name} · Pre-launch check (from server/config/campaign.json)`)
console.log(`  Items: ${r.items.length}`)
console.log(`  Reference price: ${adjusted.length ? `${adjusted.length} items set to the lowest price in the 7 days before the sale (PRC-1): ` + adjusted.map((i) => `${i.name} ${usd(i.linePriceInput)}→${usd(i.linePrice)}`).join('; ') : 'all equal to what Operations typed'}`)
console.log(`  Margin floor (MGN-2): ${low.length ? `${low.length} items below the floor: ` + low.map((i) => `${i.name} (lowest price ${usd(i.lowest)}, floor ${usd(i.floor)})`).join('; ') : 'all meet it'}`)
console.log(`  Price-adjustment payouts (PP-2): ${pp.orders} orders, ${usd(pp.amount)} in total${pp.needsCfo ? `, over ${usd(pp.limit)}: CFO approval needed` : `, within ${usd(pp.limit)}`}`)
for (const s of pp.bySku.filter((x) => x.amount > 0)) console.log(`    ${s.name}: ${s.orders} orders ${usd(s.amount)}`)
console.log(`  Expected margin rate (MGN-3): regular ${r.margin.usual}% → sale ${r.margin.campaign}%`)
console.log(r.canLaunch ? '  Verdict: can launch' : `  Verdict: cannot launch (${r.blockers.length} reasons)\n` + r.blockers.map((b) => `    - ${b}`).join('\n'))
