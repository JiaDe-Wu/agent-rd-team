"""The sequencer against a fake SubagentManager, real git in a temp dir and a fake test runner."""

import asyncio
from pathlib import Path

import json

from teamkit import (FIXTURE, FakeManager, act, default_tests, drive, finish, make_run, mini_team, mod, read, reload,
                     richest, same_shape, sh, team_mod, ts_types)

TAG = "[agent-rd-team run=r1006test role="


def kinds(run, kind):
    return [e for e in run.events if e["kind"] == kind]


def status(run):
    return {k: run.lane(k)["status"] for k in run.order}


def check_board(run, mgr):
    """The board of a real run is shaped like the UI fixture, with values from the TS unions."""
    out = json.loads(json.dumps(mod("board").build({run.rid: run}, None, mgr=mgr, scrub=str, now=1.0)))
    ref = json.loads(FIXTURE.read_text(encoding="utf-8"))
    same_shape({k: v for k, v in out["run"].items() if k != "roles"}, {k: v for k, v in ref["run"].items() if k != "roles"})
    for lane in out["run"]["roles"]:
        same_shape(lane, richest(ref["run"]["roles"]), f"lane {lane['key']}")
    _, unions = ts_types()
    assert out["run"]["status"] in unions["RunStatus"] and {e["kind"] for e in out["run"]["events"]} <= unions["TeamEventKind"]
    assert {ln["status"] for ln in out["run"]["roles"]} <= unions["LaneStatus"]
    return out


