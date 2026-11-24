# Larkspur Outfitters Official Store · Black Friday to Cyber Monday

The official store's Black Friday sale: the campaign page shoppers see, and the back office Operations uses (change discounts, read the pre-launch check, launch). This project starts from the company's store campaign template: the server skeleton, the page shell, the brand styles and components and the fonts are already there, and the requirement is built only in the places the template conventions name.

## How to run it

```bash
npm start                 # http://127.0.0.1:3000 (change it with the PORT and HOST environment variables)
npm test                  # runs every check under tests/, the same as node tests/enterprise/_run.cjs
npm run check-campaign    # the pre-launch check: works out server/config/campaign.json and prints, in plain English, whether the sale can launch and why
```

All you need is Node 22 or newer. No npm packages are installed.

## Company template conventions

### Layout

| Path | What it holds | Who changes it |
|---|---|---|
| `server/app.js`, `server/lib/http.js`, `data.js`, `clock.js` | The server skeleton, HTTP helpers, reading data, server time | Comes with the template; do not change |
| `server/data/` | Data: `products.json`, `orders.json`, taken from the knowledge base and copied as they are | Product manager |
| `server/config/campaign.json` | The campaign configuration: copied as it is from the knowledge base "Black Friday to Cyber Monday campaign plan"; when the plan changes later (a person decided at a gate), change this file | Backend developer |
| `server/lib/pricing.js` | The price engine (see "Price engine" below) | Backend developer |
| `server/routes/` | The API | Backend developer |
| `web/index.html`, `web/app.js`, `web/lib/`, `web/styles/tokens.css`, `base.css`, `shell.css` | The page shell, routing, calling the API, building HTML, the brand variables and the site-wide components | Comes with the template; do not change |
| `web/pages/campaign.js`, `web/styles/campaign.css` | The Black Friday campaign page | Frontend developer |
| `web/pages/admin.js`, `web/styles/admin.css` | The operations back office | Frontend developer |
| `web/motion/` | Brand motion: countdown digits, cards appearing, add to cart, launch celebration | Motion designer |
| `tools/check-campaign.js` | The command line of the pre-launch check | Comes with the template; do not change |
| `tests/enterprise/` | The checks the company issues | Nobody may change them |
| `docs/aidlc/` | What each stage produces | |

### Data

Items (`server/data/products.json`): `sku`, `name`, `category`, `price` regular price (dollars), `cost` (dollars), `stock`, `priceProtect` whether the item has the 14-day price-adjustment guarantee.
Orders (`server/data/orders.json`): `id`, `sku`, `paid` price paid per item (dollars), `qty`, `date` order date (`YYYY-MM-DD`, US Eastern Time), `status` (Completed / Returned).

### Campaign configuration

`server/config/campaign.json`: `name`, `start` / `end` (times with a time zone, such as `2026-11-27T00:00:00-05:00`), `fullReduction` (spend and save: `every` the threshold in dollars, `off` the amount taken off, `withDiscount` whether it stacks with the discount, `withCoupon` whether it stacks with coupons), `items` (one per item: `sku`, `pct` the percent of the regular price, `fullReduction` whether it joins spend and save, `linePriceInput` the "was" price Operations typed, **which must not be used directly**).

### Price engine (`server/lib/pricing.js`, called directly by the company checks)

The rules are in the knowledge base: Pricing and Promotion Compliance Standard PRC, Margin and Pricing Rules MGN, Price-Adjustment Guarantee Rules PP. The names, parameters and return shapes are as below; do not change them:

```js
finalPrice(price, pct)          // MGN-1 final price: price × pct / 100, rounded to the dollar
linePrice(sku, data, config)    // PRC-1 reference price: the lowest price paid on completed orders in the 7 days before config.start (the 7 days ending the day before it); the regular price if there is none
quote(items, config, data)      // cart quote, items = [{ sku, qty }]
//   → { lines: [{ sku, name, qty, final, subtotal, fullReduction }], subtotal, off, total }
//     off: the subtotals of the items in spend and save, added up, take fullReduction.off off for every fullReduction.every; total = subtotal - off
check(config, data)             // PRC-5 pre-launch check
//   → {
//       campaign: { name, start, end },
//       items: [{ sku, name, price, cost, pct, final, linePrice, linePriceInput, fullReduction,
//                 lowest, floor, marginOk }],
//       priceProtect: { orders, amount, limit, needsCfo, bySku: [{ sku, name, orders, amount }] },
//       margin: { usual, campaign },
//       blockers: [string],
//       canLaunch: boolean,
//     }
```

What the parts of `check` mean:

- `final` is the final price (MGN-1); `linePrice` the reference price (PRC-1); `lowest` the lowest price during the sale (MGN-2: for an item in spend and save `final × 90%` rounded to the dollar, otherwise `final`); `floor` the margin floor = `cost × 1.08` (not rounded); `marginOk` = `lowest >= floor`.
- `priceProtect` (PP-1, PP-2): among the completed orders of the 14 days before the sale (the 14 days ending the day before it), for an item with the guarantee and a price paid higher than the final price, the payout per order = (price paid − final price) × quantity. `orders` is how many orders get a payout, `amount` the total (dollars), `limit` = 20000, `needsCfo` = `amount > limit`, and `bySku` has one entry per item in the configuration's order (items with no payout too, with `orders` and `amount` 0).
- `margin` (MGN-3): from the units of completed orders in the 30 days before the sale, the margin rate at regular prices and at final prices: Σ(price − cost) × units ÷ Σ price × units × 100, one decimal place (a number, not a string).
- `blockers`: one plain-English sentence for each reason the sale cannot launch (an item below the margin floor, payouts that need CFO approval); `canLaunch` = there are none.

