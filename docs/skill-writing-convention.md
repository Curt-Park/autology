---
title: "Skill Writing Convention"
type: convention
tags: [docs, skills, internals]
---

# Skill Writing Convention

Part of [[autology-internals]]. Governs how autology skills should be written.

## Convention

Skills should explain **why** behavior matters, not command it. Avoid adversarial or coercive framing.

## What to Avoid

- `<EXTREMELY_IMPORTANT>` or ALL-CAPS commands ("YOU MUST", "YOU DO NOT HAVE A CHOICE")
- Red Flags tables listing rationalizations to "stop"
- "This skill is rigid. Follow exactly. Do not adapt."
- Threatening or presumptuous framing

These patterns waste context window tokens (especially harmful for skills injected every session via SessionStart), create adversarial dynamics, and don't actually improve behavior.

## What to Do Instead

- State the **reason** the behavior matters: "Knowledge captured close to the action is more accurate and complete."
- Use neutral, informative framing
- Trust that a clear "why" is more durable than a threat

## Rationale

Skills injected every session (like autology-workflow via [[shell-hook-scripts]]) have a permanent context window cost. Aggressive framing multiplies that cost with no behavioral benefit. A single sentence explaining the reason accomplishes the same goal with a fraction of the tokens.

This convention aligns with [[autology-philosophy]]'s principle of transparency: the system should explain its reasoning, not just enforce rules.
