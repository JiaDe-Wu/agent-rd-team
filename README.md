# Agent R&D Team: the Kiro Crew app

An agent R&D team built on [AI-DLC](https://github.com/awslabs/aidlc-workflows) that works from your own
standards and keeps what its people decide. It turns a one-sentence requirement into a run of an agent team
defined by a team file. Every role is a Kiro Crew chat session running as a Kiro Crew member, working in its own
git worktree and branch. The app dispatches the roles by their dependencies, merges their work, runs your
company checks itself, sends failures back to the role that owns them, stops at human gates, deploys on the
local machine, and draws all of it on a live board. A finished run can be replayed and signed off.

**What it uses from you.** Company standards (`standards.json` and the checks under `tests/enterprise/`),
business rules in the team's knowledge source, and the team file itself. All are plain files you replace.

**What it keeps.** Decisions made at a gate are written to `docs/aidlc/decisions.md` on the run branch. At the
last gate you tick which lessons to keep; later runs read them. See [Roadmap](#roadmap) for what is not done yet.

The page has three views that share one app bar: the **CTO view** (CTO 视图, all deliveries), **delivery
detail** (交付详情, one delivery) and the **team board** (团队看板, how the team delivered it).

## Install

Kiro Crew installs it straight from this repository (it is not in the App Store catalog yet):

```bash
kirocrew app install https://github.com/JiaDe-Wu/agent-rd-team    # or a clone: kirocrew app install ./agent-rd-team
```

The app stays off after install. `kirocrew app enable agent-rd-team` does not turn it on: the gateway refuses
until the app is trusted, and it also asks you to allow the app to control your chats (see below). Both are
answered in the dashboard: open the app's page at `/apps/detail/agent-rd-team` and enable it there. The first
refusal names the setting `agent.apps_trusted`, which trusts this one app only.

The app has executable parts (a Python backend, and its tasks run shell commands in git worktrees), so a Kiro Crew
with `agent.apps_allow_third_party` off refuses it with `app_execution_denied`. Trust this app alone with
`agent.apps_trusted: ["agent-rd-team"]`, or set `agent.apps_allow_third_party` to `true` to allow every third-party app.

Open the app from the sidebar, write a one-sentence requirement and hand it to the team.

### Requirements

- Kiro Crew 0.13.0 or newer (the first release with the sandboxed spawn for app backends), on macOS or Linux. Windows is not supported.
- `git`, and Node 22 or newer: the company checks run with `node --test`.
- The Kiro Crew members the team files name (for example `aidlc-product-agent`) on the Agents page. A role whose
  member is missing waits, unless the team file marks it `optional`. `python3 scripts/install_members.py` writes the
  member templates from `agents/` (as `<member>-template`) into `~/.kiro/agents` and adds the 14 members to a running
  Kiro Crew, using its `kirocrew` command; it never overwrites a template or member that already exists, and
  `--dry-run` shows what it would do.

### What the app is allowed to do, and why

Kiro Crew runs this app's Python only after you trust it. Its manifest asks for:

| Permission | Used for |
| --- | --- |
| `/api/apps/agent-rd-team` | The app's own routes (runs, gates, board, CTO view) |
| `/api/chat` | Opening one Kiro Crew chat session per role, and reading its state |
| `/api/models` | The model picker in the start form |
| `/api/agents` | Checking which team members exist on the Agents page |
| `/api/knowledge` | Finding the knowledge source the team file names |
| `storage` | Keeping each run's record |
| `sessionApproval` | Auto-approving the tool calls of the sessions this app opens, so that the team can work unattended |

`sessionApproval` is the one to think about: the sessions the app opens run file edits and shell commands without
asking you each time. Other Kiro Crew sessions are not changed. Each role works in its own git worktree under
`~/workplace/agent-rd-team/`. Its task lists the paths it may write and tells it not to push; the app records a change
outside those paths as a violation, but it does not sandbox the session.

Three kinds of commands run in the app's own process, and a role session can write what they run: the company checks
(`node --test` on the test files), the site of a run (`server.js`), and every `git` call on a run repository (git reads
its `.git/config`). The app starts all three under Kiro Crew's sandbox, at the `standard` tier, through the app-backend
SDK (`run_sandboxed_async` and `sandboxed_argv_async`), not with your full rights. Where the host cannot sandbox a
command, that step stops and says so; the app does not run it another way. A `git` call costs about 0.16 s more that
way (measured on Ubuntu 22.04: 160 ms against 2 ms for `git rev-parse`). `backend/team/sandbox.py` is the one place
that starts them, and a test fails if another place in `backend/` starts a command.

### Lessons

The last role, **Lessons**, lists what the delivery taught and asks you which of it to keep: a multiple-choice
question at its gate. Only what you tick is written, word for word, to `~/workplace/agent-rd-team/lessons.json`. Runs
that start later read that file once and name its cards in every role's task. Delete or edit the file at any time.

### Language

The app's screens, messages and team labels are in English. The agents' prompts (the `brief` fields and the task
templates) and the example company data (`packs/`, `demo/`) are still in Chinese, so the documents a run produces
are in Chinese unless you write your own team file. The store listing also carries a Chinese name and description.

### Where it comes from

This app began as the agent-team sample in
[aws-samples/sample-ai-for-software-engineering-on-aws](https://github.com/aws-samples/sample-ai-for-software-engineering-on-aws)
and is maintained here. It follows [AI-DLC Workflows](https://github.com/awslabs/aidlc-workflows). Licensed under
Apache-2.0.

## How a run goes

| Step | What happens | Code |
| --- | --- | --- |
| 1 Requirement | The team is chosen by the words in the requirement: every team file with a `scope` and without `"routable": false` matches when one of its `keywords` occurs; the lowest `priority` wins; with no match the `fallback` team runs. The start form may pick the run's model from the models Kiro Crew offers (`GET /models`); every role then uses it, a role with its own `model` included. One run at a time | `routing.route`, `service.create_run`, `service.models` |
| 2 Team | The team file is validated (dependency order, keys, gates, paths inside the app). The task template, the company standards that match, the roster and the knowledge source are read. An optional role whose member is missing sits the run out | `team.check_team`, `standards.py`, `team.leave_out_unhired` |
| 3 Repository | `~/workplace/agent-rd-team/runs/<run>/repo` starts from the team's `starter`, its `source` or `demo/target-template`; the requirement goes into the README; the `spec_pack` is overlaid, including its `tests/enterprise/` checks | `team._setup`, `gitwork.create_repo` |
| 4 Tick | Every 2 seconds the sessions are polled and each live run advances one step | `service.pulse`, `team.TeamRun.tick` |
| 5 Start | A role starts when everything it depends on is merged and, where there is a human gate, approved. A deploy role waits for all checks to pass; a read-only reviewer waits for every writing role upstream. A writing role gets a worktree `wt/<role>` on branch `team/<run>/<role>` | `team._ready`, `team._start` |
| 6 Task | The task template filled in with the role, its branch, the paths it may write, upstream outputs, matching standards, the role's `brief`, the approved work split, and the person's notes and decisions at the gates. A fix round continues the role's own session | `team._work_task`, `team._launch` |
| 7 Merge | Uncommitted changes inside the write scope are committed for the role; changes outside it are recorded as violations; the branch is merged into the run branch, and a conflict goes back to the role. A human gate then stops the run | `team._integrate`, `gitwork.merge` |
| 8 Checks | The app runs `node --test` file by file on the run branch and assigns failures to roles by `test_owners` | `checks.run_tests`, `team._test_and_bounce` |
| 9 Review | The read-only reviewer answers `DONE: 可以交付` (deliverable) or `DONE: 要改：…` (changes needed) with the roles to send back to | `team._review_done` |
| 10 Gates | Approve: later roles start with the note and the per-question decisions, which are also written to `docs/aidlc/decisions.md` on the run branch. Discuss: the role answers in its own session and may revise its documents while the gate stays open. Send back: the role reworks with the note; the person may note the risk the send-back keeps from going live (`{what, amount}` in yuan, on the run's `risks`) | `team.TeamRun.gate` |
| 11 Deploy | The deploy role writes `deploy/local.json` (port, health path); the app starts the site with `HOST=127.0.0.1`, waits for the health check, and stops a site that listens beyond loopback (checked with `lsof`) | `service._deploy`, `site.Site` |
| 12 End | `done` when every role merged, `failed` when a role failed. Only a delivered run can be signed off; signing merges the run branch into the run repository's `main` | `team._settle`, `service.signoff` |

## Code map

| Path | What it is |
| --- | --- |
| `app.json` | Kiro Crew app manifest |
| `backend/` | The orchestrator: `team/team.py` (one run's state machine and the tasks), `team/service.py` (all runs, the tick, gates, sign-off, deploy), `team/routing.py`, `team/standards.py`, `team/checks.py`, `team/gitwork.py`, `team/sessions.py`, `team/board.py`, `team/cto.py` |
| `ui/src/` | The page: `main.tsx`, `AppBar.tsx`, `board/` (team board), `cto/` (CTO view and delivery detail) |
| `ui/preview/` | A preview page on test data, without Kiro Crew |
| `team/` | Team files `team*.json`, the roster, task templates |
| `starters/` | Project templates of the example: `mall` (store promotion), `web` (internal web pages) |
| `packs/` | Company checks in `tests/enterprise/`, reference implementations in `_reference/` for the checks' own tests, and the standards index `taoyuan/standards.json` |
| `cto/history.json` | Synthetic history for the CTO view, made by `scripts/cto_history.py` |
| `demo/target-template/` | The project the built-in team (`team/team.json`) starts from |
| `scripts/dev-install.sh` | Installs or updates the app in the local Kiro Crew |
| `tests/` | Backend tests with a fake session manager and real git and node |

## Team file keys

Team level:

| Key | Meaning |
| --- | --- |
| `roles` | The roles; a role comes after the roles it depends on |
| `scope`, `keywords`, `priority`, `fallback`, `routable` | Choosing the team by the words in the requirement |
| `starter` / `source` / `needs_source` | Start from a project template / change an existing project / a project folder must be given |
| `spec_pack` | Pack(s) overlaid on the run repository, with the company checks |
| `standards`, `standards_always` | The company standards index; the standards that always apply |
| `knowledge` `{source, data_dir}` | The Kiro Crew knowledge source name; where the data files are |
| `roster`, `workspace` | The company's team shown on the board; the Kiro Crew workspace of the members |
| `task_template` | Task template in `team/` |
| `test_command`, `test_timeout_s`, `test_owners` | Command shown on the test wall; timeout per test file; who owns failures (globs) |
| `delivery_defaults` | Default delivery labels (kind, size, business line) |
| `defaults` | `model`, `max_fix_rounds` (2), `max_review_rounds` (0), `gate_discuss` (off), `max_discuss_rounds` (5) |

Role level:

| Key | Meaning |
| --- | --- |
| `key`, `title`, `icon`, `phase`, `stage` | Name and place on the board (`phase` is the AI-DLC phase) |
| `member`, `aidlc_agent` | The Kiro Crew member the session runs as; the AI-DLC expert it stands for |
| `depends_on`, `writable`, `outputs` | Whom it waits for; paths it may write (`!` excludes); outputs handed downstream |
| `brief`, `mission`, `assignment` | The task; what the board shows it is doing |
| `gate: "human"`, `gate_label`, `plan` | A human gate after this role; its button label; the work split file |
| `gate_preset`, `gate_revise_preset`, `gate_revise_risk` | Notes the gate dialog can fill in for approving and for sending back, and the risk filled in with the send-back |
| `questions` | File on the run branch with the questions the person decides at the gate: `{"questions": [{id, q, options: [{key, text}], recommend, why}]}`; `"multi": true` makes it a tick-any question (up to 10 options, no recommendation) |
| `remember` | `true` on the last gated role: what the person ticked is written to the lessons file when its gate is approved |
| `name_zh` | The role's Chinese title, so a reviewer's Chinese send-back lines still name it |
| `delivery` | File on the run branch with the proposed delivery labels |
| `optional` | Sits the run out when its member does not exist or the approved work split leaves it out |
| `deploy` `{mode: local, port, health}` | Deploy on this machine |
| `model` | The role's own model (a model picked in the start form replaces it for that run) |

## Roadmap

The aim is a team that needs fewer human decisions each time it is used, because what people decided at the
gates is kept as knowledge the next run reads. What exists today is narrower:

- Kept today: the lessons a person ticks at the last gate (`lessons.json`, read by every later run), and each
  run's gate decisions in `docs/aidlc/decisions.md`. The latter stays on that run's branch and is not read by
  other runs.
- Not done: feeding gate decisions back into the knowledge source automatically, counting how many gates a
  later run needed compared with an earlier one, and letting a gate pass without a person when a similar
  decision has been approved before. Today every gate in the team file still waits for a person.

## Test

```bash
python3 -m pytest -q                 # backend tests: Python 3.10+ and pytest; Kiro Crew's sandbox SDK is a stand-in
# the same tests in the host's real sandbox (Kiro Crew 0.13.0+ source on PYTHONPATH):
AGENT_RD_TEAM_REAL_SANDBOX=1 PYTHONPATH=/path/to/KiroCrew/src python3 -m pytest -q
(cd ui && npm ci && npm run check)   # UI: type check, component tests, build
```

Two timing-based UI tests can time out on a heavily loaded machine when test files run in parallel;
`npx vitest run --no-file-parallelism` runs them one file at a time.
