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

**Purpose**: Guided knowledge management with create, update, delete, and supersede operations

**Usage**:
```bash
# Create new knowledge
/autology:capture "We chose JWT for auth because it's stateless"

# Update existing node
/autology:capture "Update the JWT decision - now using RS256"

# Delete obsolete node
/autology:capture "Delete the old Redis caching decision"

# Supersede (replace) decision
/autology:capture "We're replacing JWT with OAuth2"
```

**Operations**:
1. **Create**: Analyzes input, classifies type, guides through ADR format for decisions, searches for relations
2. **Update**: Finds node, determines changes, updates only specified fields (partial update)
3. **Delete**: Finds node, checks impact, warns about relation removal, confirms before deletion
4. **Supersede**: Creates new node, links with supersedes relation, marks old node as superseded

**When to use**:
- After architectural decisions (create)
- When creating new components (create)
- To update or clarify existing knowledge (update)
- To mark decisions as superseded (update/supersede)
- To remove outdated or incorrect knowledge (delete)
- When replacing old decisions (supersede)

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

---

### `autology_update`

Update an existing knowledge node (partial update).

```json
{
  "id": "node-id (required)",
  "title": "New title (optional)",
  "content": "New markdown content (optional)",
  "tags": ["new", "tags"] (optional),
  "status": "active|needs_review|superseded (optional)",
  "confidence": 0.9 (optional)
}
```

**Behavior**:
- Updates only the fields you provide
- Preserves all other fields unchanged
- Updates `modified` timestamp automatically

**Example**:
```json
{
  "id": "decision-auth-2024",
  "status": "superseded",
  "content": "## Context\n...\n## Update\nSuperseded by OAuth2 implementation"
}
```

---

### `autology_delete`

Delete a knowledge node and all its relations.

```json
{
  "id": "node-id (required)"
}
```

**Behavior**:
- Permanently deletes the node file
- Removes all relations where this node is source or target
- Irreversible operation

**Warning**: Consider marking as "superseded" instead if knowledge is being replaced.

**Example**:
```json
{
  "id": "decision-old-cache-2023"
}
```

---

### `autology_relate`

Create or update a relation between two nodes (upsert).

```json
{
  "source": "source-node-id (required)",
  "target": "target-node-id (required)",
  "type": "affects|uses|supersedes|relates_to|implements|depends_on|derived_from (required)",
  "description": "Relation description (optional)",
  "confidence": 0.8 (optional, default: 0.8)
}
```

**Behavior**:
- Validates both nodes exist
- Creates new relation or updates existing
- Stores in graph index

**Example**:
```json
{
  "source": "decision-redis-cache",
  "target": "component-session-service",
  "type": "affects",
  "description": "Changes how sessions are stored",
  "confidence": 0.95
}
```

---

### `autology_unrelate`

Remove a specific relation between two nodes.

```json
{
  "source": "source-node-id (required)",
  "target": "target-node-id (required)",
  "type": "relation-type (required)"
}
```

**Behavior**:
- Removes the specified relation from graph index
- Nodes themselves remain unchanged
- Does not fail if relation doesn't exist

**Example**:
```json
{
  "source": "decision-redis-cache",
  "target": "component-old-cache",
  "type": "affects"
}
```

---

## Automation with Agents

Autology provides three specialized agents following the single responsibility principle.

### `autology-explorer` (Read-Only - Q&A)

**Purpose**: Answer implementation questions using existing ontology knowledge

**When It Triggers** (interrogative questions about existing knowledge):
- "How do we handle authentication?"
- "Why did we choose PostgreSQL?"
- "What's our error handling convention?"
- "Show me all API-related decisions"
- "What components depend on AuthService?"

**What It Does**:
1. Extracts keywords from question
2. Queries ontology with multiple targeted searches
3. Synthesizes answer from found knowledge
4. Cites sources with node IDs for traceability

**Output**: Coherent answers with references, not raw node lists

**Limitations**: Read-only access. Will suggest using `/autology:analyze` skill for meta-analysis or `autology-capture-advisor` for write operations.

---

### `autology-capture-advisor` (Create/Update/Delete)

**Purpose**: Extract and structure knowledge from conversations

**When It Triggers** (declarative statements):

**Decisions**:
- "We chose Redis over Memcached for caching"
- "Let's use JWT for authentication"

**Components**:
- "I built a new AuthService to handle login"
- "Created a CacheManager class"

**Conventions**:
- "All errors must include correlation IDs"
- "We always use camelCase for variables"

**Concepts**:
- "Order lifecycle: pending → confirmed → shipped"
- "The build process works in 3 stages"

