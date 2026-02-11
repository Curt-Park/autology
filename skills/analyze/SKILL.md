---
name: autology:analyze
description: Comprehensive ontology analysis with detailed reports and actionable insights
---

This skill provides deep analysis of your knowledge ontology with structured reports following the What/Why/Impact/Action framework.

## Commands

- `/autology:analyze` → Interactive analysis menu
- `/autology:analyze health` → Overall health assessment
- `/autology:analyze gaps` → Knowledge gap detection
- `/autology:analyze graph` → Relation structure analysis
- `/autology:analyze evolution` → Timeline and growth patterns
- `/autology:analyze quality` → Content quality assessment
- `/autology:analyze tags` → Tag taxonomy analysis
- `/autology:analyze impact <node-id>` → Impact analysis for specific node

## Analysis Types

### 1. Health Analysis

**Purpose**: Comprehensive ontology health check across multiple dimensions

**Process**:
1. Get overall statistics: `autology_status { "detail": "full" }`
2. Query all nodes: `autology_query {}`
3. Analyze each dimension:
   - **Coverage**: Node type distribution, critical area documentation
   - **Consistency**: Naming patterns, tag conventions, metadata completeness
   - **Freshness**: Recent activity, stale nodes (>90 days unchanged)
   - **Connectivity**: Relation density, orphaned nodes, hub patterns
4. Score each dimension (0-100)
5. Generate prioritized recommendations

**Output Format**:
```markdown
# Ontology Health Report

## Overall Score: [X]/100

### Coverage: [X]/100
**Finding**: [Quantified observation]
**Why**: [Root cause]
**Impact**: [Consequences]
**Action**: [Prioritized steps]

### Consistency: [X]/100
...

## Priority Actions
1. [Highest impact action]
2. [Next priority]
...
```

---

### 2. Gap Detection

**Purpose**: Identify missing or incomplete knowledge

**Process**:
1. Query all nodes by type
2. Analyze each type for completeness:
   - **Decisions**: Have alternatives and consequences?
   - **Components**: Documented purpose and usage?
   - **Conventions**: Include rationale and examples?
   - **Patterns**: Show problem/solution/tradeoffs?
3. Check for orphaned nodes (no relations)
4. Identify missing links (components without decisions, patterns without implementations)
5. Suggest specific nodes to create

**Output Format**:
```markdown
# Knowledge Gap Analysis

## Structural Gaps

**Finding**: [X] orphaned nodes with no relations
**Why**: [Root cause of isolation]
**Impact**: [Knowledge not integrated]
**Action**:
  1. Review each orphaned node
  2. Identify related concepts
  3. Create appropriate relations
**Evidence**: [node-id-1], [node-id-2], ...

## Content Gaps

**Finding**: [X] decisions missing consequence analysis
**Why**: [Why they're incomplete]
**Impact**: [Reduced decision quality]
**Action**:
  1. Prioritize recent decisions
  2. Add consequence sections
  3. Link to affected components
**Evidence**: [node-ids]

## Suggested Nodes

Based on analysis, consider creating:
- **[Type]**: "[Title]" — [Rationale]
- **[Type]**: "[Title]" — [Rationale]
```

---

### 3. Relation Graph Analysis

**Purpose**: Understand knowledge connectivity patterns

**Process**:
1. Get all nodes and relations
2. Build adjacency matrix
3. Calculate graph metrics:
   - **Degree centrality**: Most connected nodes
   - **Clustering**: Related node groups
   - **Path length**: Knowledge accessibility
   - **Bridges**: Critical connecting nodes
4. Identify patterns:
   - Hub nodes (high degree)
   - Isolated clusters
   - Missing links
   - Supersession chains

**Output Format**:
```markdown
# Relation Graph Analysis

## Graph Statistics
- Total nodes: [N]
- Total relations: [M]
- Average degree: [X.XX]
- Density: [X.XX]%
- Connected components: [N]

## Hub Nodes (Top 5)

**Node**: [title] ([node-id])
**Degree**: [in]/[out] relations
**Why hub**: [Explanation of centrality]
**Impact**: [What depends on this]
**Action**: Ensure this node is well-maintained and up-to-date

## Isolated Clusters

**Finding**: [N] nodes form isolated cluster
**Why**: [Reason for isolation]
**Impact**: [Knowledge siloing effect]
**Action**: Create bridge relations to main graph
**Evidence**: [node-ids in cluster]

## Recommended Relations

Based on content similarity and logical flow:
- [source-id] —[type]→ [target-id]: [Rationale]
- [source-id] —[type]→ [target-id]: [Rationale]
```

---

### 4. Evolution Timeline

**Purpose**: Track knowledge growth and focus shifts over time

**Process**:
1. Extract creation timestamps from all nodes
2. Group by time period (daily/weekly/monthly based on span)
3. Analyze patterns:
   - Growth rate by node type
   - Focus area shifts (tag frequency over time)
   - Decision supersession patterns
   - Activity spikes and lulls
4. Correlate with external events (commits, releases)

**Output Format**:
```markdown
# Knowledge Evolution Timeline

## Growth Overview
- Total nodes: [N] (created over [X] days)
- Average: [X.X] nodes/week
- Peak activity: [date] ([N] nodes)

## Growth by Type

[Time-based visualization showing node creation by type]

**Finding**: Decision nodes increased 3x in January
**Why**: New architecture planning phase
**Impact**: Strong foundation for implementation
**Action**: Now focus on component and convention documentation

## Focus Shifts

**Finding**: Tag "authentication" appeared in [N] nodes starting [date]
**Why**: Authentication feature implementation
**Impact**: Good clustering of related knowledge
**Action**: Capture session summary for this work stream

## Supersession Chains

**Chain**: [old-id] → [new-id] → [current-id]
**Finding**: Decision evolved through 3 iterations
**Why**: Requirements clarified through implementation
**Impact**: Shows healthy decision refinement
**Action**: None - good practice
```

