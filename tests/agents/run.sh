#!/bin/bash

# Quick verification that agent description has trigger keywords

echo "=== Agent Triggering Quick Test ==="
echo ""

# Find repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
    echo "❌ ERROR: Not in a git repository"
    exit 1
fi

AGENT_FILE="$REPO_ROOT/agents/autology-explorer.md"
KEYWORDS=("architecture" "decisions" "patterns" "conventions" "impact" "gaps" "evolution")

if [ ! -f "$AGENT_FILE" ]; then
    echo "❌ ERROR: $AGENT_FILE not found"
    exit 1
fi

echo "📄 Agent Description:"
echo "---"
head -5 "$AGENT_FILE" | grep "description:"
echo "---"
echo ""

echo "🔍 Checking for trigger keywords..."
echo ""

FOUND=0
TOTAL=${#KEYWORDS[@]}

for keyword in "${KEYWORDS[@]}"; do
    if head -5 "$AGENT_FILE" | grep -qi "$keyword"; then
        echo "✅ Found: $keyword"
        ((FOUND++))
    else
        echo "❌ Missing: $keyword"
    fi
done

echo ""
echo "📊 Results: $FOUND/$TOTAL keywords present"
echo ""

if [ $FOUND -ge 6 ]; then
    echo "✅ PASS: Agent description has sufficient trigger keywords"
    exit 0
else
    echo "❌ FAIL: Agent description needs more trigger keywords"
    exit 1
fi
