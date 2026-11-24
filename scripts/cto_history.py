"""Simulated history for the CTO view: Larkspur Outfitters' R&D centre (5 business lines x 12 people), the delivery list
of the last 12 weeks and of the 12 weeks before AI-DLC was introduced, and what is in progress right now (the backlog,
what the agents are working on, what waits at a human gate). Every delivery carries an Issue (who raised it, when) and the
PR that took it into main; some fixes are post-release defects of an app or feature that shipped earlier, and the two link
to each other. The result is written to cto/history.json, which ships with the app. The backend (backend/team/cto.py)
moves the dates so that the last day is today, then adds the runs of this app that a person signed off (measured) and the
runs that are not signed off yet (in progress).

    python3 scripts/cto_history.py

The random seed is fixed, so every run writes the same file. THESE NUMBERS ARE GENERATED, NOT MEASURED. They exist so
that the CTO view has something to show the first time it opens. They are not evidence of any efficiency gain: the arrival
rates, cycle times and defect rates below are assumptions chosen for the example, and the cost model (the "meta" block
at the foot of main()) is described in docs/cto-view-data.md.
"""
from __future__ import annotations

import json
import math
import random
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "cto" / "history.json"
SEED = 20261016
TODAY = date(2026, 10, 16)
AGENT_START = TODAY - timedelta(days=83)       # the first day of the last 12 weeks
BASE_START = AGENT_START - timedelta(days=84)  # the first day of the 12 weeks before
ISSUE_PREFIX = "LK"                            # Larkspur
rng = random.Random(SEED)

# Deliveries per business line per week (Poisson mean). The baseline is calibrated to a 12-person group; the last 12 weeks
# are the full-capacity rate times a week-by-week roll-out factor.
BASE_RATE = {"S": 68 / 12, "M": 19 / 12, "L": 2 / 12}
AGENT_RATE = {"S": 18.4, "M": 9.3, "L": 0.85}
RAMP = [0.40, 0.48, 0.56, 0.64, 0.72, 0.80, 0.88, 0.96, 1.0, 1.0, 1.0, 1.0]
# Cycle time in calendar days (uniform): example values
CYCLE = {"base": {"S": (1, 3), "M": (7, 13), "L": (26, 34)}, "agent": {"S": (0.3, 1.3), "M": (1.5, 3.5), "L": (5, 9)}}
# size -> kind
KIND = {"S": [("fix", 1.0)], "M": [("feat", 0.9), ("app", 0.1)], "L": [("app", 0.8), ("feat", 0.2)]}

