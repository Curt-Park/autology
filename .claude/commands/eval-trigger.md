---
description: Run trigger evals for an autology skill. Empirically tests whether the skill description causes Claude to actually invoke it. Usage: /eval-trigger <skill-name>
---

# Autology Trigger Eval

Empirically test whether the **$ARGUMENTS** skill description causes Claude to actually invoke it — using subprocess detection, not self-assessment.

## How it works

For each query in `trigger_evals.json`, run `claude -p "<query>"` with the plugin dir pointed at an isolated worktree, then detect from stream-json whether the `Skill` tool was actually called for `$ARGUMENTS`.

## Step 1: Read the eval set

Read:
- `skills/$ARGUMENTS/SKILL.md` — note the `description` field (the only thing Claude sees when deciding to trigger)
- `skills/$ARGUMENTS/evals/trigger_evals.json` — queries with `should_trigger` labels

## Step 2: Create an isolated worktree

```bash
git worktree add /tmp/trigger-eval-$ARGUMENTS HEAD
```

This provides a clean copy of the repo (with all skills) as the plugin dir. Isolation ensures the subprocess session is independent and doesn't inherit the current session's state.

## Step 3: Run each query as a subprocess

For each query, run `claude -p` with the worktree as plugin dir and parse the stream-json output.

Run all queries in parallel (background jobs) for speed. Save each result to a temp file, then collect after all finish.

```bash
# Per query (run in parallel with &)
output=$(env -u CLAUDECODE claude -p "$query" \
  --plugin-dir /tmp/trigger-eval-$ARGUMENTS \
  --output-format stream-json --verbose 2>/dev/null)

# Write result to /tmp/trigger-eval-$ARGUMENTS/results/<index>.txt
echo "$output" > /tmp/trigger-eval-$ARGUMENTS/results/${i}.txt
```

**Detecting a trigger:** parse each result file with python3 to find a `tool_use` event where `name` is `"Skill"` and input contains `$ARGUMENTS`:

```python
import sys, json

triggered = False
for line in sys.stdin:
    try:
        ev = json.loads(line)
        if ev.get("type") == "content_block_start":
            cb = ev.get("content_block", {})
            if cb.get("type") == "tool_use" and cb.get("name") == "Skill":
                if "$ARGUMENTS" in json.dumps(cb.get("input", {})):
                    triggered = True
                    break
    except Exception:
        pass

print("triggered" if triggered else "not_triggered")
```

## Step 4: Report results

For each query, compare the detected result to `should_trigger`:

```
$ARGUMENTS — trigger eval (empirical)
──────────────────────────────────────────────────

PASS  [trigger]     just pushed feat(payments): add Stripe webhook...
FAIL  [trigger]     How does the rate limiter work in this project...
PASS  [no-trigger]  can you add pagination to the users endpoint...
...

Results: X/Y  (Z%)
```

For every FAIL:
- State what actually happened (`triggered` / `not_triggered`)
- Hypothesize why the description led Claude to that judgment
- Suggest a specific wording fix in the description

## Step 5: Clean up

```bash
git worktree remove --force /tmp/trigger-eval-$ARGUMENTS
```

## Step 6: Synthesis

After reporting, briefly answer:
- Which queries are edge cases that reveal description ambiguity?
- Is there a pattern in the failures?
- What specific phrase in the description would fix the failures?
