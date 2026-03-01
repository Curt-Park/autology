---
name: autology:explore
description: Explore and query the autology knowledge base using native tools
---

You help the user explore the autology knowledge base in docs/.

## Process

### No Arguments: Show Overview

Use Glob to list `docs/*.md`, then read each file's frontmatter to build a summary:

```
Glob: docs/*.md
Read: frontmatter of each file
```

Display:
- Total node count
- Breakdown by type (count each distinct `type:` value found in docs/)
- All tags in use

### With Arguments: Search

Parse the user's input:

#### By type
"decisions", "components", "conventions", etc.

```
Grep docs/ for `^type: decision` (or other type)
```

#### By tag
"tagged auth", "tag:auth", "#auth"

```
Grep docs/ for the tag in frontmatter tags blocks
```

#### By keyword
Any natural language text

```
Grep docs/ -i for the keyword (search both frontmatter and content)
```


## Output Format

### Overview (no args)
```
# Autology Knowledge Base — docs/

Total nodes: N

By type:
- [type discovered in docs/]: X
- [type discovered in docs/]: X
  (list all distinct types found, with counts)

Tags: tag1, tag2, tag3, ...
```

### Search Results
```
# Results: [query description]

Found N nodes:

## [Title]
Type: [type] | Tags: [tags] | Status: [status]
File: docs/slug.md

[First 150 chars of content...]

---
```

### Empty Results
```
No nodes match "[query]".

Try broader terms or use /autology:explore (no args) to see all nodes.
```

## Key Principles

- Use Grep for search, Glob for listing, Read for full content
- Show file paths so user can read full content if needed
- Suggest next actions after results
