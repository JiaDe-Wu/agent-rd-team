#!/usr/bin/env python3
"""End to end: a stranger's first ten minutes with the app, on a gateway of its own.

    scripts/e2e_install.sh [--app DIR_OR_URL] [--kiro-src /path/to/KiroCrew/src] [--with-model] [--port 6821]

What it does, in a fresh HOME (your own Kiro Crew is not touched):

  1  start a gateway                       2  install the app (from a folder or a git URL)
  3  enable it as the owner, with consent  4  ask the app for its setup plan and run it, as the page does
  5  check the workspace, the 14 members, their templates and the rules the knowledge base read
  6  run the plan again: nothing is left to do, nothing is duplicated
  7  load the sample delivery and open its board and events
  8  with --with-model only: start the example's smallest team on a real model, wait for it to end, check the result

Steps 1-7 spend no model credits. Step 8 does. The exit code is 0 only if every check passed.
It starts one gateway process and stops it when it ends (also on Ctrl+C).
"""
import argparse
import importlib.util
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = "agent-rd-team"
PASSED: list[str] = []
FAILED: list[str] = []


def load(name: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def check(ok: bool, what: str, detail: str = "") -> bool:
    (PASSED if ok else FAILED).append(what)
    print(f"  {'PASS' if ok else 'FAIL'}  {what}" + (f"  [{detail}]" if detail and not ok else ""), flush=True)
    return ok


def rows_of(data, key: str) -> list:
    """A list answer, whether the endpoint sends the bare list or {key: [...]}."""
    return data if isinstance(data, list) else (data.get(key) or [])


def until(fn, seconds: float, every: float = 2.0):
    end = time.time() + seconds
    while True:
        value = fn()
        if value or time.time() > end:
            return value
        time.sleep(every)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--app", default=str(ROOT), help="the app folder or its git URL (default: this checkout)")
    ap.add_argument("--kiro-src", help="a Kiro Crew source checkout's src/ folder, when `kirocrew` is not installed")
    ap.add_argument("--python", default=sys.executable, help="the Python that runs the gateway (with --kiro-src)")
    ap.add_argument("--port", type=int, default=6821)
    ap.add_argument("--root", help="where the fresh HOME goes (default: a temporary folder, removed at the end)")
    ap.add_argument("--keep", action="store_true", help="keep the fresh HOME afterwards")
    ap.add_argument("--with-model", action="store_true", help="also run a delivery on a real model (spends credits)")
    ap.add_argument("--copy-kiro-login", action="store_true", help="copy ~/.local/share/kiro-cli into the fresh HOME (for --with-model)")
    ap.add_argument("--model", default="", help="the model for --with-model (default: the first the gateway offers)")
    a = ap.parse_args(argv)

    root = Path(a.root or tempfile.mkdtemp(prefix="agent-rd-team-e2e-"))
    a.root_dir = str(root)
    # Only HOME is isolated: the data home stays where Kiro Crew puts it by default (~/.kiro/crew). A data home somewhere else
    # makes Kiro Crew treat the gateway as a throwaway instance, and it then will not write the agent specs the knowledge base needs.
    home = root / "home"
    crew = home / ".kiro" / "crew"
    home.mkdir(parents=True, exist_ok=True)
    env = {k: v for k, v in os.environ.items() if k != "KIROCREW_HOME"}
    env.update({"HOME": str(home), "KIROCREW_PORT": str(a.port), "NO_COLOR": "1"})
    if a.kiro_src:
        env["PYTHONPATH"] = a.kiro_src
        kirocrew = [a.python, "-m", "kiro_crew"]
    else:
        found = shutil.which("kirocrew")
        if not found:
            sys.exit("`kirocrew` is not on PATH: install Kiro Crew or pass --kiro-src /path/to/KiroCrew/src")
        kirocrew = [found]
    print(f"fresh HOME {home}\nport {a.port}\n", flush=True)

    # Trust this one app. Kiro Crew binds that trust to where the code came from: a git URL is trusted for that repository,
    # a folder is trusted as local code (and must not be a git checkout, which counts as repository-backed).
    crew.mkdir(parents=True, exist_ok=True)
    agent: dict = {"apps_trusted": [APP]}
    app_source = a.app
    if "://" in a.app or a.app.startswith("git@"):
        agent["apps_trusted_repositories"] = {APP: a.app}
    else:
        app_source = str(root / "app")
        shutil.copytree(a.app, app_source, ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__", ".pytest_cache"))
        agent["apps_trusted_local"] = [APP]
    (crew / "config.json").write_text(json.dumps({"agent": agent}), encoding="utf-8")
    if a.copy_kiro_login:
        src = Path.home() / ".local" / "share" / "kiro-cli"
        if src.is_dir():
            shutil.copytree(src, home / ".local" / "share" / "kiro-cli", dirs_exist_ok=True)

    log = (root / "gateway.log").open("w")
    gw = subprocess.Popen([*kirocrew, "gateway", "--port", str(a.port), "--no-open", "--no-tunnel", "--no-crons"], env=env,
                          stdout=log, stderr=subprocess.STDOUT, start_new_session=True)

    def stop(*_: object) -> None:
        if gw.poll() is None:
            for sig, wait in ((signal.SIGTERM, 15), (signal.SIGKILL, 5)):
                try:
                    os.killpg(gw.pid, sig)
                    gw.wait(wait)
                    return
                except ProcessLookupError:
                    return
                except subprocess.TimeoutExpired:
                    continue

    signal.signal(signal.SIGINT, lambda *_: (stop(), sys.exit(130)))
    signal.signal(signal.SIGTERM, lambda *_: (stop(), sys.exit(143)))
    try:
        run(a, env, kirocrew, home, crew, app_source)
    except Exception as exc:  # noqa: BLE001 - the report below says where it stopped
        check(False, "the run went on to its end", f"{type(exc).__name__}: {exc}")
    finally:
        stop()
        log.close()
        print(f"\ngateway log: {root / 'gateway.log'}")
        if not a.keep and not a.root:
            shutil.rmtree(root, ignore_errors=True)
    print(f"\n{len(PASSED)} passed, {len(FAILED)} failed")
    for f in FAILED:
        print(f"  FAILED: {f}")
    return 1 if FAILED else 0


def run(a: argparse.Namespace, env: dict, kirocrew: list[str], home: Path, crew: Path, app_source: str) -> None:
    plan_mod = load("setup_plan")
    base = f"http://127.0.0.1:{a.port}"

    print("1  gateway")
    def healthy() -> bool:
        try:
            with urllib.request.urlopen(base + "/api/health", timeout=3) as r:
                return r.status == 200
        except (urllib.error.URLError, OSError):
            return False
    if not check(bool(until(healthy, 90, 1.0)), "the gateway answers /api/health"):
        return
    owner = plan_mod.Owner(a.port, kirocrew, env=env)

    print("2  install")
    r = subprocess.run([*kirocrew, "app", "install", app_source], env=env, capture_output=True, text=True, timeout=300)
    if not check(r.returncode == 0 and "installed" in r.stdout, f"`app install {a.app}` succeeds", (r.stdout + r.stderr)[-400:]):
        return
    listing = subprocess.run([*kirocrew, "app", "list"], env=env, capture_output=True, text=True).stdout
    check(APP in listing and "disabled" in listing, "the app is installed and starts disabled", listing[-200:])

    print("3  enable as the owner")
    manifest = json.loads((ROOT / "app.json").read_text(encoding="utf-8"))
    code, body = owner.call("POST", f"/api/apps/{APP}/enable", {
        "sessionApprovalConsent": True, "memberThreadsConsent": True,
        "grantsConsent": {"api": manifest["permissions"]["api"], "events": manifest["permissions"].get("events", [])}})
    check(code == 200 and body.get("ok", True), "enable with the owner's consent", f"HTTP {code} {body}")
    check(bool(until(lambda: owner.call("GET", f"/api/apps/{APP}/health")[0] == 200, 60)), "the app's backend answers /health")

    print("4  setup, as the page does it")
    code, described = owner.call("GET", f"/api/apps/{APP}/setup")
    ids = [s["id"] for s in described.get("plan", [])]
    check(code == 200 and ids[:2] == ["templates", "workspace"] and ids[-1] == "knowledge" and sum(i.startswith("member:") for i in ids) == 14,
          "a fresh gateway gets the whole plan (templates, workspace, 14 members, knowledge)", f"HTTP {code} {ids}")
    lines: list[str] = []
    failed = plan_mod.run_plan(owner, out=lines.append)
    for line in lines:
        print(f"      {line}")
    check(failed == 0, "every step of the plan ran", f"{failed} failed")

    print("5  what exists now")
    names = {m["name"] for m in rows_of(owner.call("GET", "/api/agents")[1], "agents") if m.get("workspace") == "larkspur"}
    specs = [p.stem for p in sorted((ROOT / "agents").glob("*.json"))]
    check(len(specs) == 14 and set(specs) <= names, "the 14 members are in the larkspur workspace", f"{sorted(set(specs) - names)} missing")
    check(any(w.get("name") == "larkspur" for w in rows_of(owner.call("GET", "/api/workspaces")[1], "workspaces")), "the larkspur workspace exists")
    tdir = home / ".kiro" / "agents"
    check(all((tdir / f"{n}-template.json").exists() for n in specs), "each member's template file is in ~/.kiro/agents")
    tpl = json.loads((tdir / f"{specs[0]}-template.json").read_text(encoding="utf-8")) if (tdir / f"{specs[0]}-template.json").exists() else {}
    check(bool(tpl) and "__KIROCREW_BIN__" not in json.dumps(tpl), "the templates name the real `kirocrew` command")

    def read_items() -> int:
        data = owner.call("GET", "/api/knowledge/sources")[1]
        rows = data if isinstance(data, list) else data.get("sources", [])
        row = next((s for s in rows if s.get("name") == "Larkspur Outfitters"), None)
        return int((row or {}).get("item_count") or 0)
    items = until(read_items, 180, 3.0)
    check(items > 0, "the knowledge base has read the company's rule documents", f"{items} items")
    after = owner.call("GET", f"/api/apps/{APP}/setup")[1]
    check(after.get("status", {}).get("ready") is True and after.get("plan") == [], "the app says it is ready and has nothing left to do",
          json.dumps(after.get("status")))

    print("6  again")
    lines = []
    check(plan_mod.run_plan(owner, out=lines.append) == 0 and lines == ["nothing to do: the example team is set up"], "running the plan again does nothing")
    names2 = [m["name"] for m in rows_of(owner.call("GET", "/api/agents")[1], "agents")]
    check(len(names2) == len(set(names2)), "no member was added twice")

    print("7  the sample delivery")
    code, body = owner.call("POST", f"/api/apps/{APP}/setup/sample", {})
    rid = body.get("run", "")
    check(code == 200 and bool(rid), "the sample delivery loads", f"HTTP {code} {body}")
    if rid:
        runs = owner.call("GET", f"/api/apps/{APP}/runs")[1].get("runs", [])
        check(any(r.get("id") == rid for r in runs), "it is in the list of deliveries")
        board = owner.call("GET", f"/api/apps/{APP}/board?run={rid}")[1]
        check(board.get("run", {}).get("id") == rid, "its board opens")
        events = owner.call("GET", f"/api/apps/{APP}/runs/{rid}/events")[1]
        check(bool(events.get("events")), "its events are there to replay", str(list(events))[:80])
        check(owner.call("POST", f"/api/apps/{APP}/setup/sample", {})[1].get("already") is True, "loading it twice does not import it twice")

    if a.with_model:
        with_model(a, owner, base)


BUGGY_PROJECT = {
    "package.json": '{"name": "orders", "type": "module", "scripts": {"test": "node --test"}}\n',
    "price.js": "// the order total: 10% off from 10 items\nexport function orderTotal(unit, quantity) {\n"
                "  const gross = unit * quantity\n  return quantity > 10 ? gross * 0.9 : gross\n}\n",
    "README.md": "# Orders\n\nThe order total gives 10% off from 10 items.\n",
}


def planted_bug(root: Path) -> str:
    """A tiny Node project whose order total gives no discount at exactly 10 items, as a git repository: what the bug-fix team starts from."""
    project = root / "orders"
    project.mkdir(parents=True, exist_ok=True)
    for name, text in BUGGY_PROJECT.items():
        (project / name).write_text(text, encoding="utf-8")
    git = ["git", "-C", str(project), "-c", "user.name=e2e", "-c", "user.email=e2e@localhost"]
    subprocess.run([*git, "init", "-q", "-b", "main"], check=True)
    subprocess.run([*git, "add", "-A"], check=True)
    subprocess.run([*git, "commit", "-q", "-m", "orders"], check=True)
    return str(project)


def with_model(a: argparse.Namespace, owner, base: str) -> None:
    print("8  a delivery on a real model (spends credits)")
    code, body = owner.call("GET", f"/api/apps/{APP}/models")
    models = [m["id"] for m in body.get("models", [])]
    model = a.model or (models[0] if models else "")
    check(bool(models), "the gateway offers models", str(body)[:160])
    code, body = owner.call("POST", f"/api/apps/{APP}/runs", {
        "requirement": "The order total gives no discount at exactly 10 items: it should.", "team": "team-bugfix.json",
        "source": planted_bug(Path(a.root_dir)), **({"model": model} if model else {})})
    rid = body.get("run", "")
    if not check(code == 200 and bool(rid), "the delivery starts", f"HTTP {code} {body}"):
        return

    def ended() -> dict:
        run = owner.call("GET", f"/api/apps/{APP}/board?run={rid}")[1].get("run", {})
        return run if run.get("status") in ("done", "failed", "stopped") else {}
    run = until(ended, 900, 5.0)
    check(bool(run), "it ends within 15 minutes")
    if run:
        check(run.get("status") == "done", "it is delivered", f"status {run.get('status')}")
        tests = run.get("tests") or {}
        check((tests.get("failed") or 0) == 0 and (tests.get("total") or 0) > 0, "the company checks pass", json.dumps(tests)[:160])


if __name__ == "__main__":
    sys.exit(main())
