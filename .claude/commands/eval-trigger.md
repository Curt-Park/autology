---
description: Run trigger evals for an autology skill. Empirically tests whether the skill description causes Claude to actually invoke it. Usage: /eval-trigger <skill-name>
---

# Autology Trigger Eval

Empirically test whether the **$ARGUMENTS** skill description causes Claude to actually invoke it — by launching real subagents with each query and observing whether they invoke the skill.

## How it works

For each query in `trigger_evals.json`, spawn a subagent via the Agent tool with `isolation: "worktree"`. The agent receives only the query — no hints about skills. After it decides whether to invoke a skill, it saves a result JSON. We read those files to tally pass/fail.

This measures real trigger behavior: the same mechanism that determines skill invocation in normal use.

## Step 1: Read the eval set

Read:
- `skills/$ARGUMENTS/SKILL.md` — note the `description` field (the only thing Claude sees when deciding to invoke a skill)
- `skills/$ARGUMENTS/evals/trigger_evals.json` — queries with `should_trigger` labels

## Step 2: Launch all subagents in parallel

For each query, spawn a subagent using the Agent tool with **`isolation: "worktree"`**. Launch all in the same turn so they run in parallel.

**Agent prompt:**
```
Handle this task: <query>

After you've decided whether to invoke any skills and taken your first action
(or decided no action is needed), save a result file and stop — do not
execute a long multi-step workflow.

Save to $ARGUMENTS-trigger-eval/results/<index>.json:
{"index": <i>, "query": "<query>", "skill_invoked": "<skill name or null>"}

Use only relative paths for all file operations.
```

Do not tell the agent which skill to look for or that it is being tested — the decision must be uninfluenced.

## Step 3: Collect results

Once all agents finish, read each `$ARGUMENTS-trigger-eval/results/<index>.json` and check `skill_invoked`:
- `"$ARGUMENTS"` → triggered
- `null` or any other value → not triggered

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

## Step 5: Clean up worktrees

After grading, remove the worktrees created by the agents:
```bash
git worktree remove --force <worktree-path>
```
The worktree path is returned in each agent's result.

## Step 6: Synthesis

After reporting, briefly answer:
- Which queries are edge cases that reveal description ambiguity?
- Is there a pattern in the failures?
- What specific phrase in the description would fix the failures?
