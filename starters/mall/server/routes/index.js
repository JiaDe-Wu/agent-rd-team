// The API route table: backend developers implement it from the README, "API conventions", and docs/aidlc/2-inception/requirements.md.
//
// Each route: { method: 'GET', path: '/api/campaign', handler: async (ctx) => return value }
//   ctx.params   path parameters (the sku in '/api/campaign/items/:sku')
//   ctx.query    URLSearchParams
//   ctx.body()   read the JSON request body (await; over 16KB is a 413 automatically, not JSON is a 400)
//   ctx.data     { products, orders }: the data under server/data/ (read only)
//   ctx.state    { config, status }: the campaign configuration of this server process (a copy read from server/config/campaign.json;
//                changing a discount in the back office changes this) and the sale status ('draft' not live yet / 'live')
//   ctx.now()    server time (milliseconds, see ../lib/clock.js)
//   ctx.send(status, data)  use it for a status other than 200
// A return value is written as JSON with 200. On an error: throw new HttpError(status, 'code', 'message in plain English') (see ../lib/http.js).
// How prices are worked out lives in ../lib/pricing.js; this file is only the API.

export const routes = []