---

### 5. Quality Assessment

**Purpose**: Evaluate content completeness and structure

**Process**:
1. Query all nodes
2. Check each node for:
   - **Content depth**: Word count, section structure
   - **ADR compliance** (decisions): Context/Decision/Alternatives/Consequences
   - **Metadata completeness**: Tags, confidence, references
   - **Link quality**: Relations with descriptions
3. Score quality (0-100) per node
4. Identify improvement priorities

**Output Format**:
```markdown
# Content Quality Assessment

## Quality Distribution
- High quality (80-100): [N] nodes ([X]%)
- Medium quality (50-79): [N] nodes ([X]%)
- Low quality (0-49): [N] nodes ([X]%)

## Decision ADR Compliance

**Finding**: [X]/[N] decisions missing alternatives section
**Why**: Captured quickly during implementation, not reviewed
**Impact**: Harder to understand tradeoffs retrospectively
**Action**:
  1. Review high-impact decisions first
  2. Add alternatives based on commit history
  3. Document rejected options
**Evidence**: [node-ids]

## Content Depth Issues

**Finding**: [N] nodes under 50 words
**Why**: Placeholder captures or incomplete documentation
**Impact**: Insufficient context for future reference
**Action**: Expand thin nodes or delete if obsolete
**Evidence**: [node-ids]

## Priority Improvements
1. [node-id]: [Issue] — [Impact]
2. [node-id]: [Issue] — [Impact]
```

---

### 6. Tag Taxonomy Analysis

**Purpose**: Ensure consistent tagging and discover patterns

**Process**:
1. Extract all tags from nodes
2. Analyze patterns:
   - **Frequency distribution**: Most/least used tags
   - **Co-occurrence**: Tags that appear together
   - **Naming conventions**: Singular vs plural, casing
   - **Hierarchy**: Implicit parent-child relationships
3. Suggest standardization

**Output Format**:
```markdown
# Tag Taxonomy Analysis

## Tag Statistics
- Unique tags: [N]
- Average tags per node: [X.X]
- Most common: [tag] ([N] nodes)

## Consistency Issues

**Finding**: Both "auth" and "authentication" tags used
**Why**: No established tagging convention
**Impact**: Splits related nodes, harder to search
**Action**: Standardize on "authentication", update [N] nodes
**Evidence**: [node-ids with "auth"]

## Co-occurrence Patterns

**Pattern**: "api" + "rest" appear together in [N] nodes
**Why**: API implementation work
**Impact**: Good clustering
**Action**: None - natural grouping

**Pattern**: "decision" tag on convention nodes
**Why**: Misclassification (should be node type, not tag)
**Impact**: Tag confusion
**Action**: Remove redundant type tags

## Suggested Taxonomy

Based on analysis:
- **Technology**: typescript, postgres, redis, ...
- **Domain**: authentication, api, storage, ...
- **Quality**: tech-debt, needs-review, ...
- **Process**: architecture, testing, deployment, ...
```

---

### 7. Impact Analysis

**Purpose**: Understand dependencies and change scope for a specific node

**Process**:
1. Query the target node
2. Get all relations (incoming and outgoing)
3. Trace dependencies:
   - **Direct impacts**: Nodes directly related
   - **Transitive impacts**: Nodes affected through chains
   - **Supersession cascades**: If node is superseded, what's affected?
4. Quantify change scope
5. Identify breaking change risks

**Output Format**:
```markdown
# Impact Analysis: [node-title]

## Node Details
- **Type**: [type]
- **Status**: [status]
- **Created**: [date]
- **Confidence**: [X]%

## Direct Impacts

### Affects ([N] nodes)
- [target-id]: [title] — [relation description]
- [target-id]: [title] — [relation description]

### Used by ([N] nodes)
- [source-id]: [title] — [relation description]

## Transitive Impacts

**Finding**: Changes cascade to [N] total nodes
**Why**: This is a foundational decision/component
**Impact**: High-risk change, requires careful planning
**Action**:
  1. Review all affected nodes
  2. Plan migration strategy
  3. Update nodes incrementally
  4. Create superseding node if replacing

## Breaking Change Risk

**Risk Level**: [HIGH/MEDIUM/LOW]
**Rationale**: [Why this risk level]
**Mitigation**: [Specific steps to reduce risk]
```

---

## Best Practices

1. **Always quantify findings**: Use numbers, percentages, dates
2. **Explain root causes**: Don't just state symptoms
3. **Show real impact**: Connect to project outcomes
4. **Provide concrete actions**: Specific, prioritized steps
5. **Include evidence**: Node IDs for verification

## Output Standards

Every analysis MUST follow the What/Why/Impact/Action structure:
- **What** (Finding): Quantified observation
- **Why**: Root cause explanation
- **Impact**: Project consequences
- **Action**: Prioritized concrete steps
- **Evidence**: Node IDs (when applicable)

## Tool Usage

All analysis types use these two tools:
- `autology_query`: Search and filter nodes
- `autology_status`: Get overall statistics

See `examples.md` for full report templates and detailed examples.
