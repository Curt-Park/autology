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

Autology is a code-less knowledge management system. Claude uses native tools (Read/Write/Edit/Grep/Glob) to directly CRUD docs/*.md files. A shell script hook injects context at session start.

## Specification Components

- [[codeless-architecture-decision]] — Code-less architecture decision (ADR)
- [[autology-workflow-reentry-guard]] — Reentry guard design: event-based vs state-based

## Cross-References

- Implementation details: [[autology-internals]]
- Shell scripts: [[shell-hook-scripts]]
- Usage guide: [[autology-user-guide]]
- Core philosophy: [[autology-philosophy]]
