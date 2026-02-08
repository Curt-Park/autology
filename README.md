# autology

**Living Ontology Plugin for Claude Code**

autology captures and reuses knowledge from AI coding sessions, creating a bidirectional knowledge loop that makes AI-assisted development more transparent and effective.

## Problem

AI coding agents boost productivity but reduce knowledge transparency and developer capability. Code gets written without understanding, decisions happen without documentation, and organizational knowledge doesn't accumulate.

## Solution

autology automatically captures:
- **Decisions**: Architectural choices and design decisions
- **Components**: Code structure and module relationships
- **Conventions**: Coding standards and patterns
- **Concepts**: Domain knowledge and business logic
- **Issues**: Known problems and technical debt

And makes them available:
- **Automatically** via hooks (file changes, commits, session start)
- **Explicitly** via skills (`/autology:capture`, `/autology:explore`)
- **Visually** in Obsidian (graph view, wiki links)

## Installation

```bash
# From your project directory
git clone <autology-repo> .autology-plugin
cd .autology-plugin
npm install
npm run build

# Load the plugin
claude --plugin-dir .autology-plugin
```

## Usage

### Automatic Capture

Knowledge is automatically captured when:
- You edit files (meaningful changes detected)
- You make git commits (decisions recorded)
- You start new sessions (previous knowledge injected)

### Manual Capture

```bash
# Capture a decision
/autology:capture "We chose JWT for auth because it's stateless"

# Explore the ontology
/autology:explore
/autology:explore decisions
```

### Browse in Obsidian

Open `.autology/` as an Obsidian vault to:
- Visualize knowledge graph
- Follow wiki-style links
- Search and filter nodes
- See relationships

## Project Structure

```
autology/
├── packages/mcp-server/     # MCP server (storage + tools)
├── hooks/                   # Auto-capture hooks
├── skills/                  # User-facing skills
├── agents/                  # Specialized agents
└── docs/                    # Documentation
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm run test

# Test with coverage
npm run test:coverage
```

## Status

**Phase 1: ✅ Complete** - Storage layer with Obsidian-compatible markdown
- Core types and validation
- Markdown serialization
- Node CRUD operations
- Graph index
- Search engine
- 80%+ test coverage

**Phase 2: ✅ Complete** - MCP server and tools
- 5 MCP tools (capture, query, relate, status, context)
- Zod validation
- Proper error handling
- Clean TypeScript compilation

**Phase 3: ✅ Complete** - Hooks for automatic capture
- PostToolUse(Write/Edit) hook with debouncing and staleness detection
- PostToolUse(Bash) hook for git commit detection
- SessionStart hook for knowledge injection (Read loop)
- Stop hook for session summaries
- Comprehensive test suite

**Phase 4: ✅ Complete** - Skills for explicit interaction
- `/autology:capture` skill with ADR guidance
- `/autology:explore` skill for natural language queries
- autology-explorer agent for deep analysis

**Phase 5: ✅ Complete** - Auto-classification and full validation
- Heuristic classifier with 7 node types
- Automatic relation inference
- Context-aware relevance scoring
- End-to-end knowledge cycle validated

## 🎯 MVP Complete!

The bidirectional knowledge loop is fully functional:
✅ **Write**: Hooks automatically capture knowledge
✅ **Browse**: Obsidian-compatible markdown with wiki links
✅ **Read**: SessionStart hook injects relevant knowledge
✅ **Test Coverage**: 80%+ with all tests passing

## License

MIT
