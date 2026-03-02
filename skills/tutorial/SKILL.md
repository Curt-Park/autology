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

> "We need to store URL mappings. Redis is ideal — O(1) lookups, built-in TTL support. Do you agree, or prefer something else?"

Wait for user response. When a decision is confirmed (any signal: "agreed", "go with Redis", "decided"):

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

Commit the decision doc:

```bash
git add docs/tutorial-url-shortener-db.md
git commit -m "tutorial: capture Redis storage decision"
```

After commit, **router fires**. Walk through what just happened:

1. **router** detected: commit = trigger point
2. **explore** ran context triage:
   - `tutorial-url-shortener-db.md` → just captured, already accurate → nothing to sync or capture
3. Result: knowledge base is current, no action needed

**📌 Why capture fired**: You said "agreed" (or equivalent). Signals: `"decided"`, `"chose"`, `"let's use"`, `"going with"`, explicit confirmation. The commit trigger checked if anything drifted — here it didn't.

```
> **Autology Tutorial** — Act 1 complete
> Captured: docs/tutorial-url-shortener-db.md
```

**Wait for confirmation before Act 2.**

---

## Act 2: Sync — A Decision Changes

**The scenario**: After Act 1, new information arrives. The infrastructure team says Redis isn't available — must use PostgreSQL.

Say to the user:

> "Constraint from infra: Redis isn't available in our cluster. We need to switch to PostgreSQL."

Create a config doc reflecting the new reality:

Write `docs/tutorial-url-shortener-config.md`:

```yaml
---
title: "URL Shortener Config"
type: component
tags: [config, tutorial]
---

# URL Shortener Config

## Database
- host: postgres://...
- table: url_mappings (short_code TEXT PK, original_url TEXT, expires_at TIMESTAMP)
```

Commit it:

```bash
git add docs/tutorial-url-shortener-config.md
git commit -m "tutorial: add PostgreSQL config"
```

**After commit, router fires again.** Walk through explore's triage:

1. **router** detected: commit = trigger point
2. **explore** checked context against knowledge base:
   - `tutorial-url-shortener-config.md` → new doc, already captured → nothing to capture
   - `tutorial-url-shortener-db.md` → **existing node** that says "Use Redis" — but commit context shows PostgreSQL in use
   - Classification: `tutorial-url-shortener-db.md` → **existing, stale → sync**
3. **sync** runs on `tutorial-url-shortener-db.md`:
   - Reads current doc: says Redis
   - Reads new config: says PostgreSQL
   - Detects drift → updates the decision doc in-place

Update `docs/tutorial-url-shortener-db.md` to reflect the changed decision:

```yaml
---
title: "URL Shortener: Use PostgreSQL for Storage"
type: decision
tags: [database, architecture, tutorial]
---

# URL Shortener: Use PostgreSQL for Storage

## Context
Started with Redis plan. Infrastructure constraint: no Redis available in existing cluster.
PostgreSQL cluster already provisioned — reuses existing infrastructure.

## Decision
Use PostgreSQL. Existing cluster available, no additional infra cost, sufficient for expected query load.

## Alternatives Considered
- Redis: Optimal for key-value, but not available in existing infra (rejected)
- In-memory map: No persistence

## Consequences
- Reuses existing infrastructure
- TTL handled via `expires_at` column + scheduled cleanup
- Slightly higher lookup latency vs Redis (acceptable)
```

**📌 Why sync fired**: Explore detected drift — the new config showed PostgreSQL while the decision node still said Redis. Sync read both, identified the mismatch, and updated the decision node in-place. This is the core value: **docs stay accurate automatically when decisions change**.

```
> **Autology Tutorial** — Act 2 complete
> Synced: docs/tutorial-url-shortener-db.md (Redis → PostgreSQL)
```

**Wait for confirmation before Act 3.**

---

## Act 3: Convention — A Third Trigger Pattern

**The scenario**: Reflect on what we built. Establish a team rule.

Say to the user:

> "Looking at the decision node we just updated — the 'Alternatives Considered' section is what made it easy to see that Redis was rejected for infra reasons. Should we make it a rule that every decision node must include alternatives?"

When user agrees (or any "always X" phrasing):

- `capture` triggers — `"always"`, `"the rule is"`, `"we should always"` are capture signals
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
| Decision confirmed in conversation | "agreed", "let's use", "decided" | capture |
| Commit reveals stale existing node | router → explore detects drift | sync |
| Convention established | "always", "never", "the rule is" | capture |

**The full loop**:
```
decide → capture → commit → router checks → decision changes → commit → router detects drift → sync fixes → convention → capture → repeat
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

1. Check current branch — if on `tutorial/autology-demo`, need to know original branch
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
5. **Three trigger patterns**: Decision (capture), Drift detection (sync), Convention (capture)
