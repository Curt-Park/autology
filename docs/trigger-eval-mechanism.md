---
title: "Trigger Eval Mechanism"
type: concept
tags: [evals, tooling, trigger-eval]
---

The trigger eval tests whether a skill's description causes Claude to actually invoke the skill — empirically, not through self-assessment.

## Why subprocess instead of self-assessment

The initial implementation asked Claude to judge "would I invoke this skill?" in the same session. This has self-bias and is not reproducible. The current approach runs `claude -p` as a subprocess and detects whether the `Skill` tool_use event actually appears in the stream-json output.

## Key design decisions

### Python `subprocess.Popen` run from a background process

`claude -p` subprocesses work correctly when the orchestrating script runs detached from the Bash tool. The critical constraint: **the runner script must be launched in the background** (`python3 -u run.py > run.log 2>&1 &`).

When the Bash tool executes a command synchronously, it is blocked. During this time, any child `claude -p` process that inherits `CLAUDE_CODE_SSE_PORT` will attempt to connect to the parent Claude Code process via IPC — but the parent is blocked waiting for the Bash tool to finish, causing a deadlock. Running the script in the background frees the parent, and the subprocesses proceed normally.

Three env vars must be removed from the subprocess environment:

| Variable | Reason |
|---|---|
| `CLAUDECODE` | Prevents nested Claude Code detection |
| `ANTHROPIC_API_KEY` | Forces OAuth; Max subscribers without API credits get a silent `billing_error` if key is set |
| `CLAUDE_CODE_SSE_PORT` | Prevents IPC connection attempt to parent |

### `--plugin-dir` for reliable skill loading

`claude -p` in headless (non-interactive) mode does not load project-local `.claude/commands/` files as skills — only global plugin skills from settings are loaded. Passing `--plugin-dir <stub>` makes the target skill explicitly available regardless of execution context.

### `--setting-sources ''` for isolation

Without this, all globally installed plugins are loaded alongside the test skill, so the trigger rate reflects competition rather than description quality. With `--setting-sources ''`, only `--plugin-dir` skills are visible. A small set of Claude Code built-in skills (`keybindings-help`, `simplify`, `loop`, `claude-api`) are always present regardless — but these occupy unrelated domains and don't compete with autology skills in practice.

### Early exit via `stream_event/content_block_start`

With `--include-partial-messages`, the `stream_event/content_block_start` event fires as soon as Claude begins generating a `Skill` tool_use block — before the skill actually executes. The subprocess is killed immediately on detection, preventing the skill from making downstream API calls (Grep, Read, Glob) that would consume rate limit quota across 10 parallel workers.

```python
if ev.get("type") == "stream_event":
    se = ev.get("event", {})
    if se.get("type") == "content_block_start":
        cb = se.get("content_block", {})
        if cb.get("type") == "tool_use" and cb.get("name") == "Skill":
            return idx, True  # kill process, record triggered
```

Fallback: if partial messages are unavailable, the full `type:"assistant"` message is checked for a `Skill` tool_use in its content array.

See [[eval-infrastructure-decision]] for why this approach was chosen over skill-creator.
