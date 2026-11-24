// The API route table: backend developers implement it from the README, "API conventions", and docs/aidlc/2-inception/interfaces.md.
//
// Each route: { method: 'GET', path: '/api/people', handler: async (ctx) => return value }
//   ctx.params   path parameters (write /api/people/:id in path)
//   ctx.query    URLSearchParams
//   ctx.body()   read the JSON request body (await; over 16KB is a 413 automatically, not JSON is a 400)
//   ctx.data     the data under server/data/ (read only): server/data/employees.json is ctx.data.employees
//   ctx.state    the state of this server process ({}; the API puts things in it)
//   ctx.send(status, data)  use it for a status other than 200, for example ctx.send(201, { item })
//   ctx.res      the raw response object (when you write the headers and body yourself, as in a CSV export)
// A return value is written as JSON with 200. On an error: throw new HttpError(status, 'code', 'message in plain English') (see ../lib/http.js).
//
// You can split it into several files by feature and merge them here.

export const routes = []
