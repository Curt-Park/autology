---
name: autology:explore
description: Explore the knowledge graph — neighborhood, hub nodes, paths between concepts
---

## Usage

```
/autology:explore              # graph overview (hubs, orphans, components)
/autology:explore <node>       # neighborhood (2-hop expansion from node)
/autology:explore path A B     # shortest path between two nodes
```

## Process

### Build Adjacency List

```
Glob docs/*.md → Read each file → extract [[wikilinks]] from content
```

For each file, collect all `[[wikilink]]` occurrences. Strip the `[[` and `]]` to get target slugs.
Build two maps:
- `outgoing`: `{slug: [target_slug, ...]}`
- `incoming`: `{slug: [source_slug, ...]}` (reverse map)

Node slug = filename without `.md` extension.

### Graph Overview (no args)

1. Count nodes and total links (sum of all outgoing edges)
2. Compute degree for each node: `outgoing[node].length + incoming[node].length`
3. Hub nodes: top 5 by degree, sorted descending
4. Orphans: nodes with degree 0
5. Connected components: BFS from each unvisited node

### Neighborhood (with `<node>` arg)

1. Normalize input to slug (lowercase, spaces → hyphens)
2. BFS from center node up to depth 2
3. At each hop, expand both outgoing links and backlinks
4. Display as indented tree with hop distance labeled

### Path Finding (`path A B`)

1. Normalize both slugs
2. BFS shortest path from A to B
3. If found: display as a chain `A → B → C` with hop count
4. If not found: report "no path — nodes may be in separate components"

## Output Format

### Graph Overview
```
> **Autology** — Graph Overview

N nodes, M links, K component(s)

Hub nodes (most connected):
  slug-name — X links
  ...

Orphans (no links): none  [or list slugs]
```

### Neighborhood
```
> **Autology** — Neighborhood of <node>

<node> (center)
├── linked-node (1 hop)
│   ├── deeper-node (2 hops)
│   └── another-node (2 hops)
└── other-link (1 hop, backlink)
```

### Path Finding
```
> **Autology** — Path: A → B

node-a
  → intermediate-node
    → node-b
(2 hops)
```

## When to Use

- **Graph overview**: understand knowledge structure health — which nodes are hubs, which are isolated
- **Neighborhood**: before refactoring, see blast radius; find related context around a concept
- **Path finding**: trace conceptual lineage ("how does this philosophy connect to this implementation?"), discover non-obvious links between nodes with different types/tags
