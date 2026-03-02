#!/usr/bin/env bash
# Session start hook: inject autology router skill as trigger guidance
set -euo pipefail

# Consume stdin to avoid broken pipe
cat /dev/stdin > /dev/null 2>&1 || true

# Determine plugin root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read router skill, strip YAML frontmatter
_skill_content=$(awk '/^---$/{if(found){found=0;next}else{found=1;next}} !found{print}' "${PLUGIN_ROOT}/skills/router/SKILL.md")

context="Below is the full content of the autology router skill — your guide to when and how to invoke autology skills:

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

ctx=$(escape_for_json "$context")
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$ctx"
