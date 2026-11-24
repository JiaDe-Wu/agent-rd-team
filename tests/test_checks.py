"""The app's own test run: the TAP parser on real node v25 output, and a real node run on a tiny repo."""

import asyncio
import os
from pathlib import Path

import pytest

from teamkit import mod

checks, constants = mod("checks"), mod("constants")
TEAM = {"test_command": ["node", "--test", "tests/"],
        "test_owners": [{"glob": "tests/api-*", "role": "backend"}, {"glob": "tests/web-*", "role": "frontend"}]}

# node v25.2.1 --test --test-reporter=tap, captured (stack lines trimmed)
SIGNUP = """TAP version 13
# Subtest: AC-4: name is required
ok 1 - AC-4: name is required
  ---
  duration_ms: 0.368625
  type: 'test'
  ...
# Subtest: AC-6: a full event cannot be joined
not ok 2 - AC-6: a full event cannot be joined
  ---
  duration_ms: 7.405583
  type: 'test'
  location: '/private/tmp/kctap/tests/api-signup.test.js:5:1'
  failureType: 'testCodeFailure'
  error: |-
    expected 409, got 201

    201 !== 409

  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 409
  actual: 201
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (file:///private/tmp/kctap/tests/api-signup.test.js:5:39)
  ...
# Subtest: AC-7: the same email cannot sign up twice
    # Subtest: first signup ok
    ok 1 - first signup ok
      ---
      duration_ms: 0.089125
      type: 'test'
      ...
    # Subtest: second signup 409
    not ok 2 - second signup 409
      ---
      duration_ms: 0.576083
      type: 'test'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly deep-equal:
        + actual - expected
      code: 'ERR_ASSERTION'
      expected:
        a: 2
      actual:
        a: 1
      ...
    1..2
not ok 3 - AC-7: the same email cannot sign up twice
  ---
  duration_ms: 1.223875
  type: 'suite'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: AC-8: skipped one
ok 4 - AC-8: skipped one # SKIP not yet
  ---
  duration_ms: 0.066417
  type: 'test'
  ...
# Subtest: AC-9: todo one
not ok 5 - AC-9: todo one # TODO
  ---
  duration_ms: 0.051583
  type: 'test'
  error: 'boom'
  ...
# Subtest: no ac name here
not ok 6 - no ac name here
  ---
  duration_ms: 0.096584
  type: 'test'
  error: "Cannot read properties of undefined (reading 'x')"
  code: 'ERR_TEST_FAILURE'
  ...
1..6
# tests 7
# pass 2
# fail 3
"""

EVENTS = """TAP version 13
# ok 99 - fake line from a test
# Subtest: event API
    # Subtest: AC-2: an event has a name, time, place and remaining seats
    ok 1 - AC-2: an event has a name, time, place and remaining seats
      ---
      duration_ms: 0.532166
      type: 'test'
      ...
    # Subtest: AC-10: the list is sorted by sign-up time
    not ok 2 - AC-10: the list is sorted by sign-up time
      ---
      duration_ms: 0.794166
      failureType: 'testCodeFailure'
      error: |-
        order mismatch at index 0
        + actual - expected
      ...
    1..2
not ok 1 - event API
  ---
  duration_ms: 1.744291
  type: 'suite'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  ...
# Subtest: AC-3: event detail
    # Subtest: detail 200
    ok 1 - detail 200
      ---
      duration_ms: 0.05975
      ...
    # Subtest: missing 404
    not ok 2 - missing 404
      ---
      duration_ms: 0.130208
      error: |-
        Expected values to be strictly equal:

        200 !== 404
      ...
    1..2
not ok 2 - AC-3: event detail
  ---
  duration_ms: 0.854125
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  ...
1..2
"""

LOAD_FAILURE = """TAP version 13
# node:internal/modules/esm/resolve:274
#     throw new ERR_MODULE_NOT_FOUND(
#           ^
# Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/private/tmp/kctap/frontend/app.js' imported from /private/tmp/kctap/tests/web-broken.test.js
#     at finalizeResolution (node:internal/modules/esm/resolve:274:11)
# Node.js v25.2.1
# Subtest: tests/web-broken.test.js
not ok 1 - tests/web-broken.test.js
  ---
  duration_ms: 54.728708
  type: 'test'
  failureType: 'testCodeFailure'
  exitCode: 1
  signal: ~
  error: 'test failed'
  code: 'ERR_TEST_FAILURE'
  ...
1..1
# tests 1
# fail 1
"""


def by_name(cases):
    return {c["name"]: c for c in cases}


def test_tap_cases_statuses_durations_and_first_message_lines():
    results, comments = checks.parse_tap(SIGNUP)
    cases = by_name(checks.to_cases(results, "tests/api-signup.test.js", "backend"))
    assert list(cases) == ["AC-4: name is required", "AC-6: a full event cannot be joined", "AC-7: the same email cannot sign up twice", "AC-8: skipped one",
                           "AC-9: todo one", "no ac name here"]
    assert cases["AC-4: name is required"]["status"] == "pass" and cases["AC-4: name is required"]["ms"] == 0
    six = cases["AC-6: a full event cannot be joined"]
    assert (six["status"], six["ac"], six["ms"], six["message"], six["owner"]) == ("fail", "AC-6", 7, "expected 409, got 201", "backend")
    assert cases["AC-7: the same email cannot sign up twice"]["message"] == "second signup 409: Expected values to be strictly deep-equal:"
    assert cases["AC-8: skipped one"]["status"] == "skip" and cases["AC-9: todo one"]["status"] == "skip"
    other = cases["no ac name here"]
    assert other["ac"] is None and other["message"] == "Cannot read properties of undefined (reading 'x')"
    assert comments == ["tests 7", "pass 2", "fail 3"]


