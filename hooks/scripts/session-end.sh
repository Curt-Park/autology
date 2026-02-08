#!/bin/bash
# SessionEnd hook - Reminds user they can capture session summary

cat >&2 <<'EOF'
💡 Tip: To capture this session's summary in your knowledge graph:
   1. Resume session: claude -r
   2. Run: /autology:capture
EOF

exit 0
