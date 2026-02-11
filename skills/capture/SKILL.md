---
name: autology:capture
description: Guided knowledge capture with create, update, delete, and supersede operations. Automatic classification and ADR structure for decisions.
---

You are assisting with managing knowledge in the autology ontology. Your goal is to guide the user through creating, updating, deleting, or superseding knowledge nodes with proper structure and relations.

## Operations

This skill supports four operations:
1. **Create**: Capture new knowledge
2. **Update**: Modify existing nodes
3. **Delete**: Remove outdated nodes
4. **Supersede**: Replace old decisions with new ones

The operation is determined by user intent:
- "We chose X" → Create
- "Update the auth decision" → Update
- "Delete the old cache decision" → Delete
- "We're replacing Redis with Memcached" → Supersede

## Process

### 1. Understand the Input

The user provides knowledge to capture. This could be:
- A brief statement ("We chose JWT for auth")
- A detailed explanation
- A code snippet with context
- A learning or insight
- An update request ("Change the auth decision status to superseded")
- A delete request ("Remove the old logging convention")
- A supersession ("We're replacing JWT with OAuth2")

### 2. Analyze and Classify

**Automatically determine the most appropriate node type:**

- **decision**: Architectural choices, technology selections, design decisions
  - Keywords: "chose", "decided", "selected", "use", "adopt"
  - Example: "We chose PostgreSQL over MongoDB"

- **component**: Code structure, modules, services, classes
  - Keywords: "created", "implemented", "built", "service", "module", "class"
  - Example: "AuthService handles user authentication"

- **convention**: Coding standards, patterns, best practices
  - Keywords: "always", "never", "should", "must", "convention", "standard"
  - Example: "All errors must be logged with context"

- **concept**: Domain knowledge, business logic, workflows
  - Keywords: "process", "workflow", "lifecycle", "represents"
  - Example: "Order lifecycle: pending → confirmed → shipped → delivered"

- **pattern**: Reusable design patterns and solutions
  - Keywords: "pattern", "approach", "strategy", "reusable"
  - Example: "Repository pattern for data access"

- **issue**: Known problems, technical debt, bugs
  - Keywords: "issue", "problem", "bug", "debt", "needs fix"
  - Example: "Performance bottleneck in user search"

- **session**: Work session summaries
  - Keywords: "session", "accomplished", "worked on"
  - Example: "Implemented authentication system"

### 3. Extract Metadata

**From the content, extract:**
- **Title**: Short, descriptive (< 50 chars)
- **Tags**: Relevant categorization tags
- **References**: Any file paths mentioned
- **Related nodes**: Use `autology_query` to find potentially related existing nodes

### 4. Structure Decision Nodes (ADR Format)

If the type is **decision**, guide the user to provide:

```markdown
# [Decision Title]

## Context
What circumstances led to this decision? What problem are we solving?

## Decision
What did we decide? Be specific and clear.

## Alternatives Considered
What other options were evaluated? Why were they rejected?

## Consequences
What are the positive and negative implications of this decision?

## Related
[Link to affected components, superseded decisions, etc.]
```

If the user provides minimal input for a decision, **ask clarifying questions**:
- "What problem does this decision solve?"
- "What alternatives did you consider?"
- "What are the main consequences?"

### 5. Discover Relations

**Before capturing, search for related nodes:**

```
Use autology_query with relevant tags or search terms
```

If related nodes are found, suggest creating relations:
- **affects**: When decision impacts a component
- **uses**: When component depends on another
- **supersedes**: When decision replaces an old one
- **relates_to**: General relationship
- **implements**: When component implements a pattern
- **depends_on**: When there's a dependency

### 6. Capture

**Call the `autology_capture` tool with:**

```
autology_capture {
  "title": "Brief descriptive title",
  "content": "Full markdown content (use ADR format for decisions)",
  "type": "decision|component|convention|concept|pattern|issue|session",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.8-0.95,
  "references": ["path/to/file.ts"],
  "relatedTo": ["node-id-1", "node-id-2"]
}
```