def test_full_run_parallel_stages_merges_bounce_conflict_and_review(tmp_path):
    async def go():
        mgr, tests = FakeManager(), default_tests()
        run = make_run(tmp_path, mgr, tests, requirement="Event sign-up site\n\n1. The home page lists all events.")
        await run.tick()
        assert run.s["status"] == "running" and run.s["base"]
        repo = Path(run.s["repo"])
        assert "1. The home page lists all events." in read(repo, "README.md")
        assert sh(repo, "log", "-1", "--format=%s").strip() == "Requirement: Event sign-up site"
        [(pm_id, pm_task, kw)] = mgr.spawned
        assert pm_task.startswith(TAG + "pm branch=team/r1006test/pm worktree=")
        assert kw["cwd"].endswith("/wt/pm") and kw["parent_session_key"] == "agent-rd-team:r1006test"
        assert kw["model"] == "claude-opus-5.5" and kw["folder"].endswith(" · r1006test") and kw["title"].endswith(" agent")
        assert "docs/product/**" in pm_task and "Write the requirement in the README" in pm_task

        act(mgr.get(pm_id), {"docs/product/acceptance.md": "AC-1\nAC-6\n"})
        finish(mgr.get(pm_id), "2 acceptance criteria")
        await run.tick()  # pm merged; architect and designer start together
        assert [mgr.role_of(a) for a in mgr.live()] == ["architect", "designer"]
        assert [(e["from"], e["to"]) for e in kinds(run, "handoff")] == [("pm", "architect"), ("pm", "designer")]
        assert run.lane("pm")["status"] == "merged" and run.lane("pm")["summary"] == "2 acceptance criteria"
        assert "docs/product/acceptance.md" in mgr.by_role("architect").task  # upstream outputs are its inputs

        act(mgr.by_role("architect"), {"contracts/api.md": "# API\n"})
        finish(mgr.by_role("architect"))
        act(mgr.by_role("designer"), {"docs/design/pages.md": "# Pages\n", "frontend/styles/main.css": "a{}\n"}, commit=False)
        await run.tick()  # architect merged: tester and ops start; designer still works
        assert sorted(mgr.role_of(a) for a in mgr.live()) == ["designer", "ops", "tester"]
        assert run.lane("designer")["lines"]["added"] == 2  # uncommitted work shows up live

        finish(mgr.by_role("designer"))
        await run.tick()
        assert run.lane("designer")["status"] == "merged"
        assert any("The app committed 2 files for UI design" in e["text"] for e in kinds(run, "committed"))
        assert tests.calls == 0  # nothing to test yet

        act(mgr.by_role("tester"), {"tests/api-signup.test.js": "//\n", "tests/web-render.test.js": "//\n"})
        finish(mgr.by_role("tester"), "2 tests, all red")
        await run.tick()  # tester merged: backend and frontend start, ops still works; the app tests the run branch
        assert sorted(mgr.role_of(a) for a in mgr.live()) == ["backend", "frontend", "ops"]
        assert tests.calls == 1 and kinds(run, "tests")[-1]["text"] == "Tests 0/2: nothing implemented yet, all red"
        assert not kinds(run, "bounce")

        backend1, frontend1 = mgr.by_role("backend"), mgr.by_role("frontend")
        act(backend1, {"backend/server.js": "// v1\n"})
        finish(backend1)
        act(frontend1, {"frontend/index.html": "<h1/>\n", "backend/server.js": "// changed by the frontend in passing\n"})
        act(mgr.by_role("ops"), {"ops/start.sh": "x\n", "Dockerfile": "FROM node\n"})
        finish(mgr.by_role("ops"))
        await run.tick()  # backend and ops merged, AC-6 red; nobody is sent back while the frontend is not in
        assert run.lane("ops")["status"] == "merged" and run.lane("backend")["status"] == "merged"
        assert tests.calls == 2 and run.s["tests"]["failed"] == 2 and not kinds(run, "bounce")
        assert [e["text"] for e in kinds(run, "violation")] == ["Frontend changed backend/server.js, which is outside its area"]  # seen live
        lanes = {ln["key"]: ln for ln in check_board(run, mgr)["run"]["roles"]}
        assert lanes["frontend"]["violations"] == ["backend/server.js"] and lanes["frontend"]["files"]

        finish(frontend1)
        await run.tick()  # frontend conflicts on backend/server.js: aborted, recorded, sent back
        assert [m["status"] for m in run.s["merges"] if m["role"] == "frontend"] == ["conflict"]
        assert run.s["merges"][-1]["note"] == "backend/server.js"
        assert kinds(run, "conflict")[0]["text"] == "Frontend merge conflict: backend/server.js"
        [bounce] = kinds(run, "bounce")
        assert (bounce["from"], bounce["to"]) == ("run", "frontend")
        assert run.lane("frontend")["violations"] == ["backend/server.js"] and len(kinds(run, "violation")) == 1
        assert not sh(run.s["run_wt"], "status", "--porcelain")  # the merge was aborted cleanly
        [(conv, frontend2_id, conflict_task, ckw)] = mgr.continued
        assert conv == frontend1.id and ckw["cwd"] == frontend1.cwd
        assert "Conflicting files: backend/server.js" in conflict_task and "git rm" in conflict_task
        assert tests.calls == 2 and run.s["status"] == "fixing"

        act(mgr.get(frontend2_id), {"backend/server.js": None}, msg="[frontend] leave the backend file alone")
        finish(mgr.get(frontend2_id))
        await run.tick()  # frontend merged, every implementation is in: AC-6 goes back into the backend's conversation
        assert run.lane("frontend")["status"] == "merged" and run.s["tests"]["failed"] == 1
        bounce = kinds(run, "bounce")[-1]
        assert (bounce["from"], bounce["to"], bounce["text"]) == ("tests", "backend", "AC-6 failed, sent back to Backend")
        assert bounce["data"] == {"cases": ["AC-6"]}
        assert run.lane("backend")["status"] == "fixing" and run.lane("backend")["attempt"] == 2
        conv, backend2_id, fix_task, ckw = mgr.continued[-1]
        assert conv == backend1.id and ckw["cwd"] == backend1.cwd
        assert fix_task.startswith(TAG + "backend ") and fix_task.split("\n", 1)[0].endswith(" attempt=2]")
        assert "AC-6: case (tests/api-signup.test.js): expected 409, got 201" in fix_task
        assert "fast-forwarded your branch to the latest commit of the run branch" in fix_task  # its branch caught up: the tests and the frontend are in its worktree
        assert read(Path(backend1.cwd), "frontend/index.html") and read(Path(backend1.cwd), "tests/api-signup.test.js")
        lanes = {ln["key"]: ln for ln in check_board(run, mgr)["run"]["roles"]}
        assert lanes["backend"]["status"] == "fixing" and lanes["backend"]["agent"]["id"] == backend2_id

        backend2 = mgr.get(backend2_id)
        act(backend2, {"backend/server.js": "// v2\n"})
        finish(backend2, "capacity check changed to >=")
        await run.tick()  # backend merged, all green; the reviewer waits for the next tick
        assert kinds(run, "tests")[-1]["text"] == "Tests 2/2: all green"
        assert run.lane("reviewer")["status"] == "waiting"
        await run.tick()
        reviewer = mgr.by_role("reviewer")
        # a snapshot of the run branch of its own: merges going on meanwhile do not change what it reads
        assert reviewer.cwd.endswith("/wt/reviewer") and "You are read-only" in reviewer.task and "git add" not in reviewer.task
        assert sh(Path(reviewer.cwd), "rev-parse", "HEAD") == sh(Path(run.s["run_wt"]), "rev-parse", "HEAD")
        assert run.s["status"] == "reviewing"
        finish(reviewer, "ready to deliver")
        await run.tick()
        assert run.s["status"] == "done" and run.ended
        assert kinds(run, "review")[0]["text"] == "Review: ready to deliver"
        assert kinds(run, "run")[-1]["text"] == "Run complete: the review says it can be delivered"
        assert [m["role"] + ":" + m["status"] for m in run.s["merges"]] == [
            "pm:merged", "architect:merged", "designer:merged", "tester:merged", "backend:merged", "ops:merged",
            "frontend:conflict", "frontend:merged", "backend:merged"]
        assert set(status(run).values()) == {"merged", "done"}
        assert [e["seq"] for e in run.events] == list(range(1, len(run.events) + 1))
        end = check_board(run, mgr)["run"]
        assert [h["passed"] for h in end["tests"]["history"]] == [0, 0, 1, 2]  # no test run when a merge conflicted
        assert end["merges"][6]["status"] == "conflict" and end["roles"][-1]["agent"]["id"] == reviewer.id
        assert read(Path(run.s["run_wt"]), "backend/server.js") == "// v2\n"
        lane = run.lane("backend")
        assert [a["kind"] for a in lane["attempts"]] == ["work", "fix"] and lane["summary"] == "capacity check changed to >="
        assert {c["subject"] for c in lane["commits"]} == {"[agent] work"} and len(lane["commits"]) == 2
        assert lane["files"] == [{"path": "backend/server.js", "added": 2, "removed": 1, "status": "A"}]  # both rounds
        assert lane["violations"] == [] and lane["lines"] == {"added": 2, "removed": 1}

    asyncio.run(go())


