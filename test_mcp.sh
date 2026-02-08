#!/bin/bash

# Test the MCP server with JSON-RPC requests

echo "Testing Autology MCP Server"
echo "============================"
echo ""

# Test 1: Initialize
echo "Test 1: Initialize"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./autology 2>/dev/null | jq .
echo ""

# Test 2: List tools
echo "Test 2: List tools"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | ./autology 2>/dev/null | jq .
echo ""

# Test 3: Call status tool
echo "Test 3: Get status"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"autology_status","arguments":{}}}' | ./autology 2>/dev/null | jq -r '.result.content[0].text'
echo ""

echo "Tests complete!"
