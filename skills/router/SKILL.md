---
name: autology:router
description: Route autology skills. User project question → explore for hints. Significant action (commit/push/PR, decision/convention) → explore, then sync if existing nodes found or capture if none. Determines which autology skills to run and in what order.
---

<IMPORTANT>
If there is even a 1% chance an autology skill applies, you MUST invoke it.
This is not optional. You cannot rationalize your way out of this.
</IMPORTANT>

## Overview

Route to the right autology skill at the right time. Two entry points:
- **User message** → explore before responding to surface relevant context
- **Action completed** → explore to determine whether to sync or capture

`explore` is the pivot in both flows: it tells you what already exists in
docs/ and guides the next step.

## Trigger Points

### [User message] User asks any question about the project

```
→ /autology:explore — BEFORE responding
```

Run explore to find docs/ nodes related to the question.
- Found relevant nodes → use as context when formulating the answer
- No relevant nodes found → knowledge base may be incomplete; note it

### [Action completed] After commit/push/PR or decision/convention discovered

```
→ /autology:explore — check what already exists in docs/
```

Then based on the result:
- Existing related nodes found → `/autology:sync` — update them to reflect current reality
- No related nodes found → `/autology:capture` — create a new node

Signals for "action completed":
- commit, push, PR created
- "decided", "chose", "always", "never", "the rule is", any architectural choice

## The Rule

**Two entry points. explore is always the first step.**
Even a 1% chance applies means invoke it.

```dot
digraph router {
  "User message received" [shape=doublecircle];
  "Action completed" [shape=doublecircle];
  "Is it a question about the project?" [shape=diamond];
  "explore (for context)" [shape=box];
  "Found relevant nodes?" [shape=diamond];
  "use as context" [shape=box];
  "note: knowledge gap" [shape=box];
  "Respond" [shape=doublecircle];
  "Is it a significant action?" [shape=diamond];
  "explore (for routing)" [shape=box];
  "Related nodes exist?" [shape=diamond];
  "sync (update existing)" [shape=box];
  "capture (create new)" [shape=box];
  "Continue" [shape=doublecircle];

  "User message received" -> "Is it a question about the project?";
  "Is it a question about the project?" -> "explore (for context)" [label="yes"];
  "Is it a question about the project?" -> "Respond" [label="no"];
  "explore (for context)" -> "Found relevant nodes?";
  "Found relevant nodes?" -> "use as context" [label="yes"];
  "Found relevant nodes?" -> "note: knowledge gap" [label="no"];
  "use as context" -> "Respond";
  "note: knowledge gap" -> "Respond";

  "Action completed" -> "Is it a significant action?";
  "Is it a significant action?" -> "explore (for routing)" [label="yes"];
  "Is it a significant action?" -> "Continue" [label="no"];
  "explore (for routing)" -> "Related nodes exist?";
  "Related nodes exist?" -> "sync (update existing)" [label="yes"];
  "Related nodes exist?" -> "capture (create new)" [label="no"];
  "sync (update existing)" -> "Continue";
  "capture (create new)" -> "Continue";
}
```

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "I already know the answer, no need to explore" | explore may surface relevant decisions or conventions you'd miss. |
| "I just committed, no need to check docs" | Commit = trigger point. Run capture + sync. |
| "This convention isn't worth capturing" | If it's a decision or convention, capture it. |
| "The docs are probably fine" | sync verifies. Don't assume. |
| "No docs/ in this repo" | capture still applies — knowledge goes to the autology project docs/. |
| "I'll capture this later" | Capture NOW. Later never comes. |
| "This is just a small commit" | Size doesn't matter. Check the trigger points. |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skip explore after commit | explore first — it determines sync vs capture |
| Always capture without checking docs/ | If related node exists, sync instead |
| Always sync without checking docs/ | If no related node exists, capture instead |
| Only capture when user says "remember this" | Also capture self-discovered conventions |
