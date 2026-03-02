```
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █

  ██  █  █ ████  ██  █     ██   ███ █  █
 █  █ █  █  █   █  █ █    █  █ █    █  █
 ████ █  █  █   █  █ █    █  █ █ ██  ██
 █  █ █  █  █   █  █ █    █  █ █  █  █
 █  █  ██   █    ██  ████  ██   ███  █

█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
```

**Living Ontology for Claude Code**

## The Problem

AI tools have made individual developers dramatically more productive — but organizational knowledge is not keeping up.

As each developer moves faster with AI, decisions, conventions, and context become harder to share. Knowledge stays trapped in individual sessions. Teams repeat the same mistakes. New members onboard from docs that don't exist or are already stale.

## How It Works

```
      SessionStart hook
            │ injects node index into every session
            ↓
       Your Work
      ↗          ↘
graph traversal   capture or sync autonomously
(/autology:explore) (/autology:capture or /autology:sync)
      ↖          ↙
         docs/*.md
```

**Storage**: Obsidian-compatible markdown in `docs/` — flat structure, YAML frontmatter, `[[wikilinks]]`

> **vs. automemory**: automemory is Claude's private, machine-local memory — per-developer, not committed to git, invisible to teammates. Autology is a team knowledge base: typed nodes, `[[wikilinks]]` forming a graph, doc-code sync, and git-committed so knowledge compounds across all developers.

## Skills

### `/autology:capture` — Capture Knowledge

Extracts decisions, conventions, and context from conversation and writes them to `docs/*.md`.

- **Autonomous**: saves without being asked when knowledge is clearly worth capturing
- **Deduplicates**: Grep-checks before creating; updates existing nodes in place
- **Connects**: adds `[[wikilinks]]` to related nodes and updates the reverse links
- **Types**: `decision` · `component` · `convention` · `concept` · `pattern` · `issue` · `session`

```bash
/autology:capture      # extract from current conversation
"remember this"        # triggers automatic capture
```

### `/autology:explore` — Navigate the Knowledge Graph

Traverses the `[[wikilink]]` graph — operations that Grep alone cannot do.

| Mode | Command | Use Case |
|------|---------|----------|
| Graph overview | `/autology:explore` | Hub nodes, orphans, connected components |
| Neighborhood | `/autology:explore <node>` | 2-hop expansion — blast radius before refactoring |
| Path finding | `/autology:explore path A B` | Shortest path between two concepts |

### `/autology:sync` — Keep Docs in Sync

Detects and fixes doc-code drift in-place.

| Mode | Command | Use Case |
|------|---------|----------|
| Fast | `/autology:sync` | Changed files only — run before every commit |
| Full | `/autology:sync full` | Gaps, broken wikilinks, missing links — periodic audit |

## Example

**Scenario**: a team implementing JWT authentication across multiple services.

**Without Autology**:
```
Dev A: implements JWT RS256 in 30 min → reasoning lives only in their session
Dev B: "Why JWT? Why RS256 over HS256?" → no answer in the codebase
Dev C: migrates internal service to HS256 → no record of why RS256 was chosen → rationale lost, change undocumented
New hire: reads stale ADRs that don't match the code
```

**With Autology**:
```
Dev A: implements JWT RS256
→ Claude captures automatically:
  [decision] JWT RS256 — Context (stateless API), Alternatives (sessions, OAuth),
             Consequences (token expiry UX, key rotation ops)
  [convention] Always verify JWT expiry before role check (links to → jwt-decision)

Dev B: new session — "jwt-decision" node injected at start
→ /autology:explore path jwt-decision api-gateway
  → sees: jwt-decision → auth-middleware → api-gateway (2 hops)
→ implements the new service correctly, no re-research needed

Dev C: 3 months later, migrates an internal service to HS256 (simpler for internal-only traffic)
→ updates the code, forgets to update the doc
→ /autology:sync (before committing)
  → finds: code now uses HS256 but docs/jwt-decision.md still says RS256
  → fixes the doc in-place

New hire: full decision chain available at session start, zero onboarding cost
```

## Installation

```bash
/plugin marketplace add Curt-Park/autology
/plugin install autology@autology
```

## Quick Start

```bash
# Learn the full loop (5-step interactive tutorial)
/autology:tutorial

# Capture knowledge from current conversation
/autology:capture

# Explore the knowledge graph
/autology:explore                         # overview: hubs, orphans, components
/autology:explore <node>                  # neighborhood (2-hop expansion)
/autology:explore path <node-a> <node-b>  # path between two concepts

# Sync docs with code
/autology:sync       # fast — changed files only (run before commits)
/autology:sync full  # full audit
```

## Development

```bash
git clone https://github.com/Curt-Park/autology.git
cd autology
claude --plugin-dir .
```

`/autology:tutorial` is the end-to-end test: 5 steps covering capture → inject → retrieve → update → sync. If all complete, the full loop works.

## License

MIT
