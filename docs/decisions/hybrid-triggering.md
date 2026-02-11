---
confidence: 0.8
created: "2026-02-11T13:34:47+09:00"
id: hybrid-triggering
modified: "2026-02-11T13:34:47+09:00"
references: []
relations: []
source: manual
status: active
tags:
  - docs
  - spec
  - triggering
title: Hybrid Triggering Strategy
type: decision
---

# Hybrid Triggering Strategy

Part of [[spec-moc]].

## Status
Accepted (2026-02-10)

## Context
Need reliable triggering for autology capture suggestions in Claude Code sessions.

**Options Evaluated**:
1. Agent-only (contextual, conversational)
2. Hooks-only (deterministic, event-driven)
3. Hybrid (both)

## Decision
Implement **hybrid approach**: hooks + agents.

## Architecture

### Hook Triggers (100% reliable)
- PostToolUse: git commit/PR → suggest capture
- PreCompact: context compaction → suggest capture
- SessionEnd: session end → show capture tips

### Agent Triggers (value-add)
- autology-advisor (haiku model, orchestrator pattern)
- Detects ontology signals during conversation
- Recommends appropriate skill to main Claude
- Not required for reliability (hooks cover key events)

## Implementation
```
hooks/hooks.json         → Hook configuration
internal/hooks/          → Go subcommands
cmd/autology/main.go     → Dispatch hook or MCP server mode
agents/autology-advisor  → Contextual triggering
```

## Consequences

**Positive**:
- Deterministic triggering at key events (git, compaction, session end)
- Contextual suggestions during exploration
- Best of both: Reliability + Intelligence

**Negative**:
- More complex than single approach
- Two systems to maintain

## Alternatives Considered
- Agent-only: Failed scenario 1.2 (Claude used CLAUDE.md instead of agent)
- Hooks-only: No conversational capture suggestions

## Related
- [[skills-spec]] — Skills invoked by advisor
- [[internals-moc]] — Implementation details
