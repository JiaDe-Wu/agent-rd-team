"""The CTO view: the delivery tag (the team's defaults, what the first gated role proposes, what a person confirms at the gate) and
the data of GET /cto (the simulated history moved to today, a signed-off run counted as measured, a run not signed off yet as a
card on the requirement flow board)."""

import asyncio
import json
import re
import subprocess
from datetime import date, datetime
from pathlib import Path

import pytest
from teamkit import FakeManager, make_deps, mod

team_mod, cto, delivery, constants = mod("team"), mod("cto"), mod("delivery"), mod("constants")
PROMO_REQ = ("Black Friday sale: discount 20 appliances with spend-more-save-more, the campaign page shows a countdown, "
             "the reference price and the final price, and operations can put it live from the admin page in one click.")
NOW = datetime(2026, 10, 20, 12, 0).timestamp()
# the example team's file (named team-promo.json once the example company's pack is English; the older name is read too)
PROMO_TEAM = next(p for p in (constants.TEAM_DIR / "team-promo.json", constants.TEAM_DIR / "team-taoyuan-promo.json") if p.exists())


def promo_run(tmp_path, rid="r1020aaaa", started=NOW - 3600):
    t = team_mod.load_team(PROMO_TEAM)
    state = team_mod.new_state(rid, PROMO_REQ, t, "{brief}", tmp_path / "work", constants.APP_ROOT / "starters" / "mall", started)
    return team_mod.TeamRun(state, make_deps(tmp_path, FakeManager(), None, now=lambda: NOW))


def kinds(run, kind):
    return [e["text"] for e in run.events if e["kind"] == kind]


def test_the_labels_are_the_team_defaults_until_the_planner_proposes_and_a_person_confirms(tmp_path):
    run = promo_run(tmp_path)
    assert run.delivery() == {"name": "Black Friday sale", "kind": "New feature", "size": "Medium", "line": "E-commerce", "why": ""}
    rel = run.roles["product"]["delivery"]
    assert rel in run.roles["product"]["writable"] and "delivery.json" in run.roles["product"]["brief"]
    run.s["run_wt"] = str(tmp_path / "wt")  # the run branch's worktree, where the planner wrote its file
    (tmp_path / "wt" / "docs" / "aidlc" / "2-inception").mkdir(parents=True)
    (tmp_path / "wt" / rel).write_text(json.dumps({"name": "  Appliance sale page  ", "kind": "sale", "size": "Large",
                                                   "line": "E-commerce", "why": "The official store's sale page"}))
    run._read_delivery("product", rel)
    assert run.delivery() == {"name": "Appliance sale page", "kind": "New feature", "size": "Large", "line": "E-commerce", "why": "The official store's sale page"}
    assert "Product manager proposed the delivery tag: New feature · Large · E-commerce (Appliance sale page)" in kinds(run, "plan")

    run.lane("product")["gate"] = "pending"
    assert asyncio.run(run.gate("product", "approve", "Approved.", {"size": "Medium", "kind": "New app", "line": "Alien"}))
    assert run.s["delivery"] == {"name": "Appliance sale page", "kind": "New app", "size": "Medium", "line": "E-commerce", "why": "The official store's sale page"}
    assert any(t.startswith("A person confirmed the delivery tag: New app · Medium · E-commerce") for t in kinds(run, "plan"))


def test_no_proposal_or_a_wrong_one_keeps_the_defaults(tmp_path):
    run = promo_run(tmp_path)
    run.s["run_wt"] = str(tmp_path)
    run._read_delivery("product", "docs/aidlc/2-inception/delivery.json")
    assert run.delivery()["kind"] == "New feature" and "proposed no delivery tag" in kinds(run, "plan")[-1]
    (tmp_path / "bad.json").write_text("[1, 2]")
    run._read_delivery("product", "bad.json")
    assert "delivery_proposed" not in run.s
    assert delivery.short_name("Margin dashboard: by category, from the last 30 days of orders") == "Margin dashboard"
    assert delivery.short_name("Margin dashboard\uff1aby category") == "Margin dashboard"  # a full-width colon ends the name too
    assert delivery.defaults({}, "Fix it", on_source=True)["kind"] == "New feature"


