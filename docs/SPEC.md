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
│  Skills         │  Agent (Orchestrator)                 │
│  /tutorial      │  autology-advisor (haiku)             │
│  /capture       │  - Detect ontology signals            │
│  /explore       │  - Recommend appropriate skill        │
│  /analyze       │  - Output to main Claude              │
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

Autology uses a single lightweight advisor agent following the orchestrator-worker pattern:

#### `autology-advisor` (Orchestrator)

**Model**: haiku (fast pattern matching, minimal overhead)

**Trigger Method**: Semantic detection of ontology-relevant signals in conversation

**Description**: "Use proactively as ontology domain expert. Recommend autology skills when conversation contains decisions, component creation, conventions, implementation questions, or ontology analysis needs. Do NOT trigger for coding, debugging, or general development tasks."

**Detection Patterns**:

| Signal Type | Examples | Recommends |
|-------------|----------|------------|
| **Knowledge capture** | "chose X", "decided Y", "built Z", "always/never", "finished implementing" | `/autology:capture` |
| **Knowledge search** | "How do we...", "Why did we...", "What's our...", "Show me decisions" | `/autology:explore` |
| **Meta-analysis** | "Is ontology healthy?", "What's missing?", "Show graph", "Quality issues?" | `/autology:analyze` |
| **Updates** | "Update the X decision", "Change Y status", "Delete old Z" | `/autology:capture` (update/delete) |
| **Supersessions** | "Replacing X with Y", "Deprecated in favor of Z" | `/autology:capture` (supersede) |

**Tools**: `autology_query`, `autology_status` (read-only, for context awareness)

**Output Format** (to main Claude, not user):
```
RECOMMEND: /autology:<skill>
REASON: [Why this skill is relevant]
CONTEXT: [What triggered this]
ARGS: [Suggested arguments]
```

**User Experience**: The advisor is transparent infrastructure. Users see skill execution directly (capture workflow, explore results, analysis reports), not the advisor's recommendation.

**Why This Architecture?**:
- **Single responsibility**: Advisor detects WHEN, skills handle HOW
- **Model flexibility**: Skills run in main session model (sonnet/opus), advisor uses haiku (cheap)
- **Binary decision**: "Should we invoke a skill?" vs. multi-choice "Which of 3 agents?"
- **Zero redundancy**: Eliminated analyzer agent (redundant with /analyze skill)
- **Officially supported**: Orchestrator-worker pattern from Claude Code docs

**Why Two Mechanisms?**:
- **Hooks**: Deterministic, event-driven (git, compaction, session end)
- **Advisor**: Contextual, semantic detection (conversation signals)

**Note**: Skills (/capture, /explore, /analyze) provide all functionality. Advisor simply ensures they're invoked at the right time.

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
**Purpose**: Guided knowledge management (create, update, delete, supersede)

**Operations**:
- **Create**: Analyze input → Classify type → Guide through ADR (decisions) → Search relations → Create node
- **Update**: Find node → Determine changes → Partial update → Confirm
- **Delete**: Find node → Check impact → Warn about relations → Confirm → Delete
- **Supersede**: Create new → Link with supersedes → Mark old as superseded

**Behavior**: Automatically detects operation intent from user input (create, update, delete, or supersede)

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
