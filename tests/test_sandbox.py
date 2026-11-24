"""The three places the backend runs what a role session wrote or can change go through Kiro Crew's sandbox."""

import asyncio
import os
import re
import subprocess
import sys
from pathlib import Path

import pytest

from teamkit import ROOT, mod, sh
from test_outputs import site_dir

sandbox, gitwork, checks, site_mod, constants = mod("sandbox"), mod("gitwork"), mod("checks"), mod("site"), mod("constants")

TEAM = {"test_owners": []}


@pytest.fixture
def fake(sandbox_sdk):
    """The stand-in SDK, for the tests that read what was asked of it (there is none when the suite runs in the real sandbox)."""
    if sandbox_sdk is None:
        pytest.skip("running in the host's real sandbox")
    return sandbox_sdk


def test_git_runs_in_the_standard_sandbox_with_its_own_environment(tmp_path, fake):
    asyncio.run(gitwork.git(tmp_path, "init", "-q"))
    call = fake.runs[-1]
    assert call["mode"] == "standard" and call["argv"][:3] == [constants.GIT_BIN, "-C", str(tmp_path)]
    assert call["env"]["GIT_CONFIG_GLOBAL"] and call["env"]["GIT_TERMINAL_PROMPT"] == "0" and call["timeout"] == 60.0
    assert (tmp_path / ".git").is_dir()


def test_git_stops_where_there_is_no_sandbox_instead_of_running_unsandboxed(tmp_path, fake):
    fake.unavailable = True
    with pytest.raises(gitwork.GitError, match="init not run"):
        asyncio.run(gitwork.git(tmp_path, "init", "-q"))
    assert not (tmp_path / ".git").exists()


def test_git_that_runs_too_long_is_a_timeout_not_a_git_error(tmp_path):
    with pytest.raises(asyncio.TimeoutError):
        asyncio.run(gitwork.git(tmp_path, "-c", "alias.slow=!sleep 5", "slow", timeout=0.3))


def test_the_company_checks_run_in_the_standard_sandbox_and_leave_nothing_behind(tmp_path, fake):
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "api-x.test.js").write_text("import { test } from 'node:test';\ntest('AC-1: ok', () => {});\n")
    wall = asyncio.run(checks.run_tests(tmp_path, TEAM, node=_node()))
    assert (wall["passed"], wall["total"]) == (1, 1)
    run = fake.prepared[-1]
    assert run["mode"] == "standard" and run["argv"][1:3] == ["--test", "--test-reporter=tap"]
    assert fake.cleanups and not any(Path(p).exists() for p in fake.cleanups)


def test_the_company_checks_do_not_run_where_there_is_no_sandbox(tmp_path, fake):
    (tmp_path / "tests").mkdir()
    marker = tmp_path / "ran"
    (tmp_path / "tests" / "api-x.test.js").write_text(f"import {{ writeFileSync }} from 'node:fs';\nwriteFileSync({str(marker)!r}, '1');\n")
    fake.unavailable = True
    with pytest.raises(checks.TestsUnavailable, match="no sandbox on this host"):
        asyncio.run(checks.run_tests(tmp_path, TEAM, node=_node()))
    assert not marker.exists()


def test_the_site_runs_in_the_standard_sandbox_and_its_files_go_when_it_stops(tmp_path, fake):
    async def go():
        site = site_mod.Site()
        st = await site.start("r1", site_dir(tmp_path))
        try:
            assert st["state"] == "running"
            prepared = fake.prepared[-1]
            assert prepared["mode"] == "standard" and prepared["argv"][1] == "backend/server.js"
            assert Path(prepared["cleanup"]).exists()  # still needed while the site runs
        finally:
            await site.stop()
        await asyncio.sleep(0.1)
        assert not Path(prepared["cleanup"]).exists()

    asyncio.run(go())


def test_the_site_is_not_started_where_there_is_no_sandbox(tmp_path, fake):
    async def go():
        site = site_mod.Site()
        st = await site.start("r1", site_dir(tmp_path))
        assert st["state"] == "failed" and "not started" in st["error"] and "no sandbox on this host" in st["error"]
        assert not site.running

    fake.unavailable = True
    asyncio.run(go())


def test_a_checked_command_cannot_read_what_the_sandbox_hides(tmp_path):
    """Only where the suite runs in the real sandbox: a file under ~/.gnupg, which the standard tier masks, is not there
    for a command started the way the app starts one."""
    if os.environ.get("AGENT_RD_TEAM_REAL_SANDBOX") != "1":
        pytest.skip("needs the host's real sandbox")
    gnupg = Path.home() / ".gnupg"
    existed = gnupg.exists()
    gnupg.mkdir(exist_ok=True)
    secret = gnupg / "agent-rd-team-sandbox-probe"
    secret.write_text("secret", encoding="utf-8")
    try:
        env = {"PATH": "/usr/bin:/bin"}
        done = asyncio.run(sandbox.run(["/bin/cat", str(secret)], env=env, cwd=str(tmp_path), timeout=20))
        assert b"secret" not in done.stdout and done.returncode != 0
        plain = subprocess.run(["/bin/cat", str(secret)], capture_output=True, text=True, check=False)
        assert plain.stdout == "secret"  # the same read, with no sandbox, does reach it
    finally:
        secret.unlink(missing_ok=True)
        if not existed:
            gnupg.rmdir()


def test_without_the_host_sdk_nothing_runs(monkeypatch):
    monkeypatch.undo()  # the real _sdk: the tests' Python has no kiro_crew
    monkeypatch.setitem(sys.modules, "kiro_crew", None)
    monkeypatch.setitem(sys.modules, "kiro_crew.apps", None)
    with pytest.raises(sandbox.SandboxUnavailable, match="0.13.0"):
        asyncio.run(sandbox.run(["true"], env={}))


def test_no_other_place_in_the_backend_starts_a_command():
    """A new subprocess call has to be put here on purpose: a command that is not in Kiro Crew's sandbox must not
    be able to run what a role session wrote."""
    allowed = {
        "sandbox.py": 1,    # the one asyncio.create_subprocess_exec: the prepared, wrapped argv
        "constants.py": 1,  # `node --version` of a node binary the user's machine has
        "site.py": 2,       # `lsof` of the site's own process: listening addresses, working directory
        "service.py": 1,    # `open <url>` on a Mac, with the site's address
    }
    found: dict[str, int] = {}
    for path in (ROOT / "backend").rglob("*.py"):
        n = len(re.findall(r"create_subprocess_exec\(|subprocess\.run\(|Popen\(|os\.system\(|os\.exec\w*\(|\.getoutput\(", path.read_text(encoding="utf-8")))
        if n:
            found[path.name] = n
    assert found == allowed


def _node() -> str:
    import shutil
    node = shutil.which("node")
    if not node:
        pytest.skip("node is not installed")
    return node
