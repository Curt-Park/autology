---
confidence: 0.8
created: "2026-02-11T13:34:47+09:00"
id: autology-system-specification
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

Autology is a code-less knowledge management system. Claude uses native tools (Read/Write/Edit/Grep/Glob) to directly CRUD docs/*.md files. Shell script hooks inject context at session start and show tips at session end.

## Specification Components

- [[codeless-architecture-decision]] — Code-less architecture decision (v0.5.0 ADR)

## Cross-References

- Implementation details: [[autology-internals]]
- Usage guide: [[autology-user-guide]]
- Core philosophy: [[autology-philosophy]]
