---
name: sync
description: Use when autology docs/ nodes may be out of sync with the codebase — after commits, large refactors, or when autology router identifies existing nodes from explore triage. Also for periodic full audits.
---

## Overview

docs/ nodes must accurately reflect the actual codebase and decisions. This skill verifies that and fixes any discrepancies in-place.

Two modes:
- **Fast** (default): verifies the nodes explore identified. Requires explore output.
- **Full**: audits the entire codebase and knowledge base independently. Use for periodic reviews or when explicitly requested.

## When to Use

- After explore triage (via router or directly) to verify matched existing nodes
- Periodic full audit of the knowledge base

When NOT to use:
- Capturing new knowledge → `/autology:capture`
- Finding what changed → `/autology:explore` (run explore first, then sync)

## When invoked directly

Fast mode requires explore to have run first. If explore output is not available, use `/autology:sync full`.

## Quick Reference

```
/autology:sync        # fast — verifies nodes explore identified
/autology:sync full   # full audit — no explore needed
```

---

## Fast Mode

**Precondition**: explore has already run and returned matched existing nodes.

### 1. Receive Explore Output

Use explore's matched nodes as the sync scope:

```
Existing nodes from explore triage (→ sync):
- docs/foo.md — matches [item description]
  Connected: [[bar]], [[baz]] | Tags: arch, api
```

Also include any connected nodes listed in the topology hints.

### 2. Verify and Fix

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
| Running fast mode without explore output | Fast mode needs explore's matched nodes as scope. Run explore first. |
| Report findings without fixing | Edit docs in-place immediately when discrepancies are found. |
| Judge doc accuracy without reading code | Always Read the actual file before comparing. |
| Run full audit on every action | Fast mode (post-explore) for daily use; full mode for periodic audits. |
