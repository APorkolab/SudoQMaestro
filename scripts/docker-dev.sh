#!/bin/bash

# SudoQMaestro Docker Development Script
# Provides convenient commands for Docker development workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log_success "Docker environment is ready"
}

# Build development images
build() {
    log_info "Building Docker images for development..."
    docker-compose -f docker-compose.yml build
    log_success "Development images built successfully"
}

# Start development environment
start() {
    log_info "Starting development environment..."
    docker-compose -f docker-compose.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 5
    
    # Check if services are running
    if docker-compose -f docker-compose.yml ps | grep -q "Up"; then
        log_success "Development environment started"
        show_status
    else
        log_error "Failed to start development environment"
        docker-compose -f docker-compose.yml logs
        exit 1
    fi
}

# Stop development environment
stop() {
    log_info "Stopping development environment..."
    docker-compose -f docker-compose.yml down
    log_success "Development environment stopped"
}

# Restart development environment
restart() {
    log_info "Restarting development environment..."
    stop
    start
}

# Show logs for all services or a specific service
logs() {
    local service="$1"
    
    if [[ -n "$service" ]]; then
        log_info "Showing logs for $service..."
        docker-compose -f docker-compose.yml logs -f "$service"
    else
        log_info "Showing logs for all services..."
        docker-compose -f docker-compose.yml logs -f
    fi
}

# Show status of all services
show_status() {
    echo
    log_info "Service Status:"
    docker-compose -f docker-compose.yml ps
    
    echo
    log_info "Available Services:"
    echo "  📱 Frontend: http://localhost:8080"
    echo "  🔧 Backend API: http://localhost:5000"
    echo "  🗄️  MongoDB: localhost:27017"
    echo
}

# Execute command in a running container
exec_in_container() {
    local service="$1"
    shift
    local command="$*"
    
    if [[ -z "$service" ]] || [[ -z "$command" ]]; then
        log_error "Usage: $0 exec <service> <command>"
        exit 1
    fi
    
    log_info "Executing '$command' in $service container..."
    docker-compose -f docker-compose.yml exec "$service" $command
}

# Clean up Docker resources
cleanup() {
    log_info "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose -f docker-compose.yml down --volumes --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Docker cleanup completed"
}

# Seed database in Docker environment
seed_database() {
    log_info "Seeding database in Docker environment..."
    
    # Check if backend container is running
    if ! docker-compose -f docker-compose.yml ps backend | grep -q "Up"; then
        log_error "Backend container is not running. Start the environment first."
        exit 1
    fi
    
    docker-compose -f docker-compose.yml exec backend node scripts/seed-database.js
    log_success "Database seeding completed"
}

# Run tests in Docker environment
run_tests() {
    local service="$1"
    
    case "$service" in
        "backend")
            log_info "Running backend tests..."
            docker-compose -f docker-compose.yml exec backend npm test
            ;;
        "frontend")
            log_info "Running frontend tests..."
            docker-compose -f docker-compose.yml exec frontend npm run test:ci
            ;;
        "")
            log_info "Running all tests..."
            docker-compose -f docker-compose.yml exec backend npm test
            docker-compose -f docker-compose.yml exec frontend npm run test:ci
            ;;
        *)
            log_error "Unknown test service: $service"
            log_info "Available options: backend, frontend, or leave empty for both"
            exit 1
            ;;
    esac
}

# Production build and deployment
prod_build() {
    log_info "Building production images..."
    docker-compose -f docker-compose.prod.yml build
    log_success "Production images built successfully"
}

prod_start() {
    log_info "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log_info "Waiting for services to start..."
    sleep 10
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_success "Production environment started"
        echo
        log_info "Production Services:"
        echo "  🌐 Application: http://localhost:8080"
        echo
    else
        log_error "Failed to start production environment"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

prod_stop() {
    log_info "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    log_success "Production environment stopped"
}

# Show help
show_help() {
    echo "SudoQMaestro Docker Development Script"
    echo "Usage: $0 <command> [options]"
    echo
    echo "Development Commands:"
    echo "  build                Build development images"
    echo "  start                Start development environment"
    echo "  stop                 Stop development environment"
    echo "  restart              Restart development environment"
    echo "  status               Show service status"
    echo "  logs [service]       Show logs (all services or specific service)"
    echo "  exec <service> <cmd> Execute command in running container"
    echo "  seed                 Seed database with test data"
    echo "  test [service]       Run tests (backend, frontend, or both)"
    echo "  cleanup              Clean up Docker resources"
    echo
    echo "Production Commands:"
    echo "  prod:build           Build production images"
    echo "  prod:start           Start production environment"
    echo "  prod:stop            Stop production environment"
    echo
    echo "Examples:"
    echo "  $0 start             # Start all development services"
    echo "  $0 logs backend      # Show backend logs"
    echo "  $0 exec backend bash # Open shell in backend container"
    echo "  $0 test backend      # Run backend tests"
    echo "  $0 cleanup           # Clean up unused Docker resources"
    echo
}

# Main command handling
main() {
    # Check if we're in the right directory
    if [[ ! -f docker-compose.yml ]]; then
        log_error "docker-compose.yml not found. Run this script from the project root directory."
        exit 1
    fi

    check_docker

    case "${1:-}" in
        "build")
            build
            ;;
        "start")
            start
            ;;
        "stop")
            stop
            ;;
        "restart")
            restart
            ;;
        "status")
            show_status
            ;;
        "logs")
            logs "$2"
            ;;
        "exec")
            exec_in_container "$2" "${@:3}"
            ;;
        "seed")
            seed_database
            ;;
        "test")
            run_tests "$2"
            ;;
        "cleanup")
            cleanup
            ;;
        "prod:build")
            prod_build
            ;;
        "prod:start")
            prod_start
            ;;
        "prod:stop")
            prod_stop
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