def test_restart_mid_run_then_the_reviewer_saying_needs_changes_fails_the_run(tmp_path):
    async def go():
        mgr, tests = FakeManager(), default_tests()
        run = make_run(tmp_path, mgr, tests, team=mini_team())
        await run.tick()
        act(mgr.by_role("pm"), {"docs/product/x.md": "x\n"})
        finish(mgr.by_role("pm"))
        await run.tick()
        assert sorted(mgr.role_of(a) for a in mgr.live()) == ["backend", "frontend"]
        spawned = len(mgr.spawned)
        again = reload(tmp_path, mgr, tests)  # a fresh TeamRun from run.json, as after an app restart
        assert again.events[-1]["seq"] == run.events[-1]["seq"]
        await again.tick()
        assert len(mgr.spawned) == spawned and status(again)["backend"] == "running"  # found again by id
        act(mgr.by_role("backend"), {"backend/server.js": "// v2\n"})
        finish(mgr.by_role("backend"))
        await again.tick()
        assert again.lane("backend")["status"] == "merged" and again.s["tests"]["passed"] == 1
        assert again.events[-1]["seq"] > run.events[-1]["seq"]

        def behave(a, role):
            if role == "reviewer":
                finish(a, "changes needed: the backend does not validate the email (Backend)")
            else:
                act(a, {"frontend/index.html": "<h1/>\n"})
                finish(a)

        await drive(again, mgr, behave)
        assert again.s["status"] == "failed" and again.lane("reviewer")["status"] == "done"
        assert again.lane("reviewer")["summary"] == "changes needed: the backend does not validate the email (Backend)"
        assert kinds(again, "run")[-1]["text"] == "Run ended: the review asks for changes"

    asyncio.run(go())


def test_a_spawn_whose_id_was_never_saved_is_adopted_not_started_twice(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr)
        await run.tick()
        [(pm_id, _, _)] = mgr.spawned
        run.lane("pm")["attempts"][-1]["agent"] = None  # as if the app stopped between the spawn and the save
        await run.save()
        again = reload(tmp_path, mgr, default_tests())
        await again.tick()
        assert len(mgr.spawned) == 1 and again.lane("pm")["attempts"][-1]["agent"] == pm_id
        assert again.lane("pm")["status"] == "running"

    asyncio.run(go())


def test_stop_cancels_every_live_agent(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr)
        await run.tick()
        finish(mgr.by_role("pm"))
        await run.tick()
        live = sorted(a.id for a in mgr.live())
        assert len(live) == 2
        assert await run.stop() is True
        assert sorted(mgr.cancelled) == live and not mgr.live()
        assert run.s["status"] == "stopped" and run.s["ended_at"]
        assert status(run)["architect"] == "failed" and status(run)["tester"] == "waiting"
        assert run.events[-1]["text"] == "Run stopped"
        n = len(mgr.spawned)
        await run.tick()
        assert len(mgr.spawned) == n and await run.stop() is False
        assert reload(tmp_path, mgr, default_tests()).s["status"] == "stopped"

    asyncio.run(go())


def test_fix_rounds_run_out_in_fresh_agents_when_continuing_is_impossible(tmp_path):
    async def go():
        mgr = FakeManager()
        mgr.gone = True  # every continuation answers conversation_gone: a fresh agent, same worktree
        run = make_run(tmp_path, mgr, team=mini_team())
        heads = []

        def behave(a, role):
            if role == "backend":
                heads.append((a.cwd, a.task.split("\n", 1)[0]))
                act(a, {"backend/server.js": f"// v1 {a.id}\n"})  # never fixes AC-6
            elif role == "frontend":
                act(a, {"frontend/index.html": "<h1/>\n"})
            finish(a, "ready to deliver" if role == "reviewer" else "did it")

        await drive(run, mgr, behave)
        lane = run.lane("backend")
        assert lane["attempt"] == 3 and [a["kind"] for a in lane["attempts"]] == ["work", "fix", "fix"]
        assert len({cwd for cwd, _ in heads}) == 1 and [h.endswith("attempt=3]") for _, h in heads] == [False, False, True]
        assert [a["conv"] for a in lane["attempts"]] == [a["agent"] for a in lane["attempts"]]  # each one fresh
        assert len([e for e in kinds(run, "bounce") if e["to"] == "backend"]) == 2
        assert run.s["tests"]["failed"] == 1 and run.lane("reviewer")["status"] == "done"
        assert run.s["status"] == "done"

    asyncio.run(go())


def test_tests_that_cannot_run_stop_the_run_instead_of_bouncing(tmp_path):
    async def go():
        async def no_node(wt, team):
            raise mod("checks").TestsUnavailable("Cannot run node (/nope): No such file")

        mgr = FakeManager()
        run = make_run(tmp_path, mgr, no_node, team=mini_team())
        await run.tick()
        finish(mgr.by_role("pm"))
        await run.tick()
        act(mgr.by_role("backend"), {"backend/server.js": "//\n"})
        finish(mgr.by_role("backend"))
        await run.tick()
        assert run.s["status"] == "failed" and kinds(run, "run")[-1]["text"].startswith("Run failed: the app cannot run the tests")
        assert not mgr.live() and not kinds(run, "bounce") and mgr.cancelled == [mgr.by_role("frontend").id]

    asyncio.run(go())


def test_refused_spawn_fails_the_lane_and_the_stuck_run(tmp_path):
    async def go():
        mgr = FakeManager()
        mgr.refuse = "spawn refused: cwd is not under any allowed root"
        run = make_run(tmp_path, mgr)
        await run.tick()
        assert run.lane("pm")["status"] == "failed" and run.s["status"] == "failed"
        assert "cwd is not under any allowed root" in kinds(run, "failed")[0]["text"]
        assert kinds(run, "run")[-1]["text"].startswith("Run failed: Product manager did not finish")

    asyncio.run(go())


