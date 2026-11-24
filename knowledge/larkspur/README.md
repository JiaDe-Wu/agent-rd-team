# The example company's knowledge base: Larkspur Outfitters

Larkspur Outfitters is made up. This folder is what a real company would keep in its knowledge base so an agent team works by the company's own standards instead of by what the model remembers.

## What is here

| File | What it is |
|---|---|
| `00-company-and-products.md` | Who the company is, who owns which standard, where the data is |
| `10-…` to `42-…` | The standards, one document each. Every rule has an ID (`PRC-1`, `MGN-2`, `PII-1`…), a reason, and an example that passes and one that fails |
| `data/*.md` | A document for each data set: what it is, which JSON file holds it, what the fields mean |
| `data/*.json` | The data: store products, orders and campaign plan, the employee directory, raffle prizes, weak passwords |

All of it is made up, including every name and phone number (the 555-01xx range is reserved for fiction).

## How the pieces connect

```
knowledge/larkspur/*.md   the standards, read by the agents (Kiro Crew knowledge source "Larkspur Outfitters")
packs/larkspur/standards.json   an index: which standard a requirement touches, by its keywords
packs/larkspur-promo/tests/enterprise/   the company's checks: code that fails when a rule is broken
team/team-promo.json   the team file: roles, which standards always apply, where the knowledge is
```

1. A requirement comes in ("Black Friday sale: …"). The app matches its words against `standards.json` and lists the standards and data it touches in every role's task.
2. Each role looks the originals up in the knowledge source, by title, before it writes anything.
3. The company's checks run on the merged branch. They are the standards written as tests, so a role that ignored a rule gets a red test that names the rule ID, and the failure goes back to the role that owns it.
4. At the gates a person decides, and the decision is kept.

## Make it your own

Replace the files, keep the shape:

1. **Standards**: write your own documents in `knowledge/<your company>/`. One rule per row, with an ID, why, and an example that passes and one that fails. Examples are what let an agent apply a rule correctly.
2. **Data**: put the data in `data/*.json`, with a short document beside it saying what each field means and which rule uses it.
3. **Index**: add each document to `packs/<your company>/standards.json`: `id`, `title`, `kind` (`standard` or `data`), `owner`, `doc`, `rules`, and the `keywords` that make a requirement touch it.
4. **Checks**: a rule that code can break should have a check in `tests/enterprise/` named for the rule (`prc-line.test.js`). Keep them small and write one that passes on a reference implementation and fails on a wrong one, as `packs/larkspur-promo/_reference/` does.
5. **Team file**: copy `team/team-promo.json`; change `standards`, `standards_always`, `knowledge` and `keywords`.

The knowledge folder is installed on the machine at `~/workplace/knowledge/larkspur/` and registered as the Kiro Crew knowledge source named `Larkspur Outfitters`; the data documents name the JSON files there.
