#!/bin/bash

# Dependency Validation Script
# Tests all dependencies and Docker configuration

echo "========================================="
echo "Google Drive Clone - Dependency Validator"
echo "========================================="
echo ""

errors=0
warnings=0

# Check Docker
echo "1. Checking Docker..."
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    echo "   ✓ Docker found: $docker_version"
else
    echo "   ✗ Docker not found"
    errors=$((errors + 1))
fi

# Check Docker Compose
echo "2. Checking Docker Compose..."
if docker compose version &> /dev/null; then
    compose_version=$(docker compose version)
    echo "   ✓ Docker Compose found: $compose_version"
else
    echo "   ✗ Docker Compose not found"
    errors=$((errors + 1))
fi

# Check if Docker daemon is running
echo "3. Checking Docker daemon..."
if docker info &> /dev/null 2>&1; then
    echo "   ✓ Docker daemon is running"
else
    echo "   ✗ Docker daemon is not running"
    errors=$((errors + 1))
fi

# Check required files
echo "4. Checking required files..."
required_files=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "backend/server.py"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/yarn.lock"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file exists"
    else
        echo "   ✗ $file missing"
        errors=$((errors + 1))
    fi
done

# Check disk space
echo "5. Checking disk space..."
available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available_space" -gt 10 ]; then
    echo "   ✓ Sufficient disk space: ${available_space}GB available"
elif [ "$available_space" -gt 5 ]; then
    echo "   ⚠ Low disk space: ${available_space}GB available (10GB+ recommended)"
    warnings=$((warnings + 1))
else
    echo "   ✗ Insufficient disk space: ${available_space}GB available (10GB+ required)"
    errors=$((errors + 1))
fi

# Check memory
echo "6. Checking available memory..."
if command -v free &> /dev/null; then
    available_memory=$(free -g | awk 'NR==2 {print $7}')
    if [ "$available_memory" -gt 4 ]; then
        echo "   ✓ Sufficient memory: ${available_memory}GB available"
    elif [ "$available_memory" -gt 2 ]; then
        echo "   ⚠ Low memory: ${available_memory}GB available (4GB+ recommended)"
        warnings=$((warnings + 1))
    else
        echo "   ⚠ Very low memory: ${available_memory}GB available (4GB+ recommended)"
        warnings=$((warnings + 1))
    fi
fi

# Check ports availability
echo "7. Checking port availability..."
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "   ⚠ Port $1 is already in use"
        warnings=$((warnings + 1))
        return 1
    else
        echo "   ✓ Port $1 is available"
        return 0
    fi
}

check_port 3000
check_port 8001
check_port 27017

# Validate Docker Compose file
echo "8. Validating docker-compose.yml..."
if docker compose config > /dev/null 2>&1; then
    echo "   ✓ docker-compose.yml is valid"
else
    echo "   ✗ docker-compose.yml has errors"
    errors=$((errors + 1))
fi

# Check if containers are running
echo "9. Checking running containers..."
if docker compose ps 2>/dev/null | grep -q "Up"; then
    echo "   ✓ Containers are running"
    docker compose ps --format "table {{.Service}}\t{{.Status}}"
else
    echo "   ℹ No containers running (expected if not started yet)"
fi

# Test backend dependencies (if Python is available)
echo "10. Checking backend dependencies..."
if [ -f "backend/requirements.txt" ]; then
    total_deps=$(wc -l < backend/requirements.txt)
    echo "   ✓ Found $total_deps Python dependencies"
    
    # Check for critical dependencies
    critical_deps=("fastapi" "uvicorn" "motor" "pyjwt" "passlib")
    for dep in "${critical_deps[@]}"; do
        if grep -qi "^$dep" backend/requirements.txt; then
            echo "   ✓ $dep found"
        else
            echo "   ⚠ $dep not found in requirements.txt"
            warnings=$((warnings + 1))
        fi
    done
fi

# Test frontend dependencies
echo "11. Checking frontend dependencies..."
if [ -f "frontend/package.json" ]; then
    if command -v jq &> /dev/null; then
        react_version=$(jq -r '.dependencies.react' frontend/package.json)
        router_version=$(jq -r '.dependencies["react-router-dom"]' frontend/package.json)
        echo "   ✓ React version: $react_version"
        echo "   ✓ React Router version: $router_version"
    else
        echo "   ℹ Install 'jq' to see detailed dependency info"
    fi
    
    # Check if yarn.lock exists
    if [ -f "frontend/yarn.lock" ]; then
        echo "   ✓ yarn.lock exists"
    else
        echo "   ⚠ yarn.lock missing (dependencies might not be locked)"
        warnings=$((warnings + 1))
    fi
fi

# Summary
echo ""
echo "========================================="
echo "Validation Summary"
echo "========================================="

if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo "✅ All checks passed! System is ready."
    echo ""
    echo "Run './setup.sh' to start the application"
    exit 0
elif [ $errors -eq 0 ]; then
    echo "⚠️  $warnings warning(s) found - system should work but may have issues"
    echo ""
    echo "You can proceed with './setup.sh' but monitor for issues"
    exit 0
else
    echo "❌ $errors error(s) and $warnings warning(s) found"
    echo ""
    echo "Please fix the errors before proceeding:"
    if ! command -v docker &> /dev/null; then
        echo "  - Install Docker: sudo apt-get install docker.io"
    fi
    if ! docker compose version &> /dev/null; then
        echo "  - Install Docker Compose: sudo apt-get install docker-compose-plugin"
    fi
    echo ""
    echo "See TROUBLESHOOTING.md for help"
    exit 1
fi