def test_a_lost_agent_fails_after_the_grace(tmp_path):
    async def go():
        clock = [1_000_000.0]
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, now=lambda: clock[0])
        await run.tick()
        att = run.lane("pm")["attempts"][-1]
        assert att["agent"] and run.lane("pm")["status"] == "running"
        del mgr.agents[att["agent"]]
        await run.tick()
        assert run.lane("pm")["status"] == "running"
        clock[0] += team_mod.LOST_GRACE_S + 1
        await run.tick()
        assert run.lane("pm")["status"] == "failed" and run.s["status"] == "failed"

    asyncio.run(go())


def test_live_status_follows_kirocrew_and_tool_events_are_throttled(tmp_path):
    async def go():
        clock = [2_000_000.0]
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, now=lambda: clock[0])
        await run.tick()
        pm = mgr.by_role("pm")
        pm.queued, pm.queued_reason = True, "concurrency_limit"
        await run.tick()
        assert run.lane("pm")["status"] == "queued"
        pm.queued, pm._awaiting_approval = False, True
        await run.tick()
        assert run.lane("pm")["status"] == "awaiting_approval"
        pm._awaiting_approval, pm.stalled = False, True
        await run.tick()
        assert run.lane("pm")["status"] == "stalled"
        pm.stalled, pm.last_tool = False, "Editing docs/product/acceptance.md"
        await run.tick()
        pm.last_tool = "Running: ls"
        clock[0] += 1
        await run.tick()  # within 3 s of the last tool event: not repeated
        clock[0] += 3
        await run.tick()
        assert [e["text"] for e in kinds(run, "tool")] == ["Product manager: Editing docs/product/acceptance.md", "Product manager: Running: ls"]
        assert run.lane("pm")["status"] == "running"

    asyncio.run(go())


def test_parse_done_and_title():
    assert team_mod.parse_done("Thinking.\n**DONE: ready to deliver**\n") == "ready to deliver"
    assert team_mod.parse_done("DONE: first\n...\nDONE：second") == "second"
    assert team_mod.parse_done("no summary") is None
    assert team_mod.title_of("\n# Book club sign-up\nmore", Path("/nonexistent")) == "Book club sign-up"



def test_a_fix_round_that_changes_nothing_is_not_merged_or_sent_back_again(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, team=mini_team())

        def behave(a, role):
            if role == "backend":
                if " attempt=" in a.task.split("\n", 1)[0]:
                    finish(a, "AC-6 the file to change is not mine")  # changes nothing
                    return
                act(a, {"backend/server.js": "// v1\n"})
            elif role == "frontend":
                act(a, {"frontend/index.html": "<h1/>\n"})
            finish(a, "changes needed: AC-6 failed" if role == "reviewer" else "did it")

        await drive(run, mgr, behave)
        lane = run.lane("backend")
        assert [a["kind"] for a in lane["attempts"]] == ["work", "fix"] and lane["stuck"] is True
        assert [m["role"] for m in run.s["merges"]].count("backend") == 1
        assert len([e for e in kinds(run, "bounce") if e["to"] == "backend"]) == 1
        assert "Backend, round 2, changed nothing: AC-6 the file to change is not mine" in [e["text"] for e in kinds(run, "failed")]
        assert run.lane("reviewer")["status"] == "done" and run.s["status"] == "failed"  # the reviewer said changes needed

    asyncio.run(go())


def test_a_reply_without_done_still_gets_a_summary():
    assert team_mod.gist("## OK\n\n**Backend is done**: the API works\n- details") == "Backend is done: the API works"
    assert team_mod.gist("```\n|a|b|\n```\n") is None and team_mod.gist("") is None
    assert team_mod.gist("x" * 130).endswith("…")


def test_the_team_routes_project_checks_to_ops_and_the_demo_test_script_takes_a_glob():
    constants, checks, gitwork = mod("constants"), mod("checks"), mod("gitwork")
    team = team_mod.load_team(constants.TEAM_FILE)
    assert checks.owner_of("tests/ops-scripts.test.js", team) == "ops"
    assert checks.owner_of("tests/api-signup.test.js", team) == "backend"
    ops = next(r for r in team["roles"] if r["key"] == "ops")
    assert gitwork.matches("package.json", ops["writable"])
    pkg = json.loads((constants.TARGET_TEMPLATE / "package.json").read_text(encoding="utf-8"))
    assert "tests/**/*.test.js" in pkg["scripts"]["test"]  # node 22+ does not take a directory there


def qa_team() -> dict:
    """pm → tester ∥ backend → reviewer: the tester writes tests/api-*, the backend makes them pass."""
    role = lambda key, title, deps, writable: {"key": key, "title": title, "emoji": "", "depends_on": deps,  # noqa: E731
                                               "writable": writable, "outputs": [], "brief": f"{title}'s work"}
    return team_mod.check_team({
        "version": 1, "test_command": ["node", "--test", "tests/"],
        "roles": [role("pm", "Product manager", [], ["docs/product/**"]), role("tester", "Testing", ["pm"], ["tests/api-*"]),
                  role("backend", "Backend", ["pm"], ["backend/**"]), role("reviewer", "Review", ["tester", "backend"], [])],
        "defaults": {"model": "claude-opus-5.5", "effort": "high", "max_fix_rounds": 2},
        "test_owners": [{"glob": "tests/api-*", "role": "backend"}],
    })