def test_the_words_of_older_runs_and_team_files_are_read_as_the_english_ones():
    """Older runs and team files wrote the kind, size and line in Chinese (here as \\u escapes): they read as the English words."""
    old = {"name": "x", "kind": "\u4fee\u590d", "size": "\u5927", "line": "\u4f9b\u5e94\u94fe", "why": ""}
    assert delivery.canonical(old) == {"name": "x", "kind": "Fix", "size": "Large", "line": "Supply chain", "why": ""}
    assert delivery.clean({"kind": "\u65b0\u529f\u80fd", "size": "\u4e2d", "line": "\u7535\u5546"}, {})["line"] == "E-commerce"
    team_mod.check_team({"version": 1, "roles": [{"key": "pm"}], "delivery_defaults": {"kind": "\u4fee\u590d", "size": "\u5c0f", "line": "\u5185\u90e8\u7cfb\u7edf"}})
    assert delivery.label(old) == "Fix \u00b7 Large \u00b7 Supply chain (x)"


def test_a_run_from_before_teams_had_defaults_takes_its_team_file_s_by_name(tmp_path):
    run = promo_run(tmp_path)
    run.team = {k: v for k, v in run.team.items() if k != "delivery_defaults"}  # the team as it was when it ran
    assert (run.delivery()["kind"], run.delivery()["line"]) == ("New feature", "E-commerce")
    run.team = {**run.team, "name": "A team that no longer exists"}
    assert (run.delivery()["kind"], run.delivery()["line"]) == ("New app", "Internal systems")


@pytest.mark.parametrize("change, says", [
    ({"delivery_defaults": {"kind": "sale"}}, "delivery_defaults.kind"),
    ({"roles": [{"key": "pm", "gate": "human", "delivery": "../x.json"}]}, "relative path"),
    ({"roles": [{"key": "pm", "delivery": "d.json"}]}, "human gate"),
])
def test_a_team_file_with_wrong_delivery_settings_is_refused(change, says):
    team = {"version": 1, "roles": [{"key": "pm"}], **change}
    with pytest.raises(ValueError, match=says):
        team_mod.check_team(team)


def git(cwd, *args):
    return subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], cwd=cwd, check=True,
                          capture_output=True, text=True).stdout.strip()


def test_a_run_has_an_issue_and_once_it_delivered_a_pr_that_the_signature_merges_into_main(tmp_path):
    run = promo_run(tmp_path)
    assert delivery.issue_id(run.rid).startswith("LO-")
    assert run.issue()["reporter"] == "Operations" and run.issue()["created_at"] == NOW - 3600 and run.issue()["id"] == delivery.issue_id(run.rid)
    assert delivery.issue_kind(run.issue()["kind"]) == "Requirement"
    assert run.issue()["id"] == delivery.issue_id(run.rid) != delivery.issue_id("r1020bbbb")
    run.s["delivery"] = {"name": "Transfer order fix", "kind": "Fix", "size": "Small", "line": "Supply chain"}
    assert (delivery.issue_kind(run.issue()["kind"]), run.issue()["reporter"]) == ("Defect", "Supply chain management")
    run.s["issue"] = {"reporter": "Information security"}  # an imported run brings who raised it
    assert run.issue()["reporter"] == "Information security" and run.issue()["id"] == delivery.issue_id(run.rid)
    assert run.pr() is None  # nothing delivered yet
    run.s.update(status="done", ended_at=NOW - 60, verdict="The review says it can be merged")
    assert run.pr() is None  # finished, but its deployment never went out
    run.lane("deploy")["deployed"] = {"url": "http://127.0.0.1:8090/", "at": NOW - 90}
    run.lane("backend1").update(file_count=3, lines={"added": 40, "removed": 2})
    run.lane("frontend1").update(file_count=2, lines={"added": 25, "removed": 0})
    pr = run.pr()
    assert {k: pr[k] for k in ("number", "head", "base", "state", "files", "added", "removed", "review", "sha")} == {
        "number": delivery.pr_number(run.rid), "head": f"team/{run.rid}/run", "base": "main", "state": "open",
        "files": 5, "added": 65, "removed": 2, "review": "The review says it can be merged", "sha": ""}

    assert asyncio.run(run.merge_pr()) == ""  # no repository here (a run imported from another computer)
    repo = Path(run.s["repo"])
    repo.mkdir(parents=True)
    git(repo, "init", "-q", "-b", "main")
    (repo / "README.md").write_text("a\n")
    git(repo, "add", "-A"), git(repo, "commit", "-qm", "base")
    git(repo, "checkout", "-qb", run.s["branch"])
    (repo / "app.py").write_text("print(1)\n")
    git(repo, "add", "-A"), git(repo, "commit", "-qm", "run")
    git(repo, "checkout", "-q", "main")
    sha = asyncio.run(run.merge_pr())
    assert sha and git(repo, "rev-parse", "main") == git(repo, "rev-parse", run.s["branch"])
    run.s["signoff"] = {"by": "Head of R&D", "note": "", "at": NOW, "tests": "37/37", "merged": sha}
    assert (run.pr()["state"], run.pr()["merged_by"], run.pr()["sha"]) == ("merged", "Head of R&D", sha)
    run.s["signoff"]["merged"] = ""  # signed, not merged here (an imported run)
    assert (run.pr()["state"], run.pr()["sha"]) == ("signed", "")


