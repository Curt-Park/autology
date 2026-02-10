# Autology System Specification

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
├─────────────────────────────────────────────────────────┤
│  Hooks (Deterministic)                                  │
│  - PostToolUse: git commit/PR → suggest capture         │
│  - PreCompact: context compaction → suggest capture     │
│  - SessionEnd: session end → show capture tips          │
├─────────────────────────────────────────────────────────┤
│  Skills         │  Agents (Contextual)                  │
│  /tutorial      │  autology-explorer (R)                │
│  /capture       │  - Architecture/design questions      │
│  /explore       │  - Read-only analysis                 │
│                 │                                        │
│                 │  autology-capture-advisor (CUD)       │
│                 │  - Capture decisions/components       │
│                 │  - Update existing knowledge          │
│                 │  - Manage relations                   │
├─────────────────────────────────────────────────────────┤
│              MCP Server (Go Implementation)             │
│     7 Tools: query, status, capture, update,            │
│              delete, relate, unrelate                   │
├─────────────────────────────────────────────────────────┤
│                 Storage Layer                           │
│  • NodeStore (CRUD)                                     │
│  • GraphIndex (relationships)                           │
│  • SearchEngine (query)                                 │
│  • Markdown Serialization (Obsidian-compatible)         │
└─────────────────────────────────────────────────────────┘
                            ↓
                    .autology/nodes/
                  (Markdown + Graph)
