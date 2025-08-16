# Fix for "relation event_sms_reminders_id_seq does not exist" Error

## Problem
You're getting a PostgreSQL error: `ERROR: 42P01: relation "event_sms_reminders_id_seq" does not exist`

This error occurs when something in your database is trying to use a sequence (auto-incrementing ID generator) that doesn't exist.

## Analysis
After searching the entire codebase, there are **no references** to `event_sms_reminders` in:
- Migration files
- Source code
- Frontend code
- SQL scripts

This suggests the table/sequence was either:
1. Created outside the migration system
2. Dropped but something still references it
3. Part of a failed or partial migration

## Solutions

### 1. Quick Fix - Create the Missing Sequence
If you just need to stop the error immediately:

```bash
# Run this SQL file to create the missing sequence
psql $DATABASE_URL < fix_missing_event_sms_reminders_sequence.sql
```

### 2. Diagnose What's Using It
To find what's trying to use this sequence:

```bash
# Run the diagnostic script
psql $DATABASE_URL < diagnose_event_sms_reminders_usage.sql
```

This will show you:
- If the table exists
- What columns use the sequence
- What views/functions reference it
- What foreign keys point to it

### 3. Proper Migration (Recommended)
If you actually need SMS reminders for events:

```bash
# Run the migration through Supabase
supabase db push

# Or run directly
psql $DATABASE_URL < supabase/migrations/20250201000000_create_event_sms_reminders.sql
```

### 4. Clean Up Orphaned References
If you want to remove all references to this non-existent table:

```bash
# Run the cleanup script
psql $DATABASE_URL < cleanup_event_sms_reminders_references.sql
```

## Next Steps

1. **First**, run the diagnostic script to understand what's happening
2. **Then**, choose one of:
   - Quick fix (if you need it working NOW)
   - Proper migration (if you need the feature)
   - Cleanup (if it's an orphaned reference)

## Common Causes

This error often happens when:
- A migration was partially applied
- Someone ran manual SQL that wasn't tracked
- A table was dropped with CASCADE but sequences remained
- There's a view or function that references the missing table

## Need More Help?

Check the Supabase logs for the full query that's failing:
```sql
SELECT * FROM postgres_logs 
WHERE message LIKE '%event_sms_reminders%' 
ORDER BY timestamp DESC 
LIMIT 10;
```