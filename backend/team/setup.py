"""One-click setup of the example team: a plan of calls the owner's page (or ``scripts/setup_plan.py``) makes, and
the three steps that only this app can do.

What Kiro Crew allows, and why the setup is split this way (checked against Kiro Crew 0.14):

* Creating a workspace (``POST /api/workspaces``) and a member (``POST /api/agents``) is owner-only: an app token is
  refused, and so is this backend. The owner's page makes those calls with the owner's own session.
* A member's template is a file in ``~/.kiro/agents``: a prompt, shell and file tools and the Kiro Crew control-plane
  server. Kiro Crew keeps that directory owner-only too. This app writes them, once, when the owner presses the
  button (the route is owner-only), exactly as ``scripts/install_members.py`` does from the terminal. It never
  overwrites a template that is already there.
* A knowledge source (``/api/knowledge``) is within the app's declared permissions, so the backend adds it and
  has it read the rule documents.

``GET /setup`` answers ``{status, plan}``. ``status`` says what exists; ``plan`` lists the steps still to do, each
``{id, label, call: {method, path, body}}``, in the order to run them. A caller runs them one after another and
treats a ``409`` (it exists already) as done. Running the plan again does nothing that is done.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any

from .constants import APP_NAME, APP_ROOT
from .gateway import GatewayError
from .httpkit import AppError

WORKSPACE = "larkspur"
KNOWLEDGE_SOURCE = "Larkspur Outfitters"
TEMPLATE_SUFFIX = "-template"  # Kiro Crew 0.11 refuses a member named like a template, so the template gets a suffix
PLACEHOLDER = "__KIROCREW_BIN__"
AGENTS_DIR = APP_ROOT / "agents"
KNOWLEDGE_DIR = APP_ROOT / "knowledge" / "larkspur"
EXAMPLE_FILE = APP_ROOT / "samples" / "example.json"
SAMPLE_FILE = APP_ROOT / "samples" / "sample-run.json"
APP_PATH = f"/api/apps/{APP_NAME}"


def member_specs(agents_dir: Path = AGENTS_DIR) -> list[dict[str, str]]:
    """The team's members, from ``agents/*.json``: ``{name, display_name, description}``. A description reads
    ``<display name> · <what it does>``."""
    out = []
    for path in sorted(Path(agents_dir).glob("*.json")):
        if path.name.startswith("."):
            continue
        desc = str(json.loads(path.read_text(encoding="utf-8")).get("description") or "")
        out.append({"name": path.stem, "display_name": (desc.split(" · ")[0] or path.stem)[:60], "description": desc})
    return out


def template_text(source: str, member: str, kirocrew_bin: str) -> str:
    """The Kiro agent file of *member*'s template: named ``<member>-template``, the control-plane command filled in."""
    d = json.loads(source.replace(PLACEHOLDER, kirocrew_bin))
    d["name"] = member + TEMPLATE_SUFFIX
    return json.dumps(d, ensure_ascii=False, indent=2) + "\n"


def find_kirocrew_bin() -> str:
    """The ``kirocrew`` command of the gateway this backend runs in: next to its Python, else on PATH."""
    given = os.environ.get("KIROCREW_BIN")
    candidates = [given] if given else []
    candidates += [str(Path(sys.executable).with_name("kirocrew")), shutil.which("kirocrew") or ""]
    for c in candidates:
        if c and os.access(c, os.X_OK) and not os.path.isdir(c):
            return c
    return ""


def _write_new(path: Path, text: str) -> bool:
    """Write *path* only if it is not there; atomically. True when written."""
    if path.exists():
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".setup-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.link(tmp, path)  # fails if another writer got there first: never replaces
        return True
    except FileExistsError:
        return False
    finally:
        with contextlib.suppress(OSError):
            os.unlink(tmp)