def test_a_test_the_implementer_says_is_wrong_goes_back_to_its_author_and_the_end_says_how_green_it_is(tmp_path):
    from teamkit import FakeTests

    # AC-10 passes once the tester stops sharing state between cases (its file says "fresh")
    tests = FakeTests([("api-orders.test.js#AC-10", "backend", lambda wt: "fresh" in read(wt, "tests/api-orders.test.js"))])

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, tests, team=qa_team())
        seen = []

        def behave(a, role):
            head = a.task.split("\n", 1)[0]
            if role == "backend":
                if " attempt=" in head:
                    finish(a, "No change: AC-10 fails because of the test itself, the cases share one server")
                    return
                act(a, {"backend/server.js": "// v1\n"})
            elif role == "tester":
                if " attempt=" in head:
                    seen.append(a.task)
                    act(a, {"tests/api-orders.test.js": "// AC-10 fresh server per case\n"})
                else:
                    act(a, {"tests/api-orders.test.js": "// AC-10 shared server\n"})
            elif role == "pm":
                act(a, {"docs/product/acceptance.md": "AC-10\n"})
            finish(a, "ready to deliver" if role == "reviewer" else "did it")

        await drive(run, mgr, behave)
        bounces = [e["text"] for e in kinds(run, "bounce")]
        assert any("say the tests themselves are wrong, sent back to Testing" in t for t in bounces), bounces
        assert seen and "you wrote these tests" in seen[0] and "because of the test itself, the cases share one server" in seen[0]
        assert run.s["tests"]["failed"] == 0 and run.s["status"] == "done"
        assert kinds(run, "run")[-1]["text"] == "Run complete: the review says it can be delivered"

    asyncio.run(go())


def test_a_run_that_ends_red_says_so(tmp_path):
    from teamkit import FakeTests

    tests = FakeTests([("api-orders.test.js#AC-10", "backend", lambda wt: False)])  # nobody can turn it green

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, tests, team=qa_team())

        def behave(a, role):
            if role in ("backend", "tester"):
                act(a, {"backend/server.js" if role == "backend" else "tests/api-orders.test.js": f"// {a.id}\n"})
            elif role == "pm":
                act(a, {"docs/product/acceptance.md": "AC-10\n"})
            finish(a, "ready to deliver" if role == "reviewer" else "did it")

        await drive(run, mgr, behave, ticks=80)
        assert run.s["status"] == "done"
        assert kinds(run, "run")[-1]["text"] == "Run ended: the review says ready to deliver, but 1 test(s) still fail, left to a person"
        reviewer_task = run.lane("reviewer")["attempts"][-1]["task"]
        assert "The tests the app just ran: 0/1 passed; failing: AC-10: case" in reviewer_task

    asyncio.run(go())


def deploy_team() -> dict:
    """pm → backend → reviewer → deploy: the deployment comes after the review lets the work through."""
    role = lambda key, title, deps, writable, **kw: {"key": key, "title": title, "emoji": "", "depends_on": deps,  # noqa: E731
                                                     "writable": writable, "outputs": [], "brief": f"{title}'s work", **kw}
    return team_mod.check_team({
        "version": 1, "test_command": ["node", "--test", "tests/"],
        "roles": [role("pm", "Product manager", [], ["docs/product/**"]), role("backend", "Backend", ["pm"], ["backend/**"]),
                  role("reviewer", "Review", ["backend"], []),
                  role("deploy", "Deploy", ["reviewer"], ["deploy/**"], deploy={"mode": "local", "port": 8080})],
        "defaults": {"model": "claude-opus-5.5", "effort": "high", "max_fix_rounds": 2},
        "test_owners": [{"glob": "tests/api-*", "role": "backend"}],
    })


def test_the_deploy_role_runs_after_the_review_and_the_app_deploys_what_it_configured(tmp_path):
    from teamkit import FakeTests, make_deps

    tests = FakeTests([("api-x.test.js#AC-1", "backend", lambda wt: "v1" in read(wt, "backend/server.js"))])
    calls = []

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, tests, team=deploy_team())

        async def deploy(rid, wt, spec):
            calls.append((rid, read(wt, "deploy/local.json"), spec["port"]))
            if len(calls) == 1:
                return {"ok": False, "error": "health check GET /api/products returned 404, not 200"}
            return {"ok": True, "url": "http://127.0.0.1:8080/", "note": ""}

        run.d.deploy = deploy
        order = []

        def behave(a, role):
            order.append(role)
            if role == "backend":
                act(a, {"backend/server.js": "// v1\n"})
            elif role == "pm":
                act(a, {"docs/product/acceptance.md": "AC-1\n"})
            elif role == "deploy":
                act(a, {"deploy/local.json": '{"port": 8080, "health": "/api/products"}\n' if " attempt=" in a.task.split("\n", 1)[0] else '{"port": 8080}\n'})
            finish(a, "ready to deliver" if role == "reviewer" else "did it")

        await drive(run, mgr, behave)
        assert order.index("reviewer") < order.index("deploy")  # the review first, and it did not end the run
        assert len(calls) == 2 and '"health"' in calls[1][1]  # the first deployment failed and went back to the role
        assert any("Deploy failed, sent back to Deploy" in e["text"] for e in kinds(run, "bounce"))
        assert run.lane("deploy")["deployed"]["url"] == "http://127.0.0.1:8080/"
        assert [e["text"] for e in kinds(run, "deployed")] == ["Deployed locally: http://127.0.0.1:8080/ (the orchestrator started the service from the configuration Deploy wrote; health check passed)"]
        assert run.s["status"] == "done" and kinds(run, "run")[-1]["text"] == "Run complete: Review says ready to deliver, deployed locally at http://127.0.0.1:8080/"

    asyncio.run(go())


