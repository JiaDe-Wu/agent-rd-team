"""Matched standards: which of the company's standards (and which of its knowledge-base data) a requirement touches, by keywords,
the same deterministic way the team pick works. The page shows what matched and why; every role's task lists them, and
the roles look the originals up in the Crew knowledge base themselves.

A team names its company's standards file (``standards``: a JSON file in the app, e.g. ``packs/taoyuan/standards.json``):
a list of ``{id, title, kind: "standard" | "data", owner, doc, rules, keywords}``. ``standards_always`` lists the ids
a team always works by (the raffle page always has the raffle rules and the personal data standard in it, whatever the wording).
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .constants import APP_ROOT


def _hit(word: str, text: str) -> bool:
    if re.fullmatch(r"[A-Za-z][A-Za-z -]*", word):
        return re.search(rf"(?<![A-Za-z]){re.escape(word)}(?![A-Za-z])", text, re.I) is not None
    return word in text


def load(team: dict[str, Any], app_root: Path = APP_ROOT) -> list[dict[str, Any]]:
    name = team.get("standards")
    if not isinstance(name, str) or not name or name.startswith(("/", "~")) or ".." in name.split("/"):
        return []
    try:
        rows = json.loads((app_root / name).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    return [r for r in rows if isinstance(r, dict) and isinstance(r.get("id"), str) and r.get("title")]


def match(requirement: str, team: dict[str, Any], app_root: Path = APP_ROOT) -> list[dict[str, Any]]:
    """The standards and data *requirement* touches, in the file's order, each with why."""
    text = requirement or ""
    always = {a for a in team.get("standards_always") or [] if isinstance(a, str)}
    out = []
    for s in load(team, app_root):
        words = [k for k in s.get("keywords") or [] if isinstance(k, str) and k.strip() and _hit(k, text)]
        if not words and s["id"] not in always:
            continue
        out.append({"id": s["id"], "title": s["title"], "kind": s.get("kind") or "standard", "owner": s.get("owner") or "",
                    "doc": s.get("doc") or "", "rules": [r for r in s.get("rules") or [] if isinstance(r, str)],
                    "why": f"Requirement mentions \"{', '.join(words[:3])}\"" if words else "Every project of this kind must follow it"})
    return out


def task_lines(found: list[dict[str, Any]], source: str = "", source_id: str = "") -> str:
    """The part of a role's task that names them: what to look up in the knowledge base (in *source_id* only, if given)."""
    if not found:
        return "(This requirement touches no company standards.)"
    where = f"the knowledge base source \"{source}\"" if source else "the knowledge base"
    scope = f", with `source_id: \"{source_id}\"` to search only that source" if source_id else ""
    lines = [f"The company standards and data this requirement touches (the originals are in Kiro Crew {where}: look them up by title with "
             f"`local_knowledge_search`{scope}, and do not write from memory):"]
    for s in found:
        rules = f": {', '.join(s['rules'])}" if s["rules"] else ""
        lines.append(f"- {'Data' if s['kind'] == 'data' else 'Standard'} \"{s['title']}\"{rules}")
    return "\n".join(lines)
