#!/usr/bin/env python3
"""Install the Kiro Crew members the team files name.

The team files (team/team-*.json) assign every role to a Kiro Crew member such as
`aidlc-quality-agent`. This script writes each member's agent template from
`agents/` into the Kiro agents folder and adds the member to a running Kiro Crew.
It never overwrites a template or a member that already exists.

    python3 scripts/install_members.py               # the gateway on KIROCREW_PORT, else 5476
    python3 scripts/install_members.py --dry-run     # say what it would do, change nothing

Needs a running Kiro Crew and its `kirocrew` command (on PATH, or --kirocrew-bin).
"""
import argparse
import http.cookiejar
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLACEHOLDER = "__KIROCREW_BIN__"
TEMPLATE_SUFFIX = "-template"  # Kiro Crew 0.11 refuses a member named like a template, so the template gets a suffix


def member_names(agents_dir: Path) -> list[str]:
    return sorted(p.stem for p in agents_dir.glob("*.json") if not p.name.startswith("."))


def render(text: str, kirocrew_bin: str) -> str:
    """The template with the placeholder replaced by the path of the `kirocrew` command."""
    return text.replace(PLACEHOLDER, kirocrew_bin)


def template_json(text: str, member: str, kirocrew_bin: str) -> str:
    """The Kiro agent file for *member*'s template: named `<member>-template`, the command filled in."""
    d = json.loads(render(text, kirocrew_bin))
    d["name"] = member + TEMPLATE_SUFFIX
    return json.dumps(d, ensure_ascii=False, indent=2) + "\n"


def roles_members(team_dir: Path) -> set[str]:
    """Every member the team files assign a role to (optional roles included)."""
    names: set[str] = set()
    for f in team_dir.glob("team-*.json"):
        for role in json.loads(f.read_text(encoding="utf-8")).get("roles", []):
            if role.get("member"):
                names.add(role["member"])
    return names


def team_workspace(team_dir: Path) -> str:
    """The Crew workspace the team files put their members in. The app only counts a member that sits in it."""
    names = {json.loads(f.read_text(encoding="utf-8")).get("workspace") for f in team_dir.glob("team-*.json")}
    names.discard(None)
    if len(names) != 1:
        sys.exit(f"the team files must name one workspace, found {sorted(map(str, names))}")
    return names.pop()


class Gateway:
    """The Kiro Crew gateway API, called as the dashboard owner (cookie session)."""

    def __init__(self, port: int, kirocrew_bin: str):
        self.base = f"http://127.0.0.1:{port}"
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        out = subprocess.run([kirocrew_bin, "token", "--port", str(port), "--ttl", "10m"],
                             capture_output=True, text=True, check=False).stdout
        m = re.search(r"token=([^\s]+)", out)
        if not m:
            sys.exit(f"could not get a dashboard token from `{kirocrew_bin} token`: is Kiro Crew running on port {port}?")
        self.open("/?token=" + urllib.parse.quote(m.group(1), safe=""))

    def open(self, path: str, body: dict | None = None) -> dict:
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(self.base + path, data=data, headers={"Content-Type": "application/json"})
        try:
            with self.opener.open(req, timeout=30) as r:
                raw = r.read()
        except urllib.error.HTTPError as e:
            sys.exit(f"{path}: HTTP {e.code} {e.read()[:200]!r}")
        try:
            return json.loads(raw)
        except ValueError:
            return {}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=int(os.environ.get("KIROCREW_PORT") or 5476))
    ap.add_argument("--kirocrew-bin", default=shutil.which("kirocrew") or "")
    ap.add_argument("--kiro-agents", type=Path, default=Path.home() / ".kiro" / "agents")
    ap.add_argument("--workspace-dir", type=Path, default=None,
                    help="the workspace's folder (default ~/workplace/<workspace name>)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    if not a.kirocrew_bin:
        sys.exit("`kirocrew` is not on PATH: pass --kirocrew-bin /path/to/kirocrew")

    names = member_names(ROOT / "agents")
    workspace = team_workspace(ROOT / "team")
    workspace_dir = a.workspace_dir or Path.home() / "workplace" / workspace
    for n in names:
        target = a.kiro_agents / f"{n}{TEMPLATE_SUFFIX}.json"
        if target.exists():
            print(f"template {n}{TEMPLATE_SUFFIX}: already there")
        elif a.dry_run:
            print(f"template {n}{TEMPLATE_SUFFIX}: would write {target}")
        else:
            a.kiro_agents.mkdir(parents=True, exist_ok=True)
            target.write_text(template_json((ROOT / "agents" / f"{n}.json").read_text(encoding="utf-8"), n,
                                            a.kirocrew_bin), encoding="utf-8")
            print(f"template {n}{TEMPLATE_SUFFIX}: written")

    if a.dry_run:
        print(f"would add {len(names)} members to the gateway on port {a.port}, workspace '{workspace}' -> {workspace_dir}")
        return 0

    gw = Gateway(a.port, a.kirocrew_bin)
    if workspace not in {w.get("name") for w in gw.open("/api/workspaces").get("workspaces", [])}:
        workspace_dir.mkdir(parents=True, exist_ok=True)
        gw.open("/api/workspaces", {"name": workspace, "dir": str(workspace_dir)})
        print(f"workspace {workspace}: added")
    have = {m.get("name") for m in gw.open("/api/agents").get("agents", [])}
    for n in names:
        if n in have:
            print(f"member {n}: already there")
            continue
        desc = json.loads((ROOT / "agents" / f"{n}.json").read_text(encoding="utf-8"))["description"]
        gw.open("/api/agents", {"name": n, "kiro_agent": "kirocrew", "workspace": workspace,
                                "display_name": desc.split(" · ")[0], "description": desc})
        print(f"member {n}: added")
    return 0


if __name__ == "__main__":
    sys.exit(main())
