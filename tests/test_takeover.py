"""The demo branch: taking over an existing project, and the four kinds of check on the test wall (functional / security / compliance / store listing)."""

import asyncio

from teamkit import OUTPUTS, FakeManager, act, default_tests, drive, finish, make_run, mini_team, mod, sh

gitwork, checks, constants = mod("gitwork"), mod("checks"), mod("constants")


def test_case_ids_of_the_four_groups_sort_by_group_then_number():
    ids = ["STORE-2", "AC-10", "SEC-1", None, "COMP-3", "AC-2", "STORE-1"]
    assert sorted(ids, key=checks.case_order) == ["AC-2", "AC-10", "SEC-1", "COMP-3", "STORE-1", "STORE-2", None]
    assert checks.AC_RE.match("STORE-7 the account can be deleted outside the app").group(1) == "STORE-7"
    assert checks.AC_RE.match("SEC-1 no phone number in plain text in the logs").group(1) == "SEC-1"
    assert checks.AC_RE.match("XYZ-1 another prefix") is None


def test_an_existing_project_keeps_its_title_and_is_committed_as_taken_over(tmp_path):
    src = tmp_path / "im"
    (src / "server").mkdir(parents=True)
    (src / "README.md").write_text("# Our IM\n\nIntro\n", encoding="utf-8")
    (src / "server" / "app.js").write_text("// server\n", encoding="utf-8")
    (src / "node_modules").mkdir()
    (src / "node_modules" / "x.js").write_text("", encoding="utf-8")

    async def go():
        repo = tmp_path / "runs" / "r1" / "repo"
        base = await gitwork.create_repo(src, repo, "Add account deletion", "Add account deletion", existing=True)
        return repo, base

    repo, base = asyncio.run(go())
    readme = (repo / "README.md").read_text(encoding="utf-8")
    assert readme.startswith("# Our IM\n") and readme.rstrip().endswith("## Requirement\n\nAdd account deletion")
    assert (repo / "server" / "app.js").exists() and not (repo / "node_modules").exists()
    assert sh(repo, "log", "-1", "--format=%s").strip() == "Take over: Add account deletion"
    assert len(base) == 40


def test_a_review_names_who_fixes_what():
    roles = mod("team").load_team(constants.TEAM_DIR / "team-aidlc.json")["roles"]
    targets = mod("team").review_targets
    text = ("**1. The file check can be bypassed** (owner: Backend)\n**2. Deletion is not real deletion** (owner: Backend; copy owner: Web, Android and UI design)\n"
            "- The check has a hole too (owner: Compliance & security)\n**3. The camera entry is gone** (owner: Android)")
    assert targets(text, roles) == ["designer", "compliance", "backend", "frontend", "mobile"]
    assert targets("DONE: changes needed\nSend back: backend, Android\n(owner: Deploy)", roles) == ["backend", "mobile"]  # its own line wins
    assert targets("changes needed: nobody named", roles) == [] and targets("(owner: Review)", roles) == []  # the reviewer writes nothing
    # one Send back line per role, as list items (r10135470: the second one alone was read, then neither)
    review = ("DONE: changes needed: the backend bypasses the check with an escape\n\n### F-1\n- Fix: ...\n- Send back: Testing (change the regex in `tests/ac-server-password.test.js:165`)\n"
              "- Send back: Backend (remove the escape in `sendCheck`)\n")
    assert targets(review, roles) == ["tester", "backend"]
    assert targets("1. Send back: Web\n2. **Send back**: Backend", roles) == ["backend", "frontend"]
    assert targets("DONE: changes needed\nSEND BACK: backend frontend", roles) == ["backend", "frontend"]  # keys, any case, a word list