def history():
    return {"meta": {"today": "2026-10-16", "agentStart": "2026-07-25", "weeks": ["2026-05-02", "2026-07-25"],
                     "lines": list(delivery.LINES), "peoplePerLine": 12},
            "items": [{"t": "Duplicate transfer orders (South warehouse)", "line": 3, "kind": "fix", "size": "S", "period": "agent",
                       "ship": "2026-10-16", "cyc": 1.0, "signer": "Lucas Meyer", "real": None}],
            "wip": [{"t": "Overtime request approval (Legal)", "line": 4, "kind": "feat", "size": "M", "state": "pool", "col": "Backlog", "mins": 4}]}


def signed(run, at, by="Head of R&D"):
    run.s.update(status="done", ended_at=run.s["started_at"] + 1020)
    run.s["signoff"] = {"by": by, "note": "", "at": at, "tests": "37/37"}
    return run


def test_the_history_moves_to_today_and_a_signed_run_joins_it_as_measured(tmp_path):
    run = signed(promo_run(tmp_path), NOW - 600)
    run.s["delivery"] = {"name": "Appliance sale page", "kind": "New feature", "size": "Medium", "line": "E-commerce"}
    events = [
        {"seq": 5, "kind": "approved", "role": "product", "from": "person", "text": "A person approved Requirements: Approved. One more rule: at most 2 units per person per product."},
        {"seq": 9, "kind": "bounce", "role": "compliance", "from": "person",
         "text": "A person sent it back at the Release gate: Sent back on the pre-release check.\nSend back: Backend #1. Refunds above $42k need CFO approval."},
        {"seq": 10, "kind": "bounce", "role": "backend1", "from": "compliance", "text": "As the person said, sent back to Backend #1"},
        {"seq": 14, "kind": "approved", "role": "compliance", "from": "person", "text": "A person approved Release"},
    ]
    out = cto.build({run.rid: run}, NOW, events_of=lambda r: events, history=history())
    assert out["meta"]["today"] == "2026-10-20" and out["meta"]["agentStart"] == "2026-07-29"
    assert out["meta"]["weeks"] == ["2026-05-06", "2026-07-29"]
    sim, real = [i for i in out["items"] if not i["real"]], [i for i in out["items"] if i["real"]]
    assert sim[0]["ship"] == "2026-10-20"  # the history's last day is today
    credits = [(r.pop("credits"), r.pop("agent_s")) for r in real]  # what the page's measured-against-estimate panel reads
    assert credits == [(None, 1020.0)]
    assert real == [{"t": "Appliance sale page", "line": 0, "kind": "feat", "size": "M", "issue": delivery.issue_id(run.rid),
                     "reporter": "Operations", "created": date.fromtimestamp(NOW - 3600).isoformat(), "period": "agent",
                     "ship": date.fromtimestamp(NOW - 600).isoformat(), "cyc": round(3000 / 86400, 3), "mins": 17,
                     "signer": "Head of R&D", "real": run.rid, "tests": "37/37", "members": 8,
                     "decisions": [["Approved Requirements", "One more rule: at most 2 units per person per product."],
                                   ["Sent back Release", "Refunds above $42k need CFO approval."],
                                   ["Approved Release", "No further comment"]],
                     "pr": delivery.pr_number(run.rid), "defects": [],
                     "caught": {"person": 0, "review": 0, "checks": 0}, "risks": []}]  # these events carry no moments
    assert out["meta"]["realAvgMins"] == 17 and out["wip"] == history()["wip"]
    run.s["decisions"] = [["Approved Requirements", "An added rule"]]  # an imported run brings its own list
    assert cto.build({run.rid: run}, NOW, events_of=lambda r: events, history=history())["items"][1]["decisions"] == [["Approved Requirements", "An added rule"]]


