// The price engine: backend developers implement it from the README, "Price engine", and the knowledge base's Pricing and Promotion Compliance Standard, Margin and Pricing Rules and Price-Adjustment Guarantee Rules.
// The company checks call the functions exported here directly; the names, parameters and return shapes are as the README says: do not change them. Here they are placeholders.

// MGN-1 final price
export function finalPrice(price, pct) {
  throw new Error('The price engine is not implemented yet: finalPrice')
}

// PRC-1 reference price (the struck-through price)
export function linePrice(sku, data, config) {
  throw new Error('The price engine is not implemented yet: linePrice')
}

// PRC-5 pre-launch check
export function check(config, data) {
  throw new Error('The price engine is not implemented yet: check')
}

// cart quote (spend and save)
export function quote(items, config, data) {
  throw new Error('The price engine is not implemented yet: quote')
}
