#!/bin/bash

echo "🚀 Setting up Authentication and Multi-Organization Support"
echo "=========================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start Supabase
echo "🔄 Starting Supabase..."
supabase start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
supabase db reset

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Supabase dashboard: http://localhost:54323"
echo "2. Navigate to Authentication > Users"
echo "3. Click 'Add User' and create a new user account"
echo "4. Copy the user ID (you'll see it in the users list)"
echo "5. Go to SQL Editor and run this query (replace YOUR_USER_ID with the actual user ID):"
echo ""
echo "   INSERT INTO public.organization_users ("
echo "       organization_id,"
echo "       user_id,"
echo "       role,"
echo "       status"
echo "   ) VALUES ("
echo "       '550e8400-e29b-41d4-a716-446655440000',"
echo "       'YOUR_USER_ID_HERE',"
echo "       'owner',"
echo "       'active'"
echo "   );"
echo ""
echo "6. Start the development server: npm run dev"
echo "7. Visit http://localhost:5173 and log in with your credentials"
echo ""
echo "🔐 Default Organization Details:"
echo "   Name: Brentwood Lighthouse Baptist Church"
echo "   Slug: brentwood-lighthouse-baptist"
echo "   ID: 550e8400-e29b-41d4-a716-446655440000"
echo ""
echo "📚 For more details, see AUTHENTICATION_SETUP.md" 