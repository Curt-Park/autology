---
name: autology:analyze
description: Verify docs/ and codebase are synchronized, find gaps and broken links
---

This skill verifies that documentation nodes accurately describe the actual codebase. Core principle: **Documentation and code must always be synchronized.**

## Usage

`/autology:analyze` — Run doc-code synchronization analysis

## Process

### 1. Read All Nodes

```
Glob: docs/*.md
Read: each file (frontmatter + content)
```

Extract: id, title, type, tags, status, content, wikilinks (`[[target]]` patterns)

### 2. Survey Codebase

```
Glob: agents/*.md
Glob: skills/*/SKILL.md
Read: hooks/hooks.json
Glob: internal/*/ (if exists)
Read: package.json
```

### 3. Find Knowledge Gaps

**Code → No Doc**: Significant components exist but no node documents them

**Doc → No Code**: Nodes describe things that no longer exist
- Check file path claims: does the referenced file still exist?
- Check feature claims: does the described feature still exist?

**Doc ≠ Code**: Nodes exist and code exists but they disagree
- Wrong paths, incorrect counts, outdated architecture

### 4. Check Wikilinks

Extract all `[[target]]` patterns from node content.
For each target, check if `docs/{target}.md` exists.
Report broken wikilinks.

### 5. Find Missing Wikilinks

- Nodes with 2+ shared tags but no wikilink between them → suggest link
- Node A's content mentions node B's title but no `[[B]]` link → suggest link

## Output Format

```markdown
# Ontology Analysis Report

## 1. Knowledge Gaps

### Code → No Doc
#### [Component Name]
**What**: description
**Where**: path/to/code
**Fix**: /autology:capture as [type] with tags [...]

### Doc → No Code
#### [Node Title] (node-id)
**Claim**: what node says exists
**Reality**: doesn't exist / was removed
**Fix**: update or delete the node

### Doc ≠ Code
#### [Node Title] (node-id)
**Claim**: what node says
**Reality**: what code actually shows
**Fix**: specific correction

## 2. Broken Wikilinks
| Source Node | Broken Link | Context |
|-------------|-------------|---------|

## 3. Missing Wikilinks
| Node A | Node B | Reason |
|--------|--------|--------|

## Summary
- Knowledge gaps: N
- Broken wikilinks: N
- Missing wikilinks: N
```

## Key Principles

- Every finding must be verified against actual file/code state
- Each finding includes a specific fix
- No scores or statistics — only concrete facts
- When uncertain, read the actual files to confirm
