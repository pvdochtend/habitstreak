#!/bin/bash

# HabitStreak Deployment Script for Synology NAS
# Usage: ./deploy.sh [version]
# Examples:
#   ./deploy.sh           # Deploy latest from main branch
#   ./deploy.sh v1.1      # Deploy specific tag
#   ./deploy.sh --backup  # Create backup before deploying

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository. Please run this script from the HabitStreak directory."
        exit 1
    fi
}

# Check if docker-compose is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi

    if ! docker-compose --version &> /dev/null 2>&1; then
        print_error "docker-compose not found. Please install docker-compose first."
        exit 1
    fi
}

# Check if .env.production exists
check_env() {
    if [ ! -f ".env.production" ]; then
        print_error ".env.production not found"
        print_info "Please create it from .env.production.example and configure your secrets"
        exit 1
    fi
}

# Get current version/commit
get_current_version() {
    local current_tag=$(git describe --tags --exact-match 2>/dev/null || echo "")
    local current_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

    if [ -n "$current_tag" ]; then
        echo "$current_tag ($current_commit)"
    else
        echo "$current_branch ($current_commit)"
    fi
}

# Create database backup
create_backup() {
    print_header "Creating Database Backup"

    mkdir -p "$BACKUP_DIR"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/habitstreak_$timestamp.sql"

    print_info "Backing up database to: $backup_file"

    if docker exec habitstreak-db pg_dump -U habitstreak habitstreak > "$backup_file" 2>/dev/null; then
        print_success "Database backup created"

        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/habitstreak_*.sql 2>/dev/null | tail -n +6 | xargs -r rm
        print_info "Keeping last 5 backups"
    else
        print_warning "Could not create backup (container may not be running)"
        print_info "Continuing anyway..."
    fi
}

# Pull latest code
pull_code() {
    local version=$1

    print_header "Pulling Latest Code"

    # Fetch all tags and branches
    print_info "Fetching from remote..."
    git fetch --all --tags

    if [ -z "$version" ] || [ "$version" == "latest" ]; then
        # Pull latest from current branch (usually main)
        local current_branch=$(git rev-parse --abbrev-ref HEAD)
        print_info "Pulling latest from branch: $current_branch"
        git pull origin "$current_branch"
    else
        # Checkout specific tag
        print_info "Checking out version: $version"
        git checkout "tags/$version"
    fi

    print_success "Code updated"
}

# Build and restart containers
deploy_containers() {
    print_header "Building and Deploying Containers"

    print_info "Building Docker images (this may take a few minutes)..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env.production build --no-cache

    print_info "Recreating containers with new images..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env.production up -d

    print_success "Containers deployed"
}

# Wait for health check
wait_for_health() {
    print_header "Waiting for Health Check"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        print_info "Checking health (attempt $attempt/$max_attempts)..."

        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
            print_success "Application is healthy!"
            return 0
        fi

        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "Health check failed after $max_attempts attempts"
    print_warning "Check logs with: docker-compose -f $COMPOSE_FILE logs app"
    return 1
}

# Show container status
show_status() {
    print_header "Container Status"
    docker-compose -f "$COMPOSE_FILE" --env-file .env.production ps
}

# Show logs
show_logs() {
    print_header "Recent Logs"
    docker-compose -f "$COMPOSE_FILE" --env-file .env.production logs --tail=20 app
}

# Main deployment function
deploy() {
    local version=$1
    local skip_backup=$2
    local non_interactive=$3

    print_header "HabitStreak Deployment"

    local current_version=$(get_current_version)
    print_info "Current version: $current_version"

    if [ -z "$version" ] || [ "$version" == "latest" ]; then
        print_info "Target: latest from current branch"
    else
        print_info "Target: $version"
    fi

    if [ "$non_interactive" != "yes" ]; then
        echo ""
        read -p "Continue with deployment? (y/n) " -n 1 -r
        echo ""

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Deployment cancelled"
            exit 0
        fi
    else
        print_info "Running in non-interactive mode"
    fi

    # Pre-flight checks
    check_git_repo
    check_docker
    check_env

    # Create backup unless skipped
    if [ "$skip_backup" != "skip" ]; then
        create_backup
    fi

    # Pull code
    pull_code "$version"

    # Deploy containers
    deploy_containers

    # Wait for health check
    if wait_for_health; then
        show_status
        echo ""
        print_success "Deployment complete!"

        local new_version=$(get_current_version)
        print_info "Deployed version: $new_version"
        print_info "Access at: http://localhost:3000"
    else
        print_error "Deployment completed but health check failed"
        show_logs
        exit 1
    fi
}

# Parse arguments
main() {
    local version=""
    local skip_backup=""
    local non_interactive=""
    local show_help=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-only)
                check_git_repo
                create_backup
                exit 0
                ;;
            --skip-backup)
                skip_backup="skip"
                shift
                ;;
            --yes|-y)
                non_interactive="yes"
                shift
                ;;
            --status)
                check_docker
                show_status
                exit 0
                ;;
            --logs)
                check_docker
                show_logs
                exit 0
                ;;
            --help|-h)
                show_help=true
                shift
                ;;
            *)
                version=$1
                shift
                ;;
        esac
    done

    if [ "$show_help" = true ]; then
        cat << EOF
HabitStreak Deployment Script

Usage: ./deploy.sh [version] [options]

Arguments:
  version           Git tag to deploy (e.g., v1.1, v1.2)
                    If omitted, deploys latest from current branch

Options:
  --skip-backup     Skip database backup before deployment
  --yes, -y         Non-interactive mode (no confirmation prompt)
                    Useful for scheduled tasks and automation
  --backup-only     Create backup without deploying
  --status          Show container status
  --logs            Show recent application logs
  --help, -h        Show this help message

Examples:
  ./deploy.sh                    # Deploy latest from current branch
  ./deploy.sh v1.1               # Deploy version 1.1
  ./deploy.sh v1.2 --skip-backup # Deploy v1.2 without backup
  ./deploy.sh --yes              # Deploy latest without confirmation
  ./deploy.sh v1.2 -y            # Deploy v1.2 without confirmation
  ./deploy.sh --backup-only      # Create backup only
  ./deploy.sh --status           # Show container status
  ./deploy.sh --logs             # Show recent logs

Scheduled Task Example (Synology):
  bash /volume1/docker/habitstreak/deploy.sh --yes

Backups are stored in: $SCRIPT_DIR/backups/
Last 5 backups are kept automatically.

EOF
        exit 0
    fi

    deploy "$version" "$skip_backup" "$non_interactive"
}

# Run main function
main "$@"
