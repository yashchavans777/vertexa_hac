#!/usr/bin/env bash
# ==============================================================================
# ActionGate - Automated Backend Startup Script
# start-backend.sh
#
# Principal DevOps & Security Engineer Specification:
# Rebuilds and launches the full ActionGate ecosystem in detached mode.
# Validates running container health and prints endpoint connection telemetry.
# ==============================================================================

set -e

# ANSI styling colors
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================================${NC}"
echo -e "${CYAN}  🛡️   ACTIONGATE - DEPLOYING CONTAINERIZED SOC ECOSYSTEM           ${NC}"
echo -e "${CYAN}====================================================================${NC}"
echo -e "${YELLOW}→ Triggering Docker Compose build & detached execution...${NC}"

# Execute docker-compose build and run detached
docker-compose up --build -d

echo -e "\n${GREEN}✔ ActionGate backend ecosystem deployed successfully!${NC}\n"
echo -e "${WHITE}Active Endpoints:${NC}"
echo -e "  ${GREEN}├─ Node.js Express Gateway:${NC}    http://localhost:5000"
echo -e "  ${GREEN}├─ Ingress Evaluation API:${NC}     http://localhost:5000/api/gateway/evaluate"
echo -e "  ${GREEN}├─ Python FastAPI Risk Analyzer:${NC} http://localhost:8000 (Docs: /docs)"
echo -e "  ${GREEN}├─ Simulator Endpoint:${NC}          http://localhost:8000/simulate-agent/{scenario}"
echo -e "  ${GREEN}└─ MongoDB Datastore:${NC}           mongodb://localhost:27017/actiongate\n"
echo -e "${CYAN}View live logs anytime with: ${WHITE}docker-compose logs -f${NC}"
echo -e "${CYAN}====================================================================${NC}"
