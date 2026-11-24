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

# The values are English words, shown as they are (the UI types and the CTO data match them).
KINDS = ("New app", "New feature", "Fix")
SIZES = ("Small", "Medium", "Large")
LINES = ("E-commerce", "Mobile app", "CRM", "Supply chain", "Internal systems")
FIX = KINDS[2]
NEW_APP, NEW_FEATURE = KINDS[0], KINDS[1]
# Older runs and team files wrote these values in Chinese. They are still read and stored as the English ones above.
# (Written as \u escapes: this file carries no Chinese text.)
LEGACY = {
    "kind": {"\u65b0\u5e94\u7528": KINDS[0], "\u65b0\u529f\u80fd": KINDS[1], "\u4fee\u590d": KINDS[2]},
    "size": {"\u5c0f": SIZES[0], "\u4e2d": SIZES[1], "\u5927": SIZES[2]},
    "line": {"\u7535\u5546": LINES[0], "\u79fb\u52a8\u5e94\u7528": LINES[1],
             "\u5ba2\u6237\u5173\u7cfb\u7ba1\u7406": LINES[2], "\u4f9b\u5e94\u94fe": LINES[3],
             "\u5185\u90e8\u7cfb\u7edf": LINES[4]},
}
NAME_MAX = 20
WHY_MAX = 60
FIELDS = {"kind": KINDS, "size": SIZES, "line": LINES}
# who raises a business line's Issues when a run does not say (an imported run brings its own)
REPORTERS = {"E-commerce": "Operations", "Mobile app": "UX group", "CRM": "Membership operations",
             "Supply chain": "Supply chain management", "Internal systems": "Administration"}
ISSUE_PREFIX = "LO"  # Larkspur Outfitters, the example company


ISSUE_KINDS = ("Requirement", "Defect")
_LEGACY_ISSUE_KIND = {"\u9700\u6c42": ISSUE_KINDS[0], "\u7f3a\u9677": ISSUE_KINDS[1]}


def issue_kind(value: Any) -> Any:
    """An Issue's kind as the English word (an older run's Chinese one is turned into it)."""
    return _LEGACY_ISSUE_KIND.get(value, value)


def issue_kind_of(d: dict[str, Any]) -> str:
    """The kind of Issue a run's delivery tag raises: a fix is a Defect, anything else a Requirement."""
    return ISSUE_KINDS[1] if canon("kind", d.get("kind")) == FIX else ISSUE_KINDS[0]


def canon(field: str, value: Any) -> Any:
    """*value* as the English word of *field* (kind, size, line): an older run's Chinese word is turned into it; anything else is returned as it is."""
    return LEGACY[field].get(value, value)


def canonical(d: dict[str, Any]) -> dict[str, Any]:
    """A delivery tag with its kind, size and line in English words."""
    return {**d, **{k: canon(k, d[k]) for k in LEGACY if k in d}}


def issue_id(rid: str) -> str:
    """A run's Issue number, from its id (stable, and apart from the shipped history's LO-1001…LO-2999)."""
    return f"{ISSUE_PREFIX}-{3000 + zlib.crc32(rid.encode()) % 7000}"


def pr_number(rid: str) -> int:
    """A run's pull request number, from its id (stable, and apart from the history's #1201…#4999)."""
    return 5000 + zlib.crc32(f"{rid}:pr".encode()) % 5000


def short_name(title: str) -> str:
    """A delivery's name from a requirement's first line: up to its first colon or comma, at most NAME_MAX characters."""
    head = re.split(r"[\uff1a:\uff0c,\u3002]", " ".join(str(title or "").split()), maxsplit=1)[0].strip()
    return head[:NAME_MAX] or "Untitled delivery"


def clean(data: Any, base: dict[str, Any]) -> dict[str, Any]:
    """*base* with every valid field of *data* over it (anything else in *data* is ignored)."""
    out = dict(base)
    if not isinstance(data, dict):
        return out
    for key, allowed in FIELDS.items():
        if canon(key, data.get(key)) in allowed:
            out[key] = canon(key, data[key])
    name = " ".join(str(data.get("name") or "").split())
    if name:
        out["name"] = name[:NAME_MAX]
    why = " ".join(str(data.get("why") or "").split())
    if why:
        out["why"] = why[:WHY_MAX]
    return out


def defaults(team: dict[str, Any], title: str, *, on_source: bool = False, team_dir: Path | None = None) -> dict[str, Any]:
    """The team file's ``delivery_defaults``; a run that began before teams had them takes those of the team file of the
    same name in *team_dir*; without any: a change to an existing project is a new feature, anything else a new app, medium, internal systems."""
    base = {"name": short_name(title), "kind": NEW_FEATURE if on_source else NEW_APP, "size": SIZES[1], "line": LINES[4], "why": ""}
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
            if key in dd and canon(key, dd[key]) not in allowed:
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
    """One line for events and the gate: New feature · Medium · E-commerce (Black Friday appliance sale), i.e. kind · size · line (name)."""
    d = canonical(d)
    return f"{d['kind']} · {d['size']} · {d['line']} ({d['name']})"