def test_tap_nesting_picks_the_ac_level_and_ignores_test_output():
    results, comments = checks.parse_tap(EVENTS)
    cases = by_name(checks.to_cases(results, "tests/api-events.test.js", None))
    assert list(cases) == ["AC-2: an event has a name, time, place and remaining seats", "AC-10: the list is sorted by sign-up time", "AC-3: event detail"]
    assert cases["AC-10: the list is sorted by sign-up time"]["message"] == "order mismatch at index 0"
    assert cases["AC-3: event detail"]["message"] == "missing 404: Expected values to be strictly equal:"
    assert comments[0] == "ok 99 - fake line from a test"


def test_a_file_that_cannot_load_is_one_failing_case_with_the_reason(tmp_path, monkeypatch):
    async def fake_run(node, wt, rel, timeout):
        return 1, LOAD_FAILURE.replace("/private/tmp/kctap", str(wt)), "", False

    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "web-broken.test.js").write_text("import '../frontend/app.js'\n")
    monkeypatch.setattr(checks, "run_file", fake_run)
    wall = asyncio.run(checks.run_tests(tmp_path, TEAM))
    [case] = wall["cases"]
    assert case["id"] == "web-broken.test.js#web-broken.test.js could not run" and case["owner"] == "frontend"
    assert case["message"].startswith("Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'frontend/app.js'")
    assert (wall["passed"], wall["failed"], wall["total"]) == (0, 1, 1)


def test_test_files_and_owners(tmp_path):
    for rel in ("tests/api-signup.test.js", "tests/web-render.test.mjs", "tests/helpers/server.js", "tests/sub/x_test.js",
                "tests/node_modules/y.test.js", "tests/README.md", "src/z.test.js"):
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / rel).write_text("")
    assert checks.test_files(tmp_path) == ["tests/api-signup.test.js", "tests/sub/x_test.js", "tests/web-render.test.mjs"]
    assert checks.owner_of("tests/api-signup.test.js", TEAM) == "backend"
    assert checks.owner_of("tests/sub/x_test.js", TEAM) is None


@pytest.mark.skipif(not os.access(constants.NODE_BIN, os.X_OK), reason="node is not installed")
def test_real_node_run_one_file_at_a_time_with_ids_owners_and_a_timeout(tmp_path):
    (tmp_path / "package.json").write_text('{"type": "module"}\n')
    tests = tmp_path / "tests"
    tests.mkdir()
    (tests / "api-signup.test.js").write_text(
        "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\n"
        "test('AC-6: a full event cannot be joined', () => { assert.equal(201, 409, 'expected 409, got 201'); });\n"
        "test('AC-4: name is required', () => {});\n"
        "test('AC-4: name is required (spaces)', () => {});\n"
        "setInterval(() => {}, 1000);  // an open handle: --test-force-exit still ends the file\n")
    (tests / "web-render.test.js").write_text(
        "import { test } from 'node:test';\ntest('AC-1: home page', async () => { await new Promise(r => setTimeout(r, 20000)); });\n")
    wall = asyncio.run(checks.run_tests(tmp_path, TEAM, timeout=1))
    ids = [c["id"] for c in wall["cases"]]
    assert ids == ["api-signup.test.js#AC-4", "api-signup.test.js#AC-4#2", "api-signup.test.js#AC-6", "web-render.test.js#web-render.test.js timed out"]
    six = wall["cases"][2]
    assert (six["status"], six["owner"], six["message"], six["file"]) == ("fail", "backend", "expected 409, got 201", "tests/api-signup.test.js")
    assert wall["cases"][3]["owner"] == "frontend" and wall["cases"][3]["message"] == "Did not finish within 1 s"
    assert (wall["passed"], wall["failed"], wall["total"], wall["command"]) == (2, 2, 4, "node --test tests/")


@pytest.mark.skipif(not os.access(constants.NODE_BIN, os.X_OK), reason="node is not installed")
def test_the_files_of_a_role_that_sits_the_run_out_are_not_run(tmp_path):
    (tmp_path / "package.json").write_text('{"type": "module"}\n')
    tests = tmp_path / "tests"
    tests.mkdir()
    (tests / "api-signup.test.js").write_text("import { test } from 'node:test';\ntest('AC-4: name is required', () => {});\n")
    (tests / "web-render.test.js").write_text(
        "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('AC-1: home page', () => { assert.fail('no motion'); });\n")
    wall = asyncio.run(checks.run_tests(tmp_path, {**TEAM, "skip_owners": ["frontend"]}))
    assert [c["id"] for c in wall["cases"]] == ["api-signup.test.js#AC-4"] and (wall["passed"], wall["total"]) == (1, 1)


def test_a_missing_node_is_not_a_test_failure_to_send_back(tmp_path):
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "api-x.test.js").write_text("")
    with pytest.raises(checks.TestsUnavailable, match="Cannot run node"):
        asyncio.run(checks.run_tests(Path(tmp_path), TEAM, node=str(tmp_path / "no-node")))