**Patterns**:
- "We use the Repository pattern for data access"
- "All API responses follow envelope format"

**Issues**:
- "N+1 queries causing 3s response times"
- "Memory leak in session cleanup"

**Sessions**:
- "Finished implementing user authentication system"
- "Completed the caching layer refactor"

**What It Does**:
1. Detects capture-worthy content from conversation
2. Classifies node type (decision, component, etc.)
3. Structures content appropriately (ADR for decisions, etc.)
4. Queries for existing nodes (deduplication check)
5. Suggests CREATE (new) or UPDATE (existing)
6. Gets user approval before any write operation
7. Manages relations between nodes

**Workflow Example**:
```
User: "We decided to use Redis for session caching instead of PostgreSQL"

Agent:
🎯 Detected: Decision (confidence: 95%)
Title: "Use Redis for session caching"

Checking for existing nodes... Found: "Session Storage" (decision-session-2024)

Suggested action: UPDATE existing node with:
- New information about Redis choice
- Alternative considered: PostgreSQL
- Performance improvement metrics

Update this node?
```

**Manual Invocation**:
```
Use the autology-capture-advisor agent to capture [knowledge]
```

Or use skills:
- `/autology:capture` - Guided capture
- `/autology:explore` - Search and query

### Reliability

**Status**: Hybrid triggering (as of 2026-02-10)

**Triggering Mechanisms**:
- **Hooks (100% reliable)**: git commit, PR events, context compaction, session end
- **Agents (contextual)**: Q&A, exploration, analysis

**Testing**:
- Unit tests: `go test ./internal/...` (includes hook tests)
- Integration tests: Manual hook subcommand testing
- Run all checks: `make check`

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

### Workflow 1: Hook-Based Capture (Automatic Suggestions)

```bash
# You commit code
git commit -m "feat: add Redis session storage"

# Hook triggers automatically:
# [autology] git commit detected. Consider capturing decisions/patterns with /autology:capture

# Claude receives context about the commit and may suggest:
# "I see you just committed session storage changes. Would you like to capture
#  the Redis decision as a knowledge node? Run /autology:capture to document this."

# When context is about to compact:
# [autology] Context compaction (auto) is about to occur.
# [autology] Consider capturing important decisions/patterns with /autology:capture

# Claude reviews conversation and suggests what to capture before context is lost

# When session ends:
# [autology] To capture this session's insights in your knowledge graph:
# [autology]   1. Resume session: claude -r
# [autology]   2. Run: /autology:capture
```

### Workflow 2: Capture Decision

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

### Workflow 3: Explore Before Implementing

```bash
# Before starting work
/autology:explore "authentication"

# Returns:
# - JWT Auth Decision (decision, 95% confidence)
# - AuthService Component (component, 90% confidence)
# - Security Conventions (convention, 85% confidence)

# Read full context, then build on existing knowledge
```

### Workflow 4: Agent-Assisted Development

```
1. Exploration (autology-explorer):
   User: "How should I implement authentication?"
   → Explorer triggers (interrogative)
   → Queries for JWT Auth Decision and Security Conventions
   → Suggests patterns to follow

2. Validation (autology-explorer):
   User: "Does this implementation follow our patterns?"
   → Explorer triggers (interrogative)
   → Compares against existing conventions
   → Identifies gaps or inconsistencies

3. Capture (autology-capture-advisor):
   User: "I built a new AuthService that handles JWT validation"
   → Capture-advisor triggers (declarative)
   → Classifies as component
   → Queries for duplicates (none found)
   → Suggests creating node with relations to JWT Decision
   → Creates node after user approval
```

### Workflow 5: Agent-Assisted Update

```
Scenario: You made a new decision that supersedes an old one

1. User: "We switched from JWT to OAuth2 for authentication"

2. Capture-advisor triggers:
   🎯 Detected: Decision (confidence: 95%)

   Checking existing nodes...
   Found: "Use JWT for Authentication" (decision-jwt-2024)

   This appears to supersede the existing decision.

   Suggested actions:
   1. Create new node: "Use OAuth2 for Authentication"
   2. Mark old node as superseded
   3. Create supersedes relation

   Proceed? [yes/no]

3. User: "yes"

4. Agent executes:
   - autology_capture {...} → Returns new-id
   - autology_update { "id": "decision-jwt-2024", "status": "superseded" }
   - autology_relate {
       "source": "<new-id>",
       "target": "decision-jwt-2024",
       "type": "supersedes"
     }

5. Result:
   ✓ Created: Use OAuth2 for Authentication (decision)
   ✓ Updated: Use JWT for Authentication (superseded)
   ✓ Related: <new-id> —[supersedes]→ decision-jwt-2024
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