LINES = [
    {"key": "ec", "name": "E-commerce", "signers": ["Maya Chen", "Daniel Ortiz"],
     "app": ["Gear trade-in platform", "Pre-order system", "Live-stream product picker", "Rewards points store", "Corporate group-buy page", "In-store pickup booking", "Review moderation console", "Price patrol tool", "Coupon centre", "Bundle configuration console", "Installation service booking"],
     "feat": ["Product page video", "Spend-more-save-more suggestions", "Cart price breakdown", "Trade-in value estimate", "Pre-order deposit and balance", "Product spec comparison", "Flash sale", "Photo-review coupon", "Coupon stacking rules", "Search suggestions", "Interest-free instalment display", "Price-adjustment self-service", "Smart address recognition", "Self-service invoicing", "Final price calculation"],
     "fix": ["Campaign page slow on first screen", "Reference price source corrected", "Purchase-limit notice hidden on small screens", "Payment callback timeout retry", "Search result ordering wrong", "Coupon expiry notice wording", "Product image lazy loading broken", "Order export missing fields"],
     "var": ["Tents", "Backpacks", "Footwear", "Jackets", "Cookware", "Climbing gear"]},
    {"key": "mob", "name": "Mobile app", "signers": ["Priya Nair", "Tom Becker"],
     "app": ["Store associate app", "Installer job app", "Store inspection mobile app", "Member mini-program", "After-sales visit booking", "Dealer ordering app", "Store manager dashboard", "Product manual mini-program", "Gear refresh mini-program", "Staff purchase mini-program"],
     "feat": ["Scan to buy", "One-tap sign-in", "Associate customer tags", "Notification grouping", "Live room", "Installation booking", "Repair progress lookup", "Dark mode", "Share for coupon", "Nearby store navigation", "Digital warranty card", "Trade-in photo estimate"],
     "fix": ["Notification badge not updating", "Crash on payment page", "Share card image missing", "Duplicate order on weak network", "Session expired too early", "Push tap opens the wrong page"],
     "var": ["iOS", "Android", "Mini-program", "HarmonyOS"]},
    {"key": "crm", "name": "CRM", "signers": ["Hannah Reed", "Samuel Okafor"],
     "app": ["Member points programme", "Support knowledge base", "After-sales ticket system", "Member segmentation marketing", "Voice of customer analysis", "Call centre assistant", "Extended warranty management", "Member benefits centre", "Complaint escalation", "NPS survey"],
     "feat": ["Member tier benefits page", "Birthday coupon auto-issue", "Dormant member win-back", "Ticket auto-assignment", "After-sales follow-up survey", "Points expiry reminder", "Member segment tags", "Incoming call screen pop", "Ticket overdue alert", "Points redemption approval", "Customer profile tags"],
     "fix": ["Points credited late", "Ticket status out of sync", "Member phone number masking digits corrected", "Duplicate coupon issue", "Follow-up SMS failed"],
     "var": ["Gold members", "New customers", "East region", "South region", "Online channel", "Store channel"]},
    {"key": "sc", "name": "Supply chain", "signers": ["Lucas Meyer", "Aisha Rahman"],
     "app": ["Supplier reconciliation platform", "Dealer ordering platform", "Store stock sync service", "Smart replenishment", "Delivery appointment platform", "Returns inspection system", "Warehouse operations board", "Supplier collaboration portal", "Freight settlement system", "Material traceability"],
     "feat": ["Safety stock alert", "Order quota control", "Replenishment suggestions", "Shipment tracking", "Returns receiving inspection", "Inter-warehouse transfer approval", "Supplier lead-time board", "Stock-out auto reminder", "Batch expiry management", "Bulk waybill printing"],
     "fix": ["Reconciliation rounding error", "Stock alert threshold setting", "Duplicate transfer orders", "Waybill number validation error", "Stock sync delay"],
     "var": ["East warehouse", "South warehouse", "North warehouse", "Southwest warehouse", "Central warehouse"]},
    {"key": "int", "name": "Internal systems", "signers": ["Grace Liu", "Noah Fischer"],
     "app": ["Meeting room booking", "Training sign-up", "Equipment checkout log", "Price-adjustment refund monthly report", "Visitor registration", "Travel expense lookup", "Department weekly report roll-up", "Promotion cost sheet", "Contract approval ledger", "New hire checklist"],
     "feat": ["Overtime request approval", "Meeting room conflict notice", "Directory filter by department", "Receipt photo recognition", "Permission change approval", "Auto-disable leaver accounts", "Two-step verification", "Sign-in anomaly alert", "Monthly report auto-send"],
     "fix": ["Directory department order", "Monthly report amount format", "Returns order definition corrected", "Lockout duration setting corrected", "Duplicate approval reminders"],
     "var": ["Finance", "Administration", "HR", "Legal", "Information security"]},
]
LINE_IDX = {ln["key"]: i for i, ln in enumerate(LINES)}
GATES = ["Requirements gate", "Scope gate", "Release gate", "Sign-off"]  # where a simulated in-progress item waits for a person


def poisson(lam: float) -> int:
    l, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= rng.random()
        if p <= l:
            return k
        k += 1


def pick_kind(size: str) -> str:
    r, acc = rng.random(), 0.0
    for kind, w in KIND[size]:
        acc += w
        if r < acc:
            return kind
    return KIND[size][-1][0]


def title_for(line: dict, kind: str, used: dict) -> str:
    if kind == "app":
        base = rng.choice(line["app"])
        n = used.get(base, 0) + 1
        used[base] = n
        return base if n == 1 else f"{base} (phase {n})"
    return f"{rng.choice(line[kind])} ({rng.choice(line['var'])})"


