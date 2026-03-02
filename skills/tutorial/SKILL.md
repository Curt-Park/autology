---
name: tutorial
description: Use when user is new to Autology, asks "how does Autology work", wants to learn about knowledge capture, or requests a guided introduction.
---

## Overview

Interactive tutorial in a live git branch. Create real config files, commit them, and watch autology skills trigger naturally.

**Duration**: ~15 minutes across 3 acts.

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

## Act 1: Capture — Decision + Code

**The scenario**: Design a URL shortener. First architectural decision: storage.

Say to the user:

> "We're building a URL shortener. For storage, Redis makes sense — O(1) lookups, built-in TTL. Shall we go with Redis?"

**Wait for user confirmation.**

When confirmed, create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Commit:

```bash
git add docker-compose.yml
git commit -m "tutorial: add Redis docker-compose"
```

**Router fires** — commit = trigger point.

**explore** runs context triage:
- `docker-compose.yml` added with Redis service
- No existing doc for this storage decision
- → new item, needs capture

**capture fires**: create `docs/tutorial-url-shortener-db.md`:

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

Commit the captured doc:

```bash
git add docs/tutorial-url-shortener-db.md
git commit -m "tutorial: capture Redis storage decision"
```

**📌 Why capture fired**: Commit introduced a Redis config with no corresponding decision doc. Explore classified it as new → capture created the doc automatically.

```
> **Autology Tutorial** — Act 1 complete
> Captured: docs/tutorial-url-shortener-db.md
```

**Wait for confirmation before Act 2.**

---

## Act 2: Sync — Decision Changes

**The scenario**: New constraint arrives. Discuss, change the code, watch the doc update automatically.

Say to the user:

> "Infrastructure constraint: Redis isn't available in our cluster. Should we switch to PostgreSQL?"

**Wait for user confirmation.**

When confirmed, edit `docker-compose.yml` to replace Redis with PostgreSQL:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: urlshortener
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

Commit:

```bash
git add docker-compose.yml
git commit -m "tutorial: switch storage from Redis to PostgreSQL"
```

**Router fires** — commit = trigger point.

**explore** runs context triage:
- `docker-compose.yml` now shows PostgreSQL
- Existing node `tutorial-url-shortener-db.md` still says Redis
- → existing node, stale → sync

**sync fires**: reads `docker-compose.yml` and `tutorial-url-shortener-db.md`, detects drift, updates in-place:

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

Commit the synced doc:

```bash
git add docs/tutorial-url-shortener-db.md
git commit -m "tutorial: sync storage decision (Redis → PostgreSQL)"
```

**📌 Why sync fired**: docker-compose changed to PostgreSQL but the decision doc still said Redis. Explore detected the mismatch, sync updated the doc in-place to match reality.

```
> **Autology Tutorial** — Act 2 complete
> Synced: docs/tutorial-url-shortener-db.md (Redis → PostgreSQL)
```

**Wait for confirmation before Act 3.**

---

## Act 3: Explore — Query the Knowledge Graph

**The scenario**: Some time has passed. You want to understand the current decision and its rationale.

Say to the user:

> "Now let's explore the knowledge base. Ask me anything about the decisions we've made — why we're using PostgreSQL, what happened to Redis, what the trade-offs are."

**Wait for user question.**

When the user asks (e.g., "Why are we using PostgreSQL?", "What happened to Redis?", "What are the consequences?"):

- `explore` triggers — question about existing knowledge
- Search and read:

```
Grep docs/ for relevant terms (case-insensitive)
Read docs/tutorial-url-shortener-db.md
```

Answer from the doc content. The node contains:
- Why Redis was originally chosen
- Why Redis was rejected (infra constraint)
- PostgreSQL rationale and trade-offs
- Consequences for the team

Point out: this is what `explore` does in real work — you don't have to remember decisions. The knowledge base answers.

**📌 Why explore fires**: Question about existing project knowledge. Explore searches docs/, finds the relevant node, reads it, and answers from captured context.

```
> **Autology Tutorial** — Act 3 complete
```

---

## Tutorial Complete

You've seen all three core workflows:

| Act | What happened | Skill fired |
|-----|---------------|-------------|
| 1: Capture | Redis config committed, no doc existed | explore → capture |
| 2: Sync | Config changed to PostgreSQL, doc said Redis | explore → sync |
| 3: Explore | Asked about the storage decision | explore → answer |

**The full loop**:
```
code → commit → router → explore triage → capture/sync → commit → explore queries → answer from docs
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

1. **Real artifacts**: docker-compose is a concrete, tangible file — not just docs
2. **User interaction at each act**: user makes decisions, not just watches
3. **Commit → sync**: sync always commits the updated doc
4. **Three workflows**: capture (new), sync (drift), explore (query)
5. **Organic triggers**: skills fire because conditions are met, not because script calls them
