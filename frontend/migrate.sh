#!/bin/bash

# Supabase Staging Environment Setup Script

set -e

VITE_SUPABASE_URL=https://cccxexvoahyeookqmxpl.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTkwOSwiZXhwIjoyMDYzMDAxOTA5fQ.ZqdOIKGTito-5PbMz00IGud9nm0o1EA5rj04qBVIJDw

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed."
        exit 1
    fi
}

# Extract production schema
get_production_schema() {
    print_status "Extracting production database schema..."
    
    local prod_url="$VITE_SUPABASE_URL"
    local prod_key="$VITE_SUPABASE_SERVICE_ROLE_KEY"
    
    if [ -z "$prod_url" ] || [ -z "$prod_key" ]; then
        print_error "Production Supabase URL or service role key not found."
        exit 1
    fi
    
    local host=$(echo "$prod_url" | sed 's|https://||' | sed 's|http://||')
    local connection_string="postgresql://postgres:${prod_key}@${host}:5432/postgres"
    
    pg_dump --schema-only \
        --no-owner \
        --no-privileges \
        --no-comments \
        --no-security-labels \
        --clean \
        --if-exists \
        "$connection_string" > production_schema.sql
    
    print_status "Production schema extracted to production_schema.sql"
}

# Create staging environment
create_staging_environment() {
    print_status "Creating staging environment..."
    
    print_warning "Please create a new Supabase project for staging in the dashboard first."
    read -p "Have you created a new Supabase project for staging? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Please create a new Supabase project and run this script again."
        exit 0
    fi
    
    echo ""
    read -p "Staging Supabase URL: " staging_url
    read -p "Staging Service Role Key: " staging_key
    
    if [ -z "$staging_url" ] || [ -z "$staging_key" ]; then
        print_error "Staging URL and service role key are required."
        exit 1
    fi
    
    local staging_host=$(echo "$staging_url" | sed 's|https://||' | sed 's|http://||')
    local staging_connection_string="postgresql://postgres:${staging_key}@${staging_host}:5432/postgres"
    
    print_status "Applying schema to staging database..."
    psql "$staging_connection_string" -f production_schema.sql
    
    # Save staging credentials
    cat > .env.staging << EOF
# Staging Environment Variables
VITE_SUPABASE_URL=$staging_url
VITE_SUPABASE_SERVICE_ROLE_KEY=$staging_key
VITE_SUPABASE_ANON_KEY=your_staging_anon_key_here
EOF
    
    print_warning "Please update VITE_SUPABASE_ANON_KEY in .env.staging"
    print_status "Staging environment setup complete!"
}

main() {
    print_status "Starting Supabase staging environment setup..."
    check_dependencies
    get_production_schema
    create_staging_environment
}

main "$@"