def test_nothing_red_is_deployed(tmp_path):
    from teamkit import FakeTests

    tests = FakeTests([("api-x.test.js#AC-1", "backend", lambda wt: False)])

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, tests, team=deploy_team())
        run.d.deploy = lambda *a: (_ for _ in ()).throw(AssertionError("must not deploy"))

        def behave(a, role):
            if role == "backend":
                act(a, {"backend/server.js": f"// {a.id}\n"})
            elif role == "pm":
                act(a, {"docs/product/acceptance.md": "AC-1\n"})
            finish(a, "ready to deliver" if role == "reviewer" else "did it")

        await drive(run, mgr, behave, ticks=80)
        assert run.lane("deploy")["status"] == "waiting" and run.s["status"] == "done"
        assert kinds(run, "run")[-1]["text"] == "Run ended: Review says ready to deliver, but 1 test(s) still fail, not deployed, left to a person"

    asyncio.run(go())


def test_a_person_signs_a_review_off_at_its_gate_and_can_send_work_back_to_a_named_member(tmp_path):
    from teamkit import FakeTests

    tests = FakeTests([("api-x.test.js#AC-1", "backend", lambda wt: "v1" in read(wt, "backend/server.js"))])
    team = deploy_team()
    reviewer = next(r for r in team["roles"] if r["key"] == "reviewer")
    reviewer.update(gate="human", gate_label="Compliance")

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, tests, team=team)
        deployed = []

        async def deploy(rid, wt, spec):
            deployed.append(read(wt, "backend/server.js"))
            return {"ok": True, "url": "http://127.0.0.1:8080/", "note": ""}

        run.d.deploy = deploy
        tasks = []

        async def until(cond, ticks=40):
            for _ in range(ticks):
                await run.tick()
                if cond():
                    return
                for a in mgr.live():
                    role = mgr.role_of(a)
                    tasks.append((role, a.task))
                    if role == "backend":
                        act(a, {"backend/server.js": "// v1\n" if "the owner sent it back" not in a.task else "// v1\n// for Administration use only\n"})
                    elif role == "pm":
                        act(a, {"docs/product/acceptance.md": "AC-1\n"})
                    elif role == "deploy":
                        act(a, {"deploy/local.json": '{"port": 8080, "health": "/"}\n'})
                    finish(a, "ready to deliver" if role == "reviewer" else "did it")
            raise AssertionError(run.s["status"])

        await until(lambda: run.lane("reviewer").get("gate") == "pending")
        assert run.lane("deploy")["status"] == "waiting" and not run.ended  # nothing goes out before the person signs
        assert not await run.gate("reviewer", "revise", "Sent back on the risk note.")  # sending back has to name whom
        assert await run.gate("reviewer", "revise", "Sent back on risk note 2.\nSend back: Backend. Add one line on who may use it.")
        assert any(e["text"] == "As the person said, sent back to Backend" for e in kinds(run, "bounce"))
        await until(lambda: run.lane("reviewer").get("gate") == "pending" and run.lane("reviewer")["attempt"] == 2)
        fix = next(t for r, t in tasks if r == "backend" and "the owner sent it back" in t)
        assert "Add one line on who may use it" in fix and "send it back to you (Backend)" in fix
        again = [t for r, t in tasks if r == "reviewer"][-1]
        assert "the owner sent it back at the gate" in again and "Add one line on who may use it" in again
        assert await run.gate("reviewer", "approve", "Approved for release. The export list goes to Administration only.")
        await until(lambda: run.ended)
        assert deployed and "for Administration use only" in deployed[-1]  # what went out is what the person sent back for
        assert run.s["status"] == "done" and run.s["gate_notes"]["reviewer"] == "Approved for release. The export list goes to Administration only."

    asyncio.run(go())


def optional_team() -> dict:
    """pm (gated, writes the assignment proposal) → backend ∥ motion (an optional post) → reviewer."""
    role = lambda key, title, deps, writable, **kw: {"key": key, "title": title, "emoji": "", "depends_on": deps,  # noqa: E731
                                                     "writable": writable, "outputs": [], "brief": f"{title}'s work", **kw}
    return team_mod.check_team({
        "version": 1, "test_command": ["node", "--test", "tests/"],
        "roles": [role("pm", "Product manager", [], ["docs/product/**"], gate="human", gate_label="Requirements", plan="docs/product/plan.json",
                       member="aidlc-product-agent"),
                  role("backend", "Backend", ["pm"], ["backend/**"], member="aidlc-developer-agent"),
                  role("motion", "Motion", ["pm"], ["web/motion/**"], optional=True, member="taoyuan-motion-agent"),
                  role("reviewer", "Review", ["backend", "motion"], [])],
        "defaults": {"model": "claude-opus-5.5", "effort": "high", "max_fix_rounds": 2},
        "test_owners": [{"glob": "tests/api-*", "role": "backend"}, {"glob": "tests/ux-motion*", "role": "motion"}],
    })


def optional_tests():
    from teamkit import FakeTests
    return FakeTests([("api-x.test.js#AC-1", "backend", lambda wt: "v1" in read(wt, "backend/server.js")),
                      ("ux-motion.test.js#UX-1", "motion", lambda wt: "flip" in read(wt, "web/motion/motion.js"))])


