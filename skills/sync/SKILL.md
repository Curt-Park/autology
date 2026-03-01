---
name: autology:sync
description: Sync knowledge base docs against git-changed files — fast pre-commit alternative to full analyze
---

This skill checks only git-changed files against the knowledge base, then fixes any discrepancies in-place. It is a focused, fast alternative to `/autology:analyze` for pre-commit use.

## Usage

`/autology:sync` — Sync docs against currently changed files

## Process

### 1. Find Changed Files

```
Bash: git diff --name-only HEAD
Bash: git diff --name-only --cached
```

Combine and deduplicate. These are the files to check.

### 2. Find Referenced Docs

For each changed file, search the knowledge base for references:

```
Grep: AUTOLOGY_ROOT/ for the filename (e.g., "plugin.go")
Grep: AUTOLOGY_ROOT/ for the parent directory name (e.g., "internal/model")
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
## Sync Report

**Changed files checked**: N
**Docs matched**: N
**Docs updated**: N

### Updated
- docs/example.md — updated function count (3 → 4)

### No changes needed
- docs/other.md — still accurate
```

If no docs reference any changed file: report "No docs reference the changed files — nothing to sync."

## Key Principles

- Only check changed files, not the entire codebase
- Fix discrepancies immediately — don't just report them
- If a doc is ambiguous (partially correct), update only the incorrect parts
- When uncertain about a claim, read the actual file to confirm before editing
