#!/bin/bash
# Session end hook: show knowledge capture tip
set -euo pipefail

# Consume stdin to avoid broken pipe
cat /dev/stdin > /dev/null 2>&1 || true

AUTOLOGY_ROOT="${AUTOLOGY_ROOT:-docs}"

cat >&2 <<EOF

💡 Autology tip: Consider capturing knowledge from this session.
   Run \`/autology:capture\` to save decisions, patterns, or insights to $AUTOLOGY_ROOT/.
   Resume with \`claude -r\` to continue and capture session knowledge.

EOF
