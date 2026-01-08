#!/bin/bash

# HabitStreak - Initial Setup Script
# This script sets up everything you need to run the app

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          HABITSTREAK - INITIAL SETUP                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${BLUE}[1/3] Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 2: Start PostgreSQL
echo -e "${BLUE}[2/3] Starting PostgreSQL database...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ PostgreSQL started${NC}\n"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Step 3: Initialize database
echo -e "${BLUE}[3/3] Initializing database...${NC}"
npx prisma migrate dev --name init
echo -e "${GREEN}✓ Database initialized${NC}\n"

# Success!
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SETUP COMPLETE! 🎉                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Ready to start! Run one of these commands:"
echo ""
echo -e "  ${BLUE}npm run dev${NC}          - Start locally (localhost only)"
echo -e "  ${BLUE}npm run dev:network${NC}  - Start with network access (mobile)"
echo -e "  ${BLUE}./start-network.sh${NC}   - Auto-start with network access"
echo ""
echo -e "Access URLs:"
LOCAL_IP=$(ip addr show | grep -E "inet.*eth0|inet.*wlan0|inet.*en0" | grep -v "inet6" | awk '{print $2}' | cut -d'/' -f1 | head -1)
echo -e "  Computer: ${GREEN}http://localhost:3000${NC}"
echo -e "  Mobile:   ${GREEN}http://${LOCAL_IP}:3000${NC}"
echo ""
