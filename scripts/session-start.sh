#!/bin/bash
# Session start hook: inject ontology summary + autonomous capture instructions
set -euo pipefail

# Check dependencies
if ! command -v jq >/dev/null 2>&1; then
  echo "[autology] jq is required but not installed." >&2
  echo "  macOS:  brew install jq" >&2
  echo "  Ubuntu: sudo apt install jq" >&2
  echo "  Others: https://jqlang.org/download/" >&2
  exit 0
fi

# Consume stdin to avoid broken pipe
cat /dev/stdin > /dev/null 2>&1 || true

AUTOLOGY_ROOT="${AUTOLOGY_ROOT:-docs}"

# Collect node metadata from YAML frontmatter
nodes=""
node_count=0
all_tags=""

if [ -d "$AUTOLOGY_ROOT" ]; then
  for f in "$AUTOLOGY_ROOT"/*.md; do
    [ -f "$f" ] || continue

    # Extract frontmatter fields using awk
    title=$(awk '/^---$/{if(found) exit; found=1; next} found && /^title:/{sub(/^title:[[:space:]]*/, ""); gsub(/"/, ""); print; exit}' "$f")
    type=$(awk '/^---$/{if(found) exit; found=1; next} found && /^type:/{sub(/^type:[[:space:]]*/, ""); print; exit}' "$f")
    tags=$(awk '/^---$/{if(found) exit; found=1; next} found && in_tags{if(/^[^ ]/ || /^---$/){exit} if(/^  - /){sub(/^  - /, ""); printf "%s,", $0}} found && /^tags:/{if(index($0,"[")>0){s=$0; sub(/^[^[]*\[/,"",s); sub(/\].*/,"",s); gsub(/ /,"",s); printf "%s,",s} else {in_tags=1}}' "$f")

    # Accumulate tags
    all_tags="${all_tags}${tags}"

    # Format node line
    tag_display=$(echo "$tags" | tr ',' '\n' | grep -v '^$' | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g' || true)
    filename=$(basename "$f")
    node_line="- [${type}] ${title} (tags: ${tag_display}) → ${AUTOLOGY_ROOT}/${filename}"
    nodes="${nodes}${node_line}\n"
    node_count=$((node_count + 1))
  done
fi

# Build unique sorted tag list
unique_tags=$(echo "$all_tags" | tr ',' '\n' | grep -v '^$' | sort -u | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g' || true)

# Build node list (cap at 200-line budget; ~150 nodes max)
MAX_NODES=150
if [ "$node_count" -gt "$MAX_NODES" ]; then
  shown_nodes=$(echo -e "$nodes" | head -n "$MAX_NODES")
  remaining=$((node_count - MAX_NODES))
  node_list="${shown_nodes}\n(... and ${remaining} more nodes — use Grep to search ${AUTOLOGY_ROOT}/ for more)"
else
  node_list="$nodes"
fi

# Shared capture instructions (base — no reuse-tags line)
_capture_instructions="As you work, capture important knowledge into ${AUTOLOGY_ROOT}/:
- Decisions, patterns, conventions, debugging insights → create new .md files
- Check for existing similar docs first (use Grep to search ${AUTOLOGY_ROOT}/)
- When user says \"remember this\" → save immediately
- Don't save: session-specific context, incomplete information, trivial details
- File format: YAML frontmatter (title, type, tags) + markdown content
- type: single primary classification — what kind of knowledge? (decision, component, convention, concept, pattern, issue, session)
- tags: multiple cross-cutting topics — what is it about? (e.g., [auth, api, database])
- File naming: ${AUTOLOGY_ROOT}/{title-slug}.md (lowercase, hyphens, no special chars)
- YAML frontmatter example:
  title: \"Human Readable Title\"
  type: decision
  tags: [tag1, tag2]"

# Build additionalContext
if [ "$node_count" -eq 0 ]; then
  context="[Autology Knowledge Base — ${AUTOLOGY_ROOT}/]

No knowledge nodes yet. Start capturing knowledge into ${AUTOLOGY_ROOT}/ as you work.

[Autonomous Capture Instructions]
${_capture_instructions}"
else
  context="[Autology Knowledge Base — ${AUTOLOGY_ROOT}/]

Tags in use: ${unique_tags}

$(echo -e "$node_list" | grep -v '^$')

For details on any topic, read the corresponding ${AUTOLOGY_ROOT}/*.md file.

[Autonomous Capture Instructions]
${_capture_instructions}
- Reuse existing tags from the list above when possible"
fi

# Output JSON
jq -n --arg ctx "$context" \
  '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
