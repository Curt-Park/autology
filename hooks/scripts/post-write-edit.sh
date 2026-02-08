#!/bin/bash
# Post Write/Edit hook - Captures file changes and checks for staleness

set -euo pipefail

# Parse hook context from stdin
HOOK_DATA=$(cat)

# Extract file path from the tool call result
FILE_PATH=$(echo "$HOOK_DATA" | jq -r '.toolCall.params.file_path // empty')

# If no file path, exit silently
if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Exclude patterns
EXCLUDE_PATTERNS=(
  "node_modules/"
  ".git/"
  "/tmp/"
  "dist/"
  "build/"
  "coverage/"
  ".autology/"
  ".DS_Store"
  "package-lock.json"
  "*.log"
)

# Check if file should be excluded
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" =~ $pattern ]]; then
    echo '{"decision": "allow"}'
    exit 0
  fi
done

# Debouncing: Check if we recently processed this file
DEBOUNCE_FILE="/tmp/autology-debounce-$(echo "$FILE_PATH" | md5 | cut -c1-8)"
if [ -f "$DEBOUNCE_FILE" ]; then
  LAST_TIME=$(cat "$DEBOUNCE_FILE")
  CURRENT_TIME=$(date +%s)
  TIME_DIFF=$((CURRENT_TIME - LAST_TIME))

  if [ "$TIME_DIFF" -lt 60 ]; then
    # Within 60 second debounce window
    echo '{"decision": "allow"}'
    exit 0
  fi
fi

# Update debounce timestamp
echo "$(date +%s)" > "$DEBOUNCE_FILE"

# Check if file is structurally significant
IS_SIGNIFICANT=false
case "$FILE_PATH" in
  *.ts|*.js|*.tsx|*.jsx|*.py|*.go|*.rs|*.java)
    IS_SIGNIFICANT=true
    ;;
  *.md|*.json|*.yaml|*.yml)
    # Config/doc files are significant
    IS_SIGNIFICANT=true
    ;;
esac

# Build additional context
CONTEXT=""

# (a) New knowledge capture suggestion
if [ "$IS_SIGNIFICANT" = "true" ]; then
  CONTEXT="${CONTEXT}

📝 File Modified: $FILE_PATH

Consider capturing knowledge about this change:
- If this introduces a new architectural pattern or component, use autology_capture with type='component' or 'pattern'
- If this implements a design decision, use autology_capture with type='decision'
- If this establishes a coding convention, use autology_capture with type='convention'

You can capture knowledge by calling the autology_capture tool directly with relevant details.
"
fi

# (b) Staleness check: Find existing nodes that reference this file
if [ -d ".autology/nodes" ]; then
  # Search for nodes that reference this file
  REFERENCING_NODES=$(grep -r "references:" .autology/nodes/ 2>/dev/null | grep "$FILE_PATH" | cut -d: -f1 | sort -u || true)

  if [ -n "$REFERENCING_NODES" ]; then
    CONTEXT="${CONTEXT}

⚠️  Staleness Check:
The following knowledge nodes reference this file and may need updating:
"

    for NODE_FILE in $REFERENCING_NODES; do
      # Extract node ID from filename
      NODE_ID=$(basename "$NODE_FILE" .md)
      NODE_TITLE=$(grep "^title:" "$NODE_FILE" | head -1 | cut -d: -f2- | xargs)

      CONTEXT="${CONTEXT}
- Node: $NODE_TITLE (ID: $NODE_ID)
  File: $NODE_FILE
"
    done

    CONTEXT="${CONTEXT}

Review these nodes and update them if the file changes make them outdated. You can:
1. Read the node to understand what it documents
2. Compare with the current file state
3. Update the node using autology_capture if needed (use same title to update)
"
  fi
fi

# Output response with additional context
if [ -n "$CONTEXT" ]; then
  # Escape for JSON
  CONTEXT_ESCAPED=$(echo "$CONTEXT" | jq -Rs .)

  echo "{
    \"decision\": \"allow\",
    \"additionalContext\": $CONTEXT_ESCAPED
  }"
else
  echo '{"decision": "allow"}'
fi
