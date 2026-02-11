---
name: autology:analyze
description: Holistic ontology health check with prioritized recommendations
---

This skill provides a comprehensive health assessment of your knowledge ontology with structured reports following the What/Why/Impact/Action framework.

## Usage

`/autology:analyze` — Run comprehensive ontology health check

## Process

1. **Gather Statistics**: `autology_status { "detail": "full" }` — Overall ontology metrics
2. **Query All Nodes**: `autology_query {}` — Retrieve complete node graph
3. **Analyze 7 Health Dimensions**:
   - **Empty/thin nodes**: Content < 50 words
   - **Broken wikilinks**: `[[target]]` where target doesn't exist
   - **Orphan nodes**: Zero relations
   - **Knowledge gaps**: Type distribution imbalances
   - **Stale nodes**: `needs_review` status or >90 days unchanged
   - **Tag consistency**: Duplicate/inconsistent tags
   - **ADR compliance**: Decision nodes missing Context/Decision/Alternatives/Consequences
4. **Score Each Dimension**: 0-100 scale
5. **Calculate Overall Health**: Weighted average of dimension scores
6. **Generate Prioritized Actions**: Ranked by impact and effort

## Output Format

```markdown
# Ontology Health Report

## Overall Score: [X]/100

## Health Dimensions

### 1. Content Completeness: [X]/100

**Finding**: [Quantified observation with specific numbers]
**Why**: [Root cause analysis]
**Impact**: [Consequences on knowledge usability]
**Action**:
  1. [Specific actionable step]
  2. [Next step]
  ...
**Evidence**: [Specific node IDs or patterns]

### 2. Link Integrity: [X]/100

[Same structure...]

### 3. Connectivity: [X]/100

[Same structure...]

### 4. Knowledge Coverage: [X]/100

[Same structure...]

### 5. Freshness: [X]/100

[Same structure...]

### 6. Tag Taxonomy: [X]/100

[Same structure...]

### 7. ADR Compliance: [X]/100

[Same structure...]

## Priority Actions (Ranked by Impact)

1. **[HIGH]** [Action with highest impact-to-effort ratio]
2. **[HIGH]** [Next priority]
3. **[MEDIUM]** [Medium priority actions]
4. **[LOW]** [Nice-to-have improvements]

## Summary

[1-2 sentence overall health assessment]
[Key recommendation for immediate action]
```

## Analysis Guidelines

### Scoring Rubric

Each dimension scored 0-100:

- **90-100**: Excellent health, minor optimizations possible
- **70-89**: Good health, some improvements recommended
- **50-69**: Moderate issues, action recommended
- **30-49**: Significant issues, action required
- **0-29**: Critical issues, immediate action required

### Dimension Details

#### 1. Content Completeness

- Count nodes with content < 50 words (excluding MOCs)
- Check for frontmatter-only stubs
- Verify critical nodes (MOCs, key decisions) have substantial content

#### 2. Link Integrity

- Extract all wikilink patterns: `\[\[([^\]]+)\]\]`
- Verify each target exists in ontology
- Report broken links with source context

#### 3. Connectivity

- Calculate average relations per node
- Identify orphans (0 relations)
- Find potential hubs (>5 relations)
- Assess overall graph density

#### 4. Knowledge Coverage

- Count nodes by type (decision, component, convention, concept, pattern, issue, session)
- Check for imbalances (e.g., 50 sessions but 2 decisions)
- Suggest missing node types based on project patterns

#### 5. Freshness

- Count nodes with `status: needs_review`
- Calculate days since last modification
- Flag nodes >90 days old in active areas

#### 6. Tag Taxonomy

- Collect all unique tags
- Identify near-duplicates (e.g., "api" vs "apis")
- Check for inconsistent naming (camelCase, kebab-case, spaces)
- Suggest tag normalization

#### 7. ADR Compliance

- For each `type: decision` node, verify sections exist:
  - `## Context`
  - `## Decision`
  - `## Alternatives` (or `## Alternatives Considered`)
  - `## Consequences`
- Report incomplete ADRs with missing sections

## Example

**User**: `/autology:analyze`

**Output**:

```markdown
# Ontology Health Report

## Overall Score: 68/100

## Health Dimensions

### 1. Content Completeness: 45/100

**Finding**: 12 of 21 nodes (57%) have < 50 words of content
**Why**: Migration script failed to extract content from original SPEC.md/GUIDE.md sections
**Impact**: Nodes are effectively empty stubs, providing no value to knowledge retrieval
**Action**:
  1. Delete 12 empty stub nodes (they can be recreated organically via /capture)
  2. Focus on creating content-rich nodes going forward
  3. Use /capture to rebuild missing concepts as needed
**Evidence**: data-model.md (3 lines), mcp-tools-spec.md (3 lines), storage-format.md (3 lines), ...

### 2. Link Integrity: 35/100

**Finding**: 24 broken wikilinks across 3 MOC nodes
**Why**: MOCs reference nodes that were deleted as empty stubs
**Impact**: Navigation broken, wikilink graph incomplete
**Action**:
  1. Update spec-moc.md to remove references to deleted nodes
  2. Update guide-moc.md to remove references to deleted nodes
  3. Update internals-moc.md to remove references to deleted nodes
**Evidence**: [[data-model]], [[mcp-tools-spec]], [[skills-usage]], ...

### 3. Connectivity: 85/100

**Finding**: 5 active nodes, avg 1.2 relations per node, 0 orphans
**Why**: Small ontology with tight coupling
**Impact**: Good connectivity for current size
**Action**: No action needed, connectivity is healthy

### 4. Knowledge Coverage: 60/100

**Finding**: Type distribution: 3 concepts, 1 decision, 0 components, 0 conventions, 0 patterns
**Why**: Early stage ontology, focus on high-level concepts
**Impact**: Missing tactical knowledge (conventions, patterns, components)
**Action**:
  1. Capture coding conventions as you discover them
  2. Document component architecture decisions
  3. Record recurring patterns

### 5. Freshness: 100/100

**Finding**: All nodes created/modified within last 24 hours, 0 needs_review status
**Why**: Fresh migration
**Impact**: All content is current
**Action**: No action needed

### 6. Tag Taxonomy: 90/100

**Finding**: 8 unique tags, all lowercase, consistent naming
**Why**: Good tag hygiene from the start
**Impact**: Clean taxonomy, easy filtering
**Action**: Maintain lowercase convention going forward

### 7. ADR Compliance: 100/100

**Finding**: 1 decision node (hybrid-triggering.md) with all required sections
**Why**: Proper ADR template followed
**Impact**: Decision rationale is well-documented
**Action**: Continue using ADR template for new decisions

## Priority Actions (Ranked by Impact)

1. **[HIGH]** Delete 12 empty stub nodes — they provide no value and clutter the ontology
2. **[HIGH]** Update 3 MOC nodes to remove broken wikilinks
3. **[MEDIUM]** Capture missing conventions and patterns as they emerge
4. **[LOW]** Monitor tag consistency as ontology grows

## Summary

Ontology health is moderate (68/100) with two critical issues: empty stub nodes and broken wikilinks.
**Immediate action**: Clean up stubs and fix MOC references to restore link integrity.
```
