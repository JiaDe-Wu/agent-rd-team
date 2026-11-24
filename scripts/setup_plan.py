#!/usr/bin/env python3
"""Set up the example team from a terminal: the same plan the app's page runs when you press the button.

    python3 scripts/setup_plan.py                  # the gateway on KIROCREW_PORT, else 5476
    python3 scripts/setup_plan.py --dry-run        # print the steps, change nothing

Needs a running Kiro Crew with this app installed and enabled, and the `kirocrew` command (for the sign-in token).
It signs in as the dashboard owner, asks the app for its plan (``GET /api/apps/agent-rd-team/setup``) and makes each
call of it, in order. A step that already exists (HTTP 409) counts as done, so it is safe to run twice.
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

APP = "agent-rd-team"


class Owner:
    """The gateway's API, called as the dashboard owner (cookie session from ``kirocrew token``)."""

    def __init__(self, port: int, kirocrew_bin: "str | list[str]", env: "dict[str, str] | None" = None) -> None:
        """*kirocrew_bin*: the `kirocrew` command, or the argv that stands for it (``[python, "-m", "kiro_crew"]``)."""
        self.base = f"http://127.0.0.1:{port}"
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        cmd = [kirocrew_bin] if isinstance(kirocrew_bin, str) else list(kirocrew_bin)
        out = subprocess.run([*cmd, "token", "--port", str(port), "--ttl", "10m"], capture_output=True, text=True, check=False,
                             env=env).stdout
        m = re.search(r"token=([^\s]+)", out)
        if not m:
            sys.exit(f"could not get a dashboard token from `{' '.join(cmd)} token`: is Kiro Crew running on port {port}?")
        self.call("GET", "/?token=" + urllib.parse.quote(m.group(1), safe=""))

    def call(self, method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(self.base + path, data=data, method=method, headers={"Content-Type": "application/json"})
        try:
            with self.opener.open(req, timeout=120) as r:
                status, raw = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, raw = e.code, e.read()
        try:
            return status, json.loads(raw)
        except ValueError:
            return status, {}


def run_plan(owner: Owner, *, dry_run: bool = False, out=print) -> int:
    """Run every step of the app's plan. Returns the number of steps that failed (0: set up)."""
    status, described = owner.call("GET", f"/api/apps/{APP}/setup")
    if status != 200:
        out(f"the app did not answer its setup plan (HTTP {status}): {described.get('error') or described}")
        out("is the app installed and enabled? Open /apps/detail/agent-rd-team in the dashboard and enable it.")
        return 1
    steps = described.get("plan") or []
    if not steps:
        out("nothing to do: the example team is set up")
        return 0
    failed = 0
    for step in steps:
        call = step["call"]
        if dry_run:
            out(f"would {call['method']} {call['path']}: {step['label']}")
            continue
        code, body = owner.call(call["method"], call["path"], call.get("body"))
        if code < 300:
            out(f"done  {step['label']}")
        elif code == 409:
            out(f"there {step['label']}")
        else:
            failed += 1
            out(f"FAILED {step['label']}: HTTP {code} {body.get('error') or body}")
            if step["id"] in ("templates", "workspace"):  # everything after it needs this
                break
    return failed


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=int(os.environ.get("KIROCREW_PORT") or 5476))
    ap.add_argument("--kirocrew-bin", default=shutil.which("kirocrew") or "")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    if not a.kirocrew_bin:
        sys.exit("`kirocrew` is not on PATH: pass --kirocrew-bin /path/to/kirocrew")
    return 1 if run_plan(Owner(a.port, a.kirocrew_bin), dry_run=a.dry_run) else 0


if __name__ == "__main__":
    sys.exit(main())
