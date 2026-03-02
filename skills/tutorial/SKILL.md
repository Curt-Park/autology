---
name: tutorial
description: Use when user is new to Autology, asks "how does Autology work", wants to learn about knowledge capture, or requests a guided introduction.
---

## Overview

Interactive tutorial in a live git branch. You'll make real decisions, commit real code, and watch autology skills trigger naturally — exactly as they do in real work.

**Duration**: ~10 minutes across 3 acts.

## Arguments

- `/autology:tutorial` → Start from Act 1
- `/autology:tutorial <1-3>` → Jump to specific act
- `/autology:tutorial reset` → Cleanup (return to original branch, delete tutorial branch, remove tutorial docs)

---

## Setup: Create Tutorial Branch

Check for uncommitted changes first:

```bash
git status --short
```

If clean, create the tutorial branch:

```bash
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git checkout -b tutorial/autology-demo
echo "Saved original branch: $ORIGINAL_BRANCH"
```

Tell the user: "We're now on `tutorial/autology-demo`. All tutorial commits happen here. When we're done, we'll return to `$ORIGINAL_BRANCH` and delete this branch."

**Wait for confirmation before Act 1.**

---

## Act 1: Capture — A Decision Gets Made

**The scenario**: You're designing a URL shortener service. A key architectural decision comes up.

Say to the user:

> "We need to store URL mappings. I'm recommending Redis — O(1) lookups, built-in TTL support, and easy horizontal sharding. Do you agree, or do you prefer something else?"

Wait for user response. When a decision is confirmed (any signal: "let's go with Redis", "agreed", "decided"):

- `capture` triggers — "decided", "agreed", "let's use" are capture signals
- Create `docs/tutorial-url-shortener-db.md`:

```yaml
---
title: "URL Shortener: Use Redis for Storage"
type: decision
tags: [database, architecture, tutorial]
---

# URL Shortener: Use Redis for Storage

## Context
Building a URL shortener. Need fast key-value lookups with TTL support.

## Decision
Use Redis. O(1) GET/SET, built-in key expiry, Redis Cluster for horizontal scale.

## Alternatives Considered
- PostgreSQL: Too heavy for pure key-value access pattern
- In-memory map: No persistence, single-node only

## Consequences
- Fast redirects (<1ms lookup)
- TTL-based expiry handled natively
- Requires Redis for local dev (docker-compose)
```

**📌 Why capture fired**: You said "decided" (or equivalent). Signals: `"decided"`, `"chose"`, `"let's use"`, `"going with"`, explicit confirmation. Every architectural decision becomes a node.

```
> **Autology Tutorial** — Act 1 complete
> Captured: docs/tutorial-url-shortener-db.md
```

**Wait for confirmation before Act 2.**

---

## Act 2: Commit — Router Fires

**The scenario**: Document the API spec, then commit. Watch the router trigger.

Create `docs/tutorial-url-shortener-spec.md`:

```yaml
---
title: "URL Shortener API Spec"
type: component
tags: [api, spec, tutorial]
---

# URL Shortener API Spec

## Endpoints
- `POST /shorten` — accepts `{ url }`, returns `{ short_code }`
- `GET /:code` — redirects to original URL (302)

## Storage
Uses Redis — see [[tutorial-url-shortener-db]]
```

Now commit both docs:

```bash
git add docs/tutorial-url-shortener-db.md docs/tutorial-url-shortener-spec.md
git commit -m "tutorial: add URL shortener decision and API spec"
```

**After commit, router fires automatically.** Walk through what just happened:

1. **router** detected: commit = trigger point
2. **explore** ran context triage against the commit
   - `tutorial-url-shortener-db.md` → existing, already accurate → nothing to sync
   - `tutorial-url-shortener-spec.md` → new, already captured → nothing to capture
3. Result: docs are current, no action needed

**📌 Why router fired**: Every commit triggers the router. Explore triage is lightweight — when docs are current, it reports nothing to do. The value shows when something drifts.

Now simulate drift: edit the spec to add an endpoint:

