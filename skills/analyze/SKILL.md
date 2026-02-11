---
name: autology:analyze
description: Doc-code cross-reference verification to find synchronization issues
---

This skill verifies that documentation nodes accurately describe the actual codebase, following the core principle in CLAUDE.md: **Documentation and code must always be synchronized.**

## Usage

`/autology:analyze` — Run doc-code verification analysis

## Process

1. **Query All Nodes**: `autology_query { limit: 100 }` — Retrieve complete ontology (IDs, titles, types, tags, content, wikilinks)
2. **Survey Repository**: Use Glob + Read to inventory actual codebase components:
   - `agents/*.md` — Agent count and names
   - `skills/*/SKILL.md` — Skill count and names
   - `hooks/hooks.json` — Hook types configured
   - `internal/mcp/server.go` — MCP tool registrations
   - `.claude-plugin/plugin.json` — Declared plugin components
   - `internal/*/` — Go package structure
3. **Knowledge Gaps**: Cross-reference ontology vs codebase to find:
   - **Code → No Doc**: Significant components exist but no node documents them
   - **Doc → No Code**: Nodes describe things that don't exist (deleted features, removed files)
   - **Doc ≠ Code**: Nodes exist and code exists but they disagree (wrong paths, incorrect counts, outdated architecture)
4. **Broken Wikilinks**: Extract all `[[target]]` patterns, verify each target exists in ontology
5. **Missing Wikilinks**: Find node pairs that should reference each other:
   - **Shared tags**: 2+ tags in common, no wikilink between them
   - **Title mention**: Node A's content mentions node B's title but has no `[[B]]` link
   - **MOC completeness**: MOC nodes should link to all nodes sharing their domain tag

## Output Format

No scores. No statistics. No priority rankings. Each finding is a concrete fact with a specific fix.

```markdown
# Ontology Analysis Report

## 1. Knowledge Gaps

### Code → No Doc
[Components that exist in code but have no covering documentation]

#### [Component Name]
**What**: brief description
**Where**: `path/to/code`
**Suggested action**: `/autology:capture` as [type] with tags [...]

### Doc → No Code
[Nodes that describe things no longer in the codebase]

#### [Node Title] (`node-id`)
**Claim**: what the node says exists
**Reality**: doesn't exist / was removed
**Fix**: update or delete the node

### Doc ≠ Code
[Nodes whose content contradicts the actual implementation]

#### [Node Title] (`node-id`)
**Claim**: what the node says
**Reality**: what the code actually shows
**Fix**: specific correction

## 2. Broken Wikilinks
| Source Node | Broken Link | Context |
|-------------|-------------|---------|
| `node-id` | `[[target]]` | where it appears |

## 3. Missing Wikilinks
| Node A | Node B | Reason |
|--------|--------|--------|
| `id-a` | `id-b` | shared tags / title mention / MOC gap |

## Summary
- Knowledge gaps: N (code→no doc: X, doc→no code: Y, doc≠code: Z)
- Broken wikilinks: N
- Missing wikilinks: N
```

## Analysis Guidelines

### Knowledge Gaps Detection

#### Code → No Doc

Survey these codebase areas for undocumented components:

1. **Agents**: `agents/*.md` — Count files, check if each has a corresponding node
2. **Skills**: `skills/*/SKILL.md` — Count skills, verify each is documented
3. **Hooks**: `hooks/hooks.json` — Parse hook types, check if hook system is documented
4. **MCP Tools**: `internal/mcp/server.go` — Count `s.tools[...]` registrations, verify tool inventory node exists
5. **Go Packages**: `internal/*/` — Major packages (mcp, hooks, storage) should have architecture nodes
6. **Plugin Metadata**: `.claude-plugin/plugin.json` — Verify declared components match documentation

**Heuristic**: If a component is significant enough to warrant its own file/directory, it should have a documentation node.

#### Doc → No Code

For each node, extract factual claims and verify against codebase:

- **File path claims**: "Located at `path/to/file.go`" → verify file exists
- **Count claims**: "3 agents", "7 MCP tools", "4 skills" → verify counts match reality
- **Feature claims**: "Supports X", "Implements Y" → verify feature exists in code
- **Architecture claims**: "Package Z handles..." → verify package exists and has that role

