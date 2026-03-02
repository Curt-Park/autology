---
name: capture
description: Use when a project decision, convention, or pattern should be saved to the autology knowledge base (docs/) — user says "remember this", "decided", "chose", "always do X", or autology router identifies new items from explore triage.
---

## Overview

Capture knowledge from conversation context into docs/ as markdown nodes. Save immediately — no confirmation needed.

**Precondition**: explore must have run first. Explore classifies items as new (→ capture) and provides suggested relations.

## When invoked directly

Capture requires explore output. If explore has not run, run `/autology:explore` first.

## What Capture Targets

Capture the items explore classified as new (→ capture):
- Decisions made (technology choices, architectural choices)
- Components created or modified
- Conventions or patterns established
- Concepts or domain knowledge explained
- Issues or technical debt identified

When NOT to capture:
- Session-specific context (current task, temporary state)
- Incomplete or unverified information
- Items explore classified as existing (→ sync, not capture)

## Quick Reference

| Type | Signals |
|------|---------|
| decision | "chose", "decided", "selected", "adopted" |
| component | "created", "built", "implemented", new service/module |
| convention | "always", "never", "must", "should", "the rule is" |
| concept | lifecycle, workflow, domain model, process |
| pattern | reusable approach, strategy, pattern |
| issue | bug, technical debt, bottleneck, known problem |
| session | work session summary, "finished", "completed" |

`type` = primary classification (what kind?); `tags` = cross-cutting topics (what about?).

## Process

### 1. Receive Explore Output

Use explore's new items list as the capture scope:

```
New items from explore triage (→ capture):
- [item description] — no matching node
  Suggested relations: [[foo]], [[bar]] (shared tags: architecture)
- [item description] — no matching node
  Suggested relations: none
```

### 2. Create Node

For each new item, create `docs/{title-slug}.md`:

```yaml
---
title: "Human Readable Title"
type: decision
tags: [tag1, tag2]
---
```

**File naming**: `docs/{title-slug}.md` — lowercase, hyphens, no special characters.

### 3. Add Relations

Use explore's suggested relations for wikilinks:

- Add `[[node-id]]` wikilink in the new node's body text
- Also Edit the related node to add the reverse `[[node-id]]` wikilink

### 4. Report Result

```
> **Autology** — Captured [type]: docs/{slug}.md
> Tags: [tags] | Relations: [related nodes if any]
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running capture without explore output | Explore classifies new vs existing — run it first. |
| Capturing items explore classified as existing | Those go to sync, not capture. |
| Ask user for confirmation before saving | Save immediately, then report. |
| Leave nodes for deleted code active | Set `status: archived`. |
| Add wikilink only to new node | Also add reverse link to related node. |
