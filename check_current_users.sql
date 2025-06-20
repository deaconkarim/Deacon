-- Check current state of users and organization membership

-- Show all auth users
SELECT 'Auth Users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Show all members
SELECT 'Members:' as info;
SELECT id, firstname, lastname, email, created_at FROM members ORDER BY created_at;

-- Show all organization users
SELECT 'Organization Users:' as info;
SELECT user_id, role, approval_status, created_at FROM organization_users ORDER BY created_at;

-- Show the final result - users with complete profiles
SELECT 'Complete User Profiles:' as info;
SELECT 
    m.firstname,
    m.lastname,
    m.email,
    ou.role,
    ou.approval_status,
    m.created_at as member_since,
    ou.created_at as org_member_since
FROM members m
JOIN organization_users ou ON m.id = ou.user_id
ORDER BY m.firstname, m.lastname;

-- Count summary
SELECT 'Summary:' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM members) as members_count,
    (SELECT COUNT(*) FROM organization_users) as org_users_count,
    (SELECT COUNT(*) FROM members m JOIN organization_users ou ON m.id = ou.user_id) as complete_profiles_count; 