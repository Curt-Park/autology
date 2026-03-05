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
2. Read `skills/autology-workflow/SKILL.md` (full file, including frontmatter)
3. Wrap with neutral framing: `"You have autology knowledge management installed."`
4. Escape string for JSON using bash parameter substitution (`$'\n'` for newlines)
5. Output JSON via heredoc:
   ```json
   {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
   ```
6. Explicit `exit 0`

## Hook Configuration (`hooks/hooks.json`)

```json
{
  "SessionStart": [...]  // → session-start.sh
}
```

SessionEnd hook was removed — Claude Code does not reliably display stderr on session exit, and SessionStart already injects capture guidance via autology-workflow skill.

## Key Design Choices

- **bash parameter substitution for JSON escaping**: no external dependencies; `$'\n'` matches actual newlines correctly
- **heredoc for JSON output**: clearer structure than single-line printf
- **Explicit `exit 0`**: ensures clean exit under `set -euo pipefail`
- **Self-locating via `BASH_SOURCE[0]`**: script determines its own `PLUGIN_ROOT` at runtime — no env override needed for testing (`bash scripts/session-start.sh` from repo root works directly)

## Related

- [[codeless-architecture-decision]] — Decision that introduced these scripts
- [[autology-internals]] — Overall implementation overview
