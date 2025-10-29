#!/bin/bash

echo "=========================================="
echo "Demonstrating LLM Service Errors"
echo "=========================================="
echo ""

echo "1. Getting authentication token..."
TOKEN=$(curl -s -X GET "http://localhost:8000/auth/test-token" | jq -r '.access_token')
echo "Token obtained: ${TOKEN:0:50}..."
echo ""

echo "2. Testing BCM procedure generation (will show LLM errors)..."
echo "Command: curl -X POST http://localhost:8000/bia/process/023d871d-e9dd-4a85-9e10-7980c7bea13a/generate-bcm-procedure"
echo "Headers: Authorization: Bearer [TOKEN]"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST \
  "http://localhost:8000/bia/process/023d871d-e9dd-4a85-9e10-7980c7bea13a/generate-bcm-procedure" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$RESPONSE"
echo ""

echo "=========================================="
echo "This demonstrates that the LLM service has bugs:"
echo "- 'ScoredVector has no attribute metadata'"
echo "- 'Pinecone API key configuration issues'"
echo "=========================================="
