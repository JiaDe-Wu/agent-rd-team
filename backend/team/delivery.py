"""Delivery tag: what a run delivers, as the CTO view counts it — a short name, kind, size and business line.

The run's first gated role proposes them in a small JSON file (a team file role's ``"delivery"``: a path in the run
branch), the person confirms or changes them when approving that gate. Until then, or when the file is missing or wrong,
the team file's ``delivery_defaults`` stand (a team without a gate, the bugfix pair, only ever has those)."""

from __future__ import annotations

import json
import re
import zlib
from pathlib import Path
from typing import Any

# protocol token: kept in Chinese (the UI types and the CTO data match these values)
KINDS = ("新应用", "新功能", "修复")  # new app, new feature, fix
SIZES = ("小", "中", "大")  # small, medium, large
LINES = ("电商", "移动应用", "客户关系管理", "供应链", "内部系统")  # e-commerce, mobile apps, CRM, supply chain, internal systems
NAME_MAX = 20
WHY_MAX = 60
FIELDS = {"kind": KINDS, "size": SIZES, "line": LINES}
# The team files and agents write the tags in English; they are kept under the tokens above, which the UI types and the CTO data match.
ALIASES = {"new app": "新应用", "new feature": "新功能", "fix": "修复", "small": "小", "medium": "中", "large": "大",
           "e-commerce": "电商", "mobile apps": "移动应用", "crm": "客户关系管理", "supply chain": "供应链", "internal systems": "内部系统"}


def canon(value: Any) -> Any:
    """A tag as it is kept: an English word becomes its token; anything else is left as it is."""
    return ALIASES.get(value.strip().lower(), value) if isinstance(value, str) else value
# who raises a business line's Issues when a run does not say (an imported run brings its own)
# protocol token: kept in Chinese (department names written into the CTO data)
REPORTERS = {"电商": "运营部", "移动应用": "用户体验组", "客户关系管理": "会员运营部", "供应链": "供应链管理部", "内部系统": "行政部"}


def issue_id(rid: str) -> str:
    """A run's Issue number, from its id (stable, and apart from the shipped history's TY-1001…TY-2999)."""
    return f"TY-{3000 + zlib.crc32(rid.encode()) % 7000}"


def pr_number(rid: str) -> int:
    """A run's pull request number, from its id (stable, and apart from the history's #1201…#4999)."""
    return 5000 + zlib.crc32(f"{rid}:pr".encode()) % 5000


def short_name(title: str) -> str:
    """A delivery's name from a requirement's first line: up to its first colon or comma, at most NAME_MAX characters."""
    head = re.split(r"[：:，,。]", " ".join(str(title or "").split()), maxsplit=1)[0].strip()
    return head[:NAME_MAX] or "Untitled delivery"


def clean(data: Any, base: dict[str, Any]) -> dict[str, Any]:
    """*base* with every valid field of *data* over it (anything else in *data* is ignored)."""
    out = dict(base)
    if not isinstance(data, dict):
        return out
    for key, allowed in FIELDS.items():
        if canon(data.get(key)) in allowed:
            out[key] = canon(data[key])
    name = " ".join(str(data.get("name") or "").split())
    if name:
        out["name"] = name[:NAME_MAX]
    why = " ".join(str(data.get("why") or "").split())
    if why:
        out["why"] = why[:WHY_MAX]
    return out


def defaults(team: dict[str, Any], title: str, *, on_source: bool = False, team_dir: Path | None = None) -> dict[str, Any]:
    """The team file's ``delivery_defaults``; a run that began before teams had them takes those of the team file of the
    same name in *team_dir*; without any: a change to an existing project is a new feature (新功能), anything else a new app (新应用), medium (中), internal systems (内部系统)."""
    base = {"name": short_name(title), "kind": "新功能" if on_source else "新应用", "size": "中", "line": "内部系统", "why": ""}
    dd = team.get("delivery_defaults")
    if not isinstance(dd, dict) and team_dir is not None and team.get("name"):
        dd = _defaults_by_name(team_dir).get(str(team["name"]))
    return clean(dd, base)


def _defaults_by_name(team_dir: Path) -> dict[str, Any]:
    """Every team file's ``delivery_defaults``, by its name (read once per change of the folder)."""
    key = (str(team_dir), max((p.stat().st_mtime for p in team_dir.glob("team*.json")), default=0.0))
    if _by_name.get("key") != key:
        found: dict[str, Any] = {}
        for p in team_dir.glob("team*.json"):
            try:
                t = json.loads(p.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue
            if isinstance(t, dict) and t.get("name") and isinstance(t.get("delivery_defaults"), dict):
                found[str(t["name"])] = t["delivery_defaults"]
        _by_name.update(key=key, found=found)
    return _by_name["found"]


_by_name: dict[str, Any] = {}


def check(team: dict[str, Any]) -> None:
    """A team file's delivery settings, or a ValueError saying what is wrong."""
    dd = team.get("delivery_defaults")
    if dd is not None:
        if not isinstance(dd, dict):
            raise ValueError("team.json: delivery_defaults must be {kind, size, line}")
        for key, allowed in FIELDS.items():
            if key in dd and canon(dd[key]) not in allowed:
                raise ValueError(f"team.json: delivery_defaults.{key} must be one of {', '.join(allowed)}")
    for r in team.get("roles") or []:
        rel = r.get("delivery")
        if rel is None:
            continue
        if not isinstance(rel, str) or not rel.endswith(".json") or rel.startswith(("/", "~")) or ".." in rel.split("/"):
            raise ValueError(f"team.json: delivery of {r.get('key')} must be a relative path (.json) inside the run branch")
        if r.get("gate") != "human":
            raise ValueError(f"team.json: {r.get('key')} proposes a delivery tag, so it needs a human gate (gate: human)")


def label(d: dict[str, Any]) -> str:
    """One line for events and the gate: 新功能 · 中 · 电商 (双十一家电大促), i.e. kind · size · line (name)."""
    return f"{d['kind']} · {d['size']} · {d['line']} ({d['name']})"
