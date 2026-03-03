#!/bin/bash
# Session end hook: show knowledge capture tip
set -euo pipefail

# Consume stdin to avoid broken pipe
cat /dev/stdin > /dev/null 2>&1 || true

echo "Autology: Use /autology:capture-knowledge to save knowledge from this session" >&2
