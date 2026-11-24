"""The one-click setup: its plan, the steps only the app does (templates, knowledge, sample), and the terminal runner."""

import asyncio
import importlib.util
import json


from pathlib import Path

import pytest

from http_fakes import call
from teamkit import ROOT, FakeManager, mod
from test_service import make

setup_mod, gateway = mod("setup"), mod("gateway")
GatewayError = gateway.GatewayError


class FakeGw:
    """The gateway calls the setup makes, answered from lists a test sets, recorded in ``calls``."""

    def __init__(self):
        self.spaces, self.member_rows, self.sources = [], [], []
        self.calls = []
        self.refuse = None  # a GatewayError to raise from the knowledge calls
        self.unreadable = False
        self.add_returns_id = True

    async def workspaces(self):
        if self.unreadable:
            raise GatewayError(403, "app_permission_not_approved", "app_permission_not_approved", "/api/workspaces")
        return self.spaces

    async def members(self):
        if self.unreadable:
            raise GatewayError(0, "gateway unreachable", "unreachable", "/api/agents")
        return self.member_rows

    async def knowledge_sources(self):
        if self.unreadable:
            raise GatewayError(0, "gateway unreachable", "unreachable", "/api/knowledge/sources")
        return self.sources

    async def add_knowledge_source(self, name, folder):
        self.calls.append(("add", name, folder))
        if self.refuse:
            raise self.refuse
        row = {"id": "src-1", "name": name, "uri": folder, "item_count": 0, "sync_status": "pending_confirmation"}
        self.sources.append(row)
        return row if self.add_returns_id else {}

    async def confirm_knowledge_source(self, source_id):
        self.calls.append(("confirm", source_id))
        if self.refuse:
            raise self.refuse
        for s in self.sources:
            if s["id"] == source_id:
                s["sync_status"], s["item_count"] = "scanning", 13

    async def sync_knowledge_source(self, source_id):
        self.calls.append(("sync", source_id))
        if self.refuse:
            raise self.refuse
        for s in self.sources:
            if s["id"] == source_id:
                s["item_count"] = 13


def agents_dir(tmp_path, names=("aidlc-a-agent", "aidlc-b-agent", "aidlc-c-agent")):
    d = tmp_path / "agents"
    d.mkdir()
    for n in names:
        spec = {"name": n, "description": f"Role {n[6]} · does the work of {n[6]}", "prompt": "You are a role.",
                "tools": ["@kirocrew-core", "read"], "mcpServers": {"kirocrew-core": {"command": "__KIROCREW_BIN__", "args": ["mcp-core"]}}}
        (d / f"{n}.json").write_text(json.dumps(spec), encoding="utf-8")
    return d


def knowledge_dir(tmp_path, n=3):
    d = tmp_path / "knowledge" / "larkspur"
    (d / "data").mkdir(parents=True)
    for i in range(n):
        (d / f"2{i}-rule.md").write_text(f"# Rule {i}\n", encoding="utf-8")
    (d / "data" / "products.md").write_text("# Products\n", encoding="utf-8")
    (d / "data" / "products.json").write_text('[{"sku": "TENT-2"}]\n', encoding="utf-8")  # the data a document points at
    return d


def sample_file(tmp_path, svc_tmp):
    """A finished run, recorded the way a real one is: made by a run that is stopped."""
    mgr = FakeManager()
    src, src_routes = make(svc_tmp, mgr, tick_s=60)

    async def record():
        await src.start()
        try:
            rid = (await call(src_routes, "POST", "/runs", json_body={"requirement": "A sample requirement"})).body["run"]
            await call(src_routes, "POST", f"/runs/{rid}/stop")
            d = svc_tmp / "data" / "runs" / rid
            return {"format": 1, "run": json.loads((d / "run.json").read_text(encoding="utf-8")),
                    "events": [json.loads(x) for x in (d / "events.jsonl").read_text(encoding="utf-8").splitlines()]}
        finally:
            await src.stop()

    data = asyncio.run(record())
    path = tmp_path / "sample-run.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return path, data["run"]["id"]


