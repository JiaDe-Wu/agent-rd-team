"""Lessons: at the last gate the person ticks which lessons to keep; only the ticked ones are written, word for word, and
the next run's tasks name them."""

import asyncio
import json
from pathlib import Path

import pytest

from teamkit import FakeManager, FakeTests, act, finish, make_run, mod, read, sh

team_mod = mod("team")
lessons_mod = mod("lessons")

CANDIDATES = {"questions": [
    {"id": "1", "q": "Which lessons should be remembered?", "multi": True, "recommend": "A", "why": "unticked means not kept",
     "options": [{"key": "A", "text": "Always mask personal data; do not wait for the review to send it back"},
                 {"key": "B", "text": "Write interfaces.md before touching the frontend"},
                 {"key": "C", "text": "Use only the three brand colours in the standard"}]},
]}


def remember_team() -> dict:
    role = lambda key, title, deps, **kw: {"key": key, "title": title, "emoji": "", "depends_on": deps,  # noqa: E731
                                           "outputs": [], "brief": f"{title}'s work", **kw}
    return team_mod.check_team({
        "version": 1, "test_command": ["node", "--test", "tests/"],
        "roles": [
            role("architect", "Architect", [], writable=["docs/inception/**"], phase="inception"),
            role("knowledge", "Lessons", ["architect"], writable=["docs/aidlc/5-knowledge/**"], phase="operation", gate="human",
                 gate_label="Lessons", questions="docs/aidlc/5-knowledge/questions.json", remember=True),
        ],
        "defaults": {"model": "claude-sonnet-5.5", "max_fix_rounds": 1, "gate_discuss": False},
        "test_owners": [],
    })


async def to_knowledge_gate(run, mgr, questions=CANDIDATES):
    await run.tick()
    act(mgr.by_role("architect"), {"docs/inception/arch.md": "x\n"})
    finish(mgr.by_role("architect"), "1 page of architecture")
    await run.tick()
    act(mgr.by_role("knowledge"), {"docs/aidlc/5-knowledge/questions.json": json.dumps(questions, ensure_ascii=False)})
    finish(mgr.by_role("knowledge"), "3 candidates")
    await run.tick()
    assert run.lane("knowledge")["gate"] == "pending"


def new_run(tmp_path, mgr):
    run = make_run(tmp_path, mgr, FakeTests([]), team=remember_team(), requirement="Raffle page")
    run.s["lessons_file"] = str(tmp_path / "work" / "lessons.json")
    return run


def test_a_multiple_choice_question_lists_up_to_ten_options_and_takes_none_as_an_answer(tmp_path):
    many = {"questions": [{"id": "1", "q": "Which should be remembered?", "multi": True,
                           "options": [{"key": "", "text": f"lesson {i}"} for i in range(12)]},
                          {"id": "2", "q": "A single option can still be ticked", "multi": True, "options": [{"key": "A", "text": "Only one"}]},
                          {"id": "3", "q": "A single choice with one option does not count", "options": [{"key": "A", "text": "Only one"}]}]}

    async def go():
        mgr = FakeManager()
        run = new_run(tmp_path, mgr)
        await to_knowledge_gate(run, mgr, many)
        qs = run.s["questions"]["knowledge"]
        assert [q["id"] for q in qs] == ["1", "2"]
        assert qs[0]["multi"] is True and len(qs[0]["options"]) == team_mod.MULTI_OPTIONS
        assert [o["key"] for o in qs[0]["options"]] == list("ABCDEFGHIJ")  # a missing key is its place in the list
        assert qs[0]["recommend"] == ""  # nothing is recommended to tick

    asyncio.run(go())


