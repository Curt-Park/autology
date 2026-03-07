---
name: autology-workflow
description: Use after significant project actions — commit, push, PR, or when an architectural decision is made or a new project convention is established in conversation. Running close to the action keeps captured knowledge more accurate and complete.
---

## Overview

Route to the right autology skill after significant actions. Knowledge captured close to the action is more accurate and complete — this workflow keeps docs/ in sync with what actually happened.

## Trigger Points

### [Action completed] After commit/push/PR or decision/convention discovered

1. `/autology:triage-knowledge` — context triage: analyze action, return classified list + topology hints
2. **In parallel** from the same triage result:
   - Existing items → batch `/autology:sync-knowledge` (use topology hints to verify connected nodes too)
   - New items → batch `/autology:capture-knowledge` (use suggested relations from hints to add wikilinks)

If triage returns only new items (no existing matches), skip sync — capture runs alone. If triage returns only existing items (nothing new), skip capture — sync runs alone.

Signals for "action completed":
- commit, push, PR created
- "decided", "chose", "always", "never", "the rule is", any architectural choice

autology-workflow just completed (skip — do not re-trigger):
- triage-knowledge, sync-knowledge, or capture-knowledge just ran
- docs/*.md file was just written or edited

## Flow

```
Action → triage → sync (existing) + capture (new) → done
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| sync/capture without triage first | Without triage + hints, risk duplicates or missing nodes |
| Ignore topology hints in sync/capture | Use connected/suggested relations to strengthen wikilinks |
| Only capture when user says "remember" | Self-discovered conventions are also capture targets |
