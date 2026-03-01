---
name: autology:capture
description: Capture knowledge from conversation into docs/ using native tools
---

You help capture knowledge from conversation context into docs/ as markdown nodes.

## Process

### 1. Identify Knowledge

Analyze recent conversation to find knowledge-worthy items:
- Decisions made (technology choices, architectural choices)
- Components created or modified
- Conventions or patterns established
- Concepts or domain knowledge explained
- Issues or technical debt identified

### 2. Check for Existing Nodes

Before creating, search for similar content:

```
Grep docs/ for relevant keywords or title fragments
```

- If similar node exists → read it with Read tool, then update with Edit
- If no match → create new file with Write tool

### 3. Create or Update

**Create new node** (`docs/{title-slug}.md`):

Use Write tool with YAML frontmatter + markdown content:

```yaml
---
id: title-slug
title: "Human Readable Title"
type: any descriptive label (decision, component, convention, ...)
tags: [tag1, tag2]
confidence: 0.85
status: active
created: "2026-03-01T12:00:00+09:00"
modified: "2026-03-01T12:00:00+09:00"
references: []
relations: []
---
```

**Update existing node**: Use Edit tool to modify content and update `modified` timestamp.

**File naming**: `docs/{title-slug}.md` — lowercase, hyphens, no special characters.

### 4. Add Relations

Search for related nodes:

```
Grep docs/ for nodes sharing tags or mentioning related concepts
```

For each related node found:
- Add to `relations` array in the new node's frontmatter
- Also Edit the related node to add the reverse relation

**Relation types**: `affects`, `uses`, `relates_to`, `implements`, `depends_on`

**Relation format** (in frontmatter):
```yaml
relations:
  - target: other-node-id
    type: affects
    description: "Why related"
```

**Wikilinks in body**: Reference related nodes as `[[node-id]]`.

### 5. Classify Node Type

Choose the most descriptive label for the knowledge — there is no fixed list.
Common labels and their typical signals:

| Type | Signals |
|------|---------|
| decision | "chose", "decided", "selected", "adopted" |
| component | "created", "built", "implemented", new service/module |
| convention | "always", "never", "must", "should", "the rule is" |
| concept | lifecycle, workflow, domain model, process |
| pattern | reusable approach, strategy, pattern |
| issue | bug, technical debt, bottleneck, known problem |
| session | work session summary, "finished", "completed" |

Use a different label if it better describes the knowledge.

### 6. Capture Immediately

- Do not ask for user confirmation before saving
- Save autonomously when knowledge is clearly worth capturing
- When user says "remember this" — save immediately

### 7. Report Result

After saving:
```
Captured [type] node: docs/{slug}.md
Title: [title]
Tags: [tags]
Relations: [related nodes if any]
```

## Key Principles

- **Context-first**: Extract from conversation, not explicit statements
- **Query before create**: Use Grep to avoid duplicates; update existing node if found
- **Living documents**: Edit nodes in place — git tracks the history
- **Reuse existing tags**: Check SessionStart context for current tag list
- **Partial updates**: Only update fields that change
