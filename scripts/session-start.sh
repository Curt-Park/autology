#!/usr/bin/env bash
# Session start hook: inject autology-workflow skill as trigger guidance
set -euo pipefail

# Determine plugin root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read autology-workflow skill content (including frontmatter, like superpowers does)
_skill_content=$(cat "${PLUGIN_ROOT}/skills/autology-workflow/SKILL.md" 2>&1 || echo "Error reading autology-workflow skill")

context="You have autology knowledge management installed.

**Below is the full content of the autology-workflow skill — your guide to when and how to invoke autology skills. For all other autology skills, use the Skill tool:**

${_skill_content}"

# Escape string for JSON embedding
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"        # \ → \\
    s="${s//\"/\\\"}"        # " → \"
    s="${s//$'\n'/\\n}"      # newline → \n
    s="${s//$'\r'/\\r}"      # CR → \r
    s="${s//$'\t'/\\t}"      # tab → \t
    printf '%s' "$s"
}

session_context=$(escape_for_json "$context")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${session_context}"
  }
}
EOF

exit 0
