# Test Execution Guide

## Philosophy

Test incrementally, not end-to-end. Start with simplest scenarios, measure, iterate.

## Phase 1: Description Verification (5 minutes)

**Goal**: Verify agent description contains trigger keywords

```bash
cat agents/autology-explorer.md | head -5
```

**Check**: Description includes: architecture, decisions, patterns, conventions, impact, gaps, evolution

**Pass Criteria**: All 7 keywords present

## Phase 2: Single Scenario Test (10 minutes)

**Goal**: Verify agent triggers on clearest scenario

**Test**: Scenario 1.2 (Convention Request)

**Steps**:
1. Start fresh Claude Code session
2. Type exactly: "What's our convention for error handling?"
3. Observe Claude's response
4. Record: Did it invoke Task tool with autology-explorer?

**Pass Criteria**: Agent triggered

## Phase 3: Category 1 Full Test (30 minutes)

**Goal**: Test all Architecture/Design scenarios

**Steps**:
1. Copy `results-template.md` to `results-2026-02-09-phase3.md`
2. For each Category 1 scenario (1.1-1.5):
   - Start fresh session
   - Ask query exactly as written
   - Record results in template
3. Calculate Category 1 success rate

**Pass Criteria**: ≥80% success rate in Category 1

## Phase 4: Negative Case Validation (15 minutes)

**Goal**: Verify agent doesn't trigger on non-ontology queries

**Test**: All 5 negative cases (1.5, 2.5, 3.5, 4.5, 5.5)

**Steps**:
1. Test each negative scenario
2. Record if agent incorrectly triggered
3. Calculate false positive rate

**Pass Criteria**: False positive rate <10%

## Phase 5: Full Test Suite (90 minutes)

**Goal**: Complete all 25 scenarios

**Steps**:
1. Copy template to `results-2026-02-09-full.md`
2. Test all scenarios systematically
3. Take breaks between categories
4. Record observations and patterns

**Pass Criteria**:
- Overall success rate ≥80%
- False positive rate <10%
- Tool selection accuracy ≥90%

## Recording Results

### For Each Scenario

1. **Start Fresh**: New Claude Code session or `/clear`
2. **Ask Verbatim**: Copy exact query from scenarios.md
3. **Observe**:
   - Did Claude invoke Task tool? (Check for "Launching agent" or similar)
   - What tools did agent use? (Look in agent output)
   - Was response quality good?
4. **Record**:
   - Triggered: YES/NO
   - Tool Used: autology_query/autology_status/etc
   - Correct Tool: YES/NO
   - Notes: Any observations

### Result Template Entry

```markdown
#### Scenario X.Y: [Name]
- **Triggered**: [X] YES [ ] NO
- **Tool Used**: autology_query with type="decision"
- **Correct Tool**: [X] YES [ ] NO
- **Notes**: Agent found 3 relevant decisions, response was comprehensive
```

## Analysis

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

## Iteration Guidelines

If success rate <80%:

1. **Analyze Failures**: Which scenarios failed? Why?
2. **Enhance Description**: Add missing trigger keywords
3. **Retest Failed Scenarios**: Verify improvement
4. **If Still Failing**: Consider:
   - Adding examples to agent instructions
   - Creating multiple specialized agents
   - Restoring hooks for specific triggers
