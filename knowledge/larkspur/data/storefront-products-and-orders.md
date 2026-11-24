---
title: Official store products and orders (data)
tags: [data, store, products, orders, price adjustment, Black Friday, margin, category, reporting]
---

# Official store products and orders

The 20 items in Black Friday to Cyber Monday, and the last 60 days of orders for them (2026-09-28 to 2026-11-26; the data ends on Nov 26).

**The full data is two JSON files.** When you write code, copy them into the project; do not retype or change them:

- `~/workplace/knowledge/larkspur/data/mall-products.json`: the items, one per entry. Fields: `sku`, `name`, `category`, `price` regular price (dollars), `cost` (dollars), `stock`, `priceProtect` whether the item has the 14-day price-adjustment guarantee.
- `~/workplace/knowledge/larkspur/data/mall-orders.json`: the orders, one per entry. Fields: `id` order number, `sku`, `paid` price paid per item (dollars), `qty`, `date` order date (Eastern Time), `status` Completed or Returned.

A few items:

| sku | Name | Category | Regular price | Cost | 14-day guarantee |
|---|---|---|---|---|---|
| TENT4 | Ridgeline 4-Person Tent | Tents | 599 | 410 | Yes |
| BAG20 | Alpine 20F Down Sleeping Bag | Sleeping Bags | 349 | 240 | Yes |
| JACKET | Glacier Down Jacket | Apparel | 399 | 260 | Yes |
| GPS | Orbit GPS Watch | Electronics | 449 | 348 | No |

How the reference price is taken is in the Pricing and Promotion Compliance Standard PRC-1; how the guarantee is worked out is in the Price-Adjustment Guarantee Rules PP-1.

## Working out margin from this data (Finance's definition)

When you build a margin report or dashboard, use the definition below so every department's numbers agree (set by Finance, 2026-10-13). It looks at what has already sold; the margin floor for sale pricing is in the Margin and Pricing Rules MGN-2.

| Topic | Definition |
|---|---|
| Margin rate | (revenue − cost) ÷ revenue, as a percent with one decimal place. Revenue = `paid` × `qty`; cost = `cost` × `qty` |
| Which orders | Only `status` Completed; Returned orders are not counted |
| "The last 30 days" | 30 days back from the last day of the data, counting that day. This data ends on Nov 26, so Oct 28 to Nov 26. The page states the start and end dates |
| Category margin | Weighted by revenue: the category's total margin ÷ the category's total revenue; never an average of item margin rates |
| Below 108% of cost | Compare the item's weighted average price in the window (revenue ÷ units) with cost × 108%, the same line as MGN-2 |
| Spend-and-save | Orders carry no spend-and-save information, so use the price paid, and note "spend-and-save not included" on the page |
| Who can see it | Margin reports and dashboards are internal to Finance: deploy them on the internal network only, for Finance and management |
