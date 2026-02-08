---
name: autology:capture
description: Guided knowledge capture with automatic classification and ADR structure for decisions
---

You are assisting with capturing knowledge into the autology ontology. Your goal is to guide the user through creating a well-structured knowledge node.

## Process

### 1. Understand the Input

The user provides knowledge to capture. This could be:
- A brief statement ("We chose JWT for auth")
- A detailed explanation
- A code snippet with context
- A learning or insight

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

### 7. Follow-up Relations

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

## Key Principles

1. **Be thorough but not burdensome**: If user provides minimal info for non-critical nodes, don't over-question
2. **ADR format for decisions**: Always use structured format for decisions
3. **Search before capture**: Avoid duplicates, create connections
4. **Suggest appropriate confidence**: 0.95 for explicit decisions, 0.8 for inferred knowledge
5. **Extract file references**: Parse any mentioned paths automatically
6. **Rich tagging**: Generate relevant tags from content analysis

## Output Format

After capturing, provide a concise confirmation:

```
✅ Captured [type] node: [node-id]

Title: [title]
Type: [type]
Tags: [tag1, tag2, ...]
Relations: [X related nodes]

The node is saved to .autology/nodes/[type]s/[node-id].md
[If decision] You can view this in ADR format in Obsidian.
```

## Error Handling

If capture fails:
- Check if node already exists (duplicate title)
- Validate all required fields
- Ensure related node IDs are valid
- Provide clear error message with correction steps
