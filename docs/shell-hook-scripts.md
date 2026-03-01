---
confidence: 0.9
created: "2026-03-01T05:20:00+09:00"
id: shell-hook-scripts
modified: "2026-03-01T05:20:00+09:00"
references:
  - scripts/session-start.sh
  - scripts/session-end.sh
  - scripts/launcher.sh
  - hooks/hooks.json
relations:
  - target: codeless-architecture-decision
    type: implements
    description: "Implements the code-less architecture decision"
  - target: autology-internals
    type: relates_to
    description: "Core implementation layer of autology"
source: manual
status: active
tags:
  - internals
  - architecture
  - shell
title: Shell Hook Scripts
type: component
---

# Shell Hook Scripts

Part of [[autology-internals]]. Implements [[codeless-architecture-decision]].

## Overview

Autology's only code: three bash scripts that implement the SessionStart and SessionEnd Claude Code hooks.

## Files

### scripts/launcher.sh
Routes hook subcommands to the appropriate script:
```bash
launcher.sh hook session-start  → session-start.sh
launcher.sh hook session-end    → session-end.sh
```
`CLAUDE_PLUGIN_ROOT` env determines script location.

### scripts/session-start.sh
**Core logic:**
1. Consume stdin (avoid broken pipe with `set -euo pipefail`)
2. Iterate `docs/*.md` — parse YAML frontmatter with awk
3. Filter `status: active` nodes only
4. Build node index: `- [type] Title (tags: ...) → docs/slug.md`
5. Collect unique tags across all nodes
6. Compose `additionalContext` string (node list + capture instructions)
7. Output JSON: `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}`

**Bootstrap case** (0 nodes): outputs instructions only, no node list.

**Budget**: capped at 150 nodes; shows `(... and N more)` beyond limit.

### scripts/session-end.sh
Outputs a capture tip to stderr:
```
💡 Autology tip: Consider capturing knowledge from this session.
```

## Hook Configuration (`hooks/hooks.json`)

```json
{
  "SessionStart": [...],  // → session-start.sh
  "SessionEnd": [...]     // → session-end.sh
}
```

## Key Design Choices

- **awk for frontmatter parsing**: no dependencies (pure POSIX)
- **jq for JSON output**: `jq -n --arg` handles all escaping correctly; widely available
- **`|| true` on grep pipelines**: prevents `set -e` from aborting on empty results
- **`AUTOLOGY_ROOT` env**: overridable for testing (`AUTOLOGY_ROOT=/tmp/test bash session-start.sh`)

## Related

- [[codeless-architecture-decision]] — Decision that introduced these scripts
- [[autology-internals]] — Overall implementation overview
