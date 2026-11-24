"""The member templates the team files rely on, and the installer that places them."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import install_members  # noqa: E402


def test_every_member_a_team_file_names_has_a_template():
    have = set(install_members.member_names(ROOT / "agents"))
    named = install_members.roles_members(ROOT / "team")
    # larkspur-motion-agent is the one custom member the sample adds by hand, and its role is optional
    missing = named - have - {"larkspur-motion-agent"}
    assert not missing, f"team files name members with no template: {sorted(missing)}"


def test_a_template_is_valid_json_with_a_description_and_no_machine_path():
    for name in install_members.member_names(ROOT / "agents"):
        text = (ROOT / "agents" / f"{name}.json").read_text(encoding="utf-8")
        d = json.loads(text)
        assert d["name"] == name and d["description"], name
        assert "/Users/" not in text and "/home/" not in text, f"{name} carries a machine path"
        assert " · " in d["description"], f"{name}: the display name is read before ' · '"


def test_render_puts_the_kirocrew_command_where_the_placeholder_was():
    text = (ROOT / "agents" / "aidlc-quality-agent.json").read_text(encoding="utf-8")
    assert install_members.PLACEHOLDER in text
    out = install_members.render(text, "/opt/kirocrew/bin/kirocrew")
    assert install_members.PLACEHOLDER not in out
    assert json.loads(out)["mcpServers"]["kirocrew-core"]["command"] == "/opt/kirocrew/bin/kirocrew"


def test_dry_run_changes_nothing(tmp_path, capsys):
    rc = install_members.main(["--dry-run", "--kirocrew-bin", "/x/kirocrew", "--kiro-agents", str(tmp_path / "a")])
    assert rc == 0
    assert not (tmp_path / "a").exists()
    assert "would write" in capsys.readouterr().out


def test_an_existing_template_is_not_overwritten(tmp_path, capsys):
    agents = tmp_path / "a"
    agents.mkdir()
    (agents / "aidlc-quality-agent-template.json").write_text("mine")
    install_members.main(["--dry-run", "--kirocrew-bin", "/x/kirocrew", "--kiro-agents", str(agents)])
    assert (agents / "aidlc-quality-agent-template.json").read_text() == "mine"
    assert "aidlc-quality-agent-template: already there" in capsys.readouterr().out


def test_the_kiro_agent_file_is_named_like_the_template_the_app_boots():
    text = (ROOT / "agents" / "aidlc-quality-agent.json").read_text(encoding="utf-8")
    d = json.loads(install_members.template_json(text, "aidlc-quality-agent", "/x/kirocrew"))
    assert d["name"] == "aidlc-quality-agent-template"
    assert d["mcpServers"]["kirocrew-core"]["command"] == "/x/kirocrew"


def test_the_team_files_share_one_workspace_and_the_installer_uses_it():
    assert install_members.team_workspace(ROOT / "team") == "larkspur"
