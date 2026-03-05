---
name: explore-knowledge
description: Use to answer questions about this project's decisions, architecture, and conventions — "why did we choose X?", "how does Y work?", "what's the convention for Z?". Also use for explicit /autology:explore-knowledge commands (overview, neighborhood, path). Searches docs/, follows wikilinks, and synthesizes grounded answers from the knowledge base.
---

## Overview

Answer user questions about the project by traversing the autology knowledge graph.
Search docs/ for relevant nodes, follow wikilinks to build context, and return
rich answers grounded in documented decisions, conventions, and architecture.

Use explore instead of reading a doc directly when: the user asks a question (rather than requesting a specific doc), or when the topic may span multiple connected nodes.

## Question-Answering (primary mode)

When the user asks a question about the project (conventions, architecture, decisions, rationale):

1. **Search**: Grep `docs/` for keywords from the question
2. **Read**: Read matched nodes (frontmatter + body)
3. **Follow**: For each wikilink in matched nodes, read the linked node (1-hop)
4. **Synthesize**: Answer citing specific docs (e.g., "per [[redis-storage-decision]]")

## Graph Operations

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

## Quick Reference

```
/autology:explore-knowledge overview     # graph overview
/autology:explore-knowledge <node>       # neighborhood (2-hop BFS)
/autology:explore-knowledge path A B     # shortest path
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Answer from memory instead of docs | Always Read the actual doc nodes before answering |
| Stop at 1-hop neighbors | Follow wikilinks to 2-hop for richer context |
| Ignore node type and tags | Include type/tags in answers — they add classification context |