# The columns of the requirement flow board (the AI-DLC phases); where each human gate sits
GATE_COL = {"Scope gate": "Ideation", "Requirements gate": "Inception", "Release gate": "Operation", "Sign-off": "Operation"}
AGENT_COL = (["Ideation", "Inception", "Construction", "Operation"], [2, 2, 5, 1])
SCOPE_Q = ["Gross margin on revenue or on cost", "Which day the window starts", "Whether returned orders count", "Whether contractors can see it", "How many digits of the phone number to show", "Whether data from different regions may be combined"]
PRICE_LIMIT_USD = 42  # thousands: refunds above this need CFO approval (the example company's rule)


def focus(gate: str, line: dict) -> str:
    """What the person is to decide, as the card says it."""
    if gate == "Scope gate":
        n = rng.randint(1, 3)
        return f"{n} open question{'s' if n > 1 else ''}: {rng.choice(SCOPE_Q)}" + (" and more" if n > 1 else "")
    if gate == "Requirements gate":
        return f"Confirm the work split and the acceptance criteria ({rng.randint(4, 8)} members)"
    if gate == "Release gate":
        if line["key"] == "ec":
            return f"Pre-release check: price-adjustment refunds ${round(rng.randint(31, 60) * 10 / 7.1)}k, above ${PRICE_LIMIT_USD}k needs CFO approval"
        return "Independent review passed; waiting for release approval"
    return "Deployed and healthy; waiting for the sign-off"


def wip(used: dict) -> list[dict]:
    """The requirement flow right now (simulated): the backlog, what the agents are working on, what waits at a human gate."""
    out = []
    for li, line in enumerate(LINES):
        for _ in range(rng.randint(1, 2)):
            size = rng.choices("SML", weights=[5, 4, 1])[0]
            kind = pick_kind(size)
            out.append({"t": title_for(line, kind, used), "line": li, "kind": kind, "size": size, "state": "pool", "col": "Backlog",
                        "mins": rng.randint(1, 50)})
        for _ in range(rng.randint(5, 7)):
            size = rng.choices("SML", weights=[5, 4, 1])[0]
            kind = pick_kind(size)
            it = {"t": title_for(line, kind, used), "line": li, "kind": kind, "size": size}
            if rng.random() < 0.33:
                gate = rng.choice(GATES)
                it.update(state="wait", gate=gate, col=GATE_COL[gate], who=rng.choice(line["signers"]),
                          hours=round(rng.uniform(0.2, 3.6), 1), focus=focus(gate, line))
            else:
                it.update(state="agent", col=rng.choices(*AGENT_COL)[0], members=rng.randint(3, 8), mins=rng.randint(3, 40))
            out.append(it)
    return out


# Who raises a business line's Issues; who reports a defect after release
REPORTERS = {"ec": ["Operations", "Merchandising", "Marketing"], "mob": ["UX group", "Store operations"], "crm": ["Member operations", "Customer care"],
             "sc": ["Supply chain management", "Warehouse and logistics"], "int": ["Administration"]}
DEFECT_FROM = ["Customer care", "Online monitoring"]
DEFECT_RATE = {"base": 0.08, "agent": 0.05}  # share of new apps and features with a defect reported within 30 days of release
ISSUE0, PR0 = 1001, 1201


