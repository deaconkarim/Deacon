# Quick Start: Authentication & Multi-Organization Setup

## 🚀 Quick Setup (5 minutes)

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your machine.

### 2. Run the Setup Script
```bash
./setup-auth.sh
```

### 3. Create Your User Account
1. Go to http://localhost:54323 (Supabase Dashboard)
2. Navigate to **Authentication > Users**
3. Click **"Add User"**
4. Enter your email and password
5. Copy the **User ID** (you'll need this)

### 4. Link User to Organization
1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query (replace `YOUR_USER_ID` with the actual user ID):

```sql
INSERT INTO public.organization_users (
    organization_id,
    user_id,
    role,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'YOUR_USER_ID_HERE',
    'owner',
    'active'
);
```

### 5. Start the App
```bash
npm run dev
```

### 6. Log In
- Visit http://localhost:5173
- Log in with your email and password
- You'll see "Brentwood Lighthouse Baptist Church" in the header

## 🎯 What's New

### Authentication
- ✅ Secure login/logout
- ✅ User registration with organization creation
- ✅ Session management
- ✅ Protected routes

### Multi-Organization Support
- ✅ Each church gets isolated data
- ✅ Organization switching
- ✅ Role-based access (Owner, Admin, Member, Viewer)
- ✅ Automatic data filtering by organization

### Security
- ✅ Row Level Security (RLS)
- ✅ Automatic organization context
- ✅ Cross-organization data protection

## 🔧 Troubleshooting

### "No organizations found" error
- Check if user is linked to organization in `organization_users` table
- Verify the SQL query was executed correctly

### "Permission denied" errors
- Check user role in `organization_users` table
- Verify RLS policies are working

### Data not showing up
- Check if `organization_id` is set correctly
- Verify current organization is selected

## 📚 Next Steps

1. **Create New Organizations**: Use the registration page to create additional churches
2. **Invite Users**: Organization owners can invite users to their church
3. **Customize Settings**: Update church information in Settings
4. **Add Features**: The app is ready for additional features like email notifications, billing, etc.

## 🆘 Need Help?

- Check `AUTHENTICATION_SETUP.md` for detailed documentation
- Review the troubleshooting section above
- Check Supabase logs in the dashboard 