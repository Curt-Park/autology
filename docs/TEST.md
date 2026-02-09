# Autology Testing Specification

## Unit & Integration Tests

### Running Tests

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# View coverage report in browser
make coverage-html
```

### Coverage Requirements

- **Minimum**: 80% (statements, branches, functions, lines)
- **Location**: `internal/*/` packages
- **Report**: `coverage.out`

---

## Agent Triggering Tests

### Purpose

Empirically measure whether pattern-matching agent triggering can replace hook-based automation with ≥80% reliability.

### Background

**Previous System**: Hooks with 90%+ triggering reliability
- SessionStart: 100% (always loaded context)
- PostToolUse: ~90% (debounced, staleness checked)
- SessionEnd: 100% (always suggested capture)

**New System**: autology-explorer agent with enhanced description
- Triggers via pattern matching on query content
- No guaranteed triggering, relies on Claude's judgment
- Success depends on description keyword quality

### Hypothesis

**If** agent description contains comprehensive trigger keywords (architecture, decisions, patterns, conventions, impact, gaps, evolution)
**Then** triggering reliability will be ≥80% for ontology-relevant queries
**And** false positive rate will be <10% for non-ontology queries

### Running Agent Tests

```bash
# Quick verification (checks agent description has keywords)
make test-agents

# Full test suite (manual - see execution guide below)
# Follow phases 1-5 in execution guide
```

### Test Structure

25 scenarios across 5 categories:

1. **Architecture & Design** (5 scenarios) - Decision queries, convention requests, pattern discovery
2. **Implementation Guidance** (5 scenarios) - Impact analysis, dependency checks, pattern following
3. **Quality & Review** (5 scenarios) - Consistency checks, similar solutions, convention verification
4. **Knowledge Gaps** (5 scenarios) - Documentation accuracy, missing docs, superseded nodes
5. **Evolution & Timeline** (5 scenarios) - Strategy evolution, project history, decision timelines

Each category: 4 positive cases (should trigger) + 1 negative case (should NOT trigger)

### Success Criteria

| Metric | Target | Minimum Acceptable |
|--------|--------|--------------------|
| Triggering Success Rate | ≥90% | ≥80% |
| False Positive Rate | <5% | <10% |
| Tool Selection Accuracy | ≥95% | ≥90% |

### Decision Framework

| Success Rate | Action |
|--------------|--------|
| ≥80% | ✅ Continue with agent-based approach |
| 60-79% | 🔄 Iterate on description, retest |
| <60% | ⚠️ Consider hybrid or restore hooks |

---

## Test Scenarios

### Category 1: Architecture & Design Questions

#### Scenario 1.1: Direct Decision Query
- **Query**: "Why did we choose this database structure?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with type="decision"
- **Rationale**: Contains "why" + "choose" (decision keywords)

#### Scenario 1.2: Convention Request
- **Query**: "What's our convention for error handling?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with type="convention"
- **Rationale**: Contains "convention" (exact match)

#### Scenario 1.3: Pattern Discovery
- **Query**: "Show me past decisions about API design"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with type="decision", tags filtering "api"
- **Rationale**: Contains "past decisions" + topic area

#### Scenario 1.4: Implicit Architecture Question
- **Query**: "How should I structure the authentication module?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` for related decisions/patterns
- **Rationale**: Requires knowledge of existing architecture

#### Scenario 1.5: Negative Case - Simple Typo Fix
- **Query**: "Fix this typo in the README"
- **Should Trigger**: NO
- **Expected Tool**: None (direct edit)
- **Rationale**: No architectural/design context needed

### Category 2: Implementation Guidance

#### Scenario 2.1: Feature Implementation Start
- **Query**: "I'm adding user authentication, what components will this affect?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` for impact analysis
- **Rationale**: Contains "affect" (impact analysis keyword)

#### Scenario 2.2: Dependency Check
- **Query**: "Before I refactor this, what depends on it?"
- **Should Trigger**: YES
- **Expected Tool**: Graph analysis for dependencies
- **Rationale**: Contains "depends on" (relation keyword)

#### Scenario 2.3: Pattern Following
- **Query**: "What patterns should I follow for this new API endpoint?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with type="pattern"
- **Rationale**: Contains "patterns" + "follow" (convention query)

#### Scenario 2.4: Component Relationship
- **Query**: "How does the auth service connect to the database layer?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` for components + relation analysis
- **Rationale**: Requires understanding of component relations

#### Scenario 2.5: Negative Case - Direct Code Request
- **Query**: "Write a function to validate email addresses"
- **Should Trigger**: NO
- **Expected Tool**: None (direct implementation)
- **Rationale**: No ontology context needed, pure implementation

### Category 3: Quality & Review

#### Scenario 3.1: Consistency Check
- **Query**: "Does this implementation follow our patterns?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` for patterns/conventions
- **Rationale**: Contains "follow" + "patterns" (alignment check)

#### Scenario 3.2: Similar Solutions
- **Query**: "Are there similar solutions I should check?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` for related components/patterns
- **Rationale**: Requires knowledge of existing solutions

#### Scenario 3.3: Convention Verification
- **Query**: "What conventions am I missing in this code?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with type="convention"
- **Rationale**: Contains "conventions" (direct match)

#### Scenario 3.4: ADR Completeness
- **Query**: "Is this decision documented properly as ADR?"
- **Should Trigger**: YES
- **Expected Tool**: Agent should check ADR format requirements
- **Rationale**: Requires knowledge of ADR structure rules

#### Scenario 3.5: Negative Case - Test Run
- **Query**: "Run the tests to see if they pass"
- **Should Trigger**: NO
- **Expected Tool**: None (direct bash execution)
- **Rationale**: No ontology consultation needed

### Category 4: Knowledge Gaps

#### Scenario 4.1: Documentation Accuracy
- **Query**: "Is this documentation still accurate?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` + status check for superseded nodes
- **Rationale**: Requires checking if knowledge is outdated

#### Scenario 4.2: Missing Documentation
- **Query**: "What's missing from our architectural overview?"
- **Should Trigger**: YES
- **Expected Tool**: Agent gap analysis (`autology_status` + query)
- **Rationale**: Contains "missing" (gap detection keyword)

#### Scenario 4.3: Superseded Decisions
- **Query**: "Do we have any outdated decisions about caching?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with status="superseded"
- **Rationale**: Contains "outdated" (staleness keyword)

#### Scenario 4.4: Orphaned Nodes
- **Query**: "Are there any isolated decisions without connections?"
- **Should Trigger**: YES
- **Expected Tool**: Graph analysis via `autology_query` + relation check
- **Rationale**: Requires graph structure analysis

#### Scenario 4.5: Negative Case - File Search
- **Query**: "Find all TypeScript files in the src directory"
- **Should Trigger**: NO
- **Expected Tool**: Glob tool (file system operation)
- **Rationale**: No ontology needed, pure file search

### Category 5: Evolution & Timeline

#### Scenario 5.1: Strategy Evolution
- **Query**: "How did our testing strategy evolve?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` + timeline analysis
- **Rationale**: Contains "evolve" (temporal keyword)

#### Scenario 5.2: Project History
- **Query**: "What changed since we started this project?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with date sorting
- **Rationale**: Contains "changed" + temporal scope

#### Scenario 5.3: Decision Timeline
- **Query**: "Show me the timeline of database decisions"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` with type="decision" + chronological sort
- **Rationale**: Contains "timeline" (exact match)

#### Scenario 5.4: Supersession Chain
- **Query**: "What replaced our old authentication approach?"
- **Should Trigger**: YES
- **Expected Tool**: `autology_query` for supersedes relations
- **Rationale**: Contains "replaced" (supersession keyword)

#### Scenario 5.5: Negative Case - Git History
- **Query**: "Show me the last 10 commits"
- **Should Trigger**: NO
- **Expected Tool**: Bash with git log
- **Rationale**: Git history, not ontology timeline

---

## Execution Guide

### Philosophy

Test incrementally, not end-to-end. Start with simplest scenarios, measure, iterate.

### Phase 1: Description Verification (5 minutes)

**Goal**: Verify agent description contains trigger keywords

```bash
make test-agents
```

**Check**: Description includes: architecture, decisions, patterns, conventions, impact, gaps, evolution

**Pass Criteria**: All 7 keywords present

### Phase 2: Single Scenario Test (10 minutes)

**Goal**: Verify agent triggers on clearest scenario

**Test**: Scenario 1.2 (Convention Request)

**Steps**:
1. Start fresh Claude Code session
2. Type exactly: "What's our convention for error handling?"
3. Observe Claude's response
4. Record: Did it invoke Task tool with autology-explorer?

**Pass Criteria**: Agent triggered

### Phase 3: Category 1 Full Test (30 minutes)

**Goal**: Test all Architecture/Design scenarios

**Steps**:
1. For each Category 1 scenario (1.1-1.5):
   - Start fresh session
   - Ask query exactly as written
   - Record results
2. Calculate Category 1 success rate

**Pass Criteria**: ≥80% success rate in Category 1

### Phase 4: Negative Case Validation (15 minutes)

**Goal**: Verify agent doesn't trigger on non-ontology queries

**Test**: All 5 negative cases (1.5, 2.5, 3.5, 4.5, 5.5)

**Steps**:
1. Test each negative scenario
2. Record if agent incorrectly triggered
3. Calculate false positive rate

**Pass Criteria**: False positive rate <10%

### Phase 5: Full Test Suite (90 minutes)

**Goal**: Complete all 25 scenarios

**Steps**:
1. Test all scenarios systematically
2. Take breaks between categories
3. Record observations and patterns

**Pass Criteria**:
- Overall success rate ≥80%
- False positive rate <10%
- Tool selection accuracy ≥90%

### Recording Results

**For Each Scenario**:

1. **Start Fresh**: New Claude Code session or `/clear`
2. **Ask Verbatim**: Copy exact query from scenarios
3. **Observe**:
   - Did Claude invoke Task tool?
   - What tools did agent use?
   - Was response quality good?
4. **Record**:
   - Triggered: YES/NO
   - Tool Used: autology_query/autology_status/etc
   - Correct Tool: YES/NO
   - Notes: Any observations

### Analysis

After completing all tests:

1. **Calculate Metrics**:
   ```
   Success Rate = (Correctly Triggered / Should Trigger) × 100%
   False Positive = (Wrong Triggers / Should NOT Trigger) × 100%
   Tool Accuracy = (Correct Tools / Total Triggers) × 100%
   ```

2. **Identify Patterns**:
   - Which keywords work best?
   - Which scenarios consistently fail?
   - Are there category-specific issues?

3. **Decide Next Steps**:
   - Success ≥80%: Proceed with agent approach
   - Success 60-79%: Iterate on description, retest
   - Success <60%: Consider hybrid (agent + hooks) or restore hooks

### Iteration Guidelines

If success rate <80%:

1. **Analyze Failures**: Which scenarios failed? Why?
2. **Enhance Description**: Add missing trigger keywords
3. **Retest Failed Scenarios**: Verify improvement
4. **If Still Failing**: Consider:
   - Adding examples to agent instructions
   - Creating multiple specialized agents
   - Restoring hooks for specific triggers

---

## Backup Plan

If agent triggering proves insufficient (<80% success):

**Hooks Backup**: `docs/legacy/hooks-backup-2026-02-09.md`

Restoration:
```bash
# Restore hooks from legacy backup
git show HEAD:docs/legacy/hooks-backup-2026-02-09.md
# Update hooks/hooks.json with configuration
```

---

## Timeline

- **2026-02-09**: Hooks removed, test framework created
- **2026-02-10**: Phase 1-2 testing (smoke tests)
- **2026-02-11**: Phase 3-5 testing (full suite)
- **2026-02-12**: Analysis and decision
- **2026-02-13**: Implementation of chosen approach

---

## FAQ

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
