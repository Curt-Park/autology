#!/bin/bash
# Launcher: routes hook subcommands to session scripts
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

case "${1:-}" in
  hook)
    case "${2:-}" in
      session-start) exec bash "$PLUGIN_ROOT/scripts/session-start.sh" ;;
      session-end)   exec bash "$PLUGIN_ROOT/scripts/session-end.sh" ;;
      *)             echo "Unknown hook: ${2:-}" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "Usage: launcher.sh hook <session-start|session-end>" >&2
    exit 1
    ;;
esac