def test_only_the_ticked_lessons_are_written_word_for_word(tmp_path):
    async def go():
        mgr = FakeManager()
        run = new_run(tmp_path, mgr)
        await to_knowledge_gate(run, mgr)
        assert await run.gate("knowledge", "approve", "", answers={"1": {"choice": "", "text": "", "choices": ["C", "A", "Z"]}})

        a = run.s["answers"]["knowledge"][0]
        assert a["multi"] is True and a["choices"] == ["A", "C"]  # in the role's order; an unknown key is not a tick
        assert a["options"] == ["Always mask personal data; do not wait for the review to send it back", "Use only the three brand colours in the standard"]

        cards = json.loads(Path(run.s["lessons_file"]).read_text(encoding="utf-8"))["cards"]
        assert [c["text"] for c in cards] == ["Always mask personal data; do not wait for the review to send it back", "Use only the three brand colours in the standard"]
        assert all(c["id"].startswith("L-") and "r1006test" in c["source"] for c in cards)
        assert run.s["lessons_kept"] == {"picked": 2, "added": 2, "dup": 0, "problem": ""}

        wt = Path(run.s["run_wt"])
        assert "Always mask personal data" in read(wt, team_mod.KNOWLEDGE_FILE) and "Write interfaces.md before" not in read(wt, team_mod.KNOWLEDGE_FILE)
        assert "Decision 1 \"Which lessons should be remembered?\" (multiple choice): A. Always mask personal data" in read(wt, team_mod.DECISIONS_FILE)
        assert "Lessons" in sh(wt, "log", "-1", "--format=%s")
        assert any(e["kind"] == "lessons" and "Kept 2 lessons" in e["text"] for e in run.events)

    asyncio.run(go())


def test_ticking_nothing_writes_nothing(tmp_path):
    async def go():
        mgr = FakeManager()
        run = new_run(tmp_path, mgr)
        await to_knowledge_gate(run, mgr)
        assert await run.gate("knowledge", "approve", "", answers={"1": {"choice": "", "text": "", "choices": []}})
        assert not Path(run.s["lessons_file"]).exists()
        assert run.s["lessons_kept"]["added"] == 0
        assert "No new lessons were kept" in read(Path(run.s["run_wt"]), team_mod.KNOWLEDGE_FILE)

    asyncio.run(go())


def test_leaving_the_question_out_is_ticking_nothing(tmp_path):
    async def go():
        mgr = FakeManager()
        run = new_run(tmp_path, mgr)
        await to_knowledge_gate(run, mgr)
        assert await run.gate("knowledge", "approve", "")
        assert run.s["answers"]["knowledge"][0]["choices"] == [] and not Path(run.s["lessons_file"]).exists()

    asyncio.run(go())


def test_a_lesson_already_kept_is_not_written_twice(tmp_path):
    path = tmp_path / "lessons.json"
    first, dup = lessons_mod.add(path, ["Always mask personal data", "  Use only the three brand colours in the standard "], "r1", "2026-11-15")
    assert len(first) == 2 and dup == 0
    again, dup = lessons_mod.add(path, ["Always mask personal data", "Use only the three brand colours in the standard\n", "A new one"], "r2", "2026-11-16")
    assert [c["text"] for c in again] == ["A new one"] and dup == 2
    assert [c["text"] for c in lessons_mod.load(path)] == ["Always mask personal data", "Use only the three brand colours in the standard", "A new one"]


def test_a_lessons_file_that_cannot_be_read_is_left_alone(tmp_path):
    async def go():
        mgr = FakeManager()
        run = new_run(tmp_path, mgr)
        path = Path(run.s["lessons_file"])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("{not JSON", encoding="utf-8")
        await to_knowledge_gate(run, mgr)
        assert await run.gate("knowledge", "approve", "", answers={"1": {"choice": "", "text": "", "choices": ["A"]}})
        assert path.read_text(encoding="utf-8") == "{not JSON"  # never replaced by a list of one
        assert run.lane("knowledge")["gate"] == "approved"  # the run goes on
        assert run.s["lessons_kept"]["added"] == 0 and "cannot be read" in run.s["lessons_kept"]["problem"]
        assert "cannot be read" in read(Path(run.s["run_wt"]), team_mod.KNOWLEDGE_FILE)

    asyncio.run(go())


def test_the_next_run_reads_the_kept_lessons_in_every_task(tmp_path):
    async def go():
        path = tmp_path / "lessons.json"
        lessons_mod.add(path, ["Always mask personal data; do not wait for the review to send it back"], "r1 · Raffle page", "2026-11-15")
        mgr = FakeManager()
        run = new_run(tmp_path, mgr)
        run.s["lessons_in"] = lessons_mod.load(path)
        run.s["task_template"] = "Task\n{lessons}\n{brief}"
        await run.tick()
        task = mgr.by_role("architect").task
        assert "Lessons the owner kept" in task and "- Always mask personal data; do not wait for the review to send it back (r1 · Raffle page)" in task

    asyncio.run(go())


def test_no_kept_lessons_leave_the_task_as_it_was():
    assert lessons_mod.task_lines([]) == ""


def test_remember_needs_a_human_gate_with_questions():
    bad = remember_team()
    bad["roles"][1].pop("questions")
    with pytest.raises(ValueError, match="remember"):
        team_mod.check_team(bad)
