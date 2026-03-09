#!/usr/bin/env bash
# Session start hook: inject autology-workflow skill as trigger guidance
set -euo pipefail

# Determine plugin root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

_skill_file="${PLUGIN_ROOT}/skills/autology-workflow/SKILL.md"

if [[ ! -f "$_skill_file" ]]; then
    echo "autology session-start: skill file not found: $_skill_file" >&2
    exit 1
fi

_skill_content=$(cat "$_skill_file")

context="Autology knowledge management is active. Workflow guide:

${_skill_content}"

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $(jq -n --arg s "$context" '$s')
  }
}
EOF

exit 0
