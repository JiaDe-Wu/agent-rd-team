"""A person answers the questions a role raised one by one at the gate, and discusses with it (it answers, changes its own document if needed, the gate stays open); the decisions go to every later role."""

import asyncio
import json
from pathlib import Path

from teamkit import FakeManager, FakeTests, act, finish, make_run, mod, read, sh

team_mod = mod("team")

QUESTIONS = {"questions": [
    {"id": "1", "q": "How should the assistant talk: the rules library or an external LLM?", "options": [{"key": "A", "text": "On-site rules plus product data"}, {"key": "B", "text": "Call an external LLM"}],
     "recommend": "A", "why": "Stays inside the company"},
    {"id": "2", "q": "Can the mascot be the support avatar?", "options": [{"key": "A", "text": "Yes"}, {"key": "B", "text": "No"}], "recommend": "B"},
    {"id": "3", "q": "A single option does not count", "options": [{"key": "A", "text": "Only one"}]},
]}


def talk_team(discuss: bool = True) -> dict:
    role = lambda key, title, deps, **kw: {"key": key, "title": title, "emoji": "", "depends_on": deps,  # noqa: E731
                                           "outputs": [], "brief": f"{title}'s work", **kw}
    return team_mod.check_team({
        "version": 1, "test_command": ["node", "--test", "tests/"],
        "roles": [
            role("scope", "Scope", [], writable=["docs/ideation/**"], phase="ideation", gate="human", gate_label="Scope",
                 questions="docs/ideation/questions.json"),
            role("architect", "Architect", ["scope"], writable=["docs/inception/**"], phase="inception"),
            role("reviewer", "Review", ["architect"], writable=[], phase="review", gate="human", gate_label="Release"),
        ],
        "defaults": {"model": "claude-sonnet-5.5", "max_fix_rounds": 1, "gate_discuss": discuss, "max_discuss_rounds": 2},
        "test_owners": [],
    })


async def to_scope_gate(run, mgr):
    await run.tick()
    act(mgr.by_role("scope"), {"docs/ideation/scope.md": "AC-1\n", "docs/ideation/questions.json": json.dumps(QUESTIONS, ensure_ascii=False)})
    finish(mgr.by_role("scope"), "1 scope item")
    await run.tick()
    assert run.lane("scope")["gate"] == "pending"


def test_the_questions_are_answered_one_by_one_and_travel_downstream(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(), requirement="E-commerce support assistant")
        await to_scope_gate(run, mgr)
        qs = run.s["questions"]["scope"]
        assert [q["id"] for q in qs] == ["1", "2"]  # a question with one option is not a question
        assert qs[0]["recommend"] == "A" and qs[1]["options"][1] == {"key": "B", "text": "No"}

        # 2 is answered against the recommendation; 1 is left out: it takes the recommendation
        assert await run.gate("scope", "approve", "No Android", answers={"2": {"choice": "A", "text": ""}})
        picked = run.s["answers"]["scope"]
        assert [(a["id"], a["choice"], a["differs"]) for a in picked] == [("1", "A", False), ("2", "A", True)]
        assert run.s["gate_notes"]["scope"] == "No Android"  # the note stays the person's words
        approved = [e["text"] for e in run.events if e["kind"] == "approved"][-1]
        assert "Decisions: 1 chose A; 2 chose A (differs from the recommendation)" in approved

        doc = read(Path(run.s["run_wt"]), team_mod.DECISIONS_FILE)  # the decisions are in the run branch
        assert "Decision 2 \"Can the mascot be the support avatar?\": A. Yes (differs from the recommendation)" in doc and "Note: No Android" in doc
        assert "Decisions made by people at the gates" in sh(run.s["run_wt"], "log", "-1", "--format=%s")

        await run.tick()
        task = mgr.by_role("architect").task  # the architect reads them one by one, the file named
        assert "What the owner decided at the gates, question by question" in task and 'decision 1 "How should the assistant talk: the rules library or an external LLM?": A (On-site rules plus product data)' in task
        assert team_mod.DECISIONS_FILE in task and "No Android" in task

    asyncio.run(go())


def test_other_with_words_is_the_persons_own_answer(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(), requirement="Support")
        await to_scope_gate(run, mgr)
        assert await run.gate("scope", "approve", "", answers={"1": {"choice": "other", "text": "Rules first, evaluate an LLM next quarter"},
                                                               "2": {"choice": "other", "text": ""}})
        a1, a2 = run.s["answers"]["scope"]
        assert (a1["choice"], a1["text"], a1["differs"]) == ("other", "Rules first, evaluate an LLM next quarter", True)
        assert a2["choice"] == "B"  # other without words is no answer: the recommendation
        await run.tick()
        assert "other: Rules first, evaluate an LLM next quarter" in mgr.by_role("architect").task

    asyncio.run(go())


