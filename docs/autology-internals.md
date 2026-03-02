---
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

1. **SessionStart Hook** — Shell script that injects autology-workflow skill content as trigger guidance (when/how to invoke autology skills)
2. **SessionEnd Hook** — Shell script that shows knowledge capture tips
3. **docs/*.md** — Knowledge nodes stored as markdown files with YAML frontmatter
4. **Skills** — Claude skill files that guide autology-workflow/capture-knowledge/explore-knowledge/sync-knowledge/autology-tutorial workflows using native tools

## Cross-References

- Specification: [[autology-system-specification]]
- Shell scripts: [[shell-hook-scripts]]
- User guide: [[autology-user-guide]]
