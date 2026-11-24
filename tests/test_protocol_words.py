"""The words the app reads out of agents' replies and team files: English now, and what earlier versions wrote still counts."""

import asyncio
import logging

import pytest

from teamkit import mod
from test_sessions import FakeGateway

team_mod, delivery, sessions, constants = mod("team"), mod("delivery"), mod("sessions"), mod("constants")


def test_the_verdict_is_read_in_english_and_in_the_words_of_earlier_versions():
    assert team_mod.changes_needed("changes needed: the email is not validated") and team_mod.changes_needed("Changes needed")
    assert team_mod.ready_to_deliver("ready to deliver") and team_mod.ready_to_deliver("  Ready to deliver, with two notes")
    assert not team_mod.changes_needed("ready to deliver") and not team_mod.ready_to_deliver("changes needed") and not team_mod.changes_needed(None)
    # earlier versions: 要改 / 可以交付
    assert team_mod.changes_needed("要改：邮箱没校验") and team_mod.ready_to_deliver("可以交付")
    # the verdict is the first words of the summary, not any place in it
    assert not team_mod.changes_needed("it says changes needed later") and not team_mod.ready_to_deliver("not ready to deliver")


def test_the_marker_of_a_persons_send_back_is_read_in_both_languages():
    assert team_mod.human_mark_of(team_mod.HUMAN_MARK + "note") == team_mod.HUMAN_MARK
    assert team_mod.human_mark_of("【负责人退回】note") == "【负责人退回】"  # what a run of an earlier version stored
    assert team_mod.human_mark_of("The reviewer's own words") == "" and team_mod.human_mark_of("") == ""


def test_the_delivery_tag_is_written_in_english_and_stored_as_the_enum_the_ui_knows():
    base = delivery.defaults({}, "Add a thing")
    assert (base["kind"], base["size"], base["line"]) == ("新应用", "中", "内部系统")
    got = delivery.clean({"name": "Promo page", "kind": "New Feature", "size": "LARGE", "line": "e-commerce", "why": "a reason"}, base)
    assert (got["kind"], got["size"], got["line"]) == ("新功能", "大", "电商")  # the stored enum is unchanged (the UI and the CTO data match it)
    assert delivery.label(got) == "new feature · large · e-commerce (Promo page)"
    assert delivery.clean({"kind": "fix", "line": "CRM", "size": "small"}, base)["kind"] == "修复"
    assert delivery.clean({"kind": "新功能", "line": "供应链"}, base)["line"] == "供应链"  # the older files' own words still count
    assert delivery.clean({"kind": "bug", "size": "huge", "line": "x"}, base) == base  # nothing it does not know
    delivery.check({"delivery_defaults": {"kind": "fix", "size": "small", "line": "internal systems"}})
    with pytest.raises(ValueError, match="one of new app, new feature, fix"):
        delivery.check({"delivery_defaults": {"kind": "bug"}})
    assert set(delivery.REPORTERS) == set(delivery.LINES) and not any("部" in v or "组" in v for v in delivery.REPORTERS.values())


def test_a_review_roles_are_read_by_title_in_any_case_and_by_a_word_list():
    roles = [{"key": "backend1", "title": "Backend developer #1", "writable": ["server/**"]},
             {"key": "backend2", "title": "Backend developer #2", "writable": ["server/**"]},
             {"key": "web", "title": "Web", "writable": ["web/**"]}, {"key": "reviewer", "title": "Review", "writable": []}]
    targets = team_mod.review_targets
    assert targets("Send back: Backend developer #2", roles) == ["backend2"]
    assert targets("send back: backend developer #1 and Web", roles) == ["backend1", "web"]
    assert targets("- **Send back**: web, backend2", roles) == ["backend2", "web"]
    assert targets("F-1 owner: Backend developer #1", roles) == ["backend1"]
    assert targets("Send back: Review", roles) == [] and targets("changes needed", roles) == []


def test_the_run_folder_of_an_earlier_version_is_still_the_root_while_it_exists(tmp_path):
    async def go():
        gw = FakeGateway()
        gw.folder_rows.append({"id": "old", "name": "AI-DLC 团队", "parent_id": None, "owner_app": "agent-rd-team"})
        mgr = sessions.SessionManager(gw, app="agent-rd-team", state_file=tmp_path / "sessions.json", log=logging.getLogger("t"))
        mgr.spawn_session("t", parent_session_key="agent-rd-team:r1", cwd=str(tmp_path / "a" / "b" / "c"), title="Backend agent", folder="Run 1")
        await asyncio.gather(*mgr._tasks)
        assert [c[1:] for c in gw.calls if c[0] == "folder"] == [("Run 1", "old")]  # only the run's folder was made, under the old root

    asyncio.run(go())
