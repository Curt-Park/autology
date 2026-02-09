# Agent Triggering Test Framework

## Purpose

Empirically measure whether pattern-matching agent triggering can replace hook-based automation with ≥80% reliability.

## Background

**Previous System**: Hooks with 90%+ triggering reliability
- SessionStart: 100% (always loaded context)
- PostToolUse: ~90% (debounced, staleness checked)
- SessionEnd: 100% (always suggested capture)

**New System**: autology-explorer agent with enhanced description
- Triggers via pattern matching on query content
- No guaranteed triggering, relies on Claude's judgment
- Success depends on description keyword quality

## Hypothesis

**If** agent description contains comprehensive trigger keywords (architecture, decisions, patterns, conventions, impact, gaps, evolution)
**Then** triggering reliability will be ≥80% for ontology-relevant queries
**And** false positive rate will be <10% for non-ontology queries

## Test Structure

### 25 Scenarios Across 5 Categories

1. **Architecture & Design** (5 scenarios)
   - Decision queries, convention requests, pattern discovery

2. **Implementation Guidance** (5 scenarios)
   - Impact analysis, dependency checks, pattern following

3. **Quality & Review** (5 scenarios)
   - Consistency checks, similar solutions, convention verification

4. **Knowledge Gaps** (5 scenarios)
   - Documentation accuracy, missing docs, superseded nodes

5. **Evolution & Timeline** (5 scenarios)
   - Strategy evolution, project history, decision timelines

Each category includes 4 positive cases (should trigger) and 1 negative case (should NOT trigger).

## Files

- `scenarios.md` - All 25 test scenarios with expected behavior
- `results-template.md` - Template for recording results
- `EXECUTION.md` - Step-by-step testing guide
- `analysis-template.md` - Post-test analysis framework
- `quick-test.sh` - Verify agent description has keywords

## Execution Phases

**Phase 1** (5 min): Description verification
**Phase 2** (10 min): Single scenario smoke test
**Phase 3** (30 min): Full Category 1 test
**Phase 4** (15 min): Negative case validation
**Phase 5** (90 min): Complete 25-scenario suite

## Success Criteria

| Metric | Target | Minimum Acceptable |
|--------|--------|--------------------|
| Triggering Success Rate | ≥90% | ≥80% |
| False Positive Rate | <5% | <10% |
| Tool Selection Accuracy | ≥95% | ≥90% |

## Decision Framework

| Success Rate | Action |
|--------------|--------|
| ≥80% | ✅ Continue with agent-based approach |
| 60-79% | 🔄 Iterate on description, retest |
| <60% | ⚠️ Consider hybrid or restore hooks |

## Running Tests

### Quick Verification

```bash
./quick-test.sh
```

### Full Test Execution

1. Read `EXECUTION.md` for detailed steps
2. Copy `results-template.md` to `results-YYYY-MM-DD.md`
3. Execute tests incrementally (phases 1-5)
4. Record all observations
5. Calculate metrics
6. Use `analysis-template.md` for post-test analysis

### Recording Results

For each scenario:
- Start fresh Claude Code session
- Ask query verbatim from scenarios.md
- Observe if Task tool invoked
- Record triggered Y/N, tools used, notes

## Analysis

After testing:

1. Calculate success rate, false positive rate, tool accuracy
2. Identify patterns (what worked, what failed)
3. Perform root cause analysis
4. Make recommendations
5. Decide: continue, iterate, or restore hooks

## Backup Plan

If agent triggering proves insufficient (<80% success):

**Hooks Backup**: `docs/legacy/hooks-backup-2026-02-09.md`

Restoration:
```bash
# Restore hooks.json
git checkout docs/legacy/hooks-backup-2026-02-09.md
# Extract configuration
# Update hooks/hooks.json
```

## Timeline

- **2026-02-09**: Hooks removed, test framework created
- **2026-02-10**: Phase 1-2 testing (smoke tests)
- **2026-02-11**: Phase 3-5 testing (full suite)
- **2026-02-12**: Analysis and decision
- **2026-02-13**: Implementation of chosen approach

## Questions

**Why test incrementally?**
- Catch description issues early
- Iterate quickly on failures
- Avoid wasting time on full suite if fundamentals broken

**Why 80% threshold?**
- 10-20% manual fallback is acceptable (users can explicitly request)
- Much lower than hooks (90%+) but acceptable for pattern-matching
- Below 80%, user experience degrades significantly

**Why separate negative cases?**
- False positives are costly (unnecessary agent overhead)
- Must verify agent doesn't trigger on irrelevant queries
- Different failure mode than missed triggers
