# Autology Development Rules

## Documentation-Code Sync (CRITICAL)

**Documentation and code must always be synchronized.**

### Four Documentation Levels

1. **`docs/PHILOSOPHY.md`** - Why we exist
2. **`docs/SPEC.md`** - What we implement
3. **`docs/GUIDE.md`** - How users interact
4. **`docs/MCP.md`** - How it works internally

### When to Update `docs/PHILOSOPHY.md`

**Must update**:
- Project goals changed
- Core principles changed
- Target problems changed
- Success criteria changed

### When to Update `docs/SPEC.md`

**Must update**:
- Node/relation/status types changed
- MCP tool signature changed
- Validation rules changed
- Hook behavior changed
- Data model (KnowledgeNode schema) changed
- Storage format changed

### When to Update `docs/GUIDE.md`

**Must update**:
- Skill behavior changed
- Hook triggers changed
- MCP tool usage changed
- Workflow examples changed

### When to Update `docs/MCP.md`

**Must update**:
- Search/ranking algorithm changed
- Classification patterns/rules changed
- Relation inference logic changed
- Storage implementation changed
- Performance characteristics changed
- Internal data flow changed

**Don't update (any doc)**:
- Internal refactoring (same behavior)
- Bug fixes (restoring spec behavior)
- Performance optimizations

### Protocol

```
Code change → Update docs → Run tests → Commit all
Doc change → Update code → Update tests → Verify → Commit all
```

## Verification

```bash
go build -o .claude-plugin/bin/autology ./cmd/autology  # Must succeed
go test ./internal/...                                   # Must pass
```

## Type System

### Immutability (CRITICAL)

All data structures must be immutable. Never mutate existing objects.

### Core Types

Defined in `internal/storage/types.go`:
- **NODE_TYPES**: 7 types (decision, component, convention, concept, pattern, issue, session)
- **NODE_STATUSES**: 3 states (active, needs_review, superseded)
- **RELATION_TYPES**: 7 relations (affects, uses, supersedes, relates_to, implements, depends_on, derived_from)

Adding types requires updates in:
1. `internal/storage/types.go`
2. `docs/SPEC.md`
3. `internal/classification/heuristics.go`
4. `internal/storage/node-store.go`

## File Organization

- **Target**: 200-400 lines per file
- **Hard limit**: 800 lines
- **Rule**: One concern per file

## Testing

**Minimum**: 80% coverage (statements, branches, functions, lines)

```bash
go test -cover ./internal/...
```

## Error Handling

Use custom errors from `internal/storage/errors.go`:
- `ValidationError` - Invalid input with field details
- `NotFoundError` - Node doesn't exist with ID
- `StorageError` - File system issues with path

## ADR Format

Every `decision` node requires:
1. **Context**: Why?
2. **Decision**: What?
3. **Alternatives**: What else?
4. **Consequences**: Implications?

## Obsidian Compatibility

Required:
- YAML frontmatter with all fields
- Wiki-style `[[links]]` for relations
- Valid markdown content
- UTF-8 encoding

## Pull Request Guidelines

**Always read `.github/PULL_REQUEST_TEMPLATE.md` before creating PRs.**

Structure (max 30 lines):
1. **Background**: Why is this change needed?
2. **Goal**: What does this PR achieve?
3. **Key Changes**: Bullet points of main changes
4. **Verification**: How to verify it works

Example verification:
```bash
go build -o .claude-plugin/bin/autology ./cmd/autology
go test ./internal/...
```

## Pre-Commit Checklist

```bash
go build -o .claude-plugin/bin/autology ./cmd/autology && go test ./internal/...

# Did you update documentation?
# - PHILOSOPHY.md: If goals/principles changed
# - SPEC.md: If types/tools/hooks/schema changed
# - GUIDE.md: If skills/workflows/usage changed

git commit -m "type: description"
```

## Philosophy

Every change must preserve:
1. **Transparency**: Can users trace AI decisions?
2. **Accumulation**: Does knowledge compound?
3. **Understanding**: Do humans learn more?
4. **Immutability**: Are mutations prevented?

---

**The spec is a contract, not documentation. Code violating spec is wrong.**