**Heuristic**: If a node makes a specific, verifiable claim about the codebase, verify it's still true.

#### Doc ≠ Code

Compare documentation to implementation:

- **Stale paths**: Node says `old/path.go`, code moved to `new/path.go`
- **Stale counts**: Node says "3 agents", codebase has 1 agent
- **Stale architecture**: Node describes old hook system, implementation changed to new approach
- **Incomplete coverage**: Node lists 3 of 4 actual components (missing one)

**Heuristic**: When node and code both exist for the same concept, they should agree on facts.

### Broken Wikilinks Detection

1. Extract all wikilink patterns from node content: `\[\[([^\]]+)\]\]`
2. For each extracted target, check if a node with that ID exists in ontology
3. Report broken links with:
   - Source node ID
   - Broken target
   - Context snippet (20 chars before/after the wikilink)

### Missing Wikilinks Detection

#### Shared Tags Heuristic

- For each node pair (A, B): count common tags
- If ≥2 tags in common AND no wikilink A→B or B→A: suggest link
- Skip if nodes are unrelated (e.g., both have "spec" but describe different domains)

#### Title Mention Heuristic

- For each node A: search content for other nodes' titles (case-insensitive)
- If node B's title appears in A's content AND no `[[B]]` link: suggest link
- Skip short titles (<4 chars) to avoid false positives

#### MOC Completeness Heuristic

- For nodes with type "concept" and tags suggesting MOC status (e.g., "moc", "index")
- Find all nodes sharing the MOC's domain tag (e.g., "spec", "guide", "internals")
- If MOC doesn't link to a domain node: suggest adding wikilink

## Example

**User**: `/autology:analyze`

**Output**:

```markdown
# Ontology Analysis Report

## 1. Knowledge Gaps

### Code → No Doc

#### Go Test Files
**What**: Test suite in `internal/hooks/hooks_test.go` (128 lines)
**Where**: `internal/hooks/hooks_test.go`
**Suggested action**: `/autology:capture` as component with tags [internals, testing]

### Doc → No Code

#### Explorer Agent (`autology-explorer`)
**Claim**: Node describes agent at `agents/autology-explorer.md`
**Reality**: File deleted in Phase 3 consolidation (now `autology-advisor`)
**Fix**: Delete node or update to describe new advisor agent

### Doc ≠ Code

#### Internals MOC (`internals-moc`)
**Claim**: References `[[hooks-impl]]` which describes old hook system
**Reality**: Hook implementation moved from `internal/hooks/hooks.go` to `internal/hooks/{post_tool_use,pre_compact,session_end}.go`
**Fix**: Update MOC to reflect new file structure

## 2. Broken Wikilinks

| Source Node | Broken Link | Context |
|-------------|-------------|---------|
| `spec-moc` | `[[skills-spec]]` | "See also [[skills-spec]] for..." |
| `guide-moc` | `[[tutorial-walkthrough]]` | "Complete [[tutorial-walkthrough]]..." |

## 3. Missing Wikilinks

| Node A | Node B | Reason |
|--------|--------|--------|
| `hybrid-triggering` | `hooks-config` | shared tags: triggering, hooks |
| `autology-philosophy` | `autology-advisor` | title mention: "advisor" in philosophy |
| `guide-moc` | `capture-skill` | MOC gap: both have "guide" tag |

## Summary
- Knowledge gaps: 3 (code→no doc: 1, doc→no code: 1, doc≠code: 1)
- Broken wikilinks: 2
- Missing wikilinks: 3
```

## Important Notes

- **No scoring**: This skill reports concrete discrepancies, not abstract health scores
- **Verifiable claims**: Every finding must be verified against actual code/ontology state
- **Actionable fixes**: Each finding includes specific remediation action
- **Doc-code focus**: The core question is "Does documentation accurately describe the codebase?"
- **Manual verification**: When uncertain about a claim, read the actual files to confirm

## When to Use

- After major refactoring (verify docs still match code)
- Before releases (ensure documentation is current)
- During cleanup (identify stale nodes to delete)
- When onboarding (verify documentation quality)
- Periodically (monthly health check)
