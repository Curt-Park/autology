# Autology

**Living Ontology for Claude Code**

## The Crisis

AI agents boost productivity but create a paradox:

```
Productivity ↑ + Transparency ↓ + Knowledge Accumulation ↓ = Crisis of Understanding
```

Developers don't fully understand AI-generated code. Teams can't track what's actually happening. Organizations repeat mistakes. Skills atrophy.

## The Goal

**Maintain AI productivity while expanding, not contracting, human understanding.**

Not "code faster"—but "understand deeper while coding faster."

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
Dev: "Claude, add authentication"
→ Code appears. Dev: "Looks good" (doesn't understand JWT)
→ Next dev: "Why JWT?" (no answer)
```

**With Autology**:
```
Dev: "Claude, add authentication"
→ Code appears
→ /autology:capture
→ ADR: Context (stateless microservices), Decision (JWT RS256),
       Alternatives (sessions, OAuth), Consequences (complexity vs scaling)
→ Next session: SessionStart injects the decision automatically
→ Next dev: /autology:explore authentication → sees full reasoning
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

When AI writes code, humans should **understand more, not less**.

When productivity increases, knowledge should **compound, not evaporate**.

When decisions are made, reasoning should be **transparent, not opaque**.

Autology ensures AI serves human intelligence, not replaces it.

## License

MIT