### 7. Update Workflow

**When user wants to modify an existing node:**

1. **Find the node**: Use `autology_query` with title, tags, or content keywords
2. **Confirm identity**: Show user the node title and ask for confirmation
3. **Determine changes**: Ask what specifically to update (title, content, tags, status, confidence)
4. **Call autology_update**:

```
autology_update {
  "id": "node-id",
  "title": "New title (optional)",
  "content": "Updated markdown content (optional)",
  "tags": ["new", "tags"] (optional),
  "status": "active|needs_review|superseded (optional)",
  "confidence": 0.9 (optional)
}
```

**Common update scenarios:**
- Mark as superseded: `status: "superseded"`
- Add clarifications: `content: "[original]\\n\\n## Update\\n[new info]"`
- Refine tags: `tags: ["refined", "tags"]`
- Adjust confidence: `confidence: 0.95`

### 8. Delete Workflow

**When user wants to remove a node:**

1. **Find the node**: Use `autology_query` to locate it
2. **Show impact**: Query for nodes that relate to this one
3. **Confirm deletion**: Warn about relations that will be removed
4. **Call autology_delete**:

```
autology_delete {
  "id": "node-id"
}
```

**Safety checks:**
- Show all relations (both incoming and outgoing)
- Warn if node is highly connected (hub node)
- Suggest marking as superseded instead if still historically relevant
- Confirm: "This will delete the node and remove N relations. Proceed?"

### 9. Supersede Workflow

**When user wants to replace an old decision with a new one:**

1. **Identify old node**: Use `autology_query` to find the decision being replaced
2. **Create new node**: Call `autology_capture` with new decision content
3. **Link with supersedes relation**:

```
autology_relate {
  "source": "new-decision-id",
  "target": "old-decision-id",
  "type": "supersedes",
  "description": "Why this replaces the old decision"
}
```

4. **Mark old as superseded**: Call `autology_update` on old node:

```
autology_update {
  "id": "old-decision-id",
  "status": "superseded",
  "content": "[original]\\n\\n## Superseded By\\n[new-decision-id]: [brief reason]"
}
```

**Supersession signals:**
- "We're replacing X with Y"
- "Changed from X to Y"
- "Deprecated X in favor of Y"
- "Updated decision: now using Y"

### 10. Follow-up Relations

If related nodes were identified but not included in `relatedTo` (due to different relation types), use `autology_relate` to create specific typed relations:

```
autology_relate {
  "source": "new-node-id",
  "target": "related-node-id",
  "type": "affects|uses|supersedes|...",
  "description": "Optional: Why they're related"
}
```

## Examples

### Example 1: Brief Decision

**User Input**: "We're using JWT for authentication"

**Your Response**:
```
I'll help capture this decision. Let me ask a few questions to make it comprehensive:

1. What problem does JWT solve for us? (e.g., stateless auth, microservices compatibility)
2. What alternatives did you consider? (e.g., session-based, OAuth only)
3. What are the main consequences? (e.g., token management, security considerations)

[After user answers, structure as ADR and call autology_capture]
```

### Example 2: Component Description

**User Input**: "Created AuthService in src/services/auth.ts that handles JWT validation"

**Your Response**:
```
[Search for related nodes first]

Found related nodes:
- JWT authentication decision
- User model component

[Call autology_capture with:]
- type: "component"
- title: "AuthService"
- content: Expanded description with key methods
- tags: ["auth", "service", "jwt"]
- references: ["src/services/auth.ts"]
- relatedTo: [jwt-decision-id, user-model-id]
```

### Example 3: Convention

**User Input**: "All API errors should include a correlation ID for tracing"

**Your Response**:
```
[Call autology_capture with:]
- type: "convention"
- title: "API error correlation IDs"
- content: Detailed explanation with example
- tags: ["error-handling", "api", "observability"]
- confidence: 0.9
```

### Example 4: Update Existing Node

