---
name: autology:router
description: AFTER git commit, git push, or creating a PR — route to capture and sync. Also invoke when a decision/convention is discovered (→ capture), or when user asks about relationships between knowledge nodes in docs/ (→ explore). Determines which autology skills to run.
---

<IMPORTANT>
If there is even a 1% chance an autology skill applies, you MUST invoke it.
This is not optional. You cannot rationalize your way out of this.
</IMPORTANT>

## Overview

Route to the right autology skill at the right time. Two entry points:
- **User message** → check if explore applies before responding
- **Action completed** → check if capture and/or sync applies after acting

## Trigger Points

### [User message] User asks about relationships between knowledge nodes in docs/

```
→ /autology:explore — BEFORE responding
```

Signals: "how does [doc node] relate to [doc node]", "what's connected to [node]",
"show the knowledge base structure", "blast radius before refactoring docs",
"which nodes are hubs", "are there orphan nodes in docs/".

### [Action completed] After git commit / git push / PR creation

```
1. /autology:capture — were any decisions, conventions, or patterns
   discussed this session that aren't yet in docs/?
2. /autology:sync    — do docs/ nodes still match the codebase?
```

Run capture first, then sync. Both are required after every commit.

### [Action completed] After discovering a decision, convention, or pattern

```
→ /autology:capture — save it immediately, then report
```

Signals: "decided", "chose", "always", "never", "the rule is",
a new reusable approach, or any architectural choice.

## The Rule

**Two checks — one per entry point. Miss neither.**
Even a 1% chance applies means invoke it.

```dot
digraph router {
  "User message received" [shape=doublecircle];
  "Action completed" [shape=doublecircle];
  "Asks about docs/ node relationships?" [shape=diamond];
  "explore" [shape=box];
  "Respond" [shape=doublecircle];
  "Was it a commit/push/PR?" [shape=diamond];
  "capture then sync" [shape=box];
  "Was a decision/convention discovered?" [shape=diamond];
  "capture" [shape=box];
  "Continue" [shape=doublecircle];

  "User message received" -> "Asks about docs/ node relationships?";
  "Asks about docs/ node relationships?" -> "explore" [label="yes"];
  "Asks about docs/ node relationships?" -> "Respond" [label="no"];
  "explore" -> "Respond";

  "Action completed" -> "Was it a commit/push/PR?";
  "Was it a commit/push/PR?" -> "capture then sync" [label="yes"];
  "Was it a commit/push/PR?" -> "Was a decision/convention discovered?" [label="no"];
  "Was a decision/convention discovered?" -> "capture" [label="yes"];
  "Was a decision/convention discovered?" -> "Continue" [label="no"];
  "capture then sync" -> "Continue";
  "capture" -> "Continue";
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
