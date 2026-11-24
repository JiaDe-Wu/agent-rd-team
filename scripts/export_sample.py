#!/usr/bin/env python3
"""Turn one finished run into the sample delivery that ships with the app (``samples/sample-run.json``).

    python3 scripts/export_sample.py <data_dir>/runs/<run id> [--out samples/sample-run.json]

*<data_dir>* is the app's data directory (``~/.kiro/crew/apps/agent-rd-team/data`` or the one your gateway uses).
The file is ``{"format": 1, "run": <run.json>, "events": [<events.jsonl lines>]}``, the same record
``POST /api/apps/agent-rd-team/runs/import`` takes, so the app's "Load a sample delivery" button imports it as it is.

Only an ended run can be a sample. Sign the run off in the app first: the CTO view counts only signed-off deliveries, so
that is what makes the sample show up there as a measured delivery. Your home directory in any path becomes ``/home/user``, and the sign-off name is kept
only if you pass ``--keep-names``. Look through the file before you commit it: it holds what the roles said and wrote.
"""
import argparse
import json
import sys
from pathlib import Path

ENDED = ("done", "failed", "stopped")


def clean(value, home: str):
    if isinstance(value, str):
        return value.replace(home, "/home/user") if home else value
    if isinstance(value, list):
        return [clean(v, home) for v in value]
    if isinstance(value, dict):
        return {k: clean(v, home) for k, v in value.items()}
    return value


def build(run_dir: Path, *, home: str, keep_names: bool = False) -> dict:
    state = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
    if state.get("status") not in ENDED:
        sys.exit(f"{run_dir.name} is {state.get('status')!r}: only an ended run can be a sample")
    events = []
    for line in (run_dir / "events.jsonl").read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if isinstance(ev, dict) and "seq" in ev:
            events.append(ev)
    by_seq = {int(e["seq"]): e for e in events}  # a restart may have appended an event twice: the later copy wins
    events = [by_seq[k] for k in sorted(by_seq)]
    state.pop("imported", None)
    if not keep_names and isinstance(state.get("signoff"), dict):
        state["signoff"]["by"] = "Delivery lead"
    return {"format": 1, "run": clean(state, home), "events": clean(events, home)}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("run_dir", type=Path)
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent.parent / "samples" / "sample-run.json")
    ap.add_argument("--home", default=str(Path.home()))
    ap.add_argument("--keep-names", action="store_true")
    a = ap.parse_args(argv)
    sample = build(a.run_dir, home=a.home, keep_names=a.keep_names)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(sample, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {a.out}: run {sample['run']['id']}, {len(sample['events'])} events")
    return 0


if __name__ == "__main__":
    sys.exit(main())
