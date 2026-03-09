---
title: "Node Granularity Convention"
type: convention
tags: [docs, knowledge-graph, internals]
---

# Node Granularity Convention

Part of [[autology-internals]]. Governs when to create a separate doc node vs. folding a knowledge item into a parent.

## Convention

Not every triage item needs its own file. Before creating a node, ask: does this item have enough standalone substance to be useful on its own, or is it a detail of something larger?

**Own node** — if the item has:
- A distinct title that could be searched independently
- Multiple meaningful sentences of content
- Likely to be linked from other nodes

**Fold into parent** — if the item is:
- A behavior detail or edge case of another item being captured in the same batch
- A consequence or motivation that belongs inside a parent's body
- Too thin to be useful when accessed in isolation

When folding, capture the detail in the parent node's body under a relevant section. This keeps the graph navigable — thin stub nodes add noise without adding reach.

## Example

Commit introduces a `RateLimiter` service and removes old Express middleware:
- **RateLimiter service** → own node (distinct component, likely linked)
- **Middleware removal** → fold into the service node's "What Changed" section (no standalone value)

## Rationale

A knowledge graph's value comes from well-scoped nodes that are worth linking to. Stub nodes with one sentence of content dilute search results and create spurious graph edges. Conversely, burying important concepts inside unrelated parent nodes makes them invisible. The right granularity is the minimum that preserves independent navigability.

## Related

- [[skill-writing-convention]] — similar principle: prefer lean, purposeful structure over exhaustive enumeration
- [[autology-philosophy]] — graph navigability as a core design goal
