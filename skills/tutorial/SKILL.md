---
name: autology:tutorial
description: Use when user is new to Autology, asks "how does Autology work", wants to learn about knowledge capture, or requests a guided introduction.
---

## Overview

Welcome to the Autology Tutorial. You will learn how knowledge is captured, reused, updated, and kept in sync with code — through a single continuous example.

## Arguments

- `/autology:tutorial` → Start from Step 1
- `/autology:tutorial <1-5>` → Jump to specific step
- `/autology:tutorial reset` → Delete all tutorial nodes from docs/

## The Running Example

Throughout this tutorial, we follow one realistic scenario:

> You're building a web API. You make a database decision, use that knowledge later, change your mind, adapt, and finally sync your docs with the code.

---

## Step 1: Recording Memory — Capturing a Decision

**The scenario**: You just decided to use SQLite for your project's database.

First, check what's already in the knowledge base:

```
Glob docs/*.md → read each frontmatter → show node count and tags
```

If empty, great — you're starting fresh. If nodes exist, note them.

Now capture the decision. Use Write tool to create `docs/sqlite-decision.md`:

```yaml
---
title: "Use SQLite for Database"
type: decision
tags: [database, architecture, tutorial]
---

# Use SQLite for Database

## Context
Early-stage project. Need a simple, zero-config database to move fast.

## Decision
Use SQLite. File-based, no server, works locally and in CI.

## Alternatives Considered
- PostgreSQL: too heavy for current scale
- In-memory store: no persistence

## Consequences
- Fast local development
- Will need migration if scale grows significantly
```

After writing the file, confirm:
```
> **Autology Tutorial** — Step 1 complete
```
Captured `sqlite-decision` → `docs/sqlite-decision.md`

**Key point**: The node is now a plain markdown file in `docs/`. Nothing more.

Ask: "Ready to see how this memory gets used in the next session?"

**Wait for confirmation before Step 2.**

---

## Step 2: Using Recorded Memory — The Next Session

**The scenario**: A new Claude session starts. You ask: "Add a user table to the database."

At session start, `scripts/session-start.sh` ran automatically. It injected the router skill as trigger guidance into Claude's context — telling Claude when to invoke explore, capture, and sync. The router skill is what makes Claude proactively check the knowledge base after significant actions.

To retrieve the actual decision, Claude uses explore or Grep to search docs/ on demand:

```
Grep docs/ for "sqlite" (case-insensitive)
Read docs/sqlite-decision.md
```

Show the full content. Point out:
- Claude sees the Context, Decision, Alternatives, Consequences
- This is why Claude gives SQLite-specific answers without being told

**Key point**: session-start.sh injects router skill guidance (when to act), not a node list. The actual retrieval happens when Claude reads docs/ with Grep or Read.

```
> **Autology Tutorial** — Step 2 complete
```

Ask: "Ready to see what happens when the decision changes?"

**Wait for confirmation before Step 3.**

---

## Step 3: Updating Memory — When Things Change

**The scenario**: Three months later, traffic grew. You're migrating to PostgreSQL.

The SQLite decision node is a living document — just update it in place. Git tracks what it used to say.

Rename and update: Write new content to `docs/postgresql-decision.md`, then `rm docs/sqlite-decision.md`:
- Update `title` → `"Use PostgreSQL for Database"` in frontmatter
- Rewrite the content to reflect the current decision:

```markdown
# Use PostgreSQL for Database

## Context
Started with SQLite. User table grew to 500k rows; SQLite write locks became a
bottleneck under concurrent load.

## Decision
Migrate to PostgreSQL with pgBouncer for connection pooling.

## Alternatives Considered
- Stay on SQLite with WAL mode: insufficient for concurrent writes
- MySQL: team has more PostgreSQL experience

## Consequences
- Requires Docker for local dev
- Migration script needed for existing data
- Better concurrency and indexing capabilities
```

After editing, confirm: "Updated `docs/postgresql-decision.md` — reflects current state."

**Key point**: No need to keep a graveyard of superseded nodes. Git history has the full evolution. The knowledge base shows only what's true now.

```
> **Autology Tutorial** — Step 3 complete
```

Ask: "Ready to see how the updated memory affects the next session?"

**Wait for confirmation before Step 4.**

---

## Step 4: Using Updated Memory — Adapted Context

**The scenario**: Another new session. You ask: "How should I set up the database connection?"

SessionStart ran again. `session-start.sh` injected the router skill guidance as before — telling Claude when to invoke explore, capture, and sync. Claude retrieves the current decision on demand:

```
Grep docs/ for "database" (case-insensitive)
```

This now returns `docs/postgresql-decision.md`. Claude gives PostgreSQL-specific answers — connection strings, pgBouncer config, Docker setup — without any prompting.

Demonstrate retrieval:

```
Grep docs/ for "database" (case-insensitive)
Read docs/postgresql-decision.md → show full current content including migration context
```

To see the history — when SQLite was the decision — check git:

```
git log --oneline docs/postgresql-decision.md
git show HEAD~1:docs/sqlite-decision.md
```

**Key point**: The knowledge base shows what's true now. Git shows how it got there.

```
> **Autology Tutorial** — Step 4 complete
```

Ask: "Ready for the final step — keeping docs in sync with code?"

**Wait for confirmation before Step 5.**

---

## Step 5: Syncing Docs with Code — /autology:sync

**The scenario**: A developer wrote a migration script at `scripts/migrate-to-pg.sh` but didn't document it. Meanwhile, `postgresql-migration.md` mentions `pgBouncer` but it hasn't been set up yet.

This is doc-code drift. Run the analyzer:

```
Glob docs/*.md → read all nodes
Glob scripts/*.sh → check what files exist
Read docs/postgresql-migration.md → extract factual claims
```

Report what's out of sync:

| Gap | Finding |
|-----|---------|
| Code → No Doc | `scripts/migrate-to-pg.sh` exists but no node documents it |
| Doc ≠ Code | `postgresql-migration.md` mentions pgBouncer but no config exists yet |

Then fix:
1. Capture the migration script: Write `docs/pg-migration-script.md` (type: component)
2. Edit `postgresql-migration.md` → note pgBouncer is planned, not yet implemented

After fixes, run the check again — zero gaps.

```
> **Autology Tutorial** — Step 5 complete
```

**Key point**: `/autology:sync` is the sync check. Run it before commits (fast, changed files only) or with `sync full` for a complete audit.

---

## Tutorial Complete

You've walked through the full Autology loop:

```
Capture → Inject → Retrieve → Update in place → Inject (updated) → Sync → Fix → Repeat
```

The nodes created in this tutorial stay in `docs/`. To remove them:

```
/autology:tutorial reset
```

**Next steps**:
- `/autology:capture` — capture knowledge from real conversations
- `/autology:explore` — triage knowledge items, or explore graph topology (overview, neighborhood, paths)
- `/autology:sync` — find doc-code drift anytime (or `sync full` for complete audit)

---

## Reset Process

When user runs `/autology:tutorial reset`:

1. Grep `docs/` for files containing `tutorial` in their tags frontmatter
2. Delete each with Bash `rm`
3. Confirm: "Cleaned up N tutorial nodes."

---

## Key Principles

1. **One running example**: All 5 steps follow the same scenario (SQLite → PostgreSQL)
2. **Show, don't just tell**: Demonstrate each concept with actual file operations
3. **Wait between steps**: Confirm user is ready before proceeding
4. **Real files**: Create actual nodes in `docs/` — not simulations
5. **Native tools only**: Write, Edit, Read, Grep, Glob, Bash
