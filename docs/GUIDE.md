# Autology User Guide

## Three Ways to Interact

Autology provides three interaction modes:

1. **Automatic (Hooks)** - Captures knowledge as you work
2. **Interactive (Skills)** - Explicit commands for capture/exploration
3. **Programmatic (MCP Tools)** - API for automation

## Skills

### `/autology:tutorial`

**Purpose**: 5-step interactive learning guide

**Usage**:
```bash
/autology:tutorial           # Start from beginning
/autology:tutorial 3         # Jump to step 3
/autology:tutorial reset     # Clean up tutorial nodes
```

**Steps**:
1. Understand ontology (nodes + relations)
2. Capture first node
3. Create relationships
4. Search and query
5. Learn automation (hooks)

---

### `/autology:capture`

**Purpose**: Guided knowledge capture with ADR structure

**Usage**:
```bash
/autology:capture "We chose JWT for auth because it's stateless"
```

**Behavior**:
1. Analyzes input
2. Classifies node type (decision, component, convention, etc.)
3. If decision: Guides through ADR format (Context/Decision/Alternatives/Consequences)
4. Searches for related nodes
5. Creates node with relationships

**When to use**:
- After architectural decisions
- When creating new components
- To document conventions
- To capture domain knowledge
- At end of feature work

---

### `/autology:explore`

**Purpose**: Search and browse knowledge base

**Usage**:
```bash
/autology:explore                        # View status
/autology:explore decisions              # Filter by type
/autology:explore tagged auth            # Filter by tag
/autology:explore "authentication"       # Full-text search
/autology:explore needs review           # Filter by status
```

**When to use**:
- To understand existing decisions
- Before implementing similar features
- To find relevant conventions
- To review knowledge quality
- When onboarding new members

## MCP Tools

### `autology_capture`

Create a knowledge node with automatic classification.

```json
{
  "title": "Decision Title (required)",
  "content": "Markdown content (required)",
  "type": "decision|component|convention|concept|pattern|issue|session (optional)",
  "tags": ["tag1", "tag2"] (optional)
}
```

**Behavior**:
- If `type` is omitted, automatically classifies based on content
- Validates all fields and generates UUID v4 ID
- Stores as markdown in `.autology/nodes/{type}s/{id}.md`

**Returns**:
```json
{
  "id": "uuid-v4",
  "type": "classified-type",
  "confidence": 0.8
}
```

**Example**:
```json
{
  "title": "Use JWT for authentication",
  "content": "## Context\n...\n## Decision\n...",
  "tags": ["auth", "security"]
}
```

---

### `autology_query`

Search knowledge nodes with filtering and ranking.

```json
{
  "query": "search text (optional)",
  "type": "decision|component|convention|concept|pattern|issue|session (optional)",
  "tags": ["tag1", "tag2"] (optional, all must match),
  "limit": 10 (optional, default: 10)
}
```

**Returns**: Array of matching nodes with relevance scores

**Example**:
```json
{
  "query": "authentication",
  "type": "decision",
  "limit": 5
}
```

---

### `autology_status`

Get knowledge graph statistics.

**Input**: None (empty object)

**Returns**: Comprehensive statistics including node counts by type, relation counts by type, and total counts

**Example Output**:
```json
{
  "totalNodes": 42,
  "nodesByType": {
    "decision": 10,
    "component": 8,
    ...
  },
  "totalRelations": 67,
  "relationsByType": {
    "affects": 15,
    ...
  }
}
```

## Hooks

### SessionStart

**Trigger**: Claude Code session begins

**Behavior**:
- Loads recent active nodes (last 30 days)
- Injects top 10 relevant nodes as context
- Formats: "Previous knowledge: [summaries]"

---

### PostToolUse (Write/Edit)

**Trigger**: File created or modified

**Behavior**:
- Debounces 2 seconds
- Checks staleness (>1 hour since last suggestion)
- Analyzes significance (>10 lines or key files)
- Suggests: "Capture [type] node?"

