#!/bin/bash

API="http://localhost:3000/api"

echo "🧪 Testing API..."
echo ""

# Test 1: Get all tasks
echo "1. GET /api/tasks"
curl -s $API/tasks | jq .
echo ""

# Test 2: Create task
echo "2. POST /api/tasks"
curl -s -X POST $API/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test from VM","priority":"HIGH","description":"Testing deployment"}' \
  | jq .
echo ""

# Test 3: Get statistics
echo "3. GET /api/tasks/stats"
curl -s $API/tasks/stats | jq .
echo ""

echo "✅ Tests completed!"
