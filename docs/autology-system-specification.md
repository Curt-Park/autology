---
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

- [[codeless-architecture-decision]] — Code-less architecture decision (ADR)

## Cross-References

- Implementation details: [[autology-internals]]
- Shell scripts: [[shell-hook-scripts]]
- Usage guide: [[autology-user-guide]]
- Core philosophy: [[autology-philosophy]]