@pytest.fixture
def env(tmp_path):
    svc, routes = make(tmp_path / "svc", FakeManager(), tick_s=60)
    gw = FakeGw()
    svc.sessions.gw = gw
    example = tmp_path / "example.json"
    example.write_text(json.dumps({"requirement": "Build the page", "team": "auto"}), encoding="utf-8")
    sample, rid = sample_file(tmp_path, tmp_path / "recorded")
    svc.setup = setup_mod.Setup(svc, home=tmp_path / "home", agents_dir=agents_dir(tmp_path), knowledge_dir=knowledge_dir(tmp_path),
                                example_file=example, sample_file=sample, kirocrew_bin="/opt/kc/bin/kirocrew")
    return type("Env", (), {"svc": svc, "routes": routes, "gw": gw, "home": tmp_path / "home", "tmp": tmp_path, "sample_id": rid})


def run(coro):
    return asyncio.run(coro)


def steps(described):
    return [s["id"] for s in described["plan"]]


# ---- the routes ------------------------------------------------------------------------------------------- #

def test_the_setup_routes_are_for_the_owner_only(env):
    async def go():
        for method, path in (("GET", "/setup"), ("POST", "/setup/templates"), ("POST", "/setup/knowledge"), ("POST", "/setup/sample")):
            assert (await call(env.routes, method, path, user=None)).status == 401, path
            r = await call(env.routes, method, path, owner=False)
            assert (r.status, r.code) == (403, "owner_only"), path
            r = await call(env.routes, method, path, app="some-app")
            assert (r.status, r.code) == (403, "app_token_forbidden"), path

    run(go())


# ---- the plan --------------------------------------------------------------------------------------------- #

def test_a_fresh_gateway_gets_the_whole_plan_in_the_order_it_must_run(env):
    d = run(env.svc.setup.describe())
    assert steps(d) == ["templates", "workspace", "member:aidlc-a-agent", "member:aidlc-b-agent", "member:aidlc-c-agent", "knowledge"]
    assert d["status"]["ready"] is False and d["example"] == {"requirement": "Build the page", "team": "auto"}
    by_id = {s["id"]: s["call"] for s in d["plan"]}
    assert by_id["templates"] == {"method": "POST", "path": "/api/apps/agent-rd-team/setup/templates", "body": {}}
    assert by_id["workspace"] == {"method": "POST", "path": "/api/workspaces",
                                  "body": {"name": "larkspur", "dir": str(env.home / "workplace" / "larkspur")}}
    m = by_id["member:aidlc-b-agent"]
    assert m["method"] == "POST" and m["path"] == "/api/agents"
    assert m["body"] == {"name": "aidlc-b-agent", "kiro_agent": "kirocrew", "workspace": "larkspur", "display_name": "Role b",
                         "description": "Role b · does the work of b"}
    assert by_id["knowledge"]["path"] == "/api/apps/agent-rd-team/setup/knowledge"
    assert "shell commands" in d["disclosure"] and str(env.home / ".kiro" / "agents") in d["disclosure"]
    assert d["terminal"] == "python3 scripts/setup_plan.py"


def test_what_exists_is_left_out_of_the_plan_and_a_complete_setup_has_none(env):
    env.gw.spaces = [{"name": "default"}, {"name": "larkspur"}]
    env.gw.member_rows = [{"name": "aidlc-a-agent", "workspace": "larkspur"}, {"name": "aidlc-b-agent", "workspace": "other"}]
    for n in ("aidlc-a-agent", "aidlc-b-agent", "aidlc-c-agent"):
        t = env.home / ".kiro" / "agents" / f"{n}-template.json"
        t.parent.mkdir(parents=True, exist_ok=True)
        t.write_text("{}", encoding="utf-8")
    d = run(env.svc.setup.describe())
    assert steps(d) == ["member:aidlc-b-agent", "member:aidlc-c-agent", "knowledge"]  # a member of another workspace does not count
    assert d["status"]["members"] == {"total": 3, "created": 1, "missing": ["aidlc-b-agent", "aidlc-c-agent"], "done": False}
    env.gw.member_rows += [{"name": "aidlc-b-agent", "workspace": "larkspur"}, {"name": "aidlc-c-agent", "workspace": "larkspur"}]
    env.gw.sources = [{"id": "s", "name": "Larkspur Outfitters", "item_count": 13, "sync_status": "synced"}]
    d = run(env.svc.setup.describe())
    assert d["plan"] == [] and d["status"]["ready"] is True and d["status"]["knowledge"]["items"] == 13


