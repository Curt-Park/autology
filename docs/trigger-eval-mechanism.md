---
title: "Trigger Eval Mechanism"
type: concept
tags: [evals, tooling, trigger-eval]
---

The trigger eval tests whether a skill's description causes Claude to actually invoke the skill — empirically, not through self-assessment.

## Why subprocess instead of self-assessment

The initial implementation asked Claude to judge "would I invoke this skill?" in the same session. This has self-bias and is not reproducible. The current approach runs `claude -p` as a subprocess and detects whether the `Skill` tool_use event actually appears in the stream-json output.

## Key design decisions

### tmux for TTY

`claude -p` hangs when invoked from Claude Code's Bash tool — there is no TTY. Running the subprocess inside a tmux session provides a proper TTY and resolves this.

```bash
tmux new-session -d -s trigger-eval -x 220 -y 50
tmux send-keys -t trigger-eval "bash run.sh" Enter
```

### `--setting-sources ''` for plugin isolation

Without this, the subprocess loads global settings (`~/.claude/settings.json`) and enables all registered plugins (superpowers, feature-dev, etc.), contaminating the available_skills list. Passing `--setting-sources ''` skips all settings files. Only `--plugin-dir` skills are visible — exactly one skill, the target being tested.

Verified: `plugins=['stub'], skills=['stub:autology-workflow']` with empty setting-sources.

### stub plugin dir (one skill only)

The target skill's `SKILL.md` is copied to a temp directory used as `--plugin-dir`. No other skills compete for the trigger. This is true isolation — the description is the only signal available to the model.

### `ANTHROPIC_API_KEY` unset

Forces the subprocess to use OAuth (claude.ai subscription) instead of the API key. Without this, `claude -p` fails with "Credit balance is too low" even for Max subscribers when `ANTHROPIC_API_KEY` is set in the environment.

## Detection

stream-json format embeds tool_use inside `type:"assistant"` message content arrays (not `content_block_start` events):

```python
if ev.get("type") == "assistant":
    for item in ev.get("message", {}).get("content", []):
        if item.get("type") == "tool_use" and item.get("name") == "Skill":
            if skill_name in item.get("input", {}).get("skill", ""):
                triggered = True
```

See [[eval-infrastructure-decision]] for why this approach was chosen over skill-creator.
