#!/bin/bash
# SessionStart hook - Injects relevant knowledge from previous sessions

set -euo pipefail

# Check if .autology directory exists
if [ ! -d ".autology" ] || [ ! -d ".autology/nodes" ]; then
  # No ontology exists yet, allow silently
  echo '{"decision": "allow"}'
  exit 0
fi

# Count total nodes
TOTAL_NODES=$(find .autology/nodes -name "*.md" 2>/dev/null | wc -l | xargs)

if [ "$TOTAL_NODES" -eq 0 ]; then
  # Empty ontology
  echo '{"decision": "allow"}'
  exit 0
fi

# Get recent conventions (coding standards that should be followed)
RECENT_CONVENTIONS=$(find .autology/nodes/conventions -name "*.md" -mtime -30 2>/dev/null | head -3 || true)

# Get recent decisions (important context)
RECENT_DECISIONS=$(find .autology/nodes/decisions -name "*.md" -mtime -30 2>/dev/null | head -3 || true)

# Build context
CONTEXT="
📚 Knowledge Base Available

This project has an active autology ontology with $TOTAL_NODES knowledge nodes.

## Available Tools
- \`autology_query\`: Search and filter knowledge nodes
- \`autology_capture\`: Create new knowledge nodes
- \`autology_relate\`: Link nodes together
- \`autology_status\`: View ontology statistics
- \`autology_context\`: Get relevant knowledge for current task

## Recent Context
"

# Add recent conventions
if [ -n "$RECENT_CONVENTIONS" ]; then
  CONTEXT="${CONTEXT}

### Coding Conventions (last 30 days):
"
  for CONV_FILE in $RECENT_CONVENTIONS; do
    TITLE=$(grep "^title:" "$CONV_FILE" | head -1 | cut -d: -f2- | xargs)
    NODE_ID=$(basename "$CONV_FILE" .md)
    CONTEXT="${CONTEXT}
- $TITLE (ID: $NODE_ID)
"
  done
fi

# Add recent decisions
if [ -n "$RECENT_DECISIONS" ]; then
  CONTEXT="${CONTEXT}

### Recent Decisions (last 30 days):
"
  for DEC_FILE in $RECENT_DECISIONS; do
    TITLE=$(grep "^title:" "$DEC_FILE" | head -1 | cut -d: -f2- | xargs)
    NODE_ID=$(basename "$DEC_FILE" .md)
    CONTEXT="${CONTEXT}
- $TITLE (ID: $NODE_ID)
"
  done
fi

CONTEXT="${CONTEXT}

💡 Tip: Use \`autology_query\` to search for relevant knowledge, or \`autology_context\` with current file paths to get contextual information.

The ontology is stored in \`.autology/\` and can be opened as an Obsidian vault for visual exploration.
"

# Escape for JSON
CONTEXT_ESCAPED=$(echo "$CONTEXT" | jq -Rs .)

echo "{
  \"decision\": \"allow\",
  \"additionalContext\": $CONTEXT_ESCAPED
}"
