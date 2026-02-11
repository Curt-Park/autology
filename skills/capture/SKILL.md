---
name: autology:capture
description: Context-based knowledge capture with automatic classification and CRUD operations
---

You help users capture knowledge from conversation context into the autology ontology.

## How It Works

When invoked, automatically analyze recent conversation to identify and capture knowledge-worthy events:
- Decisions made
- Components created
- Conventions established
- Concepts discussed
- Patterns applied
- Issues identified

## Process

### 1. Gather Context

Review recent conversation history (last 10-20 messages) to extract knowledge:

**Focus areas based on how you're triggered:**
- **Advisor recommendation**: Use the advisor's signal as starting point
- **Post-commit hook**: Focus on what was just committed
- **Direct invocation**: Scan full recent conversation

**Present summary:**
```
I noticed the following knowledge from our conversation:
1. [Decision/Component/Convention]
2. [Another knowledge item]

Would you like to capture these?
```

### 2. Classify Knowledge

Automatically determine node type from conversation context:

| Type | Signals | Example |
|------|---------|---------|
| **decision** | "chose", "decided", "selected", "use", "adopt" | "We chose PostgreSQL" |
| **component** | "created", "built", "implemented", "service", "module" | "AuthService handles auth" |
| **convention** | "always", "never", "must", "should", "convention" | "All errors must include IDs" |
| **concept** | "lifecycle", "workflow", "process", "represents" | "Order: pending → shipped" |
| **pattern** | "pattern", "approach", "strategy", "reusable" | "Repository pattern" |
| **issue** | "problem", "bug", "debt", "bottleneck" | "Performance issue in search" |
| **session** | "finished", "completed", "implemented", "done" | "Implemented auth system" |

### 3. Extract Metadata

From conversation content:
- **Title**: Short, descriptive (< 50 chars)
- **Tags**: Relevant categorization
- **References**: File paths mentioned
- **Related nodes**: Query ontology with `autology_query`

### 4. Determine Operation

Query ontology to check if knowledge already exists:

```
autology_query { "query": "[extracted topic]", "tags": ["tag1", "tag2"] }
```

**Decision logic:**

| Query Result | Conversation Intent | Operation |
|--------------|---------------------|-----------|
| No match | New knowledge | **Create** |
| Match found | Adds new info | **Update** |
| Match found | Contradicts | **Supersede** |
| Match found | Explicit removal | **Delete** |
| Ambiguous | — | **Ask user** |

**Confirm with user:**
```
Found existing node: "JWT Authentication" (dec-auth-2024)
Proposed operation: Update (adds RS256 algorithm info)

Proceed? (yes/no)
```

### 5. Structure Decision Nodes (ADR Format)

If type is **decision**, guide user through ADR format:

```markdown
# [Decision Title]

## Context
What circumstances led to this decision?

## Decision
What did we decide?

## Alternatives Considered
What other options were evaluated? Why rejected?

## Consequences
Positive and negative implications?
```

**Ask clarifying questions if needed:**
- "What problem does this decision solve?"
- "What alternatives did you consider?"
- "What are the main consequences?"

### 6. Execute Operation

**Create:**
```
autology_capture {
  "title": "Brief title",
  "content": "Full markdown (ADR format for decisions)",
  "type": "decision|component|convention|...",
  "tags": ["tag1", "tag2"],
  "confidence": 0.8-0.95
}
```

**Update:**
```
autology_update {
  "id": "node-id",
  "content": "[updated content]",
  "confidence": 0.95
}
```

**Delete:**
```
1. Query for relations (impact check)
2. Warn: "Will remove N relations"
3. Confirm, then: autology_delete { "id": "node-id" }
```

**Supersede:**
```
1. Create new node (autology_capture)
2. Link: autology_relate { "source": "new-id", "target": "old-id", "type": "supersedes" }
3. Mark old: autology_update { "id": "old-id", "status": "superseded" }
```

### 7. Create Relations

Search for related nodes and suggest relations:
- **affects**: Decision impacts component
- **uses**: Component depends on another
- **supersedes**: New replaces old
- **relates_to**: General relationship
- **implements**: Component implements pattern
- **depends_on**: Dependency relationship

```
autology_relate {
  "source": "new-node-id",
  "target": "related-node-id",
  "type": "[relation-type]",
  "description": "Why they're related"
}
```

## Output Format

**After Create:**
```
✅ Captured [type] node: [node-id]

Title: [title]
Tags: [tags]
Relations: [N related nodes]
File: docs/[type]s/[node-id].md
```

**After Update:**
```
✅ Updated [type] node: [node-id]

Fields changed: [content|tags|status|confidence]
```

**After Delete:**
```
✅ Deleted [type] node: [node-id]

Relations removed: [count]
```

**After Supersede:**
```
✅ Decision superseded

Old: [old-id] - [old-title]
New: [new-id] - [new-title]
```

## Error Handling

**Create failures:**
- Duplicate title → Search for existing node, offer to update instead
- Missing required fields → Ask user to provide

**Update failures:**
- Node not found → Search with broader query
- No fields to update → Ask what to change

**Delete failures:**
- Node not found → Verify ID or search by title
- High impact → Recommend marking as superseded instead

## Key Principles

1. **Context-first**: Extract knowledge from conversation, not explicit statements
2. **ADR for decisions**: Always use structured format
3. **Query before create**: Avoid duplicates, create connections
4. **Confirm operations**: Always show proposed action before executing
5. **Prefer supersede over delete**: Preserve history for decisions
6. **Check impact**: Query relations before deleting
7. **Partial updates**: Only update fields that change

## Examples

See `EXAMPLES.md` for detailed context-based capture scenarios.

## When to Use

- **After conversations** about architectural decisions
- **After creating** new components or modules
- **After establishing** team conventions or standards
- **When replacing** old decisions with new ones
- **For documenting** known issues or technical debt
