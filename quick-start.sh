#!/bin/bash

# Movie Release Website - Quick Start Script
# This script sets up and runs the entire project locally

set -e  # Exit on any error

echo "🎬 Movie Release Website - Quick Start"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Get Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Get Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
echo ""

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Build and start containers
echo -e "${GREEN}🔨 Building and starting containers...${NC}"
docker-compose up --build -d

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
echo ""

# Wait for PostgreSQL (max 30 seconds)
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U movie_user -d movie_db &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Backend (max 30 seconds)
echo ""
for i in {1..30}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✓ Backend API is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Frontend (max 30 seconds)
echo ""
for i in {1..30}; do
    if curl -s http://localhost:3000 &> /dev/null; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 All services are running!${NC}"
echo ""
echo "Access URLs:"
echo -e "${GREEN}  • Frontend:${NC}     http://localhost:3000"
echo -e "${GREEN}  • Backend API:${NC}  http://localhost:8000"
echo -e "${GREEN}  • API Docs:${NC}    http://localhost:8000/docs"
echo -e "${GREEN}  • Admin Login:${NC}  http://localhost:3000/admin/login"
echo ""
echo "To stop all services, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"
echo ""
echo -e "${YELLOW}💡 First steps:${NC}"
echo "1. Create an admin user:"
echo "   curl -X POST http://localhost:8000/api/v1/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\",\"full_name\":\"Admin User\"}'"
echo ""
echo "2. Login at: http://localhost:3000/admin/login"
echo ""
echo "=========================================="
