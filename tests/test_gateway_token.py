"""The gateway client's token: from the hook context when Kiro Crew gives one, else from the secret file an older one wrote."""

import asyncio

import pytest
from teamkit import mod

gateway_mod = mod("gateway")
Gateway, GatewayError = gateway_mod.Gateway, gateway_mod.GatewayError


def run(coro):
    return asyncio.run(coro)


def make(tmp_path, source=None, secret=None):
    f = tmp_path / ".app_secret"
    if secret is not None:
        f.write_text(secret, encoding="utf-8")
    return Gateway("aidlc-team", f, base=lambda: "http://127.0.0.1:1", clock=lambda: 0.0, token_source=source)


def test_the_token_comes_from_the_hook_context_and_needs_no_secret_file(tmp_path):
    async def source():
        return "tok-from-ctx"

    gw = make(tmp_path, source)
    assert run(gw._token_now()) == "tok-from-ctx"


def test_the_token_is_kept_until_it_is_old_and_asked_for_again_after(tmp_path):
    calls = []

    async def source():
        calls.append(1)
        return f"t{len(calls)}"

    now = [0.0]
    gw = Gateway("aidlc-team", tmp_path / ".app_secret", base=lambda: "http://127.0.0.1:1", clock=lambda: now[0], token_source=source)

    async def go():
        a = await gw._token_now()
        b = await gw._token_now()
        now[0] = gateway_mod.TOKEN_MAX_AGE + 1
        c = await gw._token_now()
        return a, b, c

    assert run(go()) == ("t1", "t1", "t2")


def test_with_no_secret_file_and_no_token_the_error_names_the_cause_instead_of_a_raw_file_error(tmp_path):
    async def nothing():
        return ""

    for gw in (make(tmp_path, nothing), make(tmp_path, None)):
        with pytest.raises(GatewayError) as e:
            run(gw._token_now())
        assert e.value.code == "no_secret"


def test_a_failing_token_source_falls_back_to_the_secret_file_path(tmp_path):
    async def broken():
        raise RuntimeError("x")

    with pytest.raises(GatewayError) as e:  # no file either: the typed error, not the RuntimeError
        run(make(tmp_path, broken)._token_now())
    assert e.value.code == "no_secret"
