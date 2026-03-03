---
title: "Triage-Explore Split Decision"
type: decision
tags: [architecture, internals, workflow]
---

# Triage-Explore Split Decision

## Status
Accepted (2026-03-03)

## Context

`explore-knowledge` was handling two distinct roles:
1. **Context triage** — after actions, scan docs/ to classify items as existing (→ sync) or new (→ capture), with topology hints
2. **Graph traversal** — answer user questions about the ontology (overview, neighborhood, path)

These have different triggers, inputs, and output consumers:
- Triage is triggered by autology-workflow after commits/decisions; its output feeds sync and capture
- Graph traversal is triggered by user questions; its output is a direct answer

The skill's own Common Mistakes table included "Confuse triage with graph traversal" — a separation signal.

Additionally, the description explicitly referenced its caller (autology-workflow), indicating coupling.

## Decision

Split into two skills:
- **triage-knowledge** — post-action context classification with topology hints, feeding sync and capture
- **explore-knowledge** — graph traversal only (overview, neighborhood, path) for answering user questions

## Consequences

**Positive**:
- Each skill has a single responsibility with clear trigger and consumer
- autology-workflow routes to triage (not explore), eliminating the naming confusion
- explore-knowledge description no longer references its caller

**Negative**:
- One more skill to maintain (6 total instead of 5)
- Existing users/docs referencing "explore for triage" need updating

## Related

- [[codeless-architecture-decision]] — Original architecture that established the skill-based system
- [[autology-internals]] — Updated skills list to include triage-knowledge
