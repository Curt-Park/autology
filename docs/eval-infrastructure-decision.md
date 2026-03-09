---
title: "Custom Eval Infrastructure Instead of skill-creator"
type: decision
tags: [evals, tooling, skill-creator]
---

We chose to build custom eval commands (`eval-trigger`, `eval-behavior`) directly in `.claude/commands/` rather than using the `skill-creator` plugin's built-in eval system.

## Rationale

**Isolation is guaranteed.** Our `eval-trigger` writes a purpose-built stub `SKILL.md` and loads it via `--plugin-dir` with `--setting-sources ''`. This gives two concrete advantages:

- **Only the target skill is visible.** No other installed skills compete for the trigger. A failing query means the description itself failed — not that another skill won.
- **The subprocess reliably sees the skill.** `--plugin-dir` is explicitly passed at invocation, so the skill is always loaded regardless of how or where `claude -p` is run.

A small set of Claude Code built-in skills (e.g. `keybindings-help`, `simplify`, `loop`, `claude-api`) are always present regardless of settings and cannot be excluded — but these occupy unrelated domains and don't compete with autology skills in practice.

**No SDK cost.** skill-creator's optimization loop uses the Anthropic SDK, which incurs API charges. autology's eval-trigger runs via OAuth (claude.ai subscription), so regression checks can be repeated freely without worrying about cost.

**Human intervention at any point.** skill-creator's optimization procedure is encapsulated in an automated loop — intervening at an arbitrary step is awkward. eval-trigger is a markdown command: read the results, edit the description directly, re-run. The iteration cycle is fully transparent and easy to interrupt or redirect.

**Customizable validation logic.** The detection and scoring logic lives in the runner script written as part of the eval command. It can be adapted per-skill — e.g. adjusting the timeout, changing how partial messages are parsed, or adding skill-specific heuristics — without being constrained by a general-purpose framework.

**Versioned alongside the skill.** The eval set (`trigger_evals.json`, `eval-behavior/`) and the eval command itself live in the same repo as the skill. Changes to a skill's behavior or description and the corresponding eval updates are committed together, keeping history coherent and making regressions easy to bisect.

## What we use instead

- `eval-trigger`: empirical trigger detection via `claude -p` subprocess + stream-json parsing → [[trigger-eval-mechanism]]
- `eval-behavior`: behavioral regression evals using Agent tool with worktree isolation → results saved in `*-workspace/` directories