def test_a_discussion_keeps_the_gate_open_and_the_role_answers_in_its_session(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(), requirement="Support")
        await to_scope_gate(run, mgr)
        assert run.discuss_allowed("scope")
        assert not await run.gate("scope", "discuss", "   ")  # discuss has to say something
        assert await run.gate("scope", "discuss", "Why does question 2 recommend not using the mascot?")
        lane = run.lane("scope")
        assert lane["gate"] == "discussing" and lane["attempts"][-1]["kind"] == "discuss"
        conv, _, task, _ = mgr.continued[-1]  # its own session: it remembers what it wrote
        assert conv == lane["attempts"][0]["agent"] and "Why does question 2 recommend not using the mascot?" in task and "do not start any other role's work" in task
        await run.tick()
        assert lane["status"] == "running" and run.s["status"] == "running"
        assert [mgr.role_of(a) for a in mgr.live()] == ["scope"]  # nothing after the gate starts meanwhile

        a = mgr.by_role("scope")
        a.result = "BR-4 lists only three scenarios; avatars are not among them.\nDesign can change it once they confirm.\n\nDONE: explained question 2"
        a.done = True
        await run.tick()
        assert lane["gate"] == "pending" and lane["status"] == "merged"  # only an answer: no new merge, the gate is open
        talk = run.s["talks"]["scope"]
        assert [t["who"] for t in talk] == ["person", "agent"]
        assert talk[1]["text"] == "BR-4 lists only three scenarios; avatars are not among them.\nDesign can change it once they confirm." and talk[1]["changed"] is False
        assert not any(e["kind"] == "failed" for e in run.events)  # answering without changing a file is no failure

        # it changes its documents: merged again, the questions read again
        assert await run.gate("scope", "discuss", "Then change question 2 to recommend yes, and write it into the scope")
        await run.tick()
        b = mgr.by_role("scope")
        q2 = json.loads(json.dumps(QUESTIONS))
        q2["questions"][1]["recommend"] = "A"
        act(b, {"docs/ideation/questions.json": json.dumps(q2, ensure_ascii=False)})
        finish(b, "question 2 changed to recommend yes")
        await run.tick()
        assert lane["gate"] == "pending" and run.s["talks"]["scope"][-1]["changed"] is True
        assert run.s["questions"]["scope"][1]["recommend"] == "A"
        assert not run.discuss_allowed("scope")  # 2 rounds for this gate (the team file says so)
        assert run.max_attempts("scope") == 1 + 1 + 2  # the discussions did not use up its fix rounds

        assert await run.gate("scope", "approve")
        await run.tick()
        assert mgr.by_role("architect")  # and the run goes on

    asyncio.run(go())


def test_a_reviewer_answers_without_its_verdict_changing(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(), requirement="Support")
        await to_scope_gate(run, mgr)
        assert await run.gate("scope", "approve")
        await run.tick()
        act(mgr.by_role("architect"), {"docs/inception/architecture.md": "# Architecture\n"})
        finish(mgr.by_role("architect"))
        for _ in range(3):
            await run.tick()
        finish(mgr.by_role("reviewer"), "ready to deliver")
        await run.tick()
        lane = run.lane("reviewer")
        assert lane["gate"] == "pending" and lane["passed"]
        assert await run.gate("reviewer", "discuss", "Will the price-adjustment refunds go over?")
        await run.tick()
        r = mgr.by_role("reviewer")
        assert "You are read-only" in r.task and "Will the price-adjustment refunds go over?" in r.task
        r.result = "No, the pre-release check says 279,000.\nDONE: changes needed: on second thought"  # its word in a discussion is not a new verdict
        r.done = True
        await run.tick()
        assert lane["gate"] == "pending" and lane["passed"] and lane["status"] == "done"
        assert run.s["talks"]["reviewer"][-1]["text"] == "No, the pre-release check says 279,000."
        assert not any(e["kind"] == "bounce" for e in run.events)

    asyncio.run(go())


def test_no_discussion_where_the_team_does_not_offer_it(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(discuss=False), requirement="Support")
        await to_scope_gate(run, mgr)
        assert not run.discuss_allowed("scope")
        assert not await run.gate("scope", "discuss", "Can we talk?")
        assert run.lane("scope")["gate"] == "pending"

    asyncio.run(go())


def test_a_wrong_questions_file_is_no_questions(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(), requirement="Support")
        await run.tick()
        act(mgr.by_role("scope"), {"docs/ideation/scope.md": "AC-1\n", "docs/ideation/questions.json": "not JSON"})
        finish(mgr.by_role("scope"))
        await run.tick()
        assert run.lane("scope")["gate"] == "pending" and run.s["questions"]["scope"] == []
        assert await run.gate("scope", "approve", "OK")  # the person decides in the note, as before
        assert "answers" not in run.s

    asyncio.run(go())


def test_the_aidlc_team_has_a_gate_at_the_end_of_inception():
    t = team_mod.load_team(Path(mod("constants").APP_ROOT) / "team" / "team-aidlc.json")
    roles = {r["key"]: r for r in t["roles"]}
    gates = [(k, r["gate_label"]) for k, r in roles.items() if r.get("gate") == "human"]
    assert gates == [("scope", "Scope"), ("pm", "Build start"), ("reviewer", "Release"), ("knowledge", "Lessons")]
    assert roles["knowledge"]["remember"] is True and roles["knowledge"]["depends_on"] == ["ops"]  # the last step: after deploy
    assert set(roles["pm"]["depends_on"]) == {"architect", "designer"}  # it sums up the whole stage
    after = {k for k, r in roles.items() if r.get("phase") == "construction"}
    deps = lambda k: set(roles[k]["depends_on"]) | {x for d in roles[k]["depends_on"] for x in deps(d)}  # noqa: E731
    assert all("pm" in deps(k) for k in after)  # nothing is built before a person approves Build start
    assert roles["scope"]["questions"] in roles["scope"]["writable"] and roles["pm"]["questions"] in roles["pm"]["writable"]
    assert t["defaults"]["gate_discuss"] is True


def test_a_discussion_is_part_of_the_wait_at_its_gate_in_the_value_stream(tmp_path):
    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, FakeTests([]), team=talk_team(), requirement="Support")
        await to_scope_gate(run, mgr)
        assert await run.gate("scope", "discuss", "Why?")
        await run.tick()
        finish(mgr.by_role("scope"), "explained")
        await run.tick()
        assert await run.gate("scope", "approve")
        flow = mod("cto").flow(run, run.events, now=run.d.now())
        waits = [x for x in flow["segments"] if x["gate"] == "scope"]
        assert len(waits) == 1 and waits[0]["decision"] == "Approved"  # one wait, from the gate to the decision

    asyncio.run(go())
