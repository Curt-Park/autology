---
name: capture
description: Use when a project decision, convention, or pattern should be saved to the autology knowledge base (docs/) — user says "remember this", "decided", "chose", "always do X", or autology router identifies new items from explore triage.
---

## Overview

Capture knowledge from conversation context into docs/ as markdown nodes. Save immediately — no confirmation needed. Always Grep for duplicates before creating.

## When to Use

- A technology or architecture decision was made
- A new component was built or implemented
- A convention was established ("always X", "never Y")
- The user explicitly asks: "remember this"

When NOT to use:
- Session-specific context (current task, temporary state)
- Incomplete or unverified information
- Content already covered in existing docs/

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

Use a different label if it better describes the knowledge. `type` = primary classification (what kind?); `tags` = cross-cutting topics (what about?).

## When invoked directly

If called directly (not via autology router), consider running `/autology:explore` first.
Explore returns topology hints — suggested relations and connected nodes — that make step 4 richer.
If explore output is available, this skill uses it automatically. If not, it falls back to manual Grep.

## Process

### 1. Check for Existing Nodes

Before creating, search for similar content:

```
Grep docs/ for relevant keywords or title fragments
```

- If similar node exists → Read it, then update with Edit
- If no match → create new file with Write

### 2. Identify Knowledge

Analyze recent conversation to find knowledge-worthy items:
- Decisions made (technology choices, architectural choices)
- Components created or modified
- Conventions or patterns established
- Concepts or domain knowledge explained
- Issues or technical debt identified

### 3. Create or Update

**Create new node** (`docs/{title-slug}.md`):

```yaml
---
title: "Human Readable Title"
type: decision
tags: [tag1, tag2]
---
```

**Update existing node**: Use Edit tool to modify content.

**File naming**: `docs/{title-slug}.md` — lowercase, hyphens, no special characters.

### 4. Add Relations

If explore provided suggested relations, use those as starting relations.
Otherwise, search manually:

```
Grep docs/ for nodes sharing tags or mentioning related concepts
```

For each related node found:
- Add a `[[node-id]]` wikilink in the new node's body text
- Also Edit the related node to add the reverse `[[node-id]]` wikilink

### 5. Report Result

```
> **Autology** — Captured [type]: docs/{slug}.md
> Tags: [tags] | Relations: [related nodes if any]
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Create new node without checking for duplicates | Always Grep first |
| Ask user for confirmation before saving | Save immediately, then report |
| Leave nodes for deleted code active | Set `status: archived` |
| Add wikilink only to new node | Also add reverse link to related node |
