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

Autology's only code: two bash scripts that implement the SessionStart and SessionEnd Claude Code hooks.

## Files

### scripts/session-start.sh
**Core logic:**
1. Consume stdin (avoid broken pipe with `set -euo pipefail`)
2. Determine plugin root via `BASH_SOURCE[0]` + `cd && pwd`
3. Read `skills/router/SKILL.md`, strip YAML frontmatter with awk
4. Prepend plain framing text: `"Below is the full content of the autology router skill — your guide to when and how to invoke autology skills:"`
5. Escape string for JSON using bash parameter substitution (`$'\n'` for newlines)
6. Output JSON:
   ```json
   {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
   ```

### scripts/session-end.sh
Outputs a JSON `systemMessage` (user-visible) with a capture tip:
```json
{"systemMessage": "Autology: /autology:capture to save knowledge from this session"}
```

## Hook Configuration (`hooks/hooks.json`)

```json
{
  "SessionStart": [...],  // → session-start.sh
  "SessionEnd": [...]     // → session-end.sh
}
```

## Key Design Choices

- **awk for frontmatter stripping**: no dependencies (pure POSIX)
- **bash parameter substitution for JSON escaping**: no external dependencies; `$'\n'` matches actual newlines correctly
- **`|| true` on stdin consume**: prevents `set -e` from aborting on broken pipe
- **Self-locating via `BASH_SOURCE[0]`**: script determines its own `PLUGIN_ROOT` at runtime — no env override needed for testing (`bash scripts/session-start.sh` from repo root works directly)

## Related

- [[codeless-architecture-decision]] — Decision that introduced these scripts
- [[autology-internals]] — Overall implementation overview
