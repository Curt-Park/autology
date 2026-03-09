---
title: "Custom Eval Infrastructure Instead of skill-creator"
type: decision
tags: [evals, tooling, skill-creator]
---

We chose to build custom eval commands (`eval-trigger`, `eval-behavior`) directly in `.claude/commands/` rather than using the `skill-creator` plugin's built-in eval system.

## Rationale

**skill-creator's eval model doesn't fit this project.** skill-creator is designed for an iterative human-review loop: run test cases, open a browser viewer, collect feedback, revise. autology's evals are automated regression checks — the goal is a pass/fail score, not subjective output review.

**skill-creator's trigger eval doesn't isolate the skill under test.** `run_eval.py` places the skill in `.claude/commands/` and runs `claude -p` with global settings intact — so all other installed skills are visible alongside the test skill. This means the trigger rate reflects how the skill performs in competition with everything else the user has installed, not the quality of the description itself. A failing query might be losing to a competing skill, not failing on its own merits. For regression testing and description iteration, this makes results hard to interpret.

Our `eval-trigger` instead loads only the target skill via a stub `--plugin-dir` with `--setting-sources ''`, giving each query a clean environment. This isolates the description signal from environmental noise.

Note: `run_eval.py` has an additional reliability issue — it omits `ANTHROPIC_API_KEY` from the subprocess env, causing silent `False` results for Max subscribers with an API key set (see [anthropics/skills#556](https://github.com/anthropics/skills/issues/556)). The fix is `env -u ANTHROPIC_API_KEY`.

**Project-local commands are simpler to evolve.** `.claude/commands/eval-trigger.md` and `eval-behavior.md` are markdown files in the repo — easy to version, modify, and run without plugin infrastructure.

## What we use instead

- `eval-trigger`: empirical trigger detection via `claude -p` subprocess + stream-json parsing → [[trigger-eval-mechanism]]
- `eval-behavior`: behavioral regression evals using Agent tool with worktree isolation → results saved in `*-workspace/` directories
