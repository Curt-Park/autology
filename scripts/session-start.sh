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
_capture_instructions="## When to capture new knowledge
Save new knowledge into ${AUTOLOGY_ROOT}/ when:
- A decision is made (technology choice, architecture, convention)
- A new component or pattern is created
- A convention is established or changed
- The user says \"remember this\" or similar
- You learn something that would help in a future session

## Doc maintenance — update existing docs when editing code
After editing a code file, check: does any ${AUTOLOGY_ROOT}/*.md node reference this file or its parent directory?
- If unsure, run: Grep ${AUTOLOGY_ROOT}/ for the filename
- If a doc references the edited file, verify it still matches reality (counts, names, types, paths, behavior)
- Update the doc in-place immediately — don't defer to end of session
- If no doc references the file, no action needed

## How to save
- Check for existing docs first (Grep ${AUTOLOGY_ROOT}/) — update existing nodes rather than creating duplicates
- Update or remove docs that are wrong or outdated
- File format: YAML frontmatter (title, type, tags) + markdown content
- type: single primary classification (decision, component, convention, concept, pattern, issue, session)
- tags: multiple cross-cutting topics (e.g., [auth, api, database]) — reuse existing tags when possible
- File naming: ${AUTOLOGY_ROOT}/{title-slug}.md (lowercase, hyphens, no special chars)
- YAML frontmatter example:
  title: \"Human Readable Title\"
  type: decision
  tags: [tag1, tag2]

## What NOT to save
- Session-specific context (current task details, in-progress work)
- Information that might be incomplete — verify before writing
- Anything that duplicates existing docs
- Speculative or unverified conclusions

## Autology skills
Invoke these skills at the right time — they handle the details:
- \`/autology:capture\` — to save new knowledge (handles dedup, wikilinks, formatting)
- \`/autology:sync\` — to verify docs match changed files (pre-commit) or full audit (\`sync full\`)
- \`/autology:explore\` — to browse or query the knowledge base"

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
${_capture_instructions}"
fi

# Build systemMessage
if [ "$node_count" -eq 0 ]; then
  msg="Autology: no nodes yet — knowledge captured during sessions goes to ${AUTOLOGY_ROOT}/"
else
  tag_count=$(echo "$unique_tags" | tr ',' '\n' | grep -c . || true)
  msg="Autology: ${node_count} nodes (${tag_count} tags) loaded from ${AUTOLOGY_ROOT}/"
fi

# Output JSON
jq -n --arg ctx "$context" --arg msg "$msg" \
  '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx},"systemMessage":$msg}'
