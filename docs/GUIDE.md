# Autology User Guide

## Three Ways to Interact

Autology provides three interaction modes:

1. **Automatic (Agents)** - Proactively provides ontology context
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
5. Learn automation (agents)

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

## Automation with Agents

Autology uses the **autology-explorer agent** to proactively provide ontology context.

### When the Agent Triggers

The agent automatically activates when you ask questions about:

**Architecture & Design**:
- "Why did we choose this database?"
- "What's our error handling convention?"
- "Show me past API design decisions"

**Implementation Planning**:
- "What will adding auth affect?"
- "What depends on this component?"
- "What patterns should I follow?"

**Quality & Review**:
- "Does this follow our patterns?"
- "What conventions am I missing?"
- "Are there similar solutions?"

**Knowledge Discovery**:
- "What's missing from our docs?"
- "Are there outdated decisions?"
- "Show me isolated nodes"

**Evolution Analysis**:
- "How did our testing strategy evolve?"
- "What changed since project start?"
- "Show me the decision timeline"

### What the Agent Does

1. Analyzes your query for ontology relevance
2. Searches knowledge nodes with `autology_query`
3. Explores relations with graph analysis
4. Provides context from past decisions
5. Suggests related patterns and conventions

### Manual Invocation

If the agent doesn't trigger automatically:

```
Use the autology-explorer agent to analyze [your question]
```

Or use skills:
- `/autology:explore` - Search and query
- `/autology:capture` - Guided capture

### Reliability

**Status**: Experimental (as of 2026-02-09)

**Baseline Comparison**:
- Previous hooks: 90%+ reliability (SessionStart: 100%, PostToolUse: ~90-95%)
- Current agents: Under validation (target: ≥80%)

**Test Framework**: See `tests/agents/` for comprehensive testing
- 25 scenarios across 5 categories
- Results to be documented after empirical validation

**Known Limitations**:
- No automatic context injection at session start
- No proactive capture suggestions after file edits
- Requires explicit user queries with trigger keywords

**Manual Fallback**: If agent doesn't trigger automatically, explicitly request:
```
Use the autology-explorer agent to analyze [your question]
```

**Restoration Plan**: If reliability < 80%, hooks can be restored from `docs/legacy/hooks-backup-2026-02-09.md`

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

### Workflow 3: Agent-Assisted Development

```
1. Query: "How should I implement authentication?"
   → autology-explorer triggers
   → Finds JWT Auth Decision and Security Conventions
   → Suggests patterns to follow

2. Query: "Does this implementation follow our patterns?"
   → autology-explorer triggers
   → Compares against existing conventions
   → Identifies gaps or inconsistencies

3. Use /autology:capture to document new patterns
   → Creates component node for AuthService
   → Links to related decisions and conventions
```

## Tips

**For Regular Use**:
- Use skills for interactive work
- Let agents provide context automatically
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