---

### PostToolUse (Bash - git commit)

**Trigger**: `git commit` executed

**Behavior**:
- Parses commit message
- Suggests: "Save commit as session node?"
- Creates session node with commit details

---

### SessionEnd

**Trigger**: Claude Code session terminates

**Behavior**:
- Summarizes session activities
- Suggests: "Capture session summary?"
- Creates session node with files modified, decisions made, issues encountered

## Node Types

| Type | Purpose | Example |
|------|---------|---------|
| **decision** | Architectural choices | "Use PostgreSQL for ACID guarantees" |
| **component** | Code structures | "AuthService handles JWT validation" |
| **convention** | Coding standards | "All errors include correlation IDs" |
| **concept** | Domain knowledge | "Order lifecycle: pending → confirmed → shipped" |
| **pattern** | Reusable designs | "Repository pattern for data access" |
| **issue** | Technical debt | "Performance bottleneck in user search" |
| **session** | Work summaries | "Implemented authentication system" |

## Relationship Types

| Type | Meaning | Example |
|------|---------|---------|
| **affects** | Impacts another | Decision → Component |
| **uses** | Depends on | Component → Component |
| **supersedes** | Replaces old | New Decision → Old Decision |
| **relates_to** | General link | Concept ↔ Concept |
| **implements** | Realizes pattern | Component → Pattern |
| **depends_on** | Requires | Component → Component |
| **derived_from** | Originates from | Pattern ← Concept |

## ADR Format

Every `decision` node must follow Architecture Decision Record format:

```markdown
## Context
Why was this decision necessary? What problem are we solving?

## Decision
What did we decide? Be specific and clear.

## Alternatives Considered
What other options were evaluated? Why were they rejected?

## Consequences
What are the positive and negative implications?
```

## Obsidian Integration

Open `.autology/nodes/` as Obsidian vault for:
- **Graph view**: Visualize knowledge connections
- **Wiki links**: Click `[[node-id]]` to navigate
- **Tags**: Search and filter by tags
- **Metadata**: View YAML frontmatter
- **Search**: Full-text search across all nodes

## Example Workflows

### Workflow 1: Capture Decision

```bash
# After making architectural choice
/autology:capture "We chose Redis for session storage"

# Claude asks ADR questions:
# - Why Redis? (Context)
# - What about alternatives? (Alternatives)
# - Trade-offs? (Consequences)

# Node created with:
# - Type: decision (auto-classified)
# - ADR format
# - Related nodes suggested
# - Tags: [redis, session, caching]
```

### Workflow 2: Explore Before Implementing

```bash
# Before starting work
/autology:explore "authentication"

# Returns:
# - JWT Auth Decision (decision, 95% confidence)
# - AuthService Component (component, 90% confidence)
# - Security Conventions (convention, 85% confidence)

# Read full context, then build on existing knowledge
```

### Workflow 3: Automatic Capture

```
1. Edit src/auth.ts
   → PostToolUse hook: "Capture AuthService component?"
   → Approve: Node created

2. Git commit: "feat: add JWT authentication"
   → PostToolUse hook: "Save as session node?"
   → Approve: Session saved

3. Session ends
   → SessionEnd hook: "Capture session summary?"
   → Approve: Summary saved with links to created nodes
```

## Tips

**For Regular Use**:
- Use skills for interactive work
- Let hooks capture automatically
- Review in Obsidian weekly
- Update superseded decisions
- Mark low-confidence nodes for review

**For Teams**:
- Commit `.autology/` to git
- Use conventions to align team
- Reference node IDs in PRs
- Onboard with `/autology:tutorial`
- Query for tech debt regularly

**For Exploration**:
- Start with `/autology:explore`
- Use graph view in Obsidian
- Follow wiki links between nodes
- Search by tags for themes
- Use `autology_query` for full-text search
