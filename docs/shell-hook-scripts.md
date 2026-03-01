---
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
3. Build node index: `- [type] Title (tags: ...) → docs/slug.md`
4. Collect unique tags across all nodes
5. Compose `additionalContext` string (node list + capture instructions)
6. Output JSON with both `hookSpecificOutput` (Claude context) and `systemMessage` (user-visible):
   ```json
   {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}, "systemMessage": "Autology: N nodes (M tags) loaded from docs/"}
   ```

**Bootstrap case** (0 nodes): `systemMessage` says `"Autology: no nodes yet — knowledge captured during sessions goes to docs/"`.

**Budget**: capped at 150 nodes; shows `(... and N more)` beyond limit.

### scripts/session-end.sh
Outputs a JSON `systemMessage` (user-visible) with a capture tip:
```json
{"systemMessage": "Autology: /autology:capture to save knowledge from this session"}
```
Falls back to stderr if jq is unavailable.

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
