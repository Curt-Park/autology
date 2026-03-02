---
name: autology:router
description: AFTER git commit, git push, or creating a PR — route to capture and sync. Also invoke when a decision, convention, or pattern is discovered to route to capture. Determines which autology skills to run and in what order.
---

<IMPORTANT>
If there is even a 1% chance an autology skill applies, you MUST invoke it.
This is not optional. You cannot rationalize your way out of this.
</IMPORTANT>

## Overview

Route to the right autology skill at the right time. This skill is your
checklist — consult it after key events to ensure nothing is missed.

## Trigger Points

### After git commit / git push / PR creation

```
1. /autology:capture — were any decisions, conventions, or patterns
   discussed this session that aren't yet in docs/?
2. /autology:sync    — do docs/ nodes still match the codebase?
```

Run capture first, then sync. Both are required after every commit.

### After discovering a decision, convention, or pattern

```
→ /autology:capture — save it immediately, then report
```

Signals: "decided", "chose", "always", "never", "the rule is",
a new reusable approach, or any architectural choice.

### When asked about relationships or before refactoring

```
→ /autology:explore — analyze knowledge graph topology
```

## The Rule

**Check this skill's trigger points after every significant action.**
Even a 1% chance that capture or sync applies means invoke it.

```dot
digraph router {
  "Action completed" [shape=doublecircle];
  "Was it a commit/push/PR?" [shape=diamond];
  "capture then sync" [shape=box];
  "Was a decision/convention discovered?" [shape=diamond];
  "capture" [shape=box];
  "Was it a refactoring or relationship question?" [shape=diamond];
  "explore" [shape=box];
  "Continue" [shape=doublecircle];

  "Action completed" -> "Was it a commit/push/PR?";
  "Was it a commit/push/PR?" -> "capture then sync" [label="yes"];
  "Was it a commit/push/PR?" -> "Was a decision/convention discovered?" [label="no"];
  "Was a decision/convention discovered?" -> "capture" [label="yes"];
  "Was a decision/convention discovered?" -> "Was it a refactoring or relationship question?" [label="no"];
  "Was it a refactoring or relationship question?" -> "explore" [label="yes"];
  "Was it a refactoring or relationship question?" -> "Continue" [label="no"];
  "capture then sync" -> "Continue";
  "capture" -> "Continue";
  "explore" -> "Continue";
}
```

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "I just committed, no need to check docs" | Commit = trigger point. Run capture + sync. |
| "This convention isn't worth capturing" | If it's a decision or convention, capture it. |
| "The docs are probably fine" | sync verifies. Don't assume. |
| "No docs/ in this repo" | capture still applies — knowledge goes to the autology project docs/. |
| "I'll capture this later" | Capture NOW. Later never comes. |
| "This is just a small commit" | Size doesn't matter. Check the trigger points. |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skip skills after "quick" commits | Every commit is a trigger point |
| Only capture when user says "remember this" | Also capture self-discovered conventions |
| Run sync but skip capture | Always capture first, then sync |
