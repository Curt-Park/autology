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

## Step 3: Run all queries in parallel via tmux

The Bash tool cannot directly run `claude -p` (no TTY). Instead, write a runner script and execute it inside a tmux session.

**Why two env vars must be unset:**
- `CLAUDECODE` — prevents nested Claude Code detection
- `ANTHROPIC_API_KEY` — forces OAuth (claude.ai) instead of API key billing

**Create the runner script:**

```bash
cat << 'EOF' > /tmp/trigger-eval-$ARGUMENTS/run.sh
#!/usr/bin/env bash
STUB="/tmp/trigger-eval-$ARGUMENTS/stub"
RESULTS="/tmp/trigger-eval-$ARGUMENTS/results"

# (loop over each query, write inline from evals JSON)
# Per query — run in parallel:
(
  output=$(env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p "$query" \
    --plugin-dir "$STUB" \
    --output-format stream-json --verbose 2>/dev/null)
  echo "$output" > "$RESULTS/${i}.txt"
) &

wait
touch /tmp/trigger-eval-$ARGUMENTS/done
EOF
```

Build the full script by reading trigger_evals.json and inlining each query, then launch via tmux:

```bash
tmux new-session -d -s trigger-eval-$ARGUMENTS -x 220 -y 50
tmux send-keys -t trigger-eval-$ARGUMENTS "bash /tmp/trigger-eval-$ARGUMENTS/run.sh" Enter
```

Poll until all results are written (or the `done` sentinel file appears):

```bash
while [ ! -f /tmp/trigger-eval-$ARGUMENTS/done ]; do sleep 3; done
```

**Detecting a trigger:** parse each result file with python3 — the stream-json format embeds tool_use items inside `type:"assistant"` message content arrays, not as `content_block_start` events:

```python
import sys, json
triggered = False
for line in sys.stdin:
    try:
        ev = json.loads(line)
        if ev.get("type") == "assistant":
            for item in ev.get("message", {}).get("content", []):
                if item.get("type") == "tool_use" and item.get("name") == "Skill":
                    if "$ARGUMENTS" in item.get("input", {}).get("skill", ""):
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
tmux kill-session -t trigger-eval-$ARGUMENTS 2>/dev/null || true
rm -rf /tmp/trigger-eval-$ARGUMENTS
```

## Step 6: Synthesis

After reporting, briefly answer:
- Which queries are edge cases that reveal description ambiguity?
- Is there a pattern in the failures?
- What specific phrase in the description would fix the failures?
