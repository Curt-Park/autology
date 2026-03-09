---
title: "Custom Eval Infrastructure Instead of skill-creator"
type: decision
tags: [evals, tooling, skill-creator]
---

We chose to build custom eval commands (`eval-trigger`, `eval-behavior`) directly in `.claude/commands/` rather than using the `skill-creator` plugin's built-in eval system.

## Rationale

**skill-creator's eval model doesn't fit this project.** skill-creator is designed for an iterative human-review loop: run test cases, open a browser viewer, collect feedback, revise. autology's evals are automated regression checks — the goal is a pass/fail score, not subjective output review.

**skill-creator's trigger detection is broken in Claude Code.** `run_eval.py` detects skill invocation by watching for `Skill` or `Read` tool calls and returning `False` on the first unrecognized tool call (`else: return False`). In Claude Code, deferred tools are discovered via `ToolSearch` before they can be invoked — so the detection hits `return False` on the `ToolSearch` event, before Claude ever calls `Skill`. All queries return `False` regardless of whether the skill would have triggered. This is a fundamental incompatibility with Claude Code's deferred tool architecture.

**Subprocess isolation is necessary for trigger evals.** Each query must run in a fresh Claude session with only the target skill visible (no other skill descriptions competing for the trigger). That requires `claude -p` subprocesses with a stub `--plugin-dir`, which skill-creator's architecture doesn't support.

**Project-local commands are simpler to evolve.** `.claude/commands/eval-trigger.md` and `eval-behavior.md` are markdown files in the repo — easy to version, modify, and run without plugin infrastructure.

## What we use instead

- `eval-trigger`: empirical trigger detection via `claude -p` subprocess + stream-json parsing → [[trigger-eval-mechanism]]
- `eval-behavior`: behavioral regression evals using Agent tool with worktree isolation → results saved in `*-workspace/` directories
