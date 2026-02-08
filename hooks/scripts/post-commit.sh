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
