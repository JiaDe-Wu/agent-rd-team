---
title: Personal Data Display Standard (Larkspur Outfitters)
tags: [standard, security, personal data, privacy, compliance]
---

# Personal Data Display Standard

Applies to every page, big screen, export file and log of the company that employees or the public can reach. Rule IDs are PII-n. Basis: data minimisation (collect and show only what the purpose needs), as in the CCPA and GDPR; the practices below are the company's own. Owners: Legal + Security.

| ID | Rule | How it is checked | Example |
|---|---|---|---|
| PII-1 | **Mask phone numbers.** Every page, API response and export shows only the last 4 digits: `***-***-1234`. | No full 10-digit phone number appears in page HTML, API responses or exports | Passes: `***-***-0134`. Fails: `415-555-0134`, `(415) 555-0134`, `+1 415 555 0134` |
| PII-2 | **Big screens and projectors show name and department only.** No phone number, no employee ID (at most its last 4 characters), no hire date. | The data a big-screen page receives has none of these fields | Passes: "Avery Brooks · Design". Fails: "Avery Brooks · LK220116 · hired 2022-11-27" |
| PII-3 | **APIs return only the fields the page uses.** Employee data sent to a page has no `phone`; a flow that needs contact details uses a separate, permissioned endpoint. | The JSON an API returns has no `phone` field | Passes: `{ "id": "LK220116", "name": "Avery Brooks", "dept": "Design" }`. Fails: the same object with `"phone": "415-555-0134"` |
| PII-4 | **Logs hold no personal data.** No phone numbers and no full employee IDs in logs. | The code never logs a whole employee object | Passes: `log.info('draw done', { prize })`. Fails: `console.log(employee)` |
