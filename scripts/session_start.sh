#!/bin/bash
# SessionStart hook - Ensures autology binary is installed

set -euo pipefail

# Check if MCP binary exists, if not, run install script
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  BINARY_PATH="${CLAUDE_PLUGIN_ROOT}/bin/autology"
  if [ ! -f "$BINARY_PATH" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/scripts/install.sh" ]; then
    bash "${CLAUDE_PLUGIN_ROOT}/scripts/install.sh" >/dev/null 2>&1 || true
  fi
fi

echo '{"decision": "allow"}'
