# Autology System Specification

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
├─────────────────────────────────────────────────────────┤
│  Hooks          │  Skills        │  Agents              │
│  - SessionStart │  /tutorial     │  autology-explorer   │
│  - PostToolUse  │  /capture      │                      │
│  - SessionEnd   │  /explore      │                      │
├─────────────────────────────────────────────────────────┤
│                    MCP Server                           │
│  6 Tools: capture, query, relate, context, status, delete │
├─────────────────────────────────────────────────────────┤
│                 Storage Layer                           │
│  • NodeStore (CRUD)                                     │
│  • GraphIndex (relationships)                           │
│  • SearchEngine (query)                                 │
│  • MarkdownSerializer (Obsidian-compatible)             │
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

```typescript
{
  id: string                    // UUID v4
  type: NodeType                // One of 7 types
  title: string                 // < 100 chars
  content: string               // Markdown
  tags: string[]                // Categorization
  relations: Relation[]         // Typed edges
  confidence: number            // 0.0-1.0
  created: string               // ISO 8601
  modified: string              // ISO 8601
  session?: string              // Session ID
  source: 'manual' | 'hook_*'   // Origin
  references: string[]          // File paths
  status: NodeStatus            // active/needs_review/superseded
}
```

## MCP Tools

### `autology_capture`
**Purpose**: Create a knowledge node

**Input**:
```typescript
{
  title: string
  content: string
  type: NodeType
  tags?: string[]
  confidence?: number           // default: 0.8
  references?: string[]
  relatedTo?: string[]          // Node IDs for relates_to edges
}
```

**Output**: Node ID

**Behavior**:
- Validates all fields
- Generates UUID v4 ID
- Stores as markdown in `.autology/nodes/{type}s/{id}.md`
- Updates graph index
- Returns node ID

### `autology_query`
**Purpose**: Search nodes

**Input**:
```typescript
{
  type?: NodeType
  tags?: string[]
  status?: NodeStatus
  minConfidence?: number
  relatedTo?: string            // Node ID
  query?: string                // Full-text search
}
```

**Output**: Array of matching nodes

### `autology_relate`
**Purpose**: Connect two nodes

**Input**:
```typescript
{
  source: string                // Node ID
  target: string                // Node ID
  type: RelationType
  description?: string
  bidirectional?: boolean       // default: false
}
```

**Output**: Success confirmation

### `autology_context`
**Purpose**: Get context-aware recommendations

**Input**:
```typescript
{
  currentTask: string
  recentFiles?: string[]
  maxResults?: number           // default: 10
}
```

**Output**: Ranked array of relevant nodes

### `autology_status`
**Purpose**: Get ontology statistics

**Input**:
```typescript
{
  detail?: 'summary' | 'full'   // default: 'summary'
}
```

**Output**: Node counts, relation counts, statistics by type/status

### `autology_delete`
**Purpose**: Remove a node

**Input**:
```typescript
{
  nodeId: string
}
```

**Output**: Success confirmation

**Behavior**: Deletes markdown file and removes from graph index

## Hooks

### SessionStart
**Trigger**: Claude Code session begins

**Behavior**:
1. Load recent active nodes (last 30 days)
2. Analyze for relevance to project
3. Inject top 10 nodes as context
4. Format: "Previous knowledge: [node titles with brief summaries]"

### PostToolUse(Write/Edit)
**Trigger**: File created or modified

**Behavior**:
1. Debounce 2 seconds (avoid spam)
2. Check staleness (>1 hour since last similar suggestion)
3. Analyze change significance (>10 lines or key files)
4. Suggest: "Capture [inferred type] node?"
5. If approved, guide through capture

### PostToolUse(Bash - git commit)
**Trigger**: `git commit` command executed

**Behavior**:
1. Parse commit message
2. Suggest: "Save commit as session node?"
3. If approved, create session node with commit details

### Stop
**Trigger**: Claude Code session ends

**Behavior**:
1. Summarize session activities
2. Suggest: "Capture session summary?"
3. If approved, create session node with:
   - Files modified
   - Decisions made
   - Issues encountered

## Skills

### `/autology:tutorial`
**Purpose**: Interactive 5-step learning guide

**Steps**:
1. Understand ontology (nodes + relations)
2. Capture first node
3. Create relationships
4. Search and query
5. Learn automation (hooks)

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
