---
tags:
  - architecture
  - spec
  - internals
  - decision
title: Code-less Architecture Decision
type: decision
---

# Code-less Architecture Decision


## Status
Accepted (2026-03-01)

## Context

The previous architecture relied on a Go MCP server (7 tools), 5 internal Go packages, a compiled binary, and an advisor agent. This created:
- Build/compilation overhead
- Go toolchain dependency
- Complex hook → binary bootstrapping
- Redundant layers (MCP tools vs Claude native tools)

Claude's native tools (Read/Write/Edit/Grep/Glob) can directly CRUD markdown files, making the MCP server unnecessary.

## Decision

Eliminate all Go code. Claude uses **native tools** to manage `docs/*.md` directly. The only code is shell script hooks.

## Architecture

### SessionStart Hook (shell script)
- Reads `skills/router/SKILL.md`, strips YAML frontmatter with awk
- Injects router skill as trigger guidance — tells Claude when/how to invoke autology skills
- Outputs `additionalContext` JSON for Claude Code

### SessionEnd Hook (shell script)
- Outputs JSON `systemMessage` with capture tip

### docs/*.md (flat structure)
- Knowledge nodes as markdown files with YAML frontmatter
- Filename = title slug (`docs/{title-slug}.md`)
- Claude CRUDs these directly with native tools

### Skills
- `capture`, `explore`, `sync`, `tutorial` — guide Claude through workflows using native tools only

## Removed
- `cmd/`, `internal/` — Go entrypoint and packages
- `go.mod`, `go.sum`, `Makefile` — Go build toolchain
- `.claude-plugin/bin/` — compiled binary
- `scripts/install.sh` — binary installer
- `agents/autology-advisor.md` — advisor agent
- PostToolUse + PreCompact hook entries (from hooks/hooks.json)
- `docs/{type}s/{id}.md` nested structure → flat `docs/*.md`

## Consequences

**Positive**:
- Zero build step — works immediately after clone
- No language runtime dependency
- Claude native tools have full file access (no MCP protocol overhead)
- Autonomous capture via system prompt (same mechanism as automemory)

**Negative**:
- No structured query API (replaced by Grep/Glob)
- No automatic relation inference (Claude judges manually)

## Related

- [[autology-internals]] — Updated implementation layer description
- [[shell-hook-scripts]] — Shell script implementation details
