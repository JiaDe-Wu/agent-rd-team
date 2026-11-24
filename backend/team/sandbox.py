"""Where the app's backend starts a child that runs what a role session wrote, or can change.

The role sessions run inside Kiro Crew's OS sandbox. This backend runs in the gateway process, which is not
sandboxed, so a command it starts runs with the user's full rights, and whatever a session put in a test file,
``server.js`` or the run repository's ``.git/config`` would run with them. Three places start such a command:
the company checks (``node --test``), the site (``Site.start``) and every ``git`` call. All three go through here, to
Kiro Crew's sandboxed spawn for app backends (``run_sandboxed_async`` and ``sandboxed_argv_async`` in
``kiro_crew.apps.backend_sdk``, first released in Kiro Crew 0.13.0), at the ``standard`` tier.

When the host cannot sandbox the child, :class:`SandboxUnavailable` is raised and the step stops. There is no second
way to run it.
"""

from __future__ import annotations

import asyncio
import contextlib
import errno
import os
import shutil
import subprocess
from typing import Any

MODE = "standard"


class SandboxUnavailable(RuntimeError):
    """The host cannot sandbox this child (or has no sandbox SDK): nothing was started."""


def _sdk() -> Any:
    try:
        from kiro_crew.apps import backend_sdk  # host module, present in the gateway from Kiro Crew 0.13.0
    except ImportError as exc:
        raise SandboxUnavailable("Kiro Crew's sandbox SDK is not available (this app needs Kiro Crew 0.13.0 or newer)") from exc
    return backend_sdk


def _unavailable(exc: BaseException) -> SandboxUnavailable:
    return SandboxUnavailable(f"Kiro Crew cannot sandbox this command: {exc}"[:300])


def _must_exist(argv: list[str], env: dict[str, str]) -> None:
    """The sandbox's launcher starts a program that is not there and exits non-zero, where a plain spawn raises: say
    ``FileNotFoundError`` here too, so a missing node or git reads as missing and not as a command that failed."""
    exe = argv[0]
    found = exe if os.sep in exe else shutil.which(exe, path=env.get("PATH") or os.defpath)
    if not found or os.path.isdir(found) or not os.access(found, os.X_OK):
        raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), exe)


async def run(argv: list[str], *, env: dict[str, str], cwd: str | None = None,
              timeout: float | None = None) -> subprocess.CompletedProcess[bytes]:
    """*argv* to completion in the sandbox, stdout and stderr captured. Past *timeout* the child and its group are
    killed and ``subprocess.TimeoutExpired`` is raised."""
    _must_exist(argv, env)
    sdk = _sdk()
    try:
        return await sdk.run_sandboxed_async(argv, mode=MODE, env=env, cwd=cwd, timeout=timeout)
    except sdk.SandboxUnavailableError as exc:
        raise _unavailable(exc) from exc


async def spawn(argv: list[str], *, env: dict[str, str], cwd: str, stdout: int, stderr: int) -> tuple[asyncio.subprocess.Process, str | None]:
    """A sandboxed child whose output the caller reads as it comes, in a session of its own (the caller kills its group).
    Returns ``(process, cleanup)``: call :func:`release` with *cleanup* once the child has exited."""
    _must_exist(argv, env)
    sdk = _sdk()
    try:
        wrapped, scrubbed, cleanup = await sdk.sandboxed_argv_async(argv, mode=MODE, env=env)
    except sdk.SandboxUnavailableError as exc:
        raise _unavailable(exc) from exc
    try:
        proc = await asyncio.create_subprocess_exec(*wrapped, cwd=cwd, env=scrubbed, stdin=asyncio.subprocess.DEVNULL,
                                                    stdout=stdout, stderr=stderr, start_new_session=True)
    except BaseException:
        release(cleanup)
        raise
    return proc, cleanup


def release(cleanup: str | None) -> None:
    """Delete what the sandbox prepared for a child, once it has exited."""
    if cleanup is not None:
        with contextlib.suppress(FileNotFoundError, OSError):
            os.unlink(cleanup)
