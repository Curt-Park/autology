---
name: autology:router
description: Route autology skills after significant actions. After commit/push/PR or decision/convention: explore docs/ to determine sync (existing nodes) or capture (no nodes). Also invoked when user explicitly calls /autology:explore.
---

<IMPORTANT>
If there is even a 1% chance an autology skill applies, you MUST invoke it.
This is not optional. You cannot rationalize your way out of this.
</IMPORTANT>

## Overview

Route to the right autology skill after significant actions. `explore` is
used as a decision tool — not triggered by user messages.

## Trigger Points

### [Action completed] After commit/push/PR or decision/convention discovered

Per-item routing — each item from the action summary is handled independently:

```
1. Summarize the action into knowledge items
   (decisions made, conventions established, components changed, etc.)
2. For each item:
   → /autology:explore — does a related node already exist in docs/?
     yes → /autology:sync  — update existing node
     no  → /autology:capture — create new node
```

Same action can result in both sync and capture for different items.

Signals for "action completed":
- commit, push, PR created
- "decided", "chose", "always", "never", "the rule is", any architectural choice

### [Explicit invocation] User calls /autology:explore directly

Run explore as requested.

## The Rule

**After every significant action: summarize → per-item explore → sync or capture.**
Even a 1% chance applies means invoke it.

```dot
digraph router {
  "Action completed" [shape=doublecircle];
  "Is it a significant action?" [shape=diamond];
  "summarize action into items" [shape=box];
  "for each item: explore" [shape=box];
  "Node exists in docs/?" [shape=diamond];
  "sync (update existing)" [shape=box];
  "capture (create new)" [shape=box];
  "More items?" [shape=diamond];
  "Continue" [shape=doublecircle];

  "Action completed" -> "Is it a significant action?";
  "Is it a significant action?" -> "summarize action into items" [label="yes"];
  "Is it a significant action?" -> "Continue" [label="no"];
  "summarize action into items" -> "for each item: explore";
  "for each item: explore" -> "Node exists in docs/?";
  "Node exists in docs/?" -> "sync (update existing)" [label="yes"];
  "Node exists in docs/?" -> "capture (create new)" [label="no"];
  "sync (update existing)" -> "More items?";
  "capture (create new)" -> "More items?";
  "More items?" -> "for each item: explore" [label="yes"];
  "More items?" -> "Continue" [label="no"];
}
```

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "I just committed, no need to check docs" | Commit = trigger point. explore → sync or capture. |
| "This convention isn't worth capturing" | If it's a decision or convention, capture it. |
| "The docs are probably fine" | sync verifies. Don't assume. |
| "No docs/ in this repo" | capture still applies — knowledge goes to the autology project docs/. |
| "I'll capture this later" | Capture NOW. Later never comes. |
| "This is just a small commit" | Size doesn't matter. Check the trigger points. |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Treat action as one item | Summarize into individual items; each routes independently |
| Skip explore, go straight to capture | explore first — existing node means sync, not duplicate |
| Skip explore, go straight to sync | explore first — no existing node means capture, not update |
| Only capture when user says "remember this" | Also capture self-discovered conventions |
