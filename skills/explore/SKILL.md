---
name: autology:explore
description: Explore and query the autology ontology
---

You are helping the user explore their autology knowledge base. Provide intuitive, conversational access to the ontology.

## Behavior Based on Input

### No Arguments: Show Status

When user calls `/autology:explore` with no arguments, call `autology_status` with `detail: "full"` to show:
- Total nodes and relations
- Breakdown by type
- Recent activity
- Nodes needing review
- Quick tips for using the ontology

Present the information in a friendly, readable format.

### With Arguments: Query the Ontology

Parse the user's input to determine what they're looking for:

#### 1. By Type

**Patterns to recognize:**
- "decisions" / "decision" → query type='decision'
- "components" / "component" → query type='component'
- "conventions" / "convention" → query type='convention'
- "concepts" / "concept" → query type='concept'
- "sessions" / "session" → query type='session'
- "patterns" / "pattern" → query type='pattern'
- "issues" / "issue" → query type='issue'

**Example**: `/autology:explore decisions`

```
Call: autology_query { "type": "decision", "limit": 20 }
```

#### 2. By Tag

**Patterns**: "tagged [tag]", "tag:[tag]", "#[tag]"

**Example**: `/autology:explore tagged auth`

```
Call: autology_query { "tags": ["auth"], "limit": 20 }
```

#### 3. By Search Query

**Patterns**: Any natural language text

**Example**: `/autology:explore authentication system`

```
Call: autology_query { "query": "authentication system", "limit": 20 }
```

#### 4. By Status

**Patterns**: "active", "needs review", "superseded"

**Example**: `/autology:explore needs review`

```
Call: autology_query { "status": "needs_review", "limit": 20 }
```

#### 5. By Confidence

**Patterns**: "high confidence", "low confidence", "confidence > X"

**Example**: `/autology:explore high confidence decisions`

```
Call: autology_query {
  "type": "decision",
  "minConfidence": 0.8,
  "limit": 20
}
```

#### 6. Related to a Node

**Patterns**: "related to [node-id]", "connections to [node-id]"

**Example**: `/autology:explore related to jwt-auth`

```
Call: autology_query { "relatedTo": "jwt-auth", "limit": 20 }
```

#### 7. Combined Queries

Parse multiple criteria:

**Example**: `/autology:explore auth decisions from last month`

```
Call: autology_query {
  "type": "decision",
  "query": "auth",
  "limit": 20
}
// Then filter by date in presentation
```

## Output Formatting

### Status View (No Args)

```markdown
# 📚 autology Ontology

**Total Knowledge Nodes**: [N]
**Total Relations**: [M]

## By Type
- 🎯 Decisions: [count]
- 🔧 Components: [count]
- 📋 Conventions: [count]
- 💡 Concepts: [count]
- 🎨 Patterns: [count]
- ⚠️  Issues: [count]
- 📅 Sessions: [count]

## Recent Activity
[List 5 most recently modified nodes]

## 🔍 Quick Actions
- `/autology:explore decisions` - View all decisions
- `/autology:explore tagged auth` - Find auth-related nodes
- `/autology:explore needs review` - See nodes needing attention

💡 **Tip**: Open `docs/` as an Obsidian vault to visualize the knowledge graph!
```

### Query Results

For query results, present in a scannable format:

```markdown
# Search Results: [query description]

Found [N] nodes:

---

## 1. [Node Title]
**Type**: [type] | **Confidence**: [X]% | **Status**: [status]
**Tags**: [tag1, tag2, ...]

[First 150 chars of content...]

🔗 **ID**: `[node-id]` | 📁 `docs/[type]s/[node-id].md`

---

## 2. [Next Node]
...

---

💡 **Next Steps**:
- Read full node: Open the .md file in your editor
- Find related: `/autology:explore related to [node-id]`
- Update node: Use `/autology:capture` with the same title to update
```

### Empty Results

If no nodes match:

```markdown
# 🔍 No Results Found

Your query "[query]" didn't match any nodes.

**Suggestions**:
- Try broader search terms
- Check spelling
- Use `/autology:explore` (no args) to see what's available
- View all nodes by type: `/autology:explore [type]`

**Current ontology**: [N] total nodes across [M] types
```

## Advanced Features

### 1. Suggest Related Searches

After showing results, suggest logical next queries:

```markdown
**Related Searches**:
- View all auth-related: `/autology:explore tagged auth`
- See recent decisions: `/autology:explore decisions`
- Find needs review: `/autology:explore needs review`
```

### 2. Show Node Details

For single-node queries (by ID), show full details:

```markdown
# 📄 [Node Title]

**Type**: [type]
**Created**: [date]
**Modified**: [date]
**Confidence**: [X]%
**Status**: [status]

**Tags**: [tag1, tag2, tag3]

**References**:
- [path/to/file1.ts]
- [path/to/file2.ts]

## Content

[Full node content in markdown]

## Relations

**Affects**:
- [[component-id]] - Component Name

**Uses**:
- [[pattern-id]] - Pattern Name

**Supersedes**:
- [[old-decision-id]] - Old Decision

---

📁 **File**: `docs/[type]s/[node-id].md`
✏️  **Update**: Use `/autology:capture "[title]"` to update this node
```

### 3. Statistics and Insights

For type queries, add insights:

```markdown
# 🎯 Decisions (15 nodes)

**Confidence Distribution**:
- High (≥0.8): 12 nodes
- Medium (0.5-0.8): 2 nodes
- Low (<0.5): 1 node ⚠️

**Status**:
- Active: 13
- Needs Review: 2 ⚠️
- Superseded: 0

**Most Connected**: [node with most relations]
**Most Recent**: [most recently modified]

[List of decision nodes...]
```

## Error Handling

Handle common issues gracefully:

1. **Ontology doesn't exist**:
   ```
   📭 No ontology found yet!

   Start capturing knowledge with `/autology:capture [content]`
   The `docs/` directory will be created automatically.
   ```

2. **Invalid node ID**:
   ```
   ❌ Node not found: [node-id]

   Use `/autology:explore` to see available nodes.
   ```

3. **Tool call failed**:
   ```
   ⚠️  Error querying ontology: [error message]

   Try simplifying your query or check if the autology directory is accessible.
   ```

## Examples

### Example 1: No Arguments

**User**: `/autology:explore`

**Action**: Call `autology_status { "detail": "full" }`

**Response**: Formatted status dashboard

### Example 2: By Type

**User**: `/autology:explore decisions`

**Action**: Call `autology_query { "type": "decision" }`

**Response**: List of all decision nodes with summary

### Example 3: Search Query

**User**: `/autology:explore authentication`

**Action**: Call `autology_query { "query": "authentication" }`

**Response**: Ranked search results

### Example 4: Complex Query

**User**: `/autology:explore high confidence auth decisions`

**Action**:
1. Parse: type=decision, query=auth, minConfidence=0.8
2. Call `autology_query { "type": "decision", "query": "auth", "minConfidence": 0.8 }`

**Response**: Filtered results with insights

## Key Principles

1. **Natural language friendly**: Parse user intent, not exact syntax
2. **Helpful defaults**: Reasonable limits, sorted by relevance
3. **Rich context**: Always provide next steps and tips
4. **Visual hierarchy**: Use emoji and formatting for scannability
5. **File paths**: Always show where nodes are stored
6. **Update hints**: Remind users how to update existing nodes
