---
description: Run trigger evals for an autology skill. Empirically tests whether the skill description causes Claude to actually invoke it. Usage: /eval-trigger <skill-name>
---

# Autology Trigger Eval

Empirically test whether the **$ARGUMENTS** skill description causes Claude to actually invoke it — using an isolated `claude -p` subprocess with only the target skill visible.

## How it works

For each query in `trigger_evals.json`:
1. A stub plugin dir is created containing **only** the target skill's `SKILL.md`
2. `claude -p "<query>"` runs with `--plugin-dir <stub>` — so the subprocess sees exactly one skill
3. The stream-json output is parsed for a `Skill` tool_use event

This gives true isolation: no other skill descriptions can attract the trigger.

## Step 1: Read the eval set

Read:
- `skills/$ARGUMENTS/SKILL.md` — note the `description` field (the only thing Claude sees)
- `skills/$ARGUMENTS/evals/trigger_evals.json` — queries with `should_trigger` labels

## Step 2: Build the stub plugin dir

```bash
mkdir -p /tmp/trigger-eval-$ARGUMENTS/stub/skills/$ARGUMENTS
cp skills/$ARGUMENTS/SKILL.md /tmp/trigger-eval-$ARGUMENTS/stub/skills/$ARGUMENTS/SKILL.md
mkdir -p /tmp/trigger-eval-$ARGUMENTS/results
```

The stub dir contains only the target skill — no other skills can compete.

## Step 3: Run all queries in parallel

Launch all queries as background bash jobs. For each query:

```bash
output=$(env -u CLAUDECODE claude -p "$query" \
  --plugin-dir /tmp/trigger-eval-$ARGUMENTS/stub \
  --output-format stream-json --verbose 2>/dev/null)
echo "$output" > /tmp/trigger-eval-$ARGUMENTS/results/${i}.txt
```

Wait for all background jobs to finish before proceeding.

**Detecting a trigger:** parse each result file with python3 — look for a `content_block_start` event where `content_block.type == "tool_use"` and `content_block.name == "Skill"`:

```python
import sys, json
triggered = False
for line in sys.stdin:
    try:
        ev = json.loads(line)
        if ev.get("type") == "content_block_start":
            cb = ev.get("content_block", {})
            if cb.get("type") == "tool_use" and cb.get("name") == "Skill":
                triggered = True
                break
    except Exception:
        pass
print("triggered" if triggered else "not_triggered")
```

## Step 4: Report results

Compare each result to `should_trigger`:

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
rm -rf /tmp/trigger-eval-$ARGUMENTS
```

## Step 6: Synthesis

After reporting, briefly answer:
- Which queries are edge cases that reveal description ambiguity?
- Is there a pattern in the failures?
- What specific phrase in the description would fix the failures?
