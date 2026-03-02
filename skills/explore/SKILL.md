---
name: explore
description: Use when router triggers context triage after significant actions, or when user asks about the autology knowledge graph — topology, node relationships, hub nodes, or overview.
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

## When invoked directly (/autology:explore)

In addition to the triage above, provide a full graph overview:
- Total node count, link count, component count
- Top 5 hub nodes
- Orphan node list
- Specific node neighborhood (2-hop BFS)
- Shortest path between two nodes

Quick Reference:
/autology:explore              # triage (default when called by router)
/autology:explore overview     # graph overview
/autology:explore <node>       # neighborhood
/autology:explore path A B     # shortest path

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Judge relevance by keyword match alone | Read the file to confirm actual relevance |
| Omit topology hints | sync/capture rely on connected/suggested relations — always include |
| Ignore implicit relations | Check tags and content overlap even without wikilinks |
