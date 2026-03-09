---
description: Run behavioral evals for an autology skill. Usage: /eval-behavior <skill-name>
---

# Autology Behavioral Eval

Run behavioral evals for the skill named **$ARGUMENTS**.

## Setup

Read these files before proceeding:
- `skills/$ARGUMENTS/SKILL.md` — the skill instructions
- `skills/$ARGUMENTS/evals/evals.json` — eval cases with prompts and assertions

Workspace: `$ARGUMENTS-workspace/` (create if needed, overwrite previous runs)

## Step 1: Run each eval case

For each case in evals.json, run it **twice in the same turn** using the Agent tool — once with the skill, once without. Launch all pairs in parallel.

**Always use `isolation: "worktree"`** on every agent. Each agent runs in its own isolated git worktree — a full copy of the repository at the current HEAD. This means:
- `docs/` in the worktree is a clean copy; agents can freely write to it without contaminating the real repo or each other's state
- No manual sandbox setup needed
- After the agent completes, the worktree path is returned in the result (use it to read output files)

**⚠️ Absolute paths bypass isolation.** Worktree isolation only works when agents use **relative paths**. If an agent writes to an absolute path (e.g. the real repo's `docs/` directory), it lands outside the worktree and contaminates the shared repo. Every agent prompt must include the instruction below to prevent this.

**Fixture files**: If the eval requires a file to pre-exist (e.g., `docs/api-gateway.md` that the task says "assume exists"), commit it to `skills/$ARGUMENTS/evals/fixtures/` in the repo. The agent prompt should instruct the agent to copy it to `docs/` at the start: `"Copy skills/$ARGUMENTS/evals/fixtures/api-gateway.md to docs/ before starting."`

**With-skill agent prompt:**
```
Execute this task following the skill instructions below.

SKILL INSTRUCTIONS:
<paste full contents of skills/$ARGUMENTS/SKILL.md here>

TASK: <eval prompt>

The project knowledge base is at docs/. Save:
- Your complete response → $ARGUMENTS-workspace/<eval-name>/with_skill/response.txt
- A step-by-step log of every tool you used → $ARGUMENTS-workspace/<eval-name>/with_skill/transcript.md

Create directories as needed.

IMPORTANT: Use only relative paths for all file operations (docs/, $ARGUMENTS-workspace/, etc.).
Do NOT write to any absolute path — absolute paths bypass your isolated worktree and contaminate the shared repo.
```

**Without-skill agent prompt:**
```
Execute this task using only your own judgment — no special instructions.

TASK: <eval prompt>

The project knowledge base is at docs/ if needed. Save:
- Your complete response → $ARGUMENTS-workspace/<eval-name>/without_skill/response.txt
- A step-by-step log of every tool you used → $ARGUMENTS-workspace/<eval-name>/without_skill/transcript.md

Create directories as needed.

IMPORTANT: Use only relative paths for all file operations (docs/, $ARGUMENTS-workspace/, etc.).
Do NOT write to any absolute path — absolute paths bypass your isolated worktree and contaminate the shared repo.
```

Use the eval case `name` field as the directory name.

**After all agents finish**, clean up worktrees:
```bash
git worktree remove --force <worktree-path>
```

## Step 2: While agents run, review assertions

The evals.json `assertions` array describes what to check. Explain each one briefly to the user while waiting for agents to finish.

## Step 3: Grade all runs

Once all agents complete, grade each eval case. You can grade inline (no need for a separate grader agent for small eval sets).

For each assertion, read the response.txt and transcript.md for both runs and judge pass/fail.

Save to `$ARGUMENTS-workspace/<eval-name>/with_skill/grading.json` and `.../without_skill/grading.json`:
```json
{
  "expectations": [
    {"text": "assertion text", "passed": true/false, "evidence": "one sentence citing specific output"}
  ],
  "summary": {"passed": N, "failed": N, "total": N, "pass_rate": 0.0}
}
```

## Step 4: Report results

Print a summary table:

```
$ARGUMENTS — behavioral eval

  <eval-name>    with_skill: X/Y    without_skill: X/Y
  ...

Total  with_skill: A/B (P%)    without_skill: C/D (Q%)    delta: +/-R%
```

Then highlight:
- Assertions both configs pass (non-discriminating — consider strengthening)
- Assertions the skill fails (regression)
- Key qualitative differences observed between with/without skill outputs