class Setup:
    def __init__(self, svc: Any, *, home: Path | None = None, agents_dir: Path | None = None, knowledge_dir: Path | None = None,
                 example_file: Path | None = None, sample_file: Path | None = None, kirocrew_bin: Any = None) -> None:
        self.svc = svc
        self.home = Path(home) if home else Path.home()
        self.agents_dir = Path(agents_dir) if agents_dir else AGENTS_DIR
        self.knowledge_dir = Path(knowledge_dir) if knowledge_dir else KNOWLEDGE_DIR
        self.example_file = Path(example_file) if example_file else EXAMPLE_FILE
        self.sample_file = Path(sample_file) if sample_file else SAMPLE_FILE
        self._bin = kirocrew_bin or find_kirocrew_bin

    # ---- where things go ------------------------------------------------------------------------------- #

    @property
    def workspace_dir(self) -> Path:
        return self.home / "workplace" / WORKSPACE

    @property
    def rules_dir(self) -> Path:
        """The example company's knowledge (rule documents and the JSON data they point at), copied here so the person can
        read and edit it. The documents name their data files under this folder: ``~/workplace/knowledge/larkspur/data/``."""
        return self.home / "workplace" / "knowledge" / WORKSPACE

    @property
    def kiro_agents_dir(self) -> Path:
        return self.home / ".kiro" / "agents"

    @property
    def gw(self) -> Any:
        return self.svc.sessions.gw

    def example(self) -> dict[str, Any]:
        """The example delivery the page offers to start: ``{requirement, team}``."""
        try:
            data = json.loads(self.example_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {"requirement": "", "team": "auto"}
        return {"requirement": str(data.get("requirement") or ""), "team": str(data.get("team") or "auto")}

    def sample_id(self) -> str:
        try:
            return str(json.loads(self.sample_file.read_text(encoding="utf-8")).get("run", {}).get("id") or "")
        except (OSError, ValueError, AttributeError):
            return ""

    def docs(self) -> list[Path]:
        return sorted(p for p in self.knowledge_dir.rglob("*.md") if p.is_file()) if self.knowledge_dir.is_dir() else []

    # ---- what exists -------------------------------------------------------------------------------------- #

    async def status(self) -> dict[str, Any]:
        specs = member_specs(self.agents_dir)
        names = [s["name"] for s in specs]
        problems: list[str] = []

        async def read(label: str, call: Any) -> Any:
            try:
                return await call()
            except (GatewayError, AttributeError) as exc:
                problems.append(f"{label}: {exc}"[:200])
                return None

        spaces = await read("workspaces", self.gw.workspaces)
        members = await read("members", self.gw.members)
        sources = await read("knowledge", self.gw.knowledge_sources)
        have_ws = None if spaces is None else any(w.get("name") == WORKSPACE for w in spaces)
        created = None if members is None else {str(m.get("name")) for m in members if m.get("workspace") == WORKSPACE}
        templates = {n for n in names if (self.kiro_agents_dir / f"{n}{TEMPLATE_SUFFIX}.json").exists()}
        source = next((s for s in sources or [] if s.get("name") == KNOWLEDGE_SOURCE), None)
        items = int((source or {}).get("item_count") or 0)
        state = str((source or {}).get("sync_status") or "")
        sample = self.sample_id()
        out = {
            "workspace": {"name": WORKSPACE, "dir": str(self.workspace_dir), "done": have_ws},
            "templates": {"total": len(names), "present": len(templates), "done": len(templates) == len(names) > 0},
            "members": {"total": len(names), "created": None if created is None else len(created & set(names)),
                        "missing": None if created is None else [n for n in names if n not in created],
                        "done": None if created is None else (set(names) <= created and bool(names))},
            # done: Kiro Crew holds the source and has been told to read it (reading takes a while: `items` counts what it has so far)
            "knowledge": {"source": KNOWLEDGE_SOURCE, "documents": len(self.docs()), "items": items, "state": state,
                          "done": (source is not None and state not in ("pending_confirmation", "error")) if sources is not None else None},
            "sample": {"id": sample, "done": bool(sample) and sample in self.svc.runs},
            "problems": problems,
        }
        out["ready"] = all(out[k]["done"] is True for k in ("workspace", "templates", "members", "knowledge"))
        return out

    # ---- what to do ----------------------------------------------------------------------------------------- #

    def plan(self, status: dict[str, Any]) -> list[dict[str, Any]]:
        """The steps still to do, in order. A step whose state could not be read is included: it is safe to repeat."""
        steps: list[dict[str, Any]] = []
        if status["templates"]["done"] is not True:
            steps.append({"id": "templates", "label": "Add the example team's member templates",
                          "call": {"method": "POST", "path": f"{APP_PATH}/setup/templates", "body": {}}})
        if status["workspace"]["done"] is not True:
            steps.append({"id": "workspace", "label": f"Create the {WORKSPACE} workspace",
                          "call": {"method": "POST", "path": "/api/workspaces",
                                   "body": {"name": WORKSPACE, "dir": str(self.workspace_dir)}}})
        missing = status["members"]["missing"]
        for spec in member_specs(self.agents_dir):
            if missing is not None and spec["name"] not in missing:
                continue
            steps.append({"id": f"member:{spec['name']}", "label": f"Add {spec['display_name']}",
                          "call": {"method": "POST", "path": "/api/agents",
                                   "body": {"name": spec["name"], "kiro_agent": "kirocrew", "workspace": WORKSPACE,
                                            "display_name": spec["display_name"], "description": spec["description"]}}})
        if status["knowledge"]["done"] is not True:
            steps.append({"id": "knowledge", "label": f"Read the {KNOWLEDGE_SOURCE} rules into the knowledge base",
                          "call": {"method": "POST", "path": f"{APP_PATH}/setup/knowledge", "body": {}}})
        return steps

    async def describe(self) -> dict[str, Any]:
        status = await self.status()
        return {"status": status, "plan": self.plan(status), "example": self.example(),
                "terminal": "python3 scripts/setup_plan.py",
                "disclosure": ("The example team's 14 members can read and write files and run shell commands in git worktrees "
                               f"under {self.home / 'workplace' / APP_NAME}. Their templates are written to {self.kiro_agents_dir}.")}

    # ---- the steps only this app does ----------------------------------------------------------------------- #

    async def install_templates(self) -> dict[str, Any]:
        """Write each member's template to ``~/.kiro/agents``; one that is there stays as it is."""
        binary = self._bin() if callable(self._bin) else str(self._bin)
        if not binary:
            raise AppError("The `kirocrew` command was not found next to the gateway's Python or on PATH, so the templates "
                           "cannot name it. Run `python3 scripts/setup_plan.py --kirocrew-bin /path/to/kirocrew` in a terminal.",
                           "kirocrew_not_found", 500)
        specs = member_specs(self.agents_dir)
        if not specs:
            raise AppError("This copy of the app has no member templates (agents/)", "no_members", 500)

        def write() -> tuple[list[str], list[str]]:
            written, kept = [], []
            for s in specs:
                text = template_text((self.agents_dir / f"{s['name']}.json").read_text(encoding="utf-8"), s["name"], binary)
                (written if _write_new(self.kiro_agents_dir / f"{s['name']}{TEMPLATE_SUFFIX}.json", text) else kept).append(s["name"])
            return written, kept

        written, kept = await asyncio.to_thread(write)
        return {"ok": True, "written": written, "kept": kept}

    async def add_knowledge(self) -> dict[str, Any]:
        """Copy the rule documents next to the workspace (where the person can edit them), add them to Kiro Crew as one
        folder source, confirm it (Kiro Crew holds a new folder source until then) and so have it read them. A source that
        is there is read again, not added twice."""
        docs = self.docs()
        if not docs:
            raise AppError("The example company's rule documents (knowledge/larkspur) are not in this copy of the app",
                           "no_documents", 500)

        def copy() -> int:
            n = 0
            for f in sorted(p for p in self.knowledge_dir.rglob("*") if p.is_file()):
                target = self.rules_dir / f.relative_to(self.knowledge_dir)
                n += _write_new(target, f.read_text(encoding="utf-8"))  # a file the person edited is kept
            return n

        copied = await asyncio.to_thread(copy)
        try:
            sources = await self.gw.knowledge_sources()
            found = next((s for s in sources if s.get("name") == KNOWLEDGE_SOURCE), None)
            added = found is None
            if found is None:
                found = await self.gw.add_knowledge_source(KNOWLEDGE_SOURCE, str(self.rules_dir))
            sid = str(found.get("id") or "")
            if not sid:
                again = next((s for s in await self.gw.knowledge_sources() if s.get("name") == KNOWLEDGE_SOURCE), {})
                sid = str(again.get("id") or "")
            if not sid:
                raise AppError("Kiro Crew added the knowledge source but did not name it", "knowledge_no_id", 502)
            row = next((s for s in await self.gw.knowledge_sources() if s.get("id") == sid), found)
            if str(row.get("sync_status") or "") == "pending_confirmation":
                await self.gw.confirm_knowledge_source(sid)  # a folder source is held until it is confirmed; then it is read
            else:
                await self.gw.sync_knowledge_source(sid)
        except GatewayError as exc:
            raise AppError(f"Kiro Crew refused the knowledge source: {exc}", "knowledge_refused", 502) from exc
        return {"ok": True, "source": KNOWLEDGE_SOURCE, "source_id": sid, "added": added, "documents": len(docs), "copied": copied,
                "folder": str(self.rules_dir)}

    async def load_sample(self) -> dict[str, Any]:
        """Import the finished delivery that ships with the app, so the replay and the measured delivery in the CTO view
        have something real to show without a model run. Once only."""
        try:
            data = json.loads(self.sample_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raise AppError("This copy of the app has no sample delivery (samples/sample-run.json)", "no_sample", 500)
        run, events = data.get("run"), data.get("events")
        rid = str((run or {}).get("id") or "") if isinstance(run, dict) else ""
        if rid and rid in self.svc.runs:
            return {"ok": True, "run": rid, "already": True}
        out = await self.svc.import_run(run, events)
        return {**out, "already": False}
