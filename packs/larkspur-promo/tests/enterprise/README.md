# Checks issued by the company (Legal and Pricing Compliance, Finance, R&D Center, Design)

Nobody may change this folder. `node tests/enterprise/_run.cjs` runs every check under `tests/` (the company's and the project's own); `node tests/enterprise/_run.cjs pp-` runs only the files with `pp-` in the name.

The checks call your code the way the "Company template conventions" in the project `README.md` describe: the price engine, the API, the pages and the motion. The rules themselves are in the knowledge base: Pricing and Promotion Compliance Standard PRC-n, Margin and Pricing Rules MGN-n, Price-Adjustment Guarantee Rules PP-n, Frontend Engineering Standard FE-n / UX-n, Brand Standard BR-n. `data/` holds a copy of the knowledge base's data: the checks use it to compare with `server/data/` and to work out the right answer themselves from the knowledge base's rules. The campaign configuration comes from the project's `server/config/campaign.json`: when the person at a gate changes a discount, the right answer follows.

The file name decides who a failure goes to: `data-copy` goes to the product manager; `prc-line`, `mgn-check`, `pp-check` and `api-campaign` go to backend developer #1; `fe-campaign` and `fe-site` go to frontend developer #1; `fe-admin` goes to frontend developer #2; `ux-motion` goes to the motion designer.
