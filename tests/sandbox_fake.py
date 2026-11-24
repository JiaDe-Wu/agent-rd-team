"""Stands in for ``kiro_crew.apps.backend_sdk`` in the tests: it runs the command as it is, and records what it was asked."""

import asyncio
import os
import signal
import subprocess
import tempfile
from typing import Any


class FakeSDK:
    class SandboxUnavailableError(RuntimeError):
        pass

    def __init__(self) -> None:
        self.unavailable = False
        self.runs: list[dict[str, Any]] = []      # run_sandboxed_async calls
        self.prepared: list[dict[str, Any]] = []  # sandboxed_argv_async calls
        self.cleanups: list[str] = []             # the files handed out as cleanup, to see them go

    def _admit(self, mode: str) -> None:
        if mode not in ("standard", "strict"):
            raise ValueError(mode)
        if self.unavailable:
            raise self.SandboxUnavailableError("no sandbox on this host")

    async def run_sandboxed_async(self, argv, *, mode="standard", env=None, strip_python_env=False, input=None,
                                  timeout=None, cwd=None):
        self._admit(mode)
        self.runs.append({"argv": list(argv), "mode": mode, "env": dict(env or {}), "cwd": cwd, "timeout": timeout})
        proc = await asyncio.create_subprocess_exec(
            *argv, cwd=cwd, env=env, stdin=asyncio.subprocess.DEVNULL, stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE, start_new_session=True)
        try:
            out, err = await asyncio.wait_for(proc.communicate(), timeout)
        except asyncio.TimeoutError:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            await proc.wait()
            raise subprocess.TimeoutExpired(argv, timeout or 0.0) from None
        return subprocess.CompletedProcess(argv, proc.returncode or 0, out, err)

    async def sandboxed_argv_async(self, argv, *, mode="standard", env=None, strip_python_env=False):
        self._admit(mode)
        fd, path = tempfile.mkstemp(prefix="fake-sandbox-")
        os.close(fd)
        self.cleanups.append(path)
        self.prepared.append({"argv": list(argv), "mode": mode, "env": dict(env or {}), "cleanup": path})
        return list(argv), dict(env or {}), path