def trace(items: list[dict], wips: list[dict]) -> None:
    """Give the deliveries and the in-progress items an Issue and a PR, and link some fixes to the delivery they fix. It uses
    another random seed, so none of the existing numbers (count, kind, size, cycle, release day) changes."""
    r = random.Random(SEED + 1)
    for it in items:
        it["created"] = (date.fromisoformat(it["ship"]) - timedelta(days=int(it["cyc"]))).isoformat()
        line = LINES[it["line"]]
        var = it["t"].rsplit(" (", 1)[-1].rstrip(")") if " (" in it["t"] else ""
        it["reporter"] = var if line["key"] == "int" and var in line["var"] else r.choice(REPORTERS[line["key"]])
    fixes = sorted((i for i in items if i["kind"] == "fix"), key=lambda i: i["ship"])
    taken: set[int] = set()
    for it in sorted((i for i in items if i["kind"] != "fix"), key=lambda i: i["ship"]):
        if r.random() >= DEFECT_RATE[it["period"]]:
            continue
        ship = date.fromisoformat(it["ship"])
        cands = [k for k, f in enumerate(fixes) if k not in taken and f["line"] == it["line"]
                 and 3 <= (date.fromisoformat(f["ship"]) - ship).days <= 30]
        if not cands:
            continue
        k = r.choice(cands)
        taken.add(k)
        fix = fixes[k]
        fix["t"] = f"Post-release defect fix: {it['t']}"
        fix["reporter"] = r.choice(DEFECT_FROM)
        fix["origin"] = id(it)
        it.setdefault("defects", []).append(id(fix))
    by_created = sorted(items, key=lambda i: (i["created"], i["ship"], i["t"]))
    num = {id(i): f"{ISSUE_PREFIX}-{ISSUE0 + n}" for n, i in enumerate(by_created)}
    for n, it in enumerate(sorted(items, key=lambda i: (i["ship"], i["created"], i["t"]))):
        it["issue"], it["pr"] = num[id(it)], PR0 + n
    for it in items:
        if "origin" in it:
            it["origin"] = num[it["origin"]]
        if "defects" in it:
            it["defects"] = [num[d] for d in it["defects"]]
    nxt, pr = ISSUE0 + len(items), PR0 + len(items)
    for w in wips:
        w["issue"], nxt = f"{ISSUE_PREFIX}-{nxt}", nxt + 1
        w["reporter"] = r.choice(REPORTERS[LINES[w["line"]]["key"]])
        if w.get("gate") == "Sign-off":
            w["pr"], pr = pr, pr + 1


def gen() -> tuple[list[dict], dict]:
    items, used = [], {}
    for period, start, rates in (("base", BASE_START, None), ("agent", AGENT_START, AGENT_RATE)):
        for w in range(12):
            wk0 = start + timedelta(days=7 * w)
            for li, line in enumerate(LINES):
                for size in ("S", "M", "L"):
                    lam = BASE_RATE[size] if period == "base" else rates[size] * RAMP[w]
                    for _ in range(poisson(lam)):
                        ship = wk0 + timedelta(days=rng.randrange(7))
                        if ship > TODAY:
                            continue
                        cyc = round(rng.uniform(*CYCLE[period][size]), 1)
                        kind = pick_kind(size)
                        items.append({"t": title_for(line, kind, used), "line": li, "kind": kind, "size": size, "period": period,
                                      "ship": ship.isoformat(), "cyc": cyc, "signer": rng.choice(line["signers"]) if period == "agent" else "",
                                      "real": None})
    return items, used


def main() -> None:
    items, used = gen()
    items.sort(key=lambda x: (x["ship"], x["t"]), reverse=True)
    # The assumptions behind the page's money and effort figures (docs/cto-view-data.md lists them, the page's Assumptions
    # panel shows them). dayRate is the loaded cost of one person-day in `currency`; the seat price is in USD and
    # `fx` turns it into `currency` (1.0 here: the example company reports in USD).
    meta = {"today": TODAY.isoformat(), "agentStart": AGENT_START.isoformat(),
            "weeks": [(BASE_START + timedelta(days=7 * i)).isoformat() for i in range(24)],
            "lines": [ln["name"] for ln in LINES], "peoplePerLine": 12,
            "eq": {"S": 1, "M": 5, "L": 30}, "human": {"S": 0.25, "M": 1, "L": 7},
            "currency": "USD", "dayRate": 282, "seatUsdMonth": 40, "fx": 1.0, "months": 3,
            "company": "Larkspur Outfitters"}
    wips = wip(used)
    trace(items, wips)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"meta": meta, "items": items, "wip": wips}, ensure_ascii=False, separators=(",", ":")) + "\n",
                   encoding="utf-8")
    base = sum(1 for i in items if i["period"] == "base")
    linked = sum(len(i.get("defects", [])) for i in items)
    print(f"{OUT}: {base} items in the first 12 weeks, {len(items) - base} in the last 12 (no measured runs); {linked} post-release defects linked")


if __name__ == "__main__":
    main()