def test_a_run_whose_delivery_tag_is_in_the_older_chinese_words_is_counted_like_the_english_one(tmp_path):
    run = signed(promo_run(tmp_path), NOW - 600)
    run.s["delivery"] = {"name": "Old run", "kind": "\u65b0\u529f\u80fd", "size": "\u4e2d", "line": "\u7535\u5546"}
    item = cto.real_item(run, [])
    assert (item["kind"], item["size"], item["line"]) == ("feat", "M", 0)


def test_runs_not_signed_off_are_cards_that_open_the_run(tmp_path):
    runs = {}

    def add(rid):
        runs[rid] = promo_run(tmp_path / rid, rid)
        return runs[rid]

    at_gate = add("r1020gate")
    at_gate.lane("compliance")["gate"] = "pending"
    at_gate.events.append({"seq": 1, "kind": "gate", "role": "compliance", "at": NOW - 1800, "text": "Waiting for approval: Release"})
    planner = add("r1020plan")
    planner.lane("product")["gate"] = "pending"
    working = add("r1020work")
    working.lane("backend1").update(status="running", started_at=NOW - 300)
    working.lane("frontend1").update(status="running", started_at=NOW - 200)
    delivered = add("r1020done")
    delivered.s.update(status="done", ended_at=NOW - 7200)
    delivered.lane("deploy")["deployed"] = {"url": "http://127.0.0.1:8090/", "at": NOW - 7300}
    failed = add("r1020fail")
    failed.s.update(status="failed", ended_at=NOW - 60)
    hidden = add("r1020hide")
    hidden.s.update(status="done", ended_at=NOW - 60, hidden=True)
    hidden.lane("deploy")["deployed"] = {"url": "x", "at": NOW}
    cards = {c["real"]: c for c in cto.build(runs, NOW, events_of=lambda r: [], history=history())["wip"] if c.get("real")}
    assert set(cards) == {"r1020gate", "r1020plan", "r1020work", "r1020done"}
    gate = cards["r1020gate"]
    assert (gate["state"], gate["col"], gate["gate"], gate["role"], gate["hours"]) == ("wait", "Operation", "Release gate", "compliance", 0.5)
    assert gate["focus"] == "The independent review has its verdict; the owner decides" and gate["live"] and gate["t"] == "Black Friday sale"
    assert gate["who"] == "Owner"
    assert (cards["r1020plan"]["col"], cards["r1020plan"]["gate"]) == ("Inception", "Requirements gate")
    assert "delivery tag" in cards["r1020plan"]["focus"]
    assert (cards["r1020work"]["state"], cards["r1020work"]["col"], cards["r1020work"]["members"]) == ("agent", "Construction", 2)
    assert (cards["r1020done"]["gate"], cards["r1020done"]["col"], cards["r1020done"]["hours"]) == ("Sign-off", "Operation", 2.0)


