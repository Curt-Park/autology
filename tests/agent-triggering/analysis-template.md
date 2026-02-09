# Agent Triggering Analysis

**Test Completion Date**: YYYY-MM-DD
**Results File**: results-YYYY-MM-DD.md

## Executive Summary

- **Overall Success Rate**: X%
- **False Positive Rate**: X%
- **Tool Selection Accuracy**: X%
- **Decision**: [Continue | Iterate | Restore Hooks]

## Performance by Category

| Category | Success | Notes |
|----------|---------|-------|
| Architecture/Design | X/4 (X%) | |
| Implementation | X/4 (X%) | |
| Quality/Review | X/4 (X%) | |
| Knowledge Gaps | X/4 (X%) | |
| Evolution/Timeline | X/4 (X%) | |

## Success Patterns

### Worked Well

Keywords that consistently triggered:
- [keyword 1]: X/Y scenarios
- [keyword 2]: X/Y scenarios

Query patterns that worked:
- "Why did we..." → 100% trigger rate
- "What's our convention..." → 100% trigger rate

### Failed Patterns

Keywords that didn't trigger:
- [scenario type]: Only X/Y triggered

Query patterns that failed:
- [pattern]: Only X/Y triggered

## Tool Usage Analysis

### Correct Tool Selection

When agent triggered, correct tools used:
- autology_query: X/Y times correct
- autology_status: X/Y times correct
- autology_relate: X/Y times correct

### Incorrect Tool Selection

Cases where wrong tool was used:
- Scenario X.Y: Used [tool] instead of [expected]

## Root Cause Analysis

### Why Triggers Failed

1. **Description Keywords Missing**: [analysis]
2. **Query Ambiguity**: [analysis]
3. **Pattern Matching Limitations**: [analysis]

### Why False Positives Occurred

1. [Scenario]: Triggered because [reason]

## Recommendations

### Immediate Actions

1.
2.
3.

### Description Enhancements

Current:
```
[current description]
```

Proposed:
```
[enhanced description with new keywords]
```

### Alternative Approaches

If success rate is insufficient:

**Option A: Hybrid Approach**
- Keep agents for complex analysis (health, gaps, timeline)
- Restore SessionStart hook for context injection
- Restore PostToolUse for capture suggestions

**Option B: Multi-Agent Specialization**
- Split autology-explorer into specialized agents:
  - autology-architecture (for design questions)
  - autology-quality (for review/consistency)
  - autology-evolution (for timeline/history)

**Option C: Hook Restoration**
- Restore from docs/legacy/hooks-backup-2026-02-09.md
- Accept 90%+ reliability of hook approach
- Document limitations of pattern-matching triggers

## Next Steps

- [ ] Implement recommendations
- [ ] Retest failed scenarios
- [ ] Measure improvement
- [ ] Make final decision on approach