def test_a_review_written_by_an_earlier_version_still_names_who_fixes_what():
    # the words runs of earlier versions stored (and a reviewer still on an old prompt writes): 打回：, 归X, 要改
    roles = mod("team").load_team(constants.TEAM_DIR / "team-aidlc.json")["roles"]
    targets = mod("team").review_targets
    text = ("**1. 文件鉴权能被绕过**（归后端）\n**2. 注销不是真删除**（归后端，文案归前端、移动端和体验设计）\n"
            "- 检查也有漏洞（归合规）\n**3. 拍照入口没了**（归移动端）")
    assert targets(text, roles) == ["designer", "compliance", "backend", "frontend", "mobile"]
    assert targets("DONE: 要改\n打回：backend、安卓\n（归运维）", roles) == ["backend", "mobile"]
    assert targets("要改：没说归谁", roles) == [] and targets("（归评审）", roles) == []
    review = ("DONE: 要改：后端用转义绕过检查\n\n### F-1\n- 怎么改：…\n- 打回：测试（改 `tests/ac-server-password.test.js:165` 的正则）\n"
              "- 打回：后端（删掉 `sendCheck` 的转义）\n")
    assert targets(review, roles) == ["tester", "backend"]
    assert targets("1. 打回：网页\n2. **打回**：后端", roles) == ["backend", "frontend"]
    team_mod = mod("team")
    assert team_mod.changes_needed("要改：一条") and team_mod.changes_needed("Changes needed: one") and not team_mod.changes_needed("ready to deliver")
    assert team_mod.ready_to_deliver("可以交付") and team_mod.ready_to_deliver("Ready to deliver")


def _review_flow(tmp_path, verdicts, limit):
    team = mini_team()
    team["defaults"]["max_review_rounds"] = limit
    reviews, fixes = [], []

    async def go():
        mgr = FakeManager()
        run = make_run(tmp_path, mgr, default_tests(), team=team, requirement="A small requirement")
        said = iter(verdicts)

        def behave(a, role):
            if role == "reviewer":
                reviews.append(a.task)
                verdict = next(said)
                a.result, a.done = f"I checked every change.\n\nDONE: {verdict}", True  # a session's reply is whole
            elif "The review's own words follow" in a.task:
                fixes.append(role)
                act(a, {"backend/server.js": f"// v2 validate the email {len(fixes)}\n"})
                finish(a, "fixed as the review says")
            else:
                act(a, OUTPUTS[role])
                finish(a)

        await drive(run, mgr, behave)
        return run, mgr

    run, mgr = asyncio.run(go())
    return run, mgr, reviews, fixes


def test_a_review_that_says_change_it_goes_back_to_the_named_roles_and_is_looked_at_again(tmp_path):
    run, mgr, reviews, fixes = _review_flow(tmp_path, ["changes needed: one\n\n1. The email is not validated (owner: Backend)", "ready to deliver"], limit=2)
    assert fixes == ["backend"] and run.s["status"] == "done" and run.s["review_rounds"] == 1
    fix = run.lane("backend")["attempts"][-1]
    assert fix["kind"] == "review" and fix["via"] == "continue" and "The email is not validated (owner: Backend)" in fix["task"]
    assert any(e["kind"] == "bounce" and e["text"] == "The review asks for changes, sent back to Backend (review round 1)" for e in run.events)
    assert "This is review round 2" in reviews[1] and "The email is not validated" in reviews[1]  # the reviewer checks its own list again
    assert [e["text"] for e in run.events if e["kind"] == "run"][-1] == "Run complete: the review says it can be delivered"


def test_after_its_rounds_a_review_that_still_says_change_it_goes_to_a_person(tmp_path):
    run, _, reviews, fixes = _review_flow(tmp_path, ["changes needed: one (owner: Backend)", "changes needed: two (owner: Backend)"], limit=1)
    assert fixes == ["backend"] and len(reviews) == 2 and run.s["status"] == "failed"
    assert [e["text"] for e in run.events if e["kind"] == "run"][-1] == "Run ended: the review sent it back 1 rounds and still asks for changes, left to a person"

    async def again():  # the person's retry sends the last review back once more, with their decisions
        return await run.retry(note="Camera: restore the system camera entry")

    assert asyncio.run(again()) == ["backend"] and run.s["status"] == "fixing" and run.s["review_rounds"] == 2
    task = run.lane("backend")["attempts"][-1]["task"]
    assert "The owner has already decided" in task and "Camera: restore the system camera entry" in task and "changes needed: two (owner: Backend)" in task