def test_the_value_stream_of_a_run_says_where_its_time_went_and_what_happened(tmp_path):
    run = promo_run(tmp_path, started=NOW - 6000)
    t0 = run.s["started_at"]
    at = lambda n: t0 + n  # noqa: E731
    ev = [
        {"seq": 1, "at": at(0), "kind": "spawned", "role": "product", "from": None, "text": "Orchestrator assigned: Product manager"},
        {"seq": 2, "at": at(50), "kind": "gate", "role": "product", "from": "product", "text": "Waiting for approval: Requirements"},
        {"seq": 3, "at": at(250), "kind": "approved", "role": "product", "from": "person", "text": "A person approved Requirements: Approved. One more rule: at most 2 units per person per product."},
        {"seq": 4, "at": at(251), "kind": "spawned", "role": "backend1", "from": None, "text": "Assigned"},
        {"seq": 5, "at": at(251), "kind": "spawned", "role": "tester", "from": None, "text": "Assigned"},
        {"seq": 6, "at": at(500), "kind": "gate", "role": "compliance", "from": "compliance", "text": "Waiting for approval: Release"},
        {"seq": 7, "at": at(700), "kind": "bounce", "role": "compliance", "from": "person", "text": "A person sent it back at the Release gate: Sent back on the pre-release check.\nSend back: Backend #1. Price-adjustment refunds need CFO approval."},
        {"seq": 8, "at": at(700), "kind": "bounce", "role": "backend1", "from": "compliance", "text": "As the person said, sent back to Backend #1"},
        {"seq": 9, "at": at(701), "kind": "spawned", "role": "backend1", "from": None, "text": "Backend #1, round 2"},
        {"seq": 10, "at": at(720), "kind": "bounce", "role": "backend1", "from": "tests", "text": "AC-7 failed, sent back to Backend #1"},
        {"seq": 11, "at": at(800), "kind": "gate", "role": "compliance", "from": "compliance", "text": "Waiting for approval: Release"},
        {"seq": 12, "at": at(900), "kind": "approved", "role": "compliance", "from": "person", "text": "A person approved Release"},
        {"seq": 13, "at": at(901), "kind": "spawned", "role": "deploy", "from": None, "text": "Assigned"},
        {"seq": 14, "at": at(950), "kind": "deployed", "role": "deploy", "from": None, "text": "Deployed locally"},
    ]
    run.s.update(status="done", ended_at=at(960))
    run.lane("deploy")["deployed"] = {"url": "http://127.0.0.1:8090/", "at": at(950)}
    f = cto.flow(run, ev, at(1500))  # delivered, not signed yet: it waits for the signature
    got = [(x["from"], x["to"], x["who"], x["col"], x["label"], x["decision"]) for x in f["segments"]]
    assert got == [(0.0, 50.0, "agent", "Inception", "Inception", None), (50.0, 250.0, "person", "Inception", "Awaiting approval \u00b7 Requirements gate", "Approved"),
                   (251.0, 500.0, "agent", "Construction", "Construction", None), (500.0, 700.0, "person", "Operation", "Awaiting approval \u00b7 Release gate", "Sent back"),
                   (701.0, 800.0, "agent", "Construction", "Rework", None), (800.0, 900.0, "person", "Operation", "Awaiting approval \u00b7 Release gate", "Approved"),
                   (901.0, 960.0, "agent", "Operation", "Operation", None), (960.0, 1500.0, "person", "Operation", "Sign-off", None)]
    assert f["segments"][2]["roles"] == ["backend1", "tester"] and f["segments"][2]["phase"] == "construction"
    assert [m["key"] for m in f["team"]] == run.order and f["team"][0] == {"key": "product", "title": "Product manager", "icon": run.roles["product"].get("icon") or "product", "skipped": False, "credits": 0}
    assert [m["kind"] for m in f["marks"]] == ["gate", "approved", "gate", "bounce", "check", "gate", "approved", "deployed"]
    assert f["sent_back"] == {"person": 1, "review": 0, "checks": 1} and f["rework"] == 1 and f["gates"] == 3
    assert (f["agent_s"], f["person_s"]) == (457.0, 1040.0) and f["end"] == 960.0
    assert [(d["at"], d["gate"], d["note"]) for d in f["decisions"]] == [
        (250.0, "Approved Requirements", "One more rule: at most 2 units per person per product."), (700.0, "Sent back Release", "Price-adjustment refunds need CFO approval."),
        (900.0, "Approved Release", "No further comment")]
    assert [m["label"] for m in f["marks"]][:3] == ["Requirements gate: awaiting approval", "Approved Requirements", "Release gate: awaiting approval"]
    run.s["signoff"] = {"by": "Head of R&D", "note": "", "at": at(1200), "tests": "37/37", "merged": "abc1234"}
    f = cto.flow(run, ev, at(1500))
    assert f["segments"][-1]["to"] == 1200.0 and f["segments"][-1]["decision"] == "Signed" and f["end"] == 1200.0
    assert [m["label"] for m in f["marks"]][-2:] == ["Head of R&D signed off", f"PR #{f['pr']['number']} merged into main"]
    assert [m["kind"] for m in f["marks"]][-2:] == ["signoff", "merged"] and f["pr"]["state"] == "merged"
    run.s["decisions"] = [["Approved Requirements", "Limit per person"], ["Sent back Release", "Price protection"], ["Approved Release", "Reserve $40k"]]  # an imported run's own words
    assert [d["note"] for d in cto.flow(run, ev, at(1500))["decisions"]] == ["Limit per person", "Price protection", "Reserve $40k"]


