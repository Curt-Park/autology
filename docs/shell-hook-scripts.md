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

Autology's only code: one bash script that implements the SessionStart Claude Code hook.

## Files

### scripts/session-start.sh
**Core logic:**
1. Determine plugin root via `BASH_SOURCE[0]` + `cd && pwd`
2. Check skill file exists — exit 1 with stderr message if missing (fail loudly)
3. Read `skills/autology-workflow/SKILL.md` (full file, including frontmatter)
4. Wrap with trimmed framing: `"Autology knowledge management is active. Workflow guide:"`
5. Escape string for JSON using `jq -n --arg s "$context" '$s'`
6. Output JSON via heredoc:
   ```json
   {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
   ```
7. Explicit `exit 0`

## Hook Configuration (`hooks/hooks.json`)

```json
{
  "SessionStart": [...]  // → session-start.sh
}
```

SessionEnd hook was removed — Claude Code does not reliably display stderr on session exit, and SessionStart already injects capture guidance via autology-workflow skill.

## Key Design Choices

- **jq for JSON escaping**: handles all control characters and unicode correctly; `jq` is listed as a prerequisite (see README)
- **Fail loudly on missing skill file**: exits 1 with stderr message rather than injecting error text as context — silent degradation is harder to debug
- **Trimmed preamble**: minimal framing reduces per-session context window cost
- **heredoc for JSON output**: clearer structure than single-line printf
- **Explicit `exit 0`**: ensures clean exit under `set -euo pipefail`
- **Self-locating via `BASH_SOURCE[0]`**: script determines its own `PLUGIN_ROOT` at runtime — no env override needed for testing (`bash scripts/session-start.sh` from repo root works directly)

## Related

- [[codeless-architecture-decision]] — Decision that introduced these scripts
- [[autology-internals]] — Overall implementation overview
