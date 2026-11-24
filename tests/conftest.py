import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))          # `import backend.routes` (bootstrap) and tests' own helpers
sys.path.insert(0, str(ROOT / "tests"))


@pytest.fixture(autouse=True)
def sandbox_sdk(monkeypatch):
    """Every test runs against a stand-in for Kiro Crew's sandbox SDK, which is not importable here. A test of the
    sandbox itself reads ``sandbox_sdk`` for what was asked, or sets ``unavailable``.

    With ``AGENT_RD_TEAM_REAL_SANDBOX=1`` and Kiro Crew 0.13.0 or newer on ``PYTHONPATH`` the whole suite runs in the
    host's real sandbox instead, and ``sandbox_sdk`` is None."""
    if os.environ.get("AGENT_RD_TEAM_REAL_SANDBOX") == "1":
        return None
    from sandbox_fake import FakeSDK
    from teamkit import mod

    fake = FakeSDK()
    monkeypatch.setattr(mod("sandbox"), "_sdk", lambda: fake)
    return fake
