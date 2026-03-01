---
confidence: 0.8
created: "2026-02-11T13:34:47+09:00"
id: autology-internals
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

Autology is implemented as a code-less system with shell script hooks:

1. **SessionStart Hook** — Shell script that injects ontology summary and autonomous capture instructions
2. **SessionEnd Hook** — Shell script that shows knowledge capture tips
3. **docs/*.md** — Knowledge nodes stored as markdown files with YAML frontmatter
4. **Skills** — Claude skill files that guide capture/explore/analyze workflows using native tools

## Cross-References

- Specification: [[autology-system-specification]]
- User guide: [[autology-user-guide]]