### API conventions (the same across the company; the checks call it this way)

Paths start with `/api/` and use JSON both ways. An error returns 4xx and `{ "error": { "code", "message" } }`; bad input is 400, never 500. The campaign configuration and status live in the server process (`ctx.state`), and the back office changes this copy; status `draft` is not live yet, `live` is live.

| Endpoint | Request | Success |
|---|---|---|
| `GET /api/time` | | `200 { "now": "<ISO time>" }`: server time (PRC-4, use `ctx.now()`) |
| `GET /api/campaign` | | `200 { "campaign": { "name", "start", "end", "status", "fullReduction" }, "items": [{ "sku", "name", "category", "price", "linePrice", "final", "pct", "fullReduction", "stock" }] }` |
| `GET /api/campaign/check` | | `200`: the result of `check()`, plus `"status"` |
| `PUT /api/campaign/items/:sku` | `{ "pct"?, "fullReduction"? }` | `200`: the check after the change (as above). `pct` that is not a whole number from 50 to 100, or `fullReduction` that is not a boolean, is `400`; an unknown item is `404`; a live sale cannot be changed: `409` (`live`) |
| `POST /api/campaign/launch` | | `200 { "campaign": { …, "status": "live" } }`. A failed check is `409` (`blocked`, and `message` says why); an already live sale is `409` (`live`) |
| `POST /api/cart/quote` | `{ "items": [{ "sku", "qty" }] }` | `200`: the result of `quote()`. A sale that is not live cannot be priced at the sale price: `409` (`not_live`, PRC-4); bad input is `400`; an unknown item is `404` |

### Page conventions

Each page module `web/pages/<page>.js` exports two functions:

- **`render(state)`**: a pure function that returns an HTML **string**. It does not touch `document`, `window` or `fetch`, so a Node test can call it directly. Build it with `` html`…` `` from `web/lib/format.js` (values put in are escaped) and return `String(html`…`)`. `format.js` also has `usd(4319)` → `$4,319`, `pctOff(85)` → `15% off`, and `parts(milliseconds)` → the days, hours, minutes and seconds of a countdown. Note that `html` turns `false` and `null` into nothing: put a boolean into an attribute as a string (`data-ok="${String(ok)}"`).
- **`mount(root, ctx)`**: called in the browser; `ctx` is `{ api, motion, fx, navigate }`: `api.get/post/put` call the API, `motion` is `web/motion/motion.js`, and `fx` is the full-screen `<canvas>`. Fetch the data, call `render` and write it into `root`, bind events (event delegation: listen on `root` and tell what was clicked from its `data-*`). It may return a cleanup function, called when the page changes.

The shape of the `state` that `render` gets is the same across the company, and the checks call it this way:

| Page | state |
|---|---|
| `campaign` | `{ status: 'loading' \| 'ready' \| 'error', campaign: the campaign of GET /api/campaign or null, items: the items of the same endpoint, now: server time (milliseconds), cart: the result of quote() or null, error?: the error message }` |
| `admin` | `{ status: 'loading' \| 'ready' \| 'saving' \| 'error', check: the result of GET /api/campaign/check or null, prev?: the check before the change (when there is one, use it to show the change "since just now"), error?: the error message }` |

The `data-*` the pages must carry (the checks use them):

- Campaign page: the countdown `data-countdown` (with `data-end` on the same element, set to the sale's end time); each item card `data-sku="<sku>"`, and inside it the element of the final price `data-final` and the element of the reference price `data-line` (with the note "Lowest price in the 7 days before the sale" next to it, as `data-line-note` or in the text); the add-to-cart button `data-action="add"` (with `data-sku`); the cart summary `data-cart`.
- Back office: one row per item `data-sku="<sku>"`, with `data-ok="true|false"` on the row (whether the margin meets the floor); the discount input `data-pct` (`<input type="number">`); the spend-and-save switch `data-fr` (`<input type="checkbox">`); the list of reasons it cannot launch `data-blockers`; the payout summary `data-pp`; the launch button `data-action="launch"` (with `disabled` when it cannot launch).

Do not write inline event attributes such as `onclick="…"` and do not write an inline `<script>`: the server's content security policy only allows script files from this site.

### Motion interface (`web/motion/motion.js`; pages use motion only through it)

| Function | What it does |
|---|---|
| `prefersReduced()` | Whether the system asks for reduced motion |
| `flip(el, text)` | Changes the text of `el` to `text`; used for the countdown digits |
| `reveal(cards)` | Item cards appear one after another (adds `is-in` to each) |
| `bump(el)` | When something is added to the cart, the cart badge bounces |
| `celebrate(canvas)` | When the sale goes live, plays a celebration on the full-screen canvas and clears it after a few seconds |

In the template these are placeholders with no animation; pages work without them.

### Site-wide components (`web/styles/base.css`; pages use them directly)

`.glass` a glass card, `.panel` padding, `.hero` a centred big-title area, `.eyebrow` a small heading, `.display` big gradient type, `.title`, `.big` a big number, `.muted`; `.btn`, `.btn--primary` (the glowing gradient main button), `.btn--ghost`; `.chip`, `.chip--active`, `.chip--done`; `.stat`; `.table`; `.state`, `.state--error`.

## Requirement

(Written when the work starts.)
