# Agent Triggering Test Framework

## Purpose

Measure autology-explorer agent triggering reliability across different query categories.

## Test Structure

1. **Scenarios** (`scenarios.md`): 25 test cases across 5 categories
2. **Execution**: Manual testing in clean Claude Code sessions
3. **Results**: Record in `results-YYYY-MM-DD.md`

## Success Criteria

- **Minimum acceptable**: 80% triggering accuracy
- **Target**: 90% triggering accuracy
- **False positives**: <10%

## Methodology

For each scenario:
1. Start fresh Claude Code session
2. Ask the test question exactly as written
3. Observe if autology-explorer triggers
4. Record: Triggered (Y/N), Correct Tool Usage (Y/N), Notes

## Analysis

Calculate:
- Triggering Success Rate = (Correct Triggers / Should Trigger) × 100%
- False Positive Rate = (Incorrect Triggers / Should NOT Trigger) × 100%
- Tool Selection Accuracy = (Correct Tool / Total Triggers) × 100%