def test_a_knowledge_source_still_waiting_for_confirmation_is_not_done_but_one_being_read_is(env):
    env.gw.sources = [{"id": "s", "name": "Larkspur Outfitters", "item_count": 0, "sync_status": "pending_confirmation"}]
    k = run(env.svc.setup.describe())["status"]["knowledge"]
    assert (k["done"], k["state"]) == (False, "pending_confirmation")
    env.gw.sources = [{"id": "s", "name": "Larkspur Outfitters", "item_count": 0, "sync_status": "scanning"}]
    assert run(env.svc.setup.describe())["status"]["knowledge"]["done"] is True  # reading takes a while: items fill in
    env.gw.sources = [{"id": "s", "name": "Larkspur Outfitters", "item_count": 0, "sync_status": "error"}]
    assert run(env.svc.setup.describe())["status"]["knowledge"]["done"] is False


def test_what_cannot_be_read_is_reported_and_its_steps_stay_in_the_plan(env):
    env.gw.unreadable = True
    d = run(env.svc.setup.describe())
    st = d["status"]
    assert st["workspace"]["done"] is None and st["members"]["done"] is None and st["knowledge"]["done"] is None
    assert len(st["problems"]) == 3 and any("app_permission_not_approved" in p for p in st["problems"])
    assert st["ready"] is False
    assert "workspace" in steps(d) and "knowledge" in steps(d) and sum(s.startswith("member:") for s in steps(d)) == 3


# ---- the templates -------------------------------------------------------------------------------------- #

def test_templates_are_written_with_the_command_named_and_never_overwritten(env):
    async def go():
        r = await call(env.routes, "POST", "/setup/templates")
        assert r.status == 200 and sorted(r.body["written"]) == ["aidlc-a-agent", "aidlc-b-agent", "aidlc-c-agent"] and r.body["kept"] == []
        return r

    run(go())
    d = env.home / ".kiro" / "agents"
    t = json.loads((d / "aidlc-a-agent-template.json").read_text(encoding="utf-8"))
    assert t["name"] == "aidlc-a-agent-template" and t["mcpServers"]["kirocrew-core"]["command"] == "/opt/kc/bin/kirocrew"
    assert "__KIROCREW_BIN__" not in (d / "aidlc-a-agent-template.json").read_text(encoding="utf-8")
    assert not [p for p in d.iterdir() if p.name.startswith(".")]  # no temporary file left behind
    (d / "aidlc-b-agent-template.json").write_text('{"mine": true}', encoding="utf-8")  # the person changed one
    r = run(env.svc.setup.install_templates())
    assert r["written"] == [] and sorted(r["kept"]) == ["aidlc-a-agent", "aidlc-b-agent", "aidlc-c-agent"]
    assert json.loads((d / "aidlc-b-agent-template.json").read_text(encoding="utf-8")) == {"mine": True}


def test_no_kirocrew_command_means_a_clear_refusal_and_the_terminal_way(env):
    env.svc.setup._bin = lambda: ""

    async def go():
        r = await call(env.routes, "POST", "/setup/templates")
        assert (r.status, r.code) == (500, "kirocrew_not_found") and "setup_plan.py" in r.body["error"]

    run(go())
    assert not (env.home / ".kiro").exists()


def test_the_shipped_member_templates_are_the_shape_the_setup_needs():
    specs = setup_mod.member_specs()
    assert len(specs) == 14 and all(s["description"] and s["display_name"] for s in specs)
    for s in specs:
        raw = (ROOT / "agents" / f"{s['name']}.json").read_text(encoding="utf-8")
        assert raw.count("__KIROCREW_BIN__") == 1, s["name"]  # exactly the control-plane command
        text = setup_mod.template_text(raw, s["name"], "/x/kirocrew")
        assert json.loads(text)["name"] == s["name"] + "-template" and "__KIROCREW_BIN__" not in text


# ---- the knowledge ------------------------------------------------------------------------------------- #

