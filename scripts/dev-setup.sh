#!/bin/bash

# SudoQMaestro Development Environment Setup Script
# This script sets up the development environment for the SudoQMaestro application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node -v | sed 's/v//')
    local required_version="20.0.0"
    
    if [[ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]]; then
        log_error "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    log_success "Node.js version $node_version is compatible"
}

# Check if MongoDB is running
check_mongodb() {
    if command_exists mongosh; then
        if mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
            log_success "MongoDB is running"
        else
            log_warning "MongoDB is installed but not running. Please start MongoDB service."
            log_info "On macOS with Homebrew: brew services start mongodb-community"
            log_info "On Linux: sudo systemctl start mongod"
        fi
    elif command_exists mongo; then
        if mongo --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
            log_success "MongoDB is running"
        else
            log_warning "MongoDB is installed but not running."
        fi
    else
        log_warning "MongoDB is not installed. Install from https://www.mongodb.com/try/download/community"
        log_info "On macOS with Homebrew: brew install mongodb-community"
        log_info "On Ubuntu: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/"
    fi
}

# Install backend dependencies
setup_backend() {
    log_info "Setting up backend..."
    cd backend
    
    if [[ ! -f package.json ]]; then
        log_error "Backend package.json not found"
        exit 1
    fi
    
    log_info "Installing backend dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            cp .env.example .env
            log_success "Created .env file from .env.example"
            log_warning "Please edit .env file with your configuration"
        else
            log_warning ".env.example not found. You'll need to create .env manually"
        fi
    else
        log_info ".env file already exists"
    fi
    
    cd ..
    log_success "Backend setup completed"
}

# Install frontend dependencies
setup_frontend() {
    log_info "Setting up frontend..."
    cd frontend
    
    if [[ ! -f package.json ]]; then
        log_error "Frontend package.json not found"
        exit 1
    fi
    
    log_info "Installing frontend dependencies..."
    npm install
    
    cd ..
    log_success "Frontend setup completed"
}

# Create useful development directories
create_directories() {
    log_info "Creating development directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p temp
    
    # Create .gitkeep files to ensure directories are tracked
    touch logs/.gitkeep
    touch uploads/.gitkeep
    touch temp/.gitkeep
    
    log_success "Development directories created"
}

# Setup Git hooks (if using Husky)
setup_git_hooks() {
    if [[ -d .git ]] && [[ -f backend/package.json ]] && grep -q "husky" backend/package.json; then
        log_info "Setting up Git hooks..."
        cd backend
        npm run prepare 2>/dev/null || log_warning "Failed to setup Git hooks"
        cd ..
        log_success "Git hooks setup completed"
    fi
}

# Validate environment setup
validate_setup() {
    log_info "Validating setup..."
    
    local errors=0
    
    # Check backend dependencies
    if [[ ! -d backend/node_modules ]]; then
        log_error "Backend dependencies not installed"
        errors=$((errors + 1))
    fi
    
    # Check frontend dependencies
    if [[ ! -d frontend/node_modules ]]; then
        log_error "Frontend dependencies not installed"
        errors=$((errors + 1))
    fi
    
    # Check environment file
    if [[ ! -f backend/.env ]]; then
        log_warning "Backend .env file not found"
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Setup validation passed"
        return 0
    else
        log_error "Setup validation failed with $errors error(s)"
        return 1
    fi
}

# Print usage instructions
print_usage() {
    echo
    log_info "🚀 Development Environment Setup Complete!"
    echo
    echo "Next steps:"
    echo "1. Edit backend/.env with your configuration"
    echo "2. Start MongoDB if not running"
    echo "3. Seed the database: npm run seed"
    echo "4. Start the backend: cd backend && npm run dev"
    echo "5. Start the frontend: cd frontend && ng serve"
    echo
    echo "Available npm scripts:"
    echo "  Backend:"
    echo "    npm run dev        - Start development server"
    echo "    npm run test       - Run tests"
    echo "    npm run seed       - Seed database with test data"
    echo "    npm run lint       - Run linting"
    echo
    echo "  Frontend:"
    echo "    ng serve           - Start development server"
    echo "    ng test            - Run tests"
    echo "    ng build           - Build for production"
    echo "    ng lint            - Run linting"
    echo
}

# Main setup function
main() {
    echo "🔧 SudoQMaestro Development Environment Setup"
    echo "============================================="
    echo
    
    # Check if we're in the right directory
    if [[ ! -f README.md ]] || ! grep -q "SudoQMaestro" README.md; then
        log_error "Please run this script from the SudoQMaestro root directory"
        exit 1
    fi
    
    # Run setup steps
    check_node_version
    check_mongodb
    setup_backend
    setup_frontend
    create_directories
    setup_git_hooks
    
    if validate_setup; then
        print_usage
    else
        log_error "Setup completed with errors. Please check the output above."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "SudoQMaestro Development Environment Setup"
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check, -c    Only check prerequisites"
        echo "  --backend, -b  Setup only backend"
        echo "  --frontend, -f Setup only frontend"
        exit 0
        ;;
    --check|-c)
        check_node_version
        check_mongodb
        exit 0
        ;;
    --backend|-b)
        setup_backend
        exit 0
        ;;
    --frontend|-f)
        setup_frontend
        exit 0
        ;;
    *)
        main
        ;;
esac
