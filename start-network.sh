#!/bin/bash

# HabitStreak - Start with Network Access
# This script starts the app so it's accessible from your mobile device

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== HabitStreak - Network Mode ===${NC}\n"

# Get local IP
LOCAL_IP=$(ip addr show | grep -E "inet.*eth0|inet.*wlan0|inet.*en0" | grep -v "inet6" | awk '{print $2}' | cut -d'/' -f1 | head -1)

echo -e "${GREEN}✓${NC} Your local IP: ${GREEN}${LOCAL_IP}${NC}"
echo -e "${GREEN}✓${NC} Access URLs:"
echo -e "  - Computer: http://${LOCAL_IP}:3002"
echo -e "  - Mobile:   http://${LOCAL_IP}:3002"
echo ""

# Start PostgreSQL
echo -e "${BLUE}Starting PostgreSQL...${NC}"
docker-compose up -d

# Wait a moment for PostgreSQL to be ready
sleep 2

# Ensure logs directory exists
mkdir -p logs

# Generate log filename with date
LOG_FILE="logs/nextjs-$(date +%Y-%m-%d).log"

# Ensure NextAuth uses the network URL for client requests
if [ -z "$NEXTAUTH_URL" ]; then
  export NEXTAUTH_URL="http://${LOCAL_IP}:3002"
fi
if [ -z "$NEXTAUTH_URL_INTERNAL" ]; then
  export NEXTAUTH_URL_INTERNAL="http://localhost:3002"
fi

# Start Next.js with network access (logging to both console and file)
echo -e "${BLUE}Starting Next.js dev server...${NC}"
echo -e "${GREEN}✓${NC} Server will be accessible from your mobile device"
echo -e "${GREEN}✓${NC} Logs: ${LOG_FILE}"
echo ""

npm run dev:network 2>&1 | tee -a "$LOG_FILE"