def test_the_rules_are_copied_next_to_the_workspace_added_as_a_folder_source_and_read(env):
    async def go():
        r = await call(env.routes, "POST", "/setup/knowledge")
        assert r.status == 200 and r.body["added"] is True and r.body["documents"] == 4 and r.body["copied"] == 5  # 4 documents + 1 data file
        return r.body

    body = run(go())
    folder = env.home / "workplace" / "knowledge" / "larkspur"  # where the documents say their data is
    assert body["folder"] == str(folder) and (folder / "20-rule.md").read_text(encoding="utf-8") == "# Rule 0\n"
    assert (folder / "data" / "products.md").exists() and (folder / "data" / "products.json").exists()
    assert env.gw.calls == [("add", "Larkspur Outfitters", str(folder)), ("confirm", "src-1")]  # held until confirmed, then read


def test_running_the_knowledge_step_again_reads_again_without_a_second_source_or_losing_an_edit(env):
    run(env.svc.setup.add_knowledge())
    folder = env.home / "workplace" / "knowledge" / "larkspur"
    (folder / "20-rule.md").write_text("# My own rule\n", encoding="utf-8")
    env.gw.calls.clear()
    body = run(env.svc.setup.add_knowledge())
    assert body["added"] is False and body["copied"] == 0 and body["source_id"] == "src-1"
    assert env.gw.calls == [("sync", "src-1")] and len(env.gw.sources) == 1  # confirmed already: read again, not confirmed again
    assert (folder / "20-rule.md").read_text(encoding="utf-8") == "# My own rule\n"


def test_a_source_the_gateway_does_not_name_is_found_by_listing(env):
    env.gw.add_returns_id = False
    assert run(env.svc.setup.add_knowledge())["source_id"] == "src-1"


def test_knowledge_refusals_say_who_refused_and_why(env):
    env.gw.refuse = GatewayError(400, "that folder is not allowed", "uri_refused", "/api/knowledge/sources")

    async def go():
        r = await call(env.routes, "POST", "/setup/knowledge")
        assert (r.status, r.code) == (502, "knowledge_refused")
        assert "uri_refused" in r.body["error"] and "not allowed" in r.body["error"]

    run(go())


def test_a_copy_of_the_app_without_the_rule_documents_says_so(env, tmp_path):
    env.svc.setup.knowledge_dir = tmp_path / "nothing"

    async def go():
        r = await call(env.routes, "POST", "/setup/knowledge")
        assert (r.status, r.code) == (500, "no_documents")

    run(go())
    assert env.gw.calls == []


# ---- the sample delivery -------------------------------------------------------------------------------- #

def test_the_sample_delivery_is_imported_once_and_then_shows_as_done(env):
    async def go():
        await env.svc.start()
        try:
            assert (await call(env.routes, "GET", "/setup")).body["status"]["sample"] == {"id": env.sample_id, "done": False}
            r = await call(env.routes, "POST", "/setup/sample")
            assert r.status == 200 and r.body["run"] == env.sample_id and r.body["already"] is False
            r = await call(env.routes, "POST", "/setup/sample")
            assert r.status == 200 and r.body == {"ok": True, "run": env.sample_id, "already": True}
            assert (await call(env.routes, "GET", "/setup")).body["status"]["sample"]["done"] is True
            assert [c["id"] for c in (await call(env.routes, "GET", "/runs")).body["runs"]] == [env.sample_id]
            board = (await call(env.routes, "GET", f"/board?run={env.sample_id}")).body
            assert board["run"]["id"] == env.sample_id
        finally:
            await env.svc.stop()

    run(go())


def test_a_sample_that_is_missing_or_not_a_finished_run_is_refused(env, tmp_path):
    env.svc.setup.sample_file = tmp_path / "gone.json"

    async def go():
        await env.svc.start()
        try:
            r = await call(env.routes, "POST", "/setup/sample")
            assert (r.status, r.code) == (500, "no_sample")
            bad = tmp_path / "bad.json"
            bad.write_text(json.dumps({"format": 1, "run": {"id": "r1234abcd", "status": "running"}, "events": []}), encoding="utf-8")
            env.svc.setup.sample_file = bad
            r = await call(env.routes, "POST", "/setup/sample")
            assert (r.status, r.code) == (400, "invalid_import")
        finally:
            await env.svc.stop()

    run(go())


def test_the_sample_that_ships_with_the_app_imports_and_names_no_machine():
    path = ROOT / "samples" / "sample-run.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["format"] == 1 and data["run"]["status"] in ("done", "failed", "stopped") and data["events"]
    text = path.read_text(encoding="utf-8")
    assert "/Users/" not in text and "/home/ubuntu" not in text
    ex = json.loads((ROOT / "samples" / "example.json").read_text(encoding="utf-8"))
    assert ex["requirement"].strip() and ex["team"]


