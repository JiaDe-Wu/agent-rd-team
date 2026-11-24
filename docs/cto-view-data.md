# The CTO view's data

The CTO view and the offline page read one document: `GET /api/apps/agent-rd-team/cto` (`backend/team/cto.py`, `build`). It has three parts. The
shipped history (`cto/history.json`) supplies the simulated company; the backend moves its dates so that its last day is today, then adds this app's own runs.

```json
{ "meta": { ... }, "items": [ ... ], "wip": [ ... ] }
```

**Everything in the shipped history is generated, not measured.** `scripts/cto_history.py` writes it with a fixed random seed, so it is the same on every run.
Only an item with a `real` run id is measured.

## `meta`: the assumptions

| Field | Meaning | Shipped value |
| --- | --- | --- |
| `company` | The example company's name | `Larkspur Outfitters` |
| `today`, `agentStart`, `weeks` | The last day; the first day of the 12 weeks with AI-DLC; 24 week starts (12 before, 12 with) | moved to today |
| `lines` | The business lines. Items point into this list by index | E-commerce, Mobile app, CRM, Supply chain, Internal systems |
| `peoplePerLine` | People in each business line. The company has `peoplePerLine × lines` people | 12 (60 in all) |
| `eq` | Person-days the same work takes people alone, by size S / M / L | 1 / 5 / 30 |
| `human` | Person-days of people's time per delivery with the agent team, by size | 0.25 / 1 / 7 |
| `currency`, `dayRate` | What every amount is in; what one person-day costs, fully loaded | USD, 282 |
| `seatUsdMonth`, `fx`, `months` | The agent seat's price in USD per person per month; `currency` per USD; months in the 12 weeks | 40, 1.0, 3 |
| `realAvgMins` | A measured run's average time, minutes (filled in by the backend) | |

## How each number is computed (`ui/src/cto/metrics.ts`)

- **More** = items released in the last 12 weeks ÷ items released in the 12 weeks before, for the same people.
- **Faster** = delivery cycle (release date − Issue date) of a large delivery, before and now. *Before* is the average cycle of deliveries of the same size in the 12 weeks before AI-DLC.
- **Cheaper** = cost per person-day of work = (Σ `human` × `dayRate` + seats × `seatUsdMonth` × `months` × `fx`) ÷ Σ `eq`, over the deliveries of the last 12 weeks. *Before* is `dayRate`.
- **More stable** = defects reported after release per 100 new apps and new features, before and now. A measured run has had no observation time after release and is left out.
- **Value** (optional): the page estimates nothing until you type a gross margin per item per day: new apps and features × average days earlier × that margin.

## `items`: deliveries

| Field | Meaning |
| --- | --- |
| `t`, `line`, `kind`, `size` | Name; index into `meta.lines`; `app` / `feat` / `fix`; `S` / `M` / `L` |
| `period` | `base` (the 12 weeks before AI-DLC) or `agent` |
| `ship`, `cyc`, `signer` | Release day; days from the Issue to release; who signed it off |
| `issue`, `reporter`, `created`, `pr` | The Issue (`LK-1234`), who raised it, its day, the PR that took it into main |
| `defects`, `origin` | A delivery lists the Issues of defects raised after it shipped; a fix points back to what it fixes |
| `real` | `null` for a simulated delivery, else the run id: **a measured delivery** |

A measured delivery (a run of this app that a person signed off) also has `mins` (the run's own time), `credits` (Kiro Crew credits used, when known), `agent_s`
(seconds the agents worked, outside the gates), `tests` (`37/37`), `members`, `decisions` (what people decided at the gates, `["Approved Release", "note"]`), `caught`
(what was sent back before release: `person`, `review`, `checks`) and `risks`. The *Measured runs against the estimate* panel shows `mins`, `credits`, `tests` and
`members` as they were measured, and puts the estimate beside them: `eq[size]` person-days for people alone, `human[size]` with the agent team, each at `dayRate`.
**The estimate is the assumption above, not a measurement.**

## `wip`: what is in progress now

`state` is `pool` (backlog), `agent` (an agent team is working) or `wait` (waiting at a human gate). `col` is the column: `Backlog`, `Ideation`, `Inception`,
`Construction` or `Operation`. A waiting card has `gate` (`Release gate`, `Sign-off`, ...), `who`, `hours` waited and `focus` (what the person is to decide). Every run
of this app that is going, waiting or delivered-but-unsigned is added as a card with `live: true`.

## Use your own numbers

1. **Change the assumptions**: edit `meta` in `cto/history.json` (or the `meta` block at the foot of `scripts/cto_history.py` and run it again). Every card, the
   Assumptions panel and the Method notes read it.
2. **Replace the simulated history**: write a `cto/history.json` of the same shape from your own tracker. Items without `real` count as before and after; leave `wip` empty
   if you have no flow data. The page keeps working with no measured run and with none of the optional fields.
3. **Measure**: run deliveries with the team and sign them off. Each one joins the list as Measured, with its own time and credits, next to the estimate.
