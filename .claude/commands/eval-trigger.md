---
description: Run trigger evals for an autology skill. Empirically tests whether the skill description causes Claude to actually invoke it. Usage: /eval-trigger <skill-name>
---

# Autology Trigger Eval

Empirically test whether the **$ARGUMENTS** skill description causes Claude to actually invoke it — using an isolated `claude -p` subprocess with only the target skill visible.

## How it works

For each query in `trigger_evals.json`:
1. A stub plugin dir is created containing **only** the target skill's `SKILL.md`
2. `claude -p "<query>"` runs with `--plugin-dir <stub>` and `--setting-sources ''` — subprocess sees exactly one skill (plus Claude Code built-ins)
3. Stream-json output is read via Python `subprocess.Popen` + `select` and parsed for a `Skill` tool_use event
4. Trigger detected mid-stream → process killed immediately (no need to wait for full response)

**Why three env vars / flags are needed:**
- `CLAUDECODE` unset — prevents nested Claude Code detection
- `ANTHROPIC_API_KEY` unset — forces OAuth (claude.ai) instead of API key billing
- `--setting-sources ''` — skips global plugin settings; only `--plugin-dir` skills are visible

**Why Python subprocess, not bash pipe or tmux:**
- Bash pipe (`claude -p ... | ...`) hangs in Claude Code's Bash tool (no TTY)
- Python `subprocess.Popen` with `stdout=PIPE` avoids this — proven by skill-creator's `run_eval.py`
- `select`-based reading allows early exit the moment a trigger is detected, and timeout-based exit if claude -p hangs

## Step 1: Read the eval set

Read:
- `skills/$ARGUMENTS/SKILL.md` — note the `description` field (the only thing Claude sees)
- `skills/$ARGUMENTS/evals/trigger_evals.json` — queries with `should_trigger` labels

## Step 2: Build the stub plugin dir

```bash
mkdir -p /tmp/trigger-eval-$ARGUMENTS/stub/skills/$ARGUMENTS
cp skills/$ARGUMENTS/SKILL.md /tmp/trigger-eval-$ARGUMENTS/stub/skills/$ARGUMENTS/SKILL.md
```

## Step 3: Run all queries in parallel via Python subprocess

Write and execute `/tmp/trigger-eval-$ARGUMENTS/run.py`. The script reads `trigger_evals.json`, runs all queries in parallel (one thread per query), and writes per-query results to `/tmp/trigger-eval-$ARGUMENTS/results/<i>.json`.

**Runner script template:**

```python
#!/usr/bin/env python3
import json, os, select, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

SKILL = "$ARGUMENTS"
STUB  = f"/tmp/trigger-eval-{SKILL}/stub"
OUT   = f"/tmp/trigger-eval-{SKILL}/results"
os.makedirs(OUT, exist_ok=True)

def run_query(item):
    query   = item["query"]
    idx     = item["idx"]
    env     = {k: v for k, v in os.environ.items() if k not in ("CLAUDECODE", "ANTHROPIC_API_KEY")}
    cmd     = ["claude", "-p", query,
               "--plugin-dir", STUB,
               "--setting-sources", "",
               "--output-format", "stream-json", "--verbose"]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env)
    triggered = False
    start     = time.time()
    buf       = ""

    try:
        while time.time() - start < 30:
            if process.poll() is not None:
                buf += (process.stdout.read() or b"").decode("utf-8", errors="replace")
                break
            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            if not ready:
                continue
            chunk = os.read(process.stdout.fileno(), 8192)
            if not chunk:
                break
            buf += chunk.decode("utf-8", errors="replace")
            # parse complete lines
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                try:
                    ev = json.loads(line.strip())
                    if ev.get("type") == "assistant":
                        for item_ in ev.get("message", {}).get("content", []):
                            if (item_.get("type") == "tool_use"
                                    and item_.get("name") == "Skill"
                                    and SKILL in item_.get("input", {}).get("skill", "")):
                                triggered = True
                                return idx, triggered  # early exit
                except Exception:
                    pass
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()

    return idx, triggered

evals = json.loads(open(f"skills/{SKILL}/evals/trigger_evals.json").read())
items = [{"idx": i, **ev} for i, ev in enumerate(evals)]

with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(run_query, item): item for item in items}
    for future in futures:
        idx, triggered = future.result()
        ev = futures[future]
        result = {"query": ev["query"], "should_trigger": ev["should_trigger"], "triggered": triggered}
        open(f"{OUT}/{idx}.json", "w").write(json.dumps(result))

print("done")
```

Run it:

```bash
python3 /tmp/trigger-eval-$ARGUMENTS/run.py
```

## Step 4: Report results

Read all result files and compare `triggered` vs `should_trigger`:

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
