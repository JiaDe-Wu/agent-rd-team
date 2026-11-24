# Larkspur Outfitters · Internal web pages

Internal web pages that Larkspur Outfitters' departments build for themselves. This project starts from the company's web template: the server skeleton, the page shell and routing, the brand styles and components, the fonts and Pip are already there, and the requirement is built only in the places the template conventions name.

## How to run it

```bash
npm start          # http://127.0.0.1:3000 (change it with the PORT and HOST environment variables)
npm test           # runs every check under tests/, the same as node tests/enterprise/_run.cjs
```

All you need is Node 22 or newer. No npm packages are installed.

## Company template conventions

### Layout

| Path | What it holds | Who changes it |
|---|---|---|
| `server/app.js`, `server/server.js`, `server/lib/` | The server skeleton, HTTP helpers, reading data | Comes with the template; do not change |
| `server/data/` | Data: JSON from the knowledge base, copied as it is | As the work is split |
| `server/routes/` | The API | As the work is split |
| `web/index.html`, `web/app.js`, `web/lib/`, `web/styles/tokens.css`, `base.css`, `shell.css` | The page shell, routing, calling the API, building HTML, the brand variables and the site-wide components | Comes with the template; do not change |
| `web/pages/`, `web/styles/<page>.css` | The pages and their styles; `web/pages/index.js` registers the pages | As the work is split |
| `web/motion/` | Brand motion | As the work is split |
| `deploy/` | Deployment configuration | As the work is split |
| `tests/enterprise/` | The checks the company issues | Nobody may change them |
| `docs/aidlc/` | What each stage produces | |

### Data

The data is in the Kiro Crew knowledge source "Larkspur Outfitters": the explanatory documents in the knowledge base give the paths of the full data files. Copy what you need into `server/data/` as it is (do not retype it or change it); `server/lib/data.js` reads by file name: `server/data/employees.json` is `ctx.data.employees` in the API.

### API conventions (the same across the company)

- Paths start with `/api/` and use JSON both ways. Routes are written in `server/routes/`; the format is explained at the top of `server/routes/index.js`.
- An error returns 4xx and `{ "error": { "code": "<short code>", "message": "<plain English for the user>" } }`; bad input is 400, never 500.
- A list endpoint returns `{ "<plural name>": [...] }` and a single object returns `{ "<singular name>": {...} }`.
- Return only the fields the page uses; how personal data is shown is in the knowledge base's Personal Data Display Standard.
- An export file (CSV) is `text/csv; charset=utf-8`, and the first row is a header row in English.

### Page conventions

Each page module `web/pages/<page>.js` exports two functions and is registered in `web/pages/index.js` (`{ title, load }`; the first is the home page):

- **`render(state)`**: a pure function that returns an HTML **string**. It does not touch `document`, `window` or `fetch`, so a Node test can call it directly. Build it with `` html`…` `` from `web/lib/format.js` (values put in are escaped) and return `String(html`…`)`.
- **`mount(root, ctx)`**: called in the browser; `ctx` is `{ api, motion, fx, navigate }`: `api.get/post/put/del` call the API, `motion` is `web/motion/motion.js`, and `fx` is the full-screen `<canvas>`. Fetch the data, call `render` and write it into `root`, bind events (event delegation: listen on `root` and tell what was clicked from its `data-*`). It may return a cleanup function, called when the page changes.

The shape of `state` and the `data-*` the tests use on the page are written by the architect in `docs/aidlc/2-inception/interfaces.md`.

Do not write inline event attributes such as `onclick="…"` and do not write an inline `<script>`: the server's content security policy only allows script files from this site.

### Motion interface (`web/motion/motion.js`; pages use motion only through it)

| Function | What it does |
|---|---|
| `prefersReduced()` | Whether the system asks for reduced motion |
| `flip(el, text)` | Changes the text of `el` to `text` (changing digits) |
| `reveal(items)` | Cards and list items appear one after another (adds `is-in` to each) |
| `bump(el)` | Tap feedback: `el` bounces |
| `celebrate(canvas)` | Plays a celebration on the full-screen canvas |

In the template these are placeholders with no animation; pages work without them.

### Site-wide components (`web/styles/base.css`; pages use them directly)

`.glass` a glass card, `.panel` padding, `.hero` a centred big-title area, `.eyebrow` a small heading, `.display` big gradient type, `.title`, `.big` a big number, `.muted`; `.btn`, `.btn--primary` (the glowing gradient main button), `.btn--ghost`; `.chip`, `.chip--active`, `.chip--done`; `.stat`; `.table`; `.state`, `.state--error`; `.mascot`.

## Requirement

(Written when the work starts.)