async def until(run, mgr, behave, cond, ticks=40):
    """Tick until *cond*; every live agent does its role's work (*behave*) in between."""
    for _ in range(ticks):
        await run.tick()
        if cond():
            return
        for a in mgr.live():
            behave(a, mgr.role_of(a))
    raise AssertionError(run.s["status"])


def test_an_optional_member_not_on_crew_sits_the_run_out_and_its_checks_are_not_run(tmp_path):
    tasks = []

    def behave(a, role):
        tasks.append((role, a.task))
        if role == "pm":
            act(a, {"docs/product/plan.json": '{"backend": "the API", "motion": "countdown flip"}\n'})
        elif role == "backend":
            act(a, {"backend/server.js": "// v1\n"})
        finish(a, "ready to deliver" if role == "reviewer" else "did it")

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, optional_tests(), team=optional_team())
        assert run.leave_out_unhired(None) == []  # Crew not read: everyone stays in
        assert run.leave_out_unhired({"aidlc-product-agent", "aidlc-developer-agent"}) == ["motion"]
        assert run.lane("motion")["status"] == "skipped" and run.lane("motion")["summary"] == "not on Crew"
        assert kinds(run, "skipped")[-1]["text"] == ("Motion: The Crew Agents page does not have taoyuan-motion-agent (not on Crew); it sits this run out; "
                                                    "the checks it owns (tests/ux-motion*) are not run this time")
        await until(run, mgr, behave, lambda: run.lane("pm").get("gate") == "pending")
        assert await run.gate("pm", "approve")
        await until(run, mgr, behave, lambda: run.ended)
        assert run.s["status"] == "done" and (run.s["tests"]["passed"], run.s["tests"]["total"]) == (1, 1)  # UX-1 not run
        assert "motion" not in {r for r, _ in tasks}
        backend = next(t for r, t in tasks if r == "backend")
        assert "Members sitting this run out: Motion (not on Crew). Their parts stay as in the template" in backend
        assert run.lane("motion")["status"] == "skipped"
        out = check_board(run, mgr)
        assert next(ln for ln in out["run"]["roles"] if ln["key"] == "motion")["optional"] is True

    asyncio.run(go())


def test_the_planner_leaves_an_optional_member_out_and_it_sits_out_once_the_person_approves(tmp_path):
    tasks = []
    plan = '{"backend": "the API", "motion": "not needed", "skip": {"motion": "price change only", "backend": "not needed either"}}\n'

    def behave(a, role):
        tasks.append(role)
        if role == "pm":
            act(a, {"docs/product/plan.json": plan})
        elif role == "backend":
            act(a, {"backend/server.js": "// v1\n"})
        finish(a, "ready to deliver" if role == "reviewer" else "did it")

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, optional_tests(), team=optional_team())
        assert run.leave_out_unhired({"aidlc-product-agent", "aidlc-developer-agent", "taoyuan-motion-agent"}) == []
        await until(run, mgr, behave, lambda: run.lane("pm").get("gate") == "pending")
        # a required member cannot be left out; the optional one is proposed, not yet out (the person has not approved)
        assert run.s["plan_skip"] == {"motion": "price change only"} and run.s["plan"] == {"backend": "the API"}
        assert kinds(run, "plan")[-1]["text"] == "Product manager proposed the assignment: Backend · the API; not needed this time: Motion (price change only)"
        assert run.lane("motion")["status"] == "waiting"
        assert await run.gate("pm", "approve", "Go ahead")
        assert run.lane("motion")["status"] == "skipped" and run.lane("motion")["summary"] == "Not needed this time: price change only"
        assert kinds(run, "skipped")[-1]["text"] == ("Motion: Not needed this time (proposed by Product manager, approved by a person at the Requirements gate): price change only; "
                                                    "the checks it owns (tests/ux-motion*) are not run this time")
        await until(run, mgr, behave, lambda: run.ended)
        assert run.s["status"] == "done" and run.s["tests"]["total"] == 1 and "motion" not in tasks

    asyncio.run(go())


