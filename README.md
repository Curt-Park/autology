```
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

```
Individual output ↑↑  +  Shared knowledge accumulation ↓  =  Organizational debt
```

As each developer moves faster with AI, the decisions, conventions, and context behind the code become harder to share. Knowledge stays trapped in individual sessions. Teams repeat the same mistakes. New members can't onboard from docs that don't exist or are already stale.

The bottleneck has shifted: it's no longer how fast one person can produce code — it's how fast a team can accumulate and reuse what they collectively know.

## The Goal

**Match organizational knowledge accumulation to individual productivity gains.**

When AI helps one developer go 10x faster, the team's shared understanding should grow with it — not fall further behind.

## How It Works

Autology captures the "why" behind decisions and feeds it back into future sessions:

```
      SessionStart hook
            │ injects node index + capture instructions
            ↓
       Your Work
      ↗          ↘
read on demand    capture autonomously
(/autology:explore)  (or /autology:capture)
      ↖          ↙
         docs/*.md
```

**Two interaction modes**:
1. **Skills**: `/autology:capture`, `/autology:explore`, `/autology:analyze`, `/autology:tutorial`
2. **Direct**: Claude's native tools (Read/Write/Edit/Grep/Glob) on `docs/*.md`

**Knowledge types**: any descriptive label — common examples: `decision` (ADR format), `component`, `convention`, `concept`, `pattern`, `issue`, `session`

**Storage**: Obsidian-compatible markdown in `docs/` — flat structure, title-based filenames

## Example

**Without Autology**:
```
Dev A (with Claude): implements JWT auth in 30 minutes
→ Context stays in Dev A's session
→ Dev B: "Why JWT? How does this work?" — no answer in the codebase
→ Team repeats the same research next time
```

**With Autology**:
```
Dev A (with Claude): implements JWT auth in 30 minutes
→ Claude captures the decision automatically:
  ADR: Context (stateless microservices), Decision (JWT RS256),
       Alternatives (sessions, OAuth), Consequences (complexity vs scaling)
→ Dev B's next session: sees the decision injected automatically
→ Dev B: /autology:explore authentication → full reasoning, zero onboarding cost
→ Team's shared knowledge grows at the same pace as individual output
```

## Installation

```bash
/plugin marketplace add Curt-Park/autology
/plugin install autology@autology
```

Requires `jq` (`brew install jq` / `sudo apt install jq`).

## Quick Start

```bash
# Learn the model
/autology:tutorial

# Capture knowledge from conversation context
/autology:capture

# Explore the knowledge base
/autology:explore decisions

# Verify doc-code sync
/autology:analyze
```

## Development

```bash
git clone https://github.com/Curt-Park/autology.git
cd autology

# Run locally
claude --plugin-dir .
```

### Testing

Autology has no unit tests — the system is Claude's behavior, not executable code.

`/autology:tutorial` serves as the end-to-end test:

1. **Capture** — writes a real node to `docs/`
2. **SessionStart** — verify the node appears in injected context
3. **Update** — edits the node in place, verify old content is gone
4. **Analyze** — introduces a doc-code gap, verify it's detected and fixed
5. **Reset** — cleans up all tutorial nodes

If all 5 steps complete correctly, the full knowledge loop works.

## Philosophy

AI tools accelerate individuals. Autology accelerates teams.

By automatically capturing what Claude and developers decide, and keeping docs in sync with code, Autology turns individual AI-assisted work into organizational knowledge that anyone can build on — without friction, without manual effort.

**Individuals move fast. Teams compound.**

## License

MIT
