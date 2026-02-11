---
confidence: 0.8
created: "2026-02-11T13:34:47+09:00"
id: internals-moc
modified: "2026-02-11T13:34:47+09:00"
references: []
relations: []
source: manual
status: active
tags:
  - docs
  - internals
  - moc
title: Autology Internals (MOC)
type: concept
---

# Autology Internals

Map of Contents for Autology implementation documentation.

## Implementation Layers

Autology is implemented in Go with these core layers:

1. **MCP Protocol** — JSON-RPC 2.0 transport layer (internal/mcp/server.go)
2. **Tool Implementations** — 7 MCP tools (internal/mcp/server.go)
3. **Storage Layer** — NodeStore CRUD operations (internal/storage/)
4. **Search Engine** — Search algorithms and scoring (internal/storage/search.go)
5. **Classification** — Type classification heuristics (internal/classification/)
6. **Enrichment** — Relation inference and context building (internal/enrichment/)
7. **Hooks** — Hook subcommands for triggering (internal/hooks/)

## Cross-References

- Specification: [[spec-moc]]
- User guide: [[guide-moc]]
