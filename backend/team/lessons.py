"""Lessons: what the person chose to keep from a delivery, and how the next run reads it.

At the last gate (``remember`` in the team file) the person ticks which candidate lessons to keep. Only what they tick
is written, word for word, to one JSON file next to the runs (``<work root>/lessons.json``). It is the app's own
file: the company's knowledge source is never written to by a run.

A run reads the file once, when it starts, so every role of one run sees the same cards, and the cards are named in
each role's task. A card says where it came from; the person can edit or delete the file at any time.
"""

from __future__ import annotations

import json
import os
import re
import secrets
from pathlib import Path
from typing import Any

KEEP_TEXT = 300  # characters of one card
IN_TASK = 20  # the newest cards a task names
MAX_CARDS = 500  # the file never grows past this: the oldest cards go first


class Unreadable(RuntimeError):
    """The file exists and cannot be read: a writer must not replace it with a list of one."""


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().casefold()


def _clean(text: str) -> str:
    return " ".join(str(text or "").split())[:KEEP_TEXT]


def load(path: Path | str | None) -> list[dict[str, Any]]:
    """The cards in *path*, oldest first. A missing file is an empty list; one that cannot be read raises."""
    if not path:
        return []
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    except (OSError, ValueError) as exc:
        raise Unreadable(str(path)) from exc
    rows = data.get("cards") if isinstance(data, dict) else None
    return [c for c in rows or [] if isinstance(c, dict) and isinstance(c.get("text"), str) and c["text"].strip()]


def add(path: Path | str, texts: list[str], source: str, today: str) -> tuple[list[dict[str, Any]], int]:
    """Append one card per text that is not already in the file. Returns ``(new cards, how many were already there)``.

    The text is stored as given (whitespace folded, cut at ``KEEP_TEXT``), never reworded."""
    cards = load(path)
    seen = {_norm(c["text"]) for c in cards}
    added: list[dict[str, Any]] = []
    dup = 0
    for raw in texts:
        text = _clean(raw)
        if not text:
            continue
        if _norm(text) in seen:
            dup += 1
            continue
        seen.add(_norm(text))
        added.append({"id": f"L-{secrets.token_hex(3)}", "text": text, "source": source, "added": today})
    if added:
        cards = (cards + added)[-MAX_CARDS:]
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_name(f".{target.name}.{os.getpid()}.tmp")
        tmp.write_text(json.dumps({"version": 1, "cards": cards}, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, target)
    return added, dup


def task_lines(cards: list[dict[str, Any]]) -> str:
    """The part of a role's task that names the kept lessons; nothing at all when there are none."""
    rows = [c for c in cards if isinstance(c, dict) and str(c.get("text") or "").strip()][-IN_TASK:]
    if not rows:
        return ""
    # agent-facing task text: stays in Chinese
    lines = ["团队以前的交付里，负责人留下的经验（原话；照着做，和这次范围里人定的事冲突时以这次为准）："]
    lines += [f"- {_clean(c['text'])}" + (f"（{c['source']}）" if c.get("source") else "") for c in rows]
    return "\n".join(lines)
