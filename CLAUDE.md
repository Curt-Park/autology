# Autology Development Rules

## Documentation-Code Sync (CRITICAL)

**Documentation and code must always be synchronized.**

### Documentation Organization

Documentation lives as autology nodes in `docs/`. Use tag-based queries to find relevant docs:

| Change Type | Discovery |
|-------------|-----------|
| Goals, principles | `autology_query { "tags": ["philosophy"] }` |
| Specification | `autology_query { "tags": ["spec"] }` |
| Usage, workflows | `autology_query { "tags": ["guide"] }` |
| Internals | `autology_query { "tags": ["internals"] }` |
| Triggering | `autology_query { "tags": ["triggering"] }` |

### When to Update Documentation

| Change Type | Query Tags |
|-------------|-----------|
| Goals, principles, problems | `philosophy` |
| Types, schemas, tools | `spec` |
| Skills, workflows, examples | `guide` |
| Algorithms, storage, internals | `internals` |

**Don't update**: Internal refactoring, bug fixes, optimizations (same behavior)

### Protocol

```
Code change → Update docs → Verify → Commit all
Doc change → Update code → Test → Commit all
```

## Change Impact Assessment

**Lesson from PR #19**: Manual discovery misses references. Use systematic search.

**Step 1: Find all references**
```bash
grep -r "COMPONENT_NAME" docs/ agents/ skills/ --include="*.md"
```

**Step 2: Update or justify**
- Update if stale
- Document why still valid if keeping

**Step 3: Check conceptual impacts**
```bash
# Example: Use grep or autology_query to find related concepts
grep -i "CONCEPT" docs/ --include="*.md" -r
```

**Step 4: Verify implementation matches docs**
```bash
# Example: Compare tool count in spec vs code
# Use autology_query to find relevant spec nodes, then compare with code
grep "s.tools\[" internal/mcp/server.go  # Count actual tools
```

## Pre-Commit Verification

**Reality**: Static scripts can't verify semantic correctness. **Humans must verify docs accurately describe code.**

**Before `git commit`**:

```bash
# 1. No placeholders
grep -r '\[TBD\]\|\[TODO\]\|FIXME' docs/ agents/
# Expected: No results

# 2. No stale references (replace REMOVED_FEATURE)
grep -r "REMOVED_FEATURE" docs/ agents/
# Expected: No results

# 3. Build succeeds
go build -o .claude-plugin/bin/autology ./cmd/autology

# 4. Tests pass
make check

# 5. Semantic accuracy (CRITICAL - Manual only)
# Read updated docs - do they accurately describe implementation?
```

**Check 5 cannot be automated.** Verify in code review.

## Code Review Requirements

**Reviewer checklist** (verify doc-code sync):

```bash
/review checck the code and docs are well-synchronized
```

**What to verify**:

1. **Philosophy nodes** (tag: `philosophy`): Core concepts still accurate?
2. **Spec nodes** (tag: `spec`): Tool signatures, schemas match implementation?
3. **Guide nodes** (tag: `guide`): Examples actually work with current code?
4. **No duplication drift**: Tutorial steps in skills/ match guide nodes?
5. **Conceptual correctness**: Does doc lie? ("automatic" but actually manual?)

**Automation limit**: Checks 1-4 partially scriptable, **Check 5 requires human judgment.**

## Philosophy

Every change must preserve:
1. **Transparency**: Can users trace AI decisions?
2. **Accumulation**: Does knowledge compound?
3. **Understanding**: Do humans learn more?
4. **Immutability**: Are mutations prevented?

---

**The spec is a contract. Code violating spec is wrong.**
