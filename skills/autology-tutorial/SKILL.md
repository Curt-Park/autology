---
name: autology-tutorial
description: Use when user is new to Autology, asks "how does Autology work", wants to learn about knowledge capture, or requests a guided introduction.
---

## Overview

Interactive tutorial in a live git branch. Create real config files, commit them, and watch autology skills trigger naturally.

**Duration**: ~15 minutes across 3 acts.

## Arguments

- `/autology:autology-tutorial` → Start from Act 1
- `/autology:autology-tutorial <1-3>` → Jump to specific act
- `/autology:autology-tutorial reset` → Cleanup (return to original branch, delete tutorial branch, remove tutorial docs)

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

Present the technical analysis to the user:

> "We're building a URL shortener. The core operation is mapping short codes to original URLs — pure key-value lookups. Here are the options:
> - **Redis**: O(1) GET/SET, built-in key expiry (TTL), designed for exactly this pattern
> - **PostgreSQL**: relational, flexible — but a full SQL engine for what's essentially a hashmap
> - **In-memory**: fastest, but no persistence — data lost on restart"

Use AskUserQuestion:

```
question: "Which storage would you choose for the URL shortener?"
options:
  - Redis (Recommended) — O(1) lookups, native TTL, built for key-value
  - PostgreSQL — familiar, flexible, but heavier than needed
  - In-memory — fast but no persistence
```

When user selects **Redis**, create `docker-compose.yml`:

```yaml
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

**autology-workflow triggers** — commit = trigger point. Now invoke triage then capture for real:

Use Skill tool: `autology:triage-knowledge`, then `autology:capture-knowledge`

Triage classifies items, capture creates the doc in `docs/` (e.g., `docs/tutorial-url-shortener-db.md`). After capture completes, stage and commit the newly created doc:

```bash
git add docs/tutorial-*.md
git commit -m "tutorial: capture Redis storage decision"
```

**Key insight**: Commit introduced a Redis config with no corresponding decision doc. Triage classified it as new → capture created the doc automatically.

```
> **Autology Tutorial** — Act 1 complete
> Captured: docs/[title-slug].md
```

**Wait for confirmation before Act 2.**

---

## Act 2: Sync — Decision Changes

**The scenario**: New constraint arrives. Discuss, change the code, watch the doc update automatically.

Present the constraint to the user:

> "New constraint from infra: Redis is not available in our existing cluster. We'd need to provision it separately — added cost and ops overhead. We do have a PostgreSQL cluster already running."

Use AskUserQuestion:

```
question: "Given the infra constraint, which alternative would you choose?"
options:
  - PostgreSQL (Recommended) — existing cluster available, no extra infra cost
  - MySQL — similar overhead, team less familiar
  - SQLite — no concurrency, not production-suitable
```

When user selects **PostgreSQL**, edit `docker-compose.yml` to replace Redis with PostgreSQL:

```yaml
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

**autology-workflow triggers** — commit = trigger point. Now invoke triage then sync for real:

Use Skill tool: `autology:triage-knowledge`, then `autology:sync-knowledge`

Triage identifies the existing doc, sync reads both files, detects the drift, and updates the doc in-place. After sync completes, stage and commit the updated doc:

```bash
git add docs/tutorial-*.md
git commit -m "tutorial: sync storage decision (Redis → PostgreSQL)"
```

**Key insight**: docker-compose changed to PostgreSQL but the decision doc still said Redis. Triage detected the existing doc, sync updated it in-place to match reality.

```
> **Autology Tutorial** — Act 2 complete
> Synced: docs/[title-slug].md (Redis → PostgreSQL)
```

**Wait for confirmation before Act 3.**

---

## Act 3: Explore — Query the Knowledge Graph

**The scenario**: Some time has passed. You want to understand the current decision and its rationale.

Use AskUserQuestion:

```
question: "What would you like to explore in the knowledge base?"
options:
  - "Why did we switch from Redis to PostgreSQL?"
  - "What are the trade-offs of the PostgreSQL choice?"
  - "What alternatives were considered from the start?"
```

For each selected question:

- `explore` triggers — question about existing knowledge

Use Skill tool: `autology:explore-knowledge`

Explore will search the knowledge base and answer from the doc content. The node contains:
- Why Redis was originally chosen
- Why Redis was rejected (infra constraint)
- PostgreSQL rationale and trade-offs
- Consequences for the team

Point out: this is what `explore` does in real work — you don't have to remember decisions. The knowledge base answers.

**Key insight**: Question about existing project knowledge. Explore searches docs/, finds the relevant node, reads it, and answers from captured context.

```
> **Autology Tutorial** — Act 3 complete
```

---

## Tutorial Complete

You've seen all three core workflows:

| Act | What happened | Skill fired |
|-----|---------------|-------------|
| 1: Capture | Redis config committed, no doc existed | triage → capture |
| 2: Sync | Config changed to PostgreSQL, doc said Redis | triage → sync |
| 3: Explore | Asked about the storage decision | explore → answer |

**The full loop**:
```
code → commit → autology-workflow → triage → capture/sync → commit → explore queries → answer from docs
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
- `/autology:triage-knowledge` — classify knowledge items after actions
- `/autology:capture-knowledge` — capture knowledge from real conversations
- `/autology:explore-knowledge` — explore graph topology, query decisions and conventions
- `/autology:sync-knowledge` — find doc-code drift anytime (or `sync full` for complete audit)

---

## Reset Process

When user runs `/autology:autology-tutorial reset`:

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
4. **Four workflows**: triage (classify), capture (new), sync (drift), explore (query)
5. **Guided invocation**: the tutorial calls skills explicitly to demonstrate each step — in real work, autology-workflow triggers them automatically after commits