```

## Data Model

### Node Types (7)

| Type | Purpose | Format |
|------|---------|--------|
| `decision` | Architectural choices | ADR: Context/Decision/Alternatives/Consequences |
| `component` | Code structures | Description of services, modules, classes |
| `convention` | Coding standards | Rules and patterns to follow |
| `concept` | Domain knowledge | Business logic and workflows |
| `pattern` | Reusable designs | Design patterns and solutions |
| `issue` | Technical debt | Known problems and limitations |
| `session` | Work summaries | What was accomplished in a session |

### Node Status (3)

- `active`: Currently valid knowledge
- `needs_review`: Requires verification
- `superseded`: Replaced by newer knowledge

### Relation Types (7)

| Type | Meaning | Example |
|------|---------|---------|
| `affects` | Impacts another node | Decision → Component |
| `uses` | Depends on another node | Component → Component |
| `supersedes` | Replaces old knowledge | New Decision → Old Decision |
| `relates_to` | General relationship | Concept ↔ Concept |
| `implements` | Realizes a pattern | Component → Pattern |
| `depends_on` | Requires for operation | Component → Component |
| `derived_from` | Originates from | Pattern ← Concept |

### Node Schema

```go
type KnowledgeNode struct {
    ID          string       // UUID v4
    Type        NodeType     // One of 7 types
    Title       string       // < 100 chars
    Content     string       // Markdown
    Tags        []string     // Categorization
    Relations   []Relation   // Typed edges
    Confidence  float64      // 0.0-1.0
    Created     time.Time    // ISO 8601
    Modified    time.Time    // ISO 8601
    Session     string       // Session ID (optional)
    Source      string       // "manual" or "hook_*"
    References  []string     // File paths
    Status      NodeStatus   // active/needs_review/superseded
}
```

## MCP Tools (Go Implementation)

### `autology_capture`
**Purpose**: Create a knowledge node with automatic classification

**Input**:
```json
{
  "title": "string (required)",
  "content": "string (required, markdown format)",
  "type": "string (optional, one of: decision, component, convention, concept, pattern, issue, session)",
  "tags": ["string"] (optional, array of tags)
}
```

**Output**:
```json
{
  "id": "uuid-v4",
  "type": "classified-type",
  "confidence": 0.8
}
```

**Behavior**:
- If `type` is provided, uses it directly
- If `type` is omitted, automatically classifies based on title and content using heuristic patterns
- Validates all fields
- Generates UUID v4 ID
- Stores as markdown in `.autology/nodes/{type}s/{id}.md`
- Updates graph index
- Returns node ID and classification info

### `autology_query`
**Purpose**: Search knowledge nodes with filtering and ranking

**Input**:
```json
{
  "query": "string (optional, full-text search)",
  "type": "string (optional, filter by node type)",
  "tags": ["string"] (optional, filter by tags - all must match),
  "limit": 10 (optional, default: 10, maximum results)
}
```

**Output**: Array of matching nodes with scores
```json
[
  {
    "node": { /* KnowledgeNode object */ },
    "score": 0.85
  }
]
```

**Behavior**:
- Performs full-text search if `query` is provided
- Filters by type and tags if specified
- Ranks results by relevance score
- Returns up to `limit` results

### `autology_status`
**Purpose**: Get knowledge graph statistics

**Input**: None (empty object `{}`)

**Output**: Statistics summary
```json
{
  "totalNodes": 42,
  "nodesByType": {
    "decision": 10,
    "component": 8,
    "convention": 5,
    "concept": 12,
    "pattern": 4,
    "issue": 2,
    "session": 1
  },
  "totalRelations": 67,
  "relationsByType": {
    "affects": 15,
    "uses": 20,
    "supersedes": 3,
    "relates_to": 18,
    "implements": 6,
    "depends_on": 4,
    "derived_from": 1
  }
}
```

**Behavior**:
- Scans all nodes in storage
- Counts nodes by type and status
- Counts relations by type
- Returns comprehensive statistics

### `autology_update`
**Purpose**: Update an existing knowledge node

**Input**:
```json
{
  "id": "string (required, node ID)",
  "title": "string (optional, new title)",
  "content": "string (optional, new content in markdown)",
  "tags": ["string"] (optional, new tags),
  "status": "string (optional, one of: active, needs_review, superseded)",
  "confidence": 0.9 (optional, new confidence score 0.0-1.0)
}
```

**Output**: Success message with changed fields
```
"✓ Updated: [title] ([type])\nFields changed: [list]"
```

**Behavior**:
- Finds node by ID across all types
- Updates only provided fields (partial update)
- Preserves all other fields
- Updates `modified` timestamp
- Returns error if node not found or no fields to update

### `autology_delete`
**Purpose**: Delete a knowledge node and cleanup its relations

**Input**:
```json
{
  "id": "string (required, node ID to delete)"
}
```

**Output**: Success message with relation count
```
"✓ Deleted: [title] ([type])\nRelations removed: [count]"
```

**Behavior**:
- Finds and deletes node file
- Removes all relations where node is source or target
- Returns error if node not found
- Operation is irreversible

### `autology_relate`
**Purpose**: Create or update a relation between two nodes (upsert)

**Input**:
```json
{
  "source": "string (required, source node ID)",
  "target": "string (required, target node ID)",
  "type": "string (required, one of: affects, uses, supersedes, relates_to, implements, depends_on, derived_from)",
  "description": "string (optional, relation description)",
  "confidence": 0.8 (optional, default: 0.8, range: 0.0-1.0)
}
```

**Output**: Success message
```
"✓ Related: [source] —[[type]]→ [target]"
```

**Behavior**:
- Validates both source and target nodes exist
- Upserts relation (creates if new, updates if exists)
- Updates graph index
- Returns error if source or target not found

### `autology_unrelate`
**Purpose**: Delete a specific relation between two nodes

**Input**:
```json
{
  "source": "string (required, source node ID)",
  "target": "string (required, target node ID)",
  "type": "string (required, relation type to remove)"
}
```

**Output**: Success message
```
"✓ Removed relation: [source] —[[type]]→ [target]"
```

**Behavior**:
- Removes specified relation from graph index
- Does not fail if relation doesn't exist
- Nodes themselves remain unchanged

## Hybrid Triggering Strategy

Autology uses **two complementary triggering mechanisms** for knowledge capture and exploration:

### 1. Hook-Based Triggering (Deterministic)

**Location**: `hooks/hooks.json`

**Triggers**:

| Hook Event | Matcher | Action |
|------------|---------|--------|
| `PostToolUse` | `tool == "Bash" && tool_input.command matches "(git commit\|gh pr create\|gh pr merge)"` | Suggest capture after git commit/PR events |
| `PreCompact` | `*` (all events) | Suggest capture before context compaction |
| `SessionEnd` | No matcher | Show capture tips on session end |

**Implementation**: Go subcommands in `internal/hooks/`
- `autology hook post-commit`: Detects git events, notifies user, provides context to Claude
- `autology hook pre-compact`: Suggests capture before compaction
- `autology hook session-end`: Shows resume + capture workflow tips

**Reliability**: 100% (deterministic matching)

### 2. Agent-Based Triggering (Contextual)

Autology provides two specialized agents following the single responsibility principle:

#### `autology-explorer` (Read-Only)

**Model**: haiku (frequent triggering, structured MCP calls)

**Trigger Method**: Pattern matching on query content during conversation

**Description Keywords**: architecture, decisions, patterns, conventions, relationships, impact, gaps, evolution, timeline, quality

**Expected Triggers**:
1. **Architecture/Design**: "Why did we choose...", "What's our convention..."
2. **Implementation**: "What will this affect?", "What depends on..."
3. **Quality/Review**: "Does this follow our patterns?", "What conventions..."
4. **Knowledge Gaps**: "What's missing...", "Are there outdated..."
5. **Evolution**: "How did X evolve?", "What changed since..."

**Tools**: `autology_query`, `autology_status` (read-only)

**Limitations**: Cannot create, update, or delete nodes. Will suggest using `autology-capture-advisor` for write operations.

#### `autology-capture-advisor` (Create/Update/Delete)

**Model**: sonnet (long-context synthesis for extracting scattered decisions)

**Trigger Method**: Declarative statements expressing new knowledge

**Description Keywords**: chose, decided, built, created, implemented, the rule is, always, never, finished

**Expected Triggers**:
1. **Decisions**: "We chose Redis over Memcached"
2. **Components**: "I built a new AuthService"
3. **Conventions**: "All errors must include correlation IDs"
4. **Concepts**: "Order lifecycle: pending → confirmed → shipped"
5. **Patterns**: "We use the Repository pattern"
6. **Issues**: "N+1 queries causing performance issues"
7. **Sessions**: "Finished implementing authentication system"

**Tools**: All 7 MCP tools (query, status, capture, update, delete, relate, unrelate)

**Workflow**:
1. Extract and classify knowledge from conversation
2. Query for existing nodes (deduplication)
3. Suggest CREATE (new) or UPDATE (existing)
4. Get user approval before write operations
5. Suggest relations after creation

**Disambiguation**: Uses sentence form, user intent, temporal direction, and action verbs to distinguish from explorer queries.

**Why Three Mechanisms?**:
- **Hooks**: Deterministic, event-driven (git, compaction, session end)
- **Explorer**: Context-aware read analysis (questions, exploration)
- **Capture-Advisor**: Long-context knowledge extraction (declarative statements)

## Skills

### `/autology:tutorial`
**Purpose**: Interactive 5-step learning guide

**Steps**:
1. Understand ontology (nodes + relations)
2. Capture first node
3. Create relationships
4. Search and query
5. Learn automation (agents)

**Behavior**: Step-by-step with user confirmation

### `/autology:capture`
**Purpose**: Guided knowledge capture

**Behavior**:
1. Analyze user input
2. Classify node type
3. If decision: Guide through ADR format
4. Search for related nodes
5. Call `autology_capture`
6. Suggest relationships

### `/autology:explore`
**Purpose**: Natural language search

**Syntax**:
- `/autology:explore` → Show status
- `/autology:explore decisions` → Filter by type
- `/autology:explore tagged auth` → Filter by tag
- `/autology:explore "caching strategy"` → Full-text search

## Storage Format

### Markdown File Structure
```markdown
---
id: uuid-v4
type: decision
title: Node Title
tags:
  - tag1
  - tag2
