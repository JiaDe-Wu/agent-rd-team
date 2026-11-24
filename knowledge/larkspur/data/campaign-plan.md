---
title: Black Friday to Cyber Monday campaign plan (submitted by Operations; data)
tags: [data, Black Friday, Cyber Monday, promotion, campaign plan, discount, spend and save, store]
---

# Black Friday to Cyber Monday campaign plan (submitted by Operations)

The plan Operations submitted for Black Friday to Cyber Monday: what percent of the regular price each of 20 items sells at, and whether it joins spend-and-save. Before launch it has to pass the pre-launch check (Pricing and Promotion Compliance Standard PRC-5); a plan that fails is changed.

**The full data is one JSON file: `~/workplace/knowledge/larkspur/data/mall-campaign.json`.** Copy it verbatim into the project as the campaign configuration. Fields:

- `name` is the sale's name; `start` and `end` are its times (US Eastern Time);
- `fullReduction` is spend-and-save: `every` is the threshold in dollars, `off` is the amount taken off, `withDiscount` is whether it stacks with the discount, `withCoupon` whether it stacks with coupons;
- `items` has one entry per item: `sku`, `pct` (the percent of regular price: 85 means 15% off), `fullReduction` (whether the item joins spend-and-save), and `linePriceInput` (the "was" price Operations typed; **do not use it directly**: the reference price is calculated under PRC-1).

Summary: Friday 2026-11-27 00:00 to Monday 2026-11-30 23:59 Eastern. Across the store, $30 off every $300, stacking with discounts and not with coupons. The GPS watch and the satellite messenger are not in spend-and-save.

This sale is worked out by date: the "7 days before the sale" of PRC-1 is **Nov 20 to Nov 26** (both ends included); the "14 days before the sale" of PP-1 is **Nov 13 to Nov 26**; the "30 days" of MGN-3 is **Oct 28 to Nov 26**. An order counts only when its `date` is in the range.

Plan summary: the 4-person tent is at 80 and the down jacket at 70; the rest of the items are at 85 to 95.
