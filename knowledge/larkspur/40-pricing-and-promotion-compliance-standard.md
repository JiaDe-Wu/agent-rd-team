---
title: Pricing and Promotion Compliance Standard (Larkspur Outfitters)
tags: [standard, pricing, promotion, compliance, reference price, spend and save, Black Friday, store]
---

# Pricing and Promotion Compliance Standard

Written by Legal and the Pricing Compliance group. Applies to every promotion in the official store. Rule IDs are PRC-n; code and tests cite the IDs.

This is Larkspur's internal standard, written with the FTC's Guides Against Deceptive Pricing (16 CFR Part 233) in mind. The text of the law governs.

| ID | Rule | Why | Example |
|---|---|---|---|
| PRC-1 | The **reference price** (the struck-through "was" price) is always **the lowest price this item sold for in the 7 days before the sale starts** (the 7 days ending the day before the start, both ends included; completed orders only). The system calculates it; Operations cannot type it in. With no sale in those 7 days it is the regular price. | Comparing with an inflated "was" price is the textbook deceptive-pricing case | The down sleeping bag's regular price is $349, but it sold at $299 on Nov 23: the reference price is $299. A reference price of $349 is not allowed |
| PRC-2 | Every reference price on a page says what it is: "Lowest price in the 7 days before the sale". A struck-through number alone is not enough. | Shoppers should know what they are being compared with | Passes: ~~$299~~ "Lowest price in the 7 days before the sale". Fails: ~~$299~~ on its own |
| PRC-3 | Spend-and-save rules are written in full: the threshold and the amount ("$30 off every $300"), whether it stacks with discounts, whether it stacks with coupons. Never just "huge savings" or "lowest prices anywhere". | An unclear condition is also misleading | Passes: "$30 off every $300. Stacks with discounts. Does not stack with coupons." Fails: "Unbeatable savings!" |
| PRC-4 | Sale times come from **server time**. Countdowns run on the time the server gives, not the shopper's computer clock. Before the sale starts or after it ends nothing can be sold at the sale price. | "Limited time" has to be true | A cart quote before the sale is live returns `409 not_live` |
| PRC-5 | A sale goes through the **pre-launch check** before it goes live: the reference price, the final price, the margin floor (Margin and Pricing Rules) and the price-adjustment payouts (Price-Adjustment Guarantee Rules) are calculated and shown to a person; a sale that does not pass cannot launch. | Once live, the prices are a promise to every shopper | A sale with an item below the margin floor gets `409 blocked` and the reasons |

The campaign plan states the exact dates this sale uses.
