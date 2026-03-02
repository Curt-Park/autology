---
name: explore-knowledge
description: Use when autology-workflow triggers context triage after significant actions, or when user asks about the autology knowledge graph — topology, node relationships, hub nodes, or overview.
---

## Overview

Scan docs/ against conversation context or an action summary.
Classify each knowledge item as existing or new, and return topology hints
(connected nodes, shared tags) so sync and capture can use them during execution.

## Process

### 1. Extract knowledge items from context
From conversation or action summary, identify:
- Decisions made, conventions established, components changed, patterns discovered

### 2. Search docs/ for each item
For each item:
- Grep docs/ for keywords, titles, tags
- Read matched files to confirm relevance

### 3. Build topology hints
For matched nodes:
- Extract wikilink connections ([[target]] patterns)
- Identify nodes sharing tags
- Flag hub/orphan status

For unmatched new items:
- Suggest related existing nodes based on tags or content overlap

### 4. Return classified list

## Output Format

> **Autology** — Explore Results
>
> ### Existing (→ sync)
> - docs/foo.md — matches [item description]
>   Connected: [[bar]], [[baz]] | Tags: arch, api | Hub (5 links)
> - docs/qux.md — matches [item description]
>   Connected: [[foo]] | Tags: convention | Orphan-adjacent
>
> ### New (→ capture)
> - [item description] — no matching node
>   Suggested relations: [[foo]], [[bar]] (shared tags: architecture)
> - [item description] — no matching node
>   Suggested relations: none

If no existing docs match any items, use empty-state format:

> **Autology** — Explore Results
>
> No existing matches found. All items classified as new.
>
> ### New (→ capture)
> - [item description] — no matching node
>   Suggested relations: [[foo]] (shared tags: architecture)

## Graph Operations

When invoked directly or with arguments, explore performs graph traversal in addition to triage.

The `<node>` argument is a **title-slug** — the filename without the `.md` extension (e.g., `redis-storage-decision` for `docs/redis-storage-decision.md`).

### Overview (`/autology:explore-knowledge overview`)

Process:
- Glob `docs/*.md`, read each file's frontmatter and wikilinks
- Count nodes, links, and disconnected components

Output:
- Total node count, link count, component count
- Top 5 hub nodes (most wikilink connections)
- Orphan node list (no incoming or outgoing links)

### Neighborhood (`/autology:explore-knowledge <node>`)

Process:
- Read the target node
- Find all nodes that link to or from the target (1-hop)
- Find their connections (2-hop BFS)

Output: node title, type, tags, and connections for each hop

### Path (`/autology:explore-knowledge path A B`)

Process:
- Find shortest wikilink path from node A to node B

Output: `A → [intermediate] → B` with each hop labeled

### Quick Reference

```
/autology:explore-knowledge              # triage (default when called by autology-workflow)
/autology:explore-knowledge overview     # graph overview
/autology:explore-knowledge <node>       # neighborhood (2-hop BFS)
/autology:explore-knowledge path A B     # shortest path
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Judge relevance by keyword match alone | Read the file to confirm actual relevance |
| Omit topology hints | sync/capture rely on connected/suggested relations — always include |
| Ignore implicit relations | Check tags and content overlap even without wikilinks |
| Confuse triage with graph traversal | Triage classifies items for sync/capture; graph traversal answers user queries about existing nodes |
