# Hook System Backup (2026-02-09)

## Configuration

### hooks.json

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-write-edit.sh",
            "timeout": 10000
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-commit.sh",
            "timeout": 10000
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.sh",
            "timeout": 5000
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-end.sh",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

## Scripts

### session-start.sh

```bash
#!/bin/bash
# SessionStart hook - Injects relevant knowledge from previous sessions

set -euo pipefail

# Check if MCP binary exists, if not, run install script
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  BINARY_PATH="${CLAUDE_PLUGIN_ROOT}/bin/autology"
  if [ ! -f "$BINARY_PATH" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/hooks/install.sh" ]; then
    # Binary doesn't exist, run install script
    bash "${CLAUDE_PLUGIN_ROOT}/hooks/install.sh" >/dev/null 2>&1 || true
  fi
fi

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
```

### post-write-edit.sh

```bash
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
```

### post-commit.sh

```bash
#!/bin/bash
# Post Bash hook - Detects git commits and suggests capturing decisions

# Use safer error handling - only exit on unset variables
set -u

# Function to safely output allow decision
safe_allow() {
  echo '{"decision": "allow"}'
  exit 0
}

# Parse hook context from stdin
# Use cat without timeout (timeout doesn't exist on macOS by default)
HOOK_DATA=$(cat 2>/dev/null || echo '{}')

# Check if we got valid data
if [ -z "$HOOK_DATA" ] || [ "$HOOK_DATA" = "{}" ]; then
  safe_allow
fi

# Extract command from the tool call (with error handling)
COMMAND=$(echo "$HOOK_DATA" | jq -r '.toolCall.params.command // empty' 2>/dev/null || echo "")

# If jq fails or command is empty, allow silently
if [ -z "$COMMAND" ]; then
  safe_allow
fi

# Check if this is a git commit command
if [[ ! "$COMMAND" =~ ^git[[:space:]]+(commit|ci) ]]; then
  # Not a git commit, allow silently
  safe_allow
fi

# Extract commit message if present
COMMIT_MSG=""
if [[ "$COMMAND" =~ -m[[:space:]]+[\"\'](.*?)[\"\'] ]]; then
  COMMIT_MSG="${BASH_REMATCH[1]}"
fi

# Get the actual commit message from git (in case -m wasn't used)
if [ -z "$COMMIT_MSG" ] && [ -d ".git" ]; then
  COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
fi

# Check if this looks like a significant commit
IS_SIGNIFICANT=false
COMMIT_TYPE=""

# Classify commit type based on conventional commits
case "$COMMIT_MSG" in
  feat:*|feature:*)
    IS_SIGNIFICANT=true
    COMMIT_TYPE="decision"
    ;;
  fix:*|bugfix:*)
    IS_SIGNIFICANT=true
    COMMIT_TYPE="issue"
    ;;
  refactor:*)
    IS_SIGNIFICANT=true
    COMMIT_TYPE="pattern"
    ;;
  docs:*)
    IS_SIGNIFICANT=false  # Usually not knowledge-worthy
    ;;
  chore:*|style:*)
    IS_SIGNIFICANT=false
    ;;
  *)
    # For non-conventional commits, check if message is substantial
    if [ "${#COMMIT_MSG}" -gt 50 ]; then
      IS_SIGNIFICANT=true
      COMMIT_TYPE="decision"
    fi
    ;;
esac

# Build additional context if significant
if [ "$IS_SIGNIFICANT" = "true" ]; then
  # Get changed files (with error handling)
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | head -5 || echo "")

  CONTEXT="
🔄 Git Commit Detected

Commit Message: $COMMIT_MSG

This commit appears significant and may contain important context worth capturing.

Consider using autology_capture with:
- type: '$COMMIT_TYPE' (or adjust as appropriate)
- title: Brief summary of what was accomplished
- content: Why this change was made, what alternatives were considered, what the consequences are
- tags: Relevant tags like the files/features affected
- references: ['$(echo "$CHANGED_FILES" | head -3 | tr '\n' ',' | sed 's/,$//' | sed "s/,/', '/g")']

Changed files:
$CHANGED_FILES
"

  # Escape for JSON (with error handling)
  CONTEXT_ESCAPED=$(echo "$CONTEXT" | jq -Rs . 2>/dev/null || echo '""')

  # If jq failed, fall back to simple allow
  if [ "$CONTEXT_ESCAPED" = '""' ]; then
    safe_allow
  fi

  echo "{
    \"decision\": \"allow\",
    \"additionalContext\": $CONTEXT_ESCAPED
  }"
else
  safe_allow
fi
```

### session-end.sh

```bash
#!/bin/bash
# SessionEnd hook - Reminds user they can capture session summary

cat >&2 <<'EOF'
💡 Tip: To capture this session's summary in your knowledge graph:
   1. Resume session: claude -r
   2. Run: /autology:capture
EOF

exit 0
```

## Triggering Reliability (Baseline)

- SessionStart: 100% (always triggers)
- PostToolUse(Write/Edit): ~90% (debounced, staleness checked)
- PostToolUse(git commit): ~95% (command-based)
- SessionEnd: 100% (always triggers)

## Removal Date

2026-02-09

## Reason

Testing agent-based triggering as replacement. If agent reliability < 80%, restore from this backup.
