---
inclusion: always
---

# Larkspur Outfitters Official Store: technical conventions

- Use only the modules that come with Node 22 and install no npm packages. Web pages use native ES modules: no framework and no bundler.
- The template conventions are in `README.md`, "Company template conventions": who owns which folder, the shape of the API, a page's `render` / `mount`, the motion interface and the site-wide components. Write to the conventions and do not change files that come with the template.
- Tests are in `tests/` and use `node:test`; the checks the company issues are in `tests/enterprise/` and nobody may change them. Run everything: `node tests/enterprise/_run.cjs`; run part: `node tests/enterprise/_run.cjs <a word in the file name>`.
- Colours, fonts and easing come only from the variables in `web/styles/tokens.css`.
