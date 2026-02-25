#!/bin/bash
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
BINARY="${PLUGIN_ROOT}/bin/autology"

if [ ! -x "$BINARY" ]; then
  if [ -f "$BINARY" ]; then
    chmod +x "$BINARY"
  else
    bash "${PLUGIN_ROOT}/scripts/install.sh"
  fi
fi

exec "$BINARY" "$@"
