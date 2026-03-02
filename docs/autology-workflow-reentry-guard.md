---
title: "Autology Workflow Reentry Guard Design"
type: decision
tags: [architecture, workflow, internals]
---

# Autology Workflow Reentry Guard Design

Part of [[autology-internals]]. Specifies how [[autology-system-specification]] prevents the autology-workflow from triggering itself recursively.

## Decision

The reentry guard checks **"Did autology-workflow just complete?"** (event-based), not **"Am I already inside a workflow?"** (state-based).

## Rationale

The trigger point is `[Action completed]`. When that completed action was autology-workflow itself (explore, sync, capture, or a docs write), the guard fires and skips re-triggering.

**State-based (rejected)**: Requires tracking runtime execution context ("am I currently in a workflow?"). Fragile — state can become stale or be missed, leaving the loop prevention unreliable.

**Event-based (chosen)**: Looks backward at the source of the completed action. No state to track. The guard is a simple classification: "was the completed action autology-workflow?"

## What counts as "autology-workflow just completed"

- `explore-knowledge`, `sync-knowledge`, or `capture-knowledge` just ran
- A `docs/*.md` file was just written or edited

## Implementation

`skills/autology-workflow/SKILL.md` — first diamond in the flowchart:

```
"Did autology-workflow just complete?" → yes: Continue (skip) / no: check significance
```
