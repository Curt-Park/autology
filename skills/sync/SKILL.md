---
name: autology:sync
description: Use before committing when code has changed, when docs may be stale, or when asked to audit documentation accuracy.
---

## Overview

docs/ nodes must accurately reflect the actual codebase. This skill verifies that and fixes any discrepancies in-place.

Two modes:
- **Fast** (default): only checks git-changed files. Use before committing.
- **Full**: audits the entire codebase and knowledge base. Use for periodic reviews or when explicitly requested.

## When to Use

- Before committing (fast mode)
- Periodic full audit of the knowledge base
- After large-scale code refactoring
- When docs/ accuracy is in question

When NOT to use:
- Capturing new knowledge → `/autology:capture`
- Understanding graph structure → `/autology:explore`

## Quick Reference

```
/autology:sync        # fast — changed files only
/autology:sync full   # full audit
```

---

## Fast Mode

### 1. Find Changed Files

```
Bash: git diff --name-only HEAD
Bash: git diff --name-only --cached
```

Combine and deduplicate.

### 2. Find Referenced Docs

For each changed file, search the knowledge base for references:

```
Grep: docs/ for the filename (e.g., "session-start.sh")
Grep: docs/ for the parent directory name (e.g., "scripts")
```

Collect all docs that reference any of the changed files.

### 3. Verify and Fix

For each matched doc:
- Read the doc
- Read the changed code file
- Compare: do counts, names, types, paths, and behavior claims still match?
- If discrepancies found: edit the doc in-place to reflect current reality

### 4. Report

```markdown
## Sync Report (fast)

**Changed files checked**: N
**Docs matched**: N
**Docs updated**: N

### Updated
- docs/example.md — updated function count (3 → 4)

### No changes needed
- docs/other.md — still accurate
```

If no docs reference any changed file: "No docs reference the changed files — nothing to sync."

---

## Full Mode

### 1. Read All Nodes

```
Glob: docs/*.md
Read: each file (frontmatter + content)
```

Extract: title, type, tags, content, wikilinks (`[[target]]` patterns)

### 2. Survey Codebase

```
Glob: skills/*/SKILL.md
Read: hooks/hooks.json
Read: package.json
Glob: scripts/*.sh
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

### 6. Report

```markdown
## Sync Report (full)

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

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Report findings without fixing | Edit docs in-place immediately when discrepancies are found |
| Judge doc accuracy without reading code | Always Read the actual file before comparing |
| Run full audit before every commit | Use fast mode daily; full mode periodically |
