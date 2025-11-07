#!/bin/bash

# Docker Setup Validation Script
# This script helps users verify their Docker deployment is working correctly

set -e

echo "========================================="
echo "Google Drive Clone - Docker Validation"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
tests_passed=0
tests_failed=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((tests_passed++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((tests_failed++))
    fi
}

echo "Running validation tests..."
echo ""

# Test 1: Check if Docker is installed
echo "Test 1: Docker Installation"
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    test_result 0 "Docker is installed ($docker_version)"
else
    test_result 1 "Docker is not installed"
fi
echo ""

# Test 2: Check if Docker Compose is installed
echo "Test 2: Docker Compose Installation"
if docker compose version &> /dev/null; then
    compose_version=$(docker compose version)
    test_result 0 "Docker Compose is available ($compose_version)"
else
    test_result 1 "Docker Compose is not available"
fi
echo ""

# Test 3: Check if Docker daemon is running
echo "Test 3: Docker Daemon Status"
if docker info &> /dev/null; then
    test_result 0 "Docker daemon is running"
else
    test_result 1 "Docker daemon is not running"
    echo -e "${YELLOW}   Try: sudo systemctl start docker${NC}"
fi
echo ""

# Test 4: Check if .env file exists
echo "Test 4: Environment Configuration"
if [ -f .env ]; then
    test_result 0 ".env file exists"
else
    test_result 1 ".env file not found"
    echo -e "${YELLOW}   Run: ./setup.sh to create .env file${NC}"
fi
echo ""

# Test 5: Check if containers are running
echo "Test 5: Container Status"
if docker compose ps | grep -q "google-drive"; then
    running_containers=$(docker compose ps --format "table {{.Name}}\t{{.Status}}" | grep -c "Up" || echo "0")
    if [ "$running_containers" -eq 3 ]; then
        test_result 0 "All 3 containers are running"
    else
        test_result 1 "Not all containers are running ($running_containers/3)"
        echo -e "${YELLOW}   Run: docker compose up -d${NC}"
    fi
else
    test_result 1 "No containers found"
    echo -e "${YELLOW}   Run: ./setup.sh to start containers${NC}"
fi
echo ""

# Test 6: Check MongoDB health
echo "Test 6: MongoDB Health"
if docker compose ps | grep mongodb | grep -q "healthy"; then
    test_result 0 "MongoDB is healthy"
else
    test_result 1 "MongoDB is not healthy"
    echo -e "${YELLOW}   Check logs: docker compose logs mongodb${NC}"
fi
echo ""

# Test 7: Check Backend health
echo "Test 7: Backend Health"
if docker compose ps | grep backend | grep -q "healthy"; then
    test_result 0 "Backend is healthy"
else
    test_result 1 "Backend is not healthy"
    echo -e "${YELLOW}   Check logs: docker compose logs backend${NC}"
fi
echo ""

# Test 8: Check Frontend status
echo "Test 8: Frontend Status"
if docker compose ps | grep frontend | grep -q "Up"; then
    test_result 0 "Frontend is running"
else
    test_result 1 "Frontend is not running"
    echo -e "${YELLOW}   Check logs: docker compose logs frontend${NC}"
fi
echo ""

# Test 9: Test Backend API
echo "Test 9: Backend API Response"
if curl -s http://localhost:8001/api/ | grep -q "Hello World"; then
    test_result 0 "Backend API is responding correctly"
else
    test_result 1 "Backend API is not responding"
    echo -e "${YELLOW}   Try: curl http://localhost:8001/api/${NC}"
fi
echo ""

# Test 10: Test Frontend accessibility
echo "Test 10: Frontend Accessibility"
if curl -s http://localhost:3000 | grep -q "<!doctype html>"; then
    test_result 0 "Frontend is accessible"
else
    test_result 1 "Frontend is not accessible"
    echo -e "${YELLOW}   Try opening: http://localhost:3000${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "Validation Summary"
echo "========================================="
echo -e "${GREEN}Tests Passed: $tests_passed${NC}"
echo -e "${RED}Tests Failed: $tests_failed${NC}"
echo ""

if [ $tests_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your Docker deployment is working correctly.${NC}"
    echo ""
    echo "You can now access the application at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8001"
    echo "  API Docs: http://localhost:8001/docs"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Run: ./setup.sh to set up the environment"
    echo "  2. Check logs: docker compose logs"
    echo "  3. Restart: docker compose restart"
    echo "  4. See: TROUBLESHOOTING.md for detailed help"
    exit 1
fi