confidence: 0.9
created: 2026-02-08T12:00:00Z
modified: 2026-02-08T12:00:00Z
session: session-id
source: manual
status: active
relations:
  - type: affects
    target: component-id
    description: Description
    confidence: 0.85
references:
  - path/to/file.ts
---

# Node Title

Content in markdown format...

## Related
- [[other-node-id]]
```

### Directory Structure
```
.autology/
├── nodes/
│   ├── decisions/
│   ├── components/
│   ├── conventions/
│   ├── concepts/
│   ├── patterns/
│   ├── issues/
│   └── sessions/
└── graph/
    └── index.json
```

### Graph Index Format
```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-08T12:00:00Z",
  "relations": [
    {
      "source": "node-id-1",
      "target": "node-id-2",
      "type": "affects",
      "description": "Optional",
      "confidence": 0.9
    }
  ]
}
```

## Validation Rules

1. **Node ID**: Must be UUID v4
2. **Title**: 1-100 characters
3. **Type**: Must be one of 7 types
4. **Status**: Must be one of 3 statuses
5. **Confidence**: 0.0-1.0
6. **Tags**: Lowercase, alphanumeric + hyphen only
7. **Relations**: Target must exist
8. **Timestamps**: ISO 8601 format
9. **References**: Valid file paths

## Behavioral Contracts

### Immutability
All operations return new objects. Never mutate existing data structures.

### Error Handling
- Invalid input → ValidationError with field details
- Node not found → NotFoundError with node ID
- File system error → StorageError with path and reason

### Confidence Scoring
- Manual capture: 0.9
- Hook with user confirmation: 0.85
- Automatic inference: 0.7
- Minimum accepted: 0.5

### ADR Format for Decisions
Must include 4 sections:
1. **Context**: Why this decision?
2. **Decision**: What was decided?
3. **Alternatives**: What else was considered?
4. **Consequences**: What are the implications?
