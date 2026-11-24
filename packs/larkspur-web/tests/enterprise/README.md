# Checks issued by the company (R&D Center, Legal, Security, Design)

Nobody may change this folder. `node tests/enterprise/_run.cjs` runs every check under `tests/` (the company's and the project's own); `node tests/enterprise/_run.cjs pii-` runs only the files with `pii-` in the name.

The checks call your code the way the "Company template conventions" in the project `README.md` describe: start a server instance and call its API (`startServer` in `_lib.js`), import the page modules and call `render`, and read the source in `web/` and `server/`. The rules themselves are in the knowledge base: Frontend Engineering Standard FE-n / UX-n, Brand Standard BR-n, Personal Data Display Standard PII-n.

The area in the file name decides who a failure goes to: `-web-` is the web pages (pages, styles and motion under `web/`) and `-server-` is the server (the API and data under `server/`). The architect says which of `web` and `server` belongs to whom in `test_areas` of `docs/aidlc/2-inception/ownership.json`.