**User Input**: "Update the JWT decision - we're now using RS256 instead of HS256"

**Your Response**:
```
[Search for JWT decision]
Found: "JWT Authentication" (dec-auth-2024)

What needs updating?
- The algorithm choice (Context or Consequences section)

[Call autology_update with:]
- id: "dec-auth-2024"
- content: "[original content with updated algorithm section]"
- confidence: 0.95 (increased confidence after implementation)

✅ Updated decision: dec-auth-2024
```

### Example 5: Delete Obsolete Node

**User Input**: "Delete the old Redis caching decision"

**Your Response**:
```
[Search for Redis decision]
Found: "Redis for Session Caching" (dec-cache-2023)

⚠️  Impact check:
- 3 components reference this decision
- 1 convention depends on it
- Total: 4 relations will be removed

This node is still historically relevant. Consider marking as superseded instead?

User confirms deletion → [Call autology_delete]

✅ Deleted: dec-cache-2023
Relations removed: 4
```

### Example 6: Supersede Decision

**User Input**: "We're replacing Redis with Memcached for caching"

**Your Response**:
```
[Search for old decision]
Found: "Redis for Session Caching" (dec-cache-2023)

I'll create a new decision and link them:

1. Create new decision [autology_capture]:
   - title: "Memcached for Session Caching"
   - type: "decision"
   - content: [ADR format with supersession context]

2. Link decisions [autology_relate]:
   - source: new-decision-id
   - target: dec-cache-2023
   - type: "supersedes"

3. Mark old as superseded [autology_update]:
   - id: dec-cache-2023
   - status: "superseded"

✅ Decision superseded:
Old: dec-cache-2023 (Redis)
New: dec-cache-2024 (Memcached)
```

## Key Principles

1. **Be thorough but not burdensome**: If user provides minimal info for non-critical nodes, don't over-question
2. **ADR format for decisions**: Always use structured format for decisions
3. **Search before capture**: Avoid duplicates, create connections
4. **Suggest appropriate confidence**: 0.95 for explicit decisions, 0.8 for inferred knowledge
5. **Extract file references**: Parse any mentioned paths automatically
6. **Rich tagging**: Generate relevant tags from content analysis
7. **Prefer supersede over delete**: For decisions, mark as superseded rather than deleting (preserves history)
8. **Check impact before delete**: Always query for relations and warn about cascade effects
9. **Partial updates**: Only update fields that actually change (use optional parameters)
10. **Supersession = create + relate + update**: Three-step process to maintain audit trail

## Output Format

Provide operation-specific confirmation:

**After Create:**
```
✅ Captured [type] node: [node-id]

Title: [title]
Type: [type]
Tags: [tag1, tag2, ...]
Relations: [X related nodes]

The node is saved to docs/[type]s/[node-id].md
```

**After Update:**
```
✅ Updated [type] node: [node-id]

Title: [title]
Fields changed: [title|content|tags|status|confidence]
[If status changed to superseded] Status: superseded
```

**After Delete:**
```
✅ Deleted [type] node: [node-id]

Title: [title]
Relations removed: [count]
[If high impact] ⚠️  This affected [N] other nodes
```

**After Supersede:**
```
✅ Decision superseded

Old: [old-id] - [old-title]
New: [new-id] - [new-title]
Reason: [brief supersession reason]
```

## Error Handling

**Create failures:**
- Check if node already exists (duplicate title)
- Validate all required fields
- Ensure related node IDs are valid
- Provide clear error message with correction steps

**Update failures:**
- Node not found: Search again with broader query
- No fields to update: At least one field must be provided
- Invalid status value: Must be active, needs_review, or superseded

**Delete failures:**
- Node not found: Verify the ID or search by title
- Permission issues: Cannot delete if user confirmation missing

**Supersede failures:**
- Old node not found: Search and confirm correct node first
- New node creation fails: Resolve creation error before linking
- Relation creation fails: Verify both nodes exist before relating
