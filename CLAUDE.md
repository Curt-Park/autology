# Autology Development Rules

## Documentation-Code Sync (CRITICAL)

**Documentation and code must always be synchronized.**

### Four Documentation Levels

1. **`docs/PHILOSOPHY.md`** - Why we exist (goals, principles)
2. **`docs/SPEC.md`** - What we implement (types, tools, schemas)
3. **`docs/GUIDE.md`** - How users interact (skills, workflows)
4. **`docs/MCP.md`** - How it works internally (algorithms, storage)

### When to Update Each Doc

| Change Type | Update |
|-------------|--------|
| Goals, principles, problems | PHILOSOPHY.md |
| Types, tool signatures, schemas, agents | SPEC.md |
| Skills, workflows, examples | GUIDE.md |
| Algorithms, storage, internals | MCP.md |

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
# Example: Removing hooks → "Bidirectional Loop" concept changed
grep -i "loop\|flow" docs/PHILOSOPHY.md
```

**Step 4: Verify implementation matches docs**
```bash
# Example: MCP tools count
grep "autology_" agents/*.md              # What docs claim
grep "s.tools\[" internal/mcp/server.go   # What code has
# These MUST match!
```

## Pre-Commit Verification

**Reality**: Static scripts can't verify semantic correctness. **Humans must verify docs accurately describe code.**

**Before `git commit`**:

```bash
# 1. No placeholders
grep -r '\[TBD\]\|\[TODO\]\|FIXME' docs/ agents/ --exclude-dir=legacy
# Expected: No results

# 2. No stale references (replace REMOVED_FEATURE)
grep -r "REMOVED_FEATURE" docs/ agents/
# Expected: No results

# 3. Build succeeds
go build -o .claude-plugin/bin/autology ./cmd/autology

# 4. Tests pass
go test ./internal/...

# 5. Semantic accuracy (CRITICAL - Manual only)
# Read updated docs - do they accurately describe implementation?
```

**Check 5 cannot be automated.** Verify in code review.

## Code Review Requirements

**Reviewer checklist** (verify doc-code sync):

```bash
/review spec과 구현이 잘 동기화 되어있는지 면밀히 검토
```

**What to verify**:

1. **PHILOSOPHY.md**: Core concepts (Loop, Flow, Principle) still accurate?
2. **SPEC.md vs code**:
   - `grep "s.tools\[" internal/mcp/server.go` count = SPEC.md tool count?
   - `internal/storage/types.go` types = SPEC.md types?
3. **GUIDE.md**: Examples actually work with current code?
4. **No duplication drift**: Tutorial steps in SPEC.md, GUIDE.md, skills/ all match?
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
