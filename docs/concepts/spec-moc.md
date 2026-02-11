---
confidence: 0.8
created: "2026-02-11T13:34:47+09:00"
id: spec-moc
modified: "2026-02-11T13:34:47+09:00"
references: []
relations: []
source: manual
status: active
tags:
  - docs
  - spec
  - moc
title: Autology System Specification (MOC)
type: concept
---

# Autology System Specification

Map of Contents for the Autology specification documents.

## Architecture Overview

Autology uses a hybrid triggering system (hooks + agents) to integrate with Claude Code, exposing an MCP server with 7 tools and 4 skills.

## Specification Components

- [[hybrid-triggering]] — Hook + Agent triggering strategy (ADR)

## Cross-References

- Implementation details: [[internals-moc]]
- Usage guide: [[guide-moc]]
- Core philosophy: [[autology-philosophy]]
