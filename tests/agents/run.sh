#!/bin/bash

# Agent Triggering Test Runner
# Tests if autology-explorer agent triggers on key scenarios

set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
    echo "❌ ERROR: Not in a git repository"
    exit 1
fi

RESULTS_FILE="$REPO_ROOT/tests/agents/results-$(date +%Y%m%d-%H%M%S).txt"

echo "=== Agent Triggering Test Suite ==="
echo ""
echo "Testing if autology-explorer agent triggers on key scenarios"
echo "Results will be saved to: $RESULTS_FILE"
echo ""

# Key scenarios to test (from docs/TEST.md)
declare -a SCENARIOS=(
    "1.2|Convention Request|What's our convention for error handling?|YES"
    "1.1|Direct Decision Query|Why did we choose this database structure?|YES"
    "2.1|Feature Impact|I'm adding user authentication, what components will this affect?|YES"
    "3.1|Consistency Check|Does this implementation follow our patterns?|YES"
    "1.5|Negative - Typo Fix|Fix this typo in the README|NO"
)

TOTAL=${#SCENARIOS[@]}
PASSED=0
FAILED=0

echo "📋 Testing $TOTAL scenarios..."
echo ""

# Initialize results file
cat > "$RESULTS_FILE" <<EOF
Agent Triggering Test Results
Date: $(date)
Repository: $REPO_ROOT

EOF

for scenario in "${SCENARIOS[@]}"; do
    IFS='|' read -r id name query should_trigger <<< "$scenario"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 Scenario $id: $name"
    echo "Expected: Agent should $([[ "$should_trigger" == "YES" ]] && echo "TRIGGER" || echo "NOT trigger")"
    echo ""
    echo "Query to test:"
    echo "  \"$query\""
    echo ""
    echo "Instructions:"
    echo "  1. Open a NEW Claude Code session (or run: /clear)"
    echo "  2. Paste the query above"
    echo "  3. Observe if autology-explorer agent is invoked"
    echo ""

    read -p "Did the agent trigger? [y/n/skip]: " response

    case $response in
        y|Y)
            actual="YES"
            ;;
        n|N)
            actual="NO"
            ;;
        s|S|skip)
            echo "⏭️  Skipped"
            echo ""
            echo "Scenario $id: $name" >> "$RESULTS_FILE"
            echo "  Query: $query" >> "$RESULTS_FILE"
            echo "  Expected: $should_trigger | Actual: SKIPPED" >> "$RESULTS_FILE"
            echo "" >> "$RESULTS_FILE"
            continue
            ;;
        *)
            echo "❌ Invalid input, marking as skipped"
            echo ""
            continue
            ;;
    esac

    # Record result
    echo "Scenario $id: $name" >> "$RESULTS_FILE"
    echo "  Query: $query" >> "$RESULTS_FILE"
    echo "  Expected: $should_trigger | Actual: $actual" >> "$RESULTS_FILE"

    # Check if result matches expectation
    if [[ "$actual" == "$should_trigger" ]]; then
        echo "✅ PASS - Agent behavior matched expectation"
        ((PASSED++))
        echo "  Result: PASS" >> "$RESULTS_FILE"
    else
        echo "❌ FAIL - Agent behavior did NOT match expectation"
        ((FAILED++))
        echo "  Result: FAIL" >> "$RESULTS_FILE"
    fi

    # Add notes
    read -p "Add notes (optional, press Enter to skip): " notes
    if [[ -n "$notes" ]]; then
        echo "  Notes: $notes" >> "$RESULTS_FILE"
    fi

    echo "" >> "$RESULTS_FILE"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Total Scenarios: $TOTAL"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "  Skipped: $((TOTAL - PASSED - FAILED))"
echo ""

# Calculate success rate
if [[ $((PASSED + FAILED)) -gt 0 ]]; then
    SUCCESS_RATE=$((PASSED * 100 / (PASSED + FAILED)))
    echo "  Success Rate: $SUCCESS_RATE%"
    echo ""

    # Write summary to results file
    cat >> "$RESULTS_FILE" <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Scenarios: $TOTAL
Passed: $PASSED
Failed: $FAILED
Skipped: $((TOTAL - PASSED - FAILED))
Success Rate: $SUCCESS_RATE%

Decision:
EOF

    # Decision framework
    if [[ $SUCCESS_RATE -ge 80 ]]; then
        echo "  ✅ Decision: Continue with agent-based approach (≥80%)"
        echo "  ✅ Continue with agent-based approach (≥80%)" >> "$RESULTS_FILE"
    elif [[ $SUCCESS_RATE -ge 60 ]]; then
        echo "  🔄 Decision: Iterate on description, retest (60-79%)"
        echo "  🔄 Iterate on description, retest (60-79%)" >> "$RESULTS_FILE"
    else
        echo "  ⚠️  Decision: Consider hybrid or restore hooks (<60%)"
        echo "  ⚠️  Consider hybrid or restore hooks (<60%)" >> "$RESULTS_FILE"
    fi
fi

echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""
echo "To run full test suite (25 scenarios), see: docs/TEST.md"
echo ""
