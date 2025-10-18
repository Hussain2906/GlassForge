#!/bin/bash

# Glass Calculation System API Test Script
# This script tests all the new endpoints

BASE_URL="http://localhost:3001"
ORG_ID="cmgwcxblp0000ykrkiq0iaq05"  # From seed output

echo "=========================================="
echo "Glass Calculation System API Tests"
echo "=========================================="
echo ""

# Test 1: List Glass Rates
echo "Test 1: List Glass Rates"
echo "GET /api/v1/admin/glass-rates"
curl -s "${BASE_URL}/api/v1/admin/glass-rates" \
  -H "X-Org-Id: ${ORG_ID}" | jq '.' || echo "Failed"
echo ""
echo ""

# Test 2: List Process Masters
echo "Test 2: List Process Masters"
echo "GET /api/v1/admin/process-master"
curl -s "${BASE_URL}/api/v1/admin/process-master" \
  -H "X-Org-Id: ${ORG_ID}" | jq '.' || echo "Failed"
echo ""
echo ""

# Test 3: Calculate Line Item (Simple - mm input)
echo "Test 3: Calculate Line Item (mm input)"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "widthMm": 609.6,
    "heightMm": 914.4,
    "quantity": 2
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 4: Calculate Line Item (inch input)
echo "Test 4: Calculate Line Item (inch input)"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "widthInch": 24,
    "heightInch": 36,
    "quantity": 2
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 5: Calculate Line Item with Processes
echo "Test 5: Calculate Line Item with Processes"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "widthInch": 24,
    "heightInch": 36,
    "quantity": 2,
    "processes": [
      { "processCode": "BP" },
      { "processCode": "TMP" }
    ]
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 6: Calculate Line Item with Override Rate
echo "Test 6: Calculate Line Item with Override Rate"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "widthInch": 24,
    "heightInch": 36,
    "quantity": 2,
    "processes": [
      { "processCode": "BP" },
      { "processCode": "TMP", "overrideRate": 90 }
    ]
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 7: Calculate with Different Glass Type
echo "Test 7: Calculate with Tinted Glass"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 6,
    "glassType": "Tinted",
    "widthInch": 30,
    "heightInch": 48,
    "quantity": 1,
    "processes": [
      { "processCode": "EDG" }
    ]
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 8: Calculate with Fixed Process (Hole Drilling)
echo "Test 8: Calculate with Fixed Process"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "widthInch": 24,
    "heightInch": 36,
    "quantity": 3,
    "processes": [
      { "processCode": "HOLE" }
    ]
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 9: Validation Test - Missing dimensions
echo "Test 9: Validation Test (should fail)"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "quantity": 2
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 10: Validation Test - Invalid quantity
echo "Test 10: Validation Test - Invalid Quantity (should fail)"
echo "POST /api/v1/orders/calculate-line"
curl -s -X POST "${BASE_URL}/api/v1/orders/calculate-line" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: ${ORG_ID}" \
  -d '{
    "thicknessMm": 5,
    "glassType": "Clear Float",
    "widthInch": 24,
    "heightInch": 36,
    "quantity": 0
  }' | jq '.' || echo "Failed"
echo ""
echo ""

echo "=========================================="
echo "All Tests Completed!"
echo "=========================================="
