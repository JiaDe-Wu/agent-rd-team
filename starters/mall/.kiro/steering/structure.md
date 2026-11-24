---
inclusion: always
---

# Larkspur Outfitters Official Store: layout

| Path | What it is |
|---|---|
| `server/lib/pricing.js` | The price engine: final price, reference price, pre-launch check, cart quote |
| `server/routes/` | The API |
| `server/data/` | Data (from the knowledge base) |
| `server/config/campaign.json` | The campaign configuration (Operations' plan) |
| `web/pages/campaign.js` | The Black Friday campaign page |
| `web/pages/admin.js` | The operations back office |
| `web/motion/` | Brand motion |
| `web/styles/` | Styles: `tokens.css` brand variables, `base.css` site-wide components, and one css file per page |
| `tools/check-campaign.js` | The pre-launch check on the command line (`npm run check-campaign`) |
| `tests/` | Tests; `tests/enterprise/` holds the checks the company issues |
| `docs/aidlc/` | What each stage produces |