def test_a_gated_review_that_still_says_needs_changes_waits_for_the_person_who_sends_it_back_or_overrules_it(tmp_path):
    from teamkit import FakeTests

    tests = FakeTests([("api-x.test.js#AC-1", "backend", lambda wt: "v1" in read(wt, "backend/server.js"))])
    team = deploy_team()
    team["defaults"]["max_review_rounds"] = 1
    next(r for r in team["roles"] if r["key"] == "reviewer").update(gate="human", gate_label="Release")
    tasks = []

    def behave(a, role):
        tasks.append((role, a.task))
        if role == "backend":
            act(a, {"backend/server.js": f"// v1\n// {a.id}\n"})
        elif role == "pm":
            act(a, {"docs/product/acceptance.md": "AC-1\n"})
        elif role == "deploy":
            act(a, {"deploy/local.json": '{"port": 8080, "health": "/"}\n'})
        if role == "reviewer":
            finish(a, "changes needed: F-1 price-adjustment refunds above 300,000\nSend back: Backend")
        else:
            finish(a, "did it")

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, tests, team=team)
        deployed = []

        async def deploy(rid, wt, spec):
            deployed.append(rid)
            return {"ok": True, "url": "http://127.0.0.1:8080/", "note": ""}

        run.d.deploy = deploy
        overruled = lambda: run.lane("reviewer").get("gate") == "pending" and run.lane("reviewer").get("overrule")  # noqa: E731
        await until(run, mgr, behave, overruled)
        # one round as the review said, then the rounds are used up: the person decides, the run does not end
        assert run.s["review_rounds"] == 1 and not run.ended and run.s["status"] == "gating"
        assert kinds(run, "gate")[-1]["text"] == "Waiting for a person to decide Release: Review sent back 1 rounds and still asks for changes; the person can send it back for another round, or give a reason, overrule the review and release"
        assert run.lane("deploy")["status"] == "waiting" and run.sign_block() == "A run can be signed off only after it has ended"
        assert not await run.gate("reviewer", "approve", "  ")  # overruling the review takes a reason
        assert await run.gate("reviewer", "revise", "reserve 280,000 for price adjustments")  # names nobody: back to whom the review named
        assert kinds(run, "bounce")[-2]["text"] == "A person sent it back at the Release gate: change once more as the review says: reserve 280,000 for price adjustments"
        assert run.s["review_rounds"] == 2 and run.s["review_note"] == "reserve 280,000 for price adjustments"
        await until(run, mgr, behave, lambda: overruled() and run.lane("reviewer")["attempt"] == 3)
        fix = [t for r, t in tasks if r == "backend"][-1]
        assert "F-1 price-adjustment refunds above 300,000" in fix and "reserve 280,000 for price adjustments" in fix
        assert await run.gate("reviewer", "approve", "I take the risk: reserve 280,000 for price adjustments, Finance reviews after the campaign")
        await until(run, mgr, behave, lambda: run.ended)
        assert deployed and run.s["status"] == "done" and run.sign_block() == ""
        assert run.s["overruled"] == {"role": "reviewer", "note": "I take the risk: reserve 280,000 for price adjustments, Finance reviews after the campaign",
                                      "review": "changes needed: F-1 price-adjustment refunds above 300,000"}
        assert kinds(run, "approved")[-1]["text"] == "A person overruled the review and approved Release: I take the risk: reserve 280,000 for price adjustments, Finance reviews after the campaign"
        assert kinds(run, "run")[-1]["text"] == "Run complete: A person overruled the review and released, deployed locally at http://127.0.0.1:8080/"
        board = mod("board").detail(run, mgr=mgr, scrub=str, now=1.0)
        assert board["overruled"]["note"].startswith("I take the risk") and board["sign_block"] == ""

    asyncio.run(go())


def test_only_a_run_that_delivered_can_be_signed_off(tmp_path):
    run = make_run(tmp_path, FakeManager(), team=deploy_team())
    assert run.sign_block() == "A run can be signed off only after it has ended"
    run.s["status"] = "failed"
    assert run.sign_block() == "The run failed and delivered nothing, so it cannot be signed off (the failed roles can be retried)"
    run.s["status"] = "stopped"
    assert run.sign_block() == "The run was stopped and delivered nothing, so it cannot be signed off"
    run.s["status"], run.s["tests"]["failed"] = "done", 2
    assert run.sign_block() == "Not deployed, so it cannot be signed off (2 test(s) still fail)"
    run.lane("deploy")["deployed"] = {"url": "http://127.0.0.1:8080/", "at": 1.0}
    assert run.sign_block() == ""
    without = make_run(tmp_path / "b", FakeManager(), team=mini_team())
    without.s["status"] = "done"
    assert without.sign_block() == ""  # a team that deploys nothing: done is delivered


def test_a_role_whose_crew_member_is_missing_waits_and_starts_once_it_is_added(tmp_path):
    """A role names a Crew member "Agents" does not have: it is held with one event instead of silently booting the
    template of that name; adding the member lets it start on the next tick."""
    team = mini_team()
    team["workspace"] = "taoyuan"
    for r in team["roles"]:
        r["member"] = "aidlc-product-agent" if r["key"] == "pm" else "aidlc-developer-agent"
    members: set[str] = {"aidlc-developer-agent"}
    mgr = FakeManager()
    run = make_run(tmp_path, mgr, team=team)
    run.d.members = lambda ws: set(members) if ws == "taoyuan" else None

    async def go():
        await run.tick()
        assert run.lane("pm")["status"] == "waiting" and run.lane("pm")["awaiting_member"] == "aidlc-product-agent"
        held = kinds(run, "member")
        assert len(held) == 1 and held[0]["text"] == "Product manager has not started: the Crew Agents page has no member aidlc-product-agent; it starts automatically once added"
        await run.tick()  # still missing: no second event
        assert len(kinds(run, "member")) == 1 and not mgr.spawned
        members.add("aidlc-product-agent")
        await run.tick()
        assert run.lane("pm")["status"] == "running" and not run.lane("pm").get("awaiting_member")
        assert kinds(run, "member")[-1]["text"] == "Member aidlc-product-agent was added; Product manager starts"

    asyncio.run(go())


def test_members_not_read_or_an_optional_post_never_holds_a_role(tmp_path):
    """No member list yet (Crew not read): the role starts; an optional post is decided when the run is handed over."""
    team = mini_team()
    team["workspace"] = "taoyuan"
    team["roles"][0].update(member="aidlc-product-agent")
    mgr = FakeManager()
    run = make_run(tmp_path, mgr, team=team)
    run.d.members = lambda ws: None

    async def go():
        await run.tick()
        assert run.lane("pm")["status"] == "running" and not run.lane("pm").get("awaiting_member")

    asyncio.run(go())
    team = optional_team()
    run = make_run(tmp_path / "b", FakeManager(), optional_tests(), team=team)
    run.d.members = lambda ws: {"aidlc-product-agent", "aidlc-developer-agent"}
    assert run._member_missing("motion") is None and run._member_missing("pm") is None
