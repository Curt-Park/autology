---
confidence: 0.8
created: "2026-02-11T17:58:56+09:00"
id: component-1472
modified: "2026-02-11T17:58:56+09:00"
references: []
relations: []
source: manual
status: active
tags:
  - architecture
  - agents
  - triggering
  - internals
title: Autology Advisor Agent
type: component
---

# Autology Advisor Agent

Part of [[internals-moc]].

## Overview

The autology-advisor is a lightweight orchestrator agent (haiku model) that detects ontology-related signals in conversations and recommends appropriate skills to the main Claude session.

## Architecture Pattern

**Orchestrator-Worker Pattern**:
1. **Advisor (haiku)**: Detects ontology signals → recommends skill
2. **Main Claude (sonnet/opus)**: Invokes recommended skill in session context
3. **Skill**: Executes with full capabilities
4. **User**: Sees skill workflow directly (advisor is transparent)

## Location

`agents/autology-advisor.md`

## When It Triggers

The advisor proactively recommends skills when detecting:
- Decision-making conversations → `/autology:capture` for decisions
- Component creation → `/autology:capture` for components
- Implementation questions → `/autology:explore` for querying ontology
- Ontology analysis needs → `/autology:analyze` for verification

## Why This Pattern

- **Binary decision**: "Invoke skill?" vs "Which of 3 agents?" (simpler)
- **Model flexibility**: Skills inherit session model (sonnet/opus), advisor stays cheap (haiku)
- **Zero redundancy**: All functionality in skills, advisor ensures timing
- **Officially supported**: Orchestrator-worker pattern from Claude Code docs

## Related

- [[hybrid-triggering]] — Overall triggering strategy (hooks + agents)
- [[guide-moc]] — Skills that advisor recommends