def test_the_offline_page_carries_the_data_and_when_it_was_made(tmp_path):
    page = tmp_path / "offline.html"
    page.write_text('<html data-snapshot=""><script id="data" type="application/json">/*__DATA__*/{}</script></html>')
    data = {"meta": {"today": "2026-10-20"}, "items": [{"t": "</script><b>"}], "wip": []}
    out = cto.offline(data, generated="2026-10-20 12:00", path=page)
    assert out["name"] == "CTO-view-offline-2026-10-20.html"
    assert 'data-snapshot="2026-10-20 12:00"' in out["html"] and "<\\/script><b>" in out["html"]
    shipped = cto.OFFLINE.read_text(encoding="utf-8")
    assert 'data-snapshot=""' in shipped and "/*__DATA__*/{}" in shipped


def test_the_shipped_history_is_the_data_the_page_reads():
    h = json.loads(cto.HISTORY.read_text(encoding="utf-8"))
    assert {"today", "agentStart", "weeks", "lines", "peoplePerLine", "eq", "human", "dayRate", "currency", "seatUsdMonth", "fx", "months"} <= set(h["meta"])
    assert h["meta"]["currency"] == "USD" and h["meta"]["company"] == "Larkspur Outfitters"
    assert h["meta"]["lines"] == list(delivery.LINES) and len(h["meta"]["weeks"]) == 24
    assert {i["kind"] for i in h["items"]} == {"app", "feat", "fix"} and {i["size"] for i in h["items"]} == {"S", "M", "L"}
    assert {i["period"] for i in h["items"]} == {"base", "agent"} and not any(i["real"] for i in h["items"])
    assert {w["state"] for w in h["wip"]} == {"pool", "agent", "wait"}
    assert all(0 <= i["line"] < len(delivery.LINES) for i in h["items"] + h["wip"])
    issues = {i["issue"]: i for i in h["items"] + h["wip"]}
    assert len(issues) == len(h["items"]) + len(h["wip"]) and all(i["reporter"] for i in issues.values())
    assert all(i["created"] <= i["ship"] for i in h["items"]) and len({i["pr"] for i in h["items"]}) == len(h["items"])
    assert all(k.startswith("LO-") and int(k[3:]) < 3000 for k in issues) and all(i["pr"] < 5000 for i in h["items"])  # apart from the runs' own
    linked = [(i, issues[d]) for i in h["items"] for d in i.get("defects", [])]
    assert linked and all(f["origin"] == i["issue"] and f["kind"] == "fix" and f["ship"] > i["ship"] for i, f in linked)
    assert not re.search(r"[\u4e00-\u9fff]", cto.HISTORY.read_text(encoding="utf-8"))  # the example company's data is English