Open `docs/tutorial-url-shortener-spec.md` and add under Endpoints:
```
- `DELETE /:code` — removes a short URL (admin only)
```

Commit without creating a new doc for the delete endpoint:

```bash
git add docs/tutorial-url-shortener-spec.md
git commit -m "tutorial: add delete endpoint to spec"
```

Router fires again. This time explore finds the spec was updated but the decision node wasn't touched. Sync checks: does `tutorial-url-shortener-db.md` still match reality? It does — no drift there.

**📌 Key point**: In real work, drift happens when you modify code or specs but forget to update related docs. Router + sync catch it automatically.

```
> **Autology Tutorial** — Act 2 complete
```

**Wait for confirmation before Act 3.**

---

## Act 3: Convention — A Third Trigger Pattern

**The scenario**: Reflect on what we built. Establish a team rule.

Say to the user:

> "Looking at the decision node we created — the 'Alternatives Considered' section is what makes it valuable. Should we make it a rule that every decision node must include alternatives?"

When user agrees (or any "always X" phrasing):

- `capture` triggers again — `"always"`, `"the rule is"`, `"we should always"` are capture signals
- Create `docs/tutorial-decision-convention.md`:

```yaml
---
title: "Decision Nodes Must Include Alternatives Considered"
type: convention
tags: [conventions, documentation, tutorial]
---

# Decision Nodes Must Include Alternatives Considered

## Convention
Every decision node in docs/ MUST include an "Alternatives Considered" section.

## Rationale
Forces deliberate choice over default choices.
Prevents re-litigating the same decisions later.
Future Claude and team members see why rejected options were rejected.

## Example
See [[tutorial-url-shortener-db]] for correct format.
```

Commit the convention:

```bash
git add docs/tutorial-decision-convention.md
git commit -m "tutorial: establish alternatives-required convention for decisions"
```

**📌 Why capture fired**: You said "always" (or equivalent). Signals: `"always"`, `"never"`, `"must"`, `"the rule is"`, `"we should always"`. Conventions are first-class knowledge — future sessions inherit the rule automatically.

```
> **Autology Tutorial** — Act 3 complete
```

---

## Tutorial Complete

You've experienced all three trigger patterns in real git workflow:

| Trigger | Signal | Skill fired |
|---------|--------|-------------|
| Decision in conversation | "decided", "let's use", confirmed choice | capture |
| `git commit` | commit = significant action | router → explore → sync/capture |
| Convention established | "always", "never", "the rule is" | capture |

**The full loop**:
```
decide → capture → commit → router verifies → convention → capture → repeat
```

---

## Cleanup

Return to original branch and remove all tutorial artifacts:

```bash
git checkout <ORIGINAL_BRANCH>
git branch -D tutorial/autology-demo
```

Then remove tutorial docs:

```
Grep docs/ for frontmatter containing "tutorial" in tags
Delete each matched file with Bash rm
```

Confirm: "Back on `<ORIGINAL_BRANCH>`. Tutorial branch deleted. Cleaned up N tutorial nodes."

**Next steps**:
- `/autology:capture` — capture knowledge from real conversations
- `/autology:explore` — triage knowledge items, or explore graph topology
- `/autology:sync` — find doc-code drift anytime (or `sync full` for complete audit)

---

## Reset Process

When user runs `/autology:tutorial reset`:

1. Check current branch — if on `tutorial/autology-demo`, ask for original branch name
2. `git checkout <original-branch>`
3. `git branch -D tutorial/autology-demo`
4. Grep `docs/` for files with `tutorial` in tags frontmatter
5. Delete each with Bash `rm`
6. Confirm: "Cleaned up tutorial branch and N tutorial nodes."

---

## Key Principles

1. **Real git branch**: Tutorial is isolated — original branch untouched throughout
2. **Organic triggers**: Skills fire because conditions are met, not because script calls them
3. **Annotate every trigger**: After each skill fires, explain the signal that caused it
4. **Interactive decisions**: User makes real choices, not just watches
5. **Three trigger patterns**: Decision (capture), Commit (router), Convention (capture)
