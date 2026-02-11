---
confidence: 0.8
created: "2026-02-11T17:59:03+09:00"
id: component-2038
modified: "2026-02-11T17:59:03+09:00"
references: []
relations: []
source: manual
status: active
tags:
  - internals
  - architecture
  - golang
title: Internal Package Architecture
type: component
---

# Internal Package Architecture

Part of [[internals-moc]].

## Overview

Autology's Go implementation is organized into 5 internal packages, each with a focused responsibility.

## Package Structure

### 1. internal/mcp/
**Purpose**: MCP (Model Context Protocol) server implementation  
**Key Files**: `server.go`, `tools.go`  
**Responsibilities**:
- JSON-RPC 2.0 protocol handling (stdio transport)
- Tool registration and dispatch
- Request/response serialization

### 2. internal/storage/
**Purpose**: Persistent knowledge graph storage  
**Key Files**: `nodestore.go`, `search.go`, `types.go`  
**Responsibilities**:
- NodeStore: CRUD operations for knowledge nodes
- SearchEngine: Query processing and ranking
- File-based persistence (markdown frontmatter + content)

### 3. internal/classification/
**Purpose**: Automatic node type classification  
**Key Files**: `classifier.go`  
**Responsibilities**:
- Heuristic-based type detection (decision, component, convention, etc.)
- Content analysis for classification
- Tag inference

### 4. internal/enrichment/
**Purpose**: Knowledge graph enrichment  
**Key Files**: `enricher.go`  
**Responsibilities**:
- Automatic relation inference
- Context building from related nodes
- Graph connectivity improvements

### 5. internal/hooks/
**Purpose**: Claude Code hook subcommands  
**Key Files**: `post_tool_use.go`, `pre_compact.go`, `session_end.go`  
**Responsibilities**:
- Post-commit capture suggestions
- Pre-compaction reminders
- Session-end tips
- Zero-dependency Go subcommands

## Design Principles

**High Cohesion**: Each package has a single, well-defined responsibility  
**Low Coupling**: Packages depend on interfaces, not concrete implementations  
**Immutability**: All data structures are immutable (no in-place mutations)  
**Testability**: Each package has comprehensive unit tests

## Related

- [[internals-moc]] — High-level architecture overview
- [[hybrid-triggering]] — How hooks package integrates with triggering strategy