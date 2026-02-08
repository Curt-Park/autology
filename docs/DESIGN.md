# autology: Design Document

## Vision

Create a **Living Ontology** system that captures knowledge from AI coding sessions and makes it available for future sessions, solving the "organizational knowledge crisis" in AI-assisted development.

## Core Insight

AI coding agents (Claude Code, Cursor, etc.) dramatically boost productivity but create three problems:

1. **Opacity**: Code changes happen without understanding why
2. **No Accumulation**: Knowledge doesn't persist across sessions
3. **Capability Erosion**: Developers lose understanding of their own codebase

autology solves this with a **bidirectional knowledge loop**:
- **Write**: Automatically capture decisions, patterns, and context
- **Read**: Inject relevant knowledge into new sessions
- **Browse**: Visualize and explore in Obsidian

## Architecture

### Plugin Structure

```
Claude Code Plugin
├── MCP Server        # Knowledge storage and retrieval
├── Hooks             # Automatic capture (Write loop)
│   ├── PostToolUse   # File changes, commits
│   ├── SessionStart  # Knowledge injection (Read loop)
│   └── Stop          # Session summary
├── Skills            # Explicit interaction
│   ├── /capture      # Manual recording
│   └── /explore      # Ontology browsing
└── Agents            # Deep analysis
```

## Success Metrics

MVP complete when:
- ✅ Write: Sessions auto-capture knowledge
- ✅ Browse: `.autology/` opens in Obsidian with graph
- ✅ Read: New sessions get relevant context
- ✅ Coverage: 80%+ test coverage
