#!/bin/bash
# Test script for autology hooks

set -euo pipefail

echo "Testing autology hooks..."
echo "========================="
echo ""

# Test 1: post-write-edit.sh with a TypeScript file
echo "Test 1: Post Write/Edit Hook (TypeScript file)"
echo "-----------------------------------------------"
TEST_DATA_1='{
  "toolCall": {
    "name": "Write",
    "params": {
      "file_path": "src/test.ts",
      "content": "console.log(\"test\");"
    }
  },
  "result": {}
}'

echo "$TEST_DATA_1" | hooks/scripts/post-write-edit.sh | jq .
echo ""

# Test 2: post-write-edit.sh with excluded file
echo "Test 2: Post Write/Edit Hook (Excluded file - node_modules)"
echo "------------------------------------------------------------"
TEST_DATA_2='{
  "toolCall": {
    "name": "Write",
    "params": {
      "file_path": "node_modules/test/index.js",
      "content": "test"
    }
  },
  "result": {}
}'

echo "$TEST_DATA_2" | hooks/scripts/post-write-edit.sh | jq .
echo ""

# Test 3: post-commit.sh with git commit
echo "Test 3: Post Commit Hook (Feature commit)"
echo "------------------------------------------"
TEST_DATA_3='{
  "toolCall": {
    "name": "Bash",
    "params": {
      "command": "git commit -m \"feat: add new authentication system\""
    }
  },
  "result": {}
}'

echo "$TEST_DATA_3" | hooks/scripts/post-commit.sh | jq .
echo ""

# Test 4: post-commit.sh with non-git command
echo "Test 4: Post Commit Hook (Non-git command)"
echo "-------------------------------------------"
TEST_DATA_4='{
  "toolCall": {
    "name": "Bash",
    "params": {
      "command": "npm install"
    }
  },
  "result": {}
}'

echo "$TEST_DATA_4" | hooks/scripts/post-commit.sh | jq .
echo ""

# Test 5: session-start.sh without .autology
echo "Test 5: Session Start Hook (No ontology)"
echo "-----------------------------------------"
# Temporarily hide .autology if it exists
if [ -d ".autology" ]; then
  mv .autology .autology.bak
fi

hooks/scripts/session-start.sh | jq .

# Restore .autology
if [ -d ".autology.bak" ]; then
  mv .autology.bak .autology
fi
echo ""

# Test 6: session-start.sh with .autology
echo "Test 6: Session Start Hook (With ontology)"
echo "-------------------------------------------"
if [ -d ".autology" ]; then
  hooks/scripts/session-start.sh | jq .
else
  echo "Skipped - no .autology directory"
fi
echo ""

echo "========================="
echo "All hook tests completed!"
