---
name: sync-knowledge
description: Use when existing autology docs/ nodes need syncing or updating — when a doc is out of date after a code change, after refactors, when triage identifies existing nodes to verify, or for periodic full audits. Not for new items (use capture) or knowledge questions (use explore).
---

## Overview

docs/ nodes must accurately reflect the actual codebase and decisions. This skill verifies that and fixes any discrepancies in-place.

Two modes:
- **Fast** (default): verifies only the nodes triage identified — fast enough to run after every action.
- **Full**: audits the entire codebase and knowledge base independently — for periodic reviews or when explicitly requested.

**Precondition**: if triage has not run this session, run `/autology:triage-knowledge` first, then fast sync. Full mode is only used when the user explicitly passes `full`.

## Quick Reference

```
/autology:sync-knowledge        # fast — verifies nodes triage identified
/autology:sync-knowledge full   # full audit — no triage needed
```

---

## Fast Mode

**Precondition**: triage has already run and returned matched existing nodes.

### 1. Receive Triage Output

Use triage's matched nodes as the sync scope:

```
Existing nodes from triage (→ sync):
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

### 3. Report

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

Identify the project's key files based on its structure:

```
Glob: common project manifests (package.json, go.mod, Cargo.toml, pyproject.toml, etc.)
Glob: source directories identified from project structure
Read: key config files (hooks/, scripts/, config/, etc.)
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

**Fix policy**: For Doc ≠ Code discrepancies — edit the doc in-place immediately, then report what was fixed. For Code → No Doc gaps — report only (capture handles new nodes).

### 6. Report

```markdown
## Sync Report (full)

### Code → No Doc
- **[Component Name]**: what/where → fix: capture as [type] with tags [...]

### Doc → No Code / Doc ≠ Code
- **[Node Title]**: claim vs reality → fix: edit or delete

### Broken Wikilinks
| Source | Broken Link |
|--------|-------------|

### Missing Wikilinks
| Node A | Node B | Reason |
|--------|--------|--------|

**Summary**: N gaps, N broken links, N missing links
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running fast mode without triage output | Run `/autology:triage-knowledge` first automatically — triage output is what fast mode syncs against. |
| Falling back to full mode when triage is missing | Full mode is only for explicit `full` argument. Default path: run triage → fast sync. |
| Report findings without fixing | Edit docs in-place immediately when discrepancies are found. |
| Judge doc accuracy without reading code | Always Read the actual file before comparing. |
| Run full audit on every action | Fast mode (post-triage) for daily use; full mode for periodic audits. |
