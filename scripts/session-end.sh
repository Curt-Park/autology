#!/bin/bash
# Session end hook: show knowledge capture tip
set -euo pipefail

# Consume stdin to avoid broken pipe
cat /dev/stdin > /dev/null 2>&1 || true

AUTOLOGY_ROOT="${AUTOLOGY_ROOT:-docs}"

if command -v jq >/dev/null 2>&1; then
  jq -n --arg msg "Autology: /autology:capture to save knowledge from this session" \
    '{"systemMessage":$msg}'
else
  echo "Autology: /autology:capture to save knowledge from this session" >&2
fi