def test_the_shipped_sample_loads_into_a_service(tmp_path):
    svc, routes = make(tmp_path, FakeManager(), tick_s=60)

    async def go():
        await svc.start()
        try:
            r = await call(routes, "POST", "/setup/sample")
            assert r.status == 200 and r.body["already"] is False, r.body
        finally:
            await svc.stop()

    run(go())


# ---- the terminal runner ----------------------------------------------------------------------------------- #

def load_script(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


class FakeOwner:
    def __init__(self, plan, answers=None, setup_status=200):
        self.plan, self.answers, self.setup_status, self.calls = plan, answers or {}, setup_status, []

    def call(self, method, path, body=None):
        self.calls.append((method, path))
        if path.endswith("/setup"):
            return self.setup_status, ({"plan": self.plan} if self.setup_status == 200 else {"error": "not enabled"})
        return self.answers.get(path, 200), {"error": "no"}


def step(i, path="/api/agents"):
    return {"id": i, "label": f"step {i}", "call": {"method": "POST", "path": path, "body": {"n": i}}}


def test_the_terminal_runner_makes_each_call_and_counts_an_existing_one_as_done():
    runner = load_script("setup_plan")
    out = []
    owner = FakeOwner([step("a", "/p/a"), step("b", "/p/b"), step("c", "/p/c")], {"/p/b": 409, "/p/c": 500})
    assert runner.run_plan(owner, out=out.append) == 1
    assert [c[1] for c in owner.calls][1:] == ["/p/a", "/p/b", "/p/c"]
    assert out == ["done  step a", "there step b", "FAILED step c: HTTP 500 no"]


def test_the_terminal_runner_stops_where_the_rest_would_depend_on_it():
    runner = load_script("setup_plan")
    owner = FakeOwner([step("templates", "/p/t"), step("member:x", "/p/m")], {"/p/t": 500})
    assert runner.run_plan(owner, out=lambda s: None) == 1
    assert [c[1] for c in owner.calls][1:] == ["/p/t"]


def test_the_terminal_runner_tells_a_person_whose_app_is_not_enabled_what_to_do():
    runner = load_script("setup_plan")
    out = []
    assert runner.run_plan(FakeOwner([], setup_status=404), out=out.append) == 1
    assert "enable it" in out[1] and out[0].startswith("the app did not answer")
    out.clear()
    assert runner.run_plan(FakeOwner([]), out=out.append) == 0 and out == ["nothing to do: the example team is set up"]
    owner = FakeOwner([step("a")])
    assert runner.run_plan(owner, dry_run=True, out=out.append) == 0 and owner.calls == [("GET", "/api/apps/agent-rd-team/setup")]


# ---- exporting a sample ------------------------------------------------------------------------------------- #

def test_exporting_a_sample_takes_an_ended_run_only_and_drops_the_machine_and_the_name(tmp_path):
    export = load_script("export_sample")
    d = tmp_path / "r1234abcd"
    d.mkdir()
    state = {"id": "r1234abcd", "status": "done", "cwd": "/home/me/workplace/x", "imported": {"from": "elsewhere"},
             "signoff": {"by": "A. Person", "note": "ok"}}
    (d / "run.json").write_text(json.dumps(state), encoding="utf-8")
    (d / "events.jsonl").write_text("\n".join(json.dumps(e) for e in (
        {"seq": 2, "text": "at /home/me/x"}, {"seq": 1, "text": "start"}, {"seq": 2, "text": "again /home/me/x"})) + "\ntorn line\n", encoding="utf-8")
    out = export.build(d, home="/home/me")
    assert out["run"]["cwd"] == "/home/user/workplace/x" and "imported" not in out["run"] and out["run"]["signoff"]["by"] == "Delivery lead"
    assert [e["seq"] for e in out["events"]] == [1, 2] and out["events"][1]["text"] == "again /home/user/x"
    assert export.build(d, home="/home/me", keep_names=True)["run"]["signoff"]["by"] == "A. Person"
    state["status"] = "running"
    (d / "run.json").write_text(json.dumps(state), encoding="utf-8")
    with pytest.raises(SystemExit):
        export.build(d, home="/home/me")
