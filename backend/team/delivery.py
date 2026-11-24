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

# Data enums: the stored values stay as they are, because the UI types and the CTO data match them (the UI shows them in English,
# see ``DISPLAY``). A team file or a planner writes the English names (``ALIASES``); the stored value is the enum.
KINDS = ("新应用", "新功能", "修复")  # new app, new feature, fix
SIZES = ("小", "中", "大")  # small, medium, large
LINES = ("电商", "移动应用", "客户关系管理", "供应链", "内部系统")  # e-commerce, mobile apps, CRM, supply chain, internal systems
DISPLAY = {"新应用": "new app", "新功能": "new feature", "修复": "fix", "小": "small", "中": "medium", "大": "large",
           "电商": "e-commerce", "移动应用": "mobile apps", "客户关系管理": "CRM", "供应链": "supply chain", "内部系统": "internal systems"}
ALIASES = {**{v: k for k, v in DISPLAY.items()}, "customer relationship management": "客户关系管理", "mobile app": "移动应用",
           "internal system": "内部系统", "ecommerce": "电商"}
NAME_MAX = 20
WHY_MAX = 60
FIELDS = {"kind": KINDS, "size": SIZES, "line": LINES}
# who raises a business line's Issues when a run does not say (an imported run brings its own)
REPORTERS = {"电商": "Operations", "移动应用": "UX team", "客户关系管理": "Member operations", "供应链": "Supply chain management",
             "内部系统": "Administration"}


def canon(allowed: tuple[str, ...], value: Any) -> str | None:
    """The enum value *value* names, written as the enum itself or by its English name (any case); None when it names none."""
    if not isinstance(value, str):
        return None
    v = " ".join(value.split())
    if v in allowed:
        return v
    got = ALIASES.get(v.lower())
    return got if got in allowed else None


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
        got = canon(allowed, data.get(key))
        if got:
            out[key] = got
    name = " ".join(str(data.get("name") or "").split())
    if name:
        out["name"] = name[:NAME_MAX]
    why = " ".join(str(data.get("why") or "").split())
    if why:
        out["why"] = why[:WHY_MAX]
    return out


def defaults(team: dict[str, Any], title: str, *, on_source: bool = False, team_dir: Path | None = None) -> dict[str, Any]:
    """The team file's ``delivery_defaults``; a run that began before teams had them takes those of the team file of the
    same name in *team_dir*; without any: a change to an existing project is a new feature, anything else a new app; medium; internal systems."""
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
            if key in dd and canon(allowed, dd[key]) is None:
                raise ValueError(f"team.json: delivery_defaults.{key} must be one of {', '.join(DISPLAY[a] for a in allowed)}")
    for r in team.get("roles") or []:
        rel = r.get("delivery")
        if rel is None:
            continue
        if not isinstance(rel, str) or not rel.endswith(".json") or rel.startswith(("/", "~")) or ".." in rel.split("/"):
            raise ValueError(f"team.json: delivery of {r.get('key')} must be a relative path (.json) inside the run branch")
        if r.get("gate") != "human":
            raise ValueError(f"team.json: {r.get('key')} proposes a delivery tag, so it needs a human gate (gate: human)")


def label(d: dict[str, Any]) -> str:
    """One line for events and the gate: new feature · medium · e-commerce (Black Friday promo), i.e. kind · size · line (name)."""
    return f"{DISPLAY.get(d['kind'], d['kind'])} · {DISPLAY.get(d['size'], d['size'])} · {DISPLAY.get(d['line'], d['line'])} ({d['name']})"
