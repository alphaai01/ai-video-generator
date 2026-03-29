#!/bin/bash
# =============================================================
#  AI Video Generator - One-Click Setup Script
# =============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║     AI Video Generator - Setup Script        ║"
echo "║     Powered by Azure AI Foundry + Sora 2     ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Check prerequisites ----
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required. You have $(node -v).${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ npm $(npm -v)${NC}"

# ---- Install backend ----
echo ""
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}  → Created backend/.env from template. Please edit with your Azure credentials.${NC}"
fi
npm install
echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

# ---- Install frontend ----
echo ""
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd ../frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}  → Created frontend/.env from template.${NC}"
fi
npm install
echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"

cd ..

# ---- Done ----
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗"
echo "║           Setup Complete!                     ║"
echo "╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit ${YELLOW}backend/.env${NC} with your Azure credentials"
echo -e "  2. Start the backend:  ${BLUE}cd backend && npm run dev${NC}"
echo -e "  3. Start the frontend: ${BLUE}cd frontend && npm run dev${NC}"
echo -e "  4. Open ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "Or use Docker:  ${BLUE}docker-compose up --build${NC}"
echo ""
