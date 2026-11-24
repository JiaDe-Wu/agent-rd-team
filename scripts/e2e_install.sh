#!/usr/bin/env bash
# End to end on a gateway of its own: install, enable, set up, check, (with --with-model) deliver. See e2e_install.py.
#   scripts/e2e_install.sh [--app DIR_OR_URL] [--kiro-src /path/to/KiroCrew/src] [--with-model] [--port 6821]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
py="${E2E_PYTHON:-}"
if [ -z "$py" ]; then
  for c in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then py="$c"; break; fi
  done
fi
[ -n "$py" ] || { echo "needs Python 3.10 or newer (or set E2E_PYTHON)" >&2; exit 2; }
exec "$py" "$here/e2e_install.py" "$@"
