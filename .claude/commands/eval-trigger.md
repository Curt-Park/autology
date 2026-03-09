---
description: Run trigger evals for an autology skill. Empirically tests whether the skill description causes Claude to actually invoke it. Usage: /eval-trigger <skill-name>
---

# Autology Trigger Eval

Empirically test whether the **$ARGUMENTS** skill description causes Claude to actually invoke it — using an isolated `claude -p` subprocess with only the target skill visible.

## How it works

For each query in `trigger_evals.json`:
1. A stub plugin dir is created containing **only** the target skill's `SKILL.md`
2. `claude -p "<query>"` runs via Python `subprocess.Popen` with `--plugin-dir <stub>` and `--setting-sources ''` — subprocess sees exactly one skill (plus Claude Code built-ins)
3. stream-json is parsed line-by-line; trigger detected via `stream_event/content_block_start` → process killed immediately before skill executes
4. All queries run in parallel via `ThreadPoolExecutor`

**Why the runner script must be executed in the background:**
- `claude -p` deadlocks when its parent process is the blocked Bash tool: the subprocess tries to connect to the parent Claude Code process via `CLAUDE_CODE_SSE_PORT`, but the parent is waiting for the Bash tool to finish
- Running `run.py` in the background (`python3 -u run.py > run.log 2>&1 &`) frees the parent, breaking the deadlock
- The Bash tool then polls `run.log` for completion

**Why `CLAUDECODE`, `ANTHROPIC_API_KEY`, `CLAUDE_CODE_SSE_PORT` must be unset:**
- `CLAUDECODE` — prevents nested Claude Code detection
- `ANTHROPIC_API_KEY` — forces OAuth (claude.ai subscription); Max subscribers without API credits get a silent `billing_error` otherwise
- `CLAUDE_CODE_SSE_PORT` — prevents the subprocess from attempting IPC with the parent

**Why `--setting-sources ''` is needed:**
- Skips global plugin settings; only `--plugin-dir` skills are visible
- Built-in skills (`keybindings-help`, `simplify`, `loop`, `claude-api`) are always present regardless — but these occupy unrelated domains and don't compete with autology skills in practice

## Step 1: Read the eval set

Read:
- `skills/$ARGUMENTS/SKILL.md` — note the `description` field (the only thing Claude sees)
- `skills/$ARGUMENTS/evals/trigger_evals.json` — queries with `should_trigger` labels

## Step 2: Build the stub plugin dir

```bash
mkdir -p /tmp/trigger-eval-$ARGUMENTS/stub/skills/$ARGUMENTS
cp skills/$ARGUMENTS/SKILL.md /tmp/trigger-eval-$ARGUMENTS/stub/skills/$ARGUMENTS/SKILL.md
```

## Step 3: Write the runner script

Write `/tmp/trigger-eval-$ARGUMENTS/run.py`:

```python
#!/usr/bin/env python3
import json, os, select, signal, subprocess, time
from concurrent.futures import ThreadPoolExecutor

SKILL = "$ARGUMENTS"
STUB  = f"/tmp/trigger-eval-{SKILL}/stub"
OUT   = f"/tmp/trigger-eval-{SKILL}/results"
os.makedirs(OUT, exist_ok=True)

UNSET = ("CLAUDECODE", "ANTHROPIC_API_KEY", "CLAUDE_CODE_SSE_PORT", "CLAUDE_CODE_ENTRYPOINT")

def detected(ev):
    if ev.get("type") == "stream_event":
        cb = ev.get("event", {}).get("content_block", {})
        return cb.get("type") == "tool_use" and cb.get("name") == "Skill"
    if ev.get("type") == "assistant":
        return any(c.get("type") == "tool_use" and c.get("name") == "Skill"
                   for c in ev.get("message", {}).get("content", []))
    return False

def kill_proc(p):
    try: os.killpg(os.getpgid(p.pid), signal.SIGKILL)
    except Exception: p.kill()
    try: p.wait(timeout=3)
    except Exception: pass

def run_query(item):
    env = {k: v for k, v in os.environ.items() if k not in UNSET}
    p = subprocess.Popen(
        ["claude", "-p", item["query"], "--plugin-dir", STUB,
         "--setting-sources", "", "--output-format", "stream-json",
         "--verbose", "--include-partial-messages"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        env=env, start_new_session=True)
    buf = ""
    deadline = time.time() + 30
    try:
        while time.time() < deadline:
            if p.poll() is not None:
                buf += (p.stdout.read() or b"").decode("utf-8", errors="replace")
                break
            if not select.select([p.stdout], [], [], 1.0)[0]:
                continue
            chunk = os.read(p.stdout.fileno(), 8192)
            if not chunk:
                break
            buf += chunk.decode("utf-8", errors="replace")
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                try:
                    if detected(json.loads(line)):
                        return item["idx"], True
                except Exception:
                    pass
    finally:
        kill_proc(p)
    return item["idx"], False

evals = json.loads(open(f"skills/{SKILL}/evals/trigger_evals.json").read())
items = [{"idx": i, **ev} for i, ev in enumerate(evals)]

with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(run_query, item): item for item in items}
    for future in futures:
        idx, triggered = future.result()
        ev = futures[future]
        open(f"{OUT}/{idx}.json", "w").write(
            json.dumps({"query": ev["query"], "should_trigger": ev["should_trigger"], "triggered": triggered}))

print("done")
```

## Step 4: Run in the background and wait

```bash
python3 -u /tmp/trigger-eval-$ARGUMENTS/run.py > /tmp/trigger-eval-$ARGUMENTS/run.log 2>&1 &
```

Then poll until complete:

```bash
# poll every few seconds
while ! grep -q "done" /tmp/trigger-eval-$ARGUMENTS/run.log 2>/dev/null; do sleep 3; done
cat /tmp/trigger-eval-$ARGUMENTS/run.log
```

## Step 5: Report results

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

## Step 6: Clean up

```bash
rm -rf /tmp/trigger-eval-$ARGUMENTS
```

## Step 7: Synthesis

After reporting, briefly answer:
- Which queries are edge cases that reveal description ambiguity?
- Is there a pattern in the failures?
- What specific phrase in the description would fix the failures?
