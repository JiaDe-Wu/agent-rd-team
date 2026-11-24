---
title: Company Raffle Rules (Larkspur Outfitters)
tags: [standard, business rules, raffle, company event]
---

# Company Raffle Rules

Written by People Operations and run by Facilities, for the annual all-hands event. Rule IDs are RULE-n; code and tests cite the IDs.

| ID | Rule | Why | Example |
|---|---|---|---|
| RULE-1 | Only **active employees** can win. Departed people (`status` = `Departed`) and contractors (`type` = `Contractor`) are not in the draw. | The event budget covers employees only | A contractor with `status: Active, type: Contractor` is excluded |
| RULE-2 | Each person wins **at most once**. A winner is removed from the pool, so later prizes cannot go to them. | More people win | Someone who won the Third prize cannot also win the Grand prize |
| RULE-3 | Prizes are drawn in the prize list's order (Third → Second → First → Grand). Each prize must have all its winners before the next one is drawn. | The flow on stage | Drawing the Grand prize while the First prize has 1 of 2 winners fails |
| RULE-4 | **The server draws**, with a cryptographically secure random source (Node's `crypto.randomInt`), never `Math.random`. The page cannot decide who wins. | Fairness that people can trust | Passes: `crypto.randomInt(pool.length)`. Fails: `Math.floor(Math.random() * pool.length)` |
| RULE-5 | Every draw is **recorded**: time, prize, winner's employee ID. The record can be exported for Facilities to hand out prizes; phone numbers in the export are masked under PII-1. | Auditable and reconcilable | Passes: `2026-12-04T19:02:11-05:00, Grand prize, LK220116`. Fails: an export column of full phone numbers |
| RULE-6 | A draw cannot be undone. If a result must be voided (for example the winner is not in the room), a reason is written down and the voided record is kept. | Prevents back-room changes | Deleting a winner row fails; marking it `voided` with a reason passes |
