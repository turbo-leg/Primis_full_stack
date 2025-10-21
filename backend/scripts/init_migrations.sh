#!/bin/bash
# Bash script to initialize Alembic migrations
# Run this script from the backend directory

echo "🔧 Initializing Alembic Migrations..."
echo ""

# Check if we're in the backend directory
if [ ! -f "alembic.ini" ]; then
    echo "❌ Error: alembic.ini not found. Please run this script from the backend directory."
    echo "Usage: cd backend && bash scripts/init_migrations.sh"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Using default local database..."
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/college_prep"
fi

echo "📊 Database URL: $DATABASE_URL"
echo ""

# Check if migrations already exist
if [ -n "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
    echo "⚠️  Warning: Migration files already exist:"
    ls alembic/versions/*.py | sed 's/^/   - /'
    echo ""
    read -p "Do you want to create a new migration anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled."
        exit 0
    fi
fi

echo "📝 Generating initial migration from models..."
alembic revision --autogenerate -m "Initial migration - create all tables"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration created successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review the generated migration file in alembic/versions/"
    echo "   2. Apply the migration: alembic upgrade head"
    echo "   3. Or use: python scripts/migrate.py upgrade"
    echo ""
    echo "🐳 For Docker:"
    echo "   docker-compose up -d  (migrations run automatically)"
    echo ""
    
    # List the created migration file
    echo "📄 Created migration file:"
    ls -t alembic/versions/*.py | head -1 | sed 's/^/   /'
else
    echo ""
    echo "❌ Failed to create migration. Check the error above."
    exit 1
fi
