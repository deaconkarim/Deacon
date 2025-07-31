# Task Creation Troubleshooting Guide

## Database Schema Issues

### Problem: Missing Columns in Tasks Table

If you encounter errors like "column does not exist" or "failed to create task", the tasks table may be missing required columns.

### Solution 1: Simple Column Addition

Run the simple migration script that only adds columns without changing policies:

```sql
-- Run this SQL script
\i add_task_columns_simple.sql
```

### Solution 2: Full Migration with Policy Updates

If you need to update RLS policies as well:

```sql
-- Run this SQL script
\i add_task_columns.sql
```

### Solution 3: Manual Column Addition

If the scripts don't work, manually add the columns:

```sql
-- Add missing columns
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
```

## Common Error Messages

### "ERROR: 42710: policy already exists"

**Cause**: The RLS policies already exist in the database.

**Solution**: Use the simple migration script (`add_task_columns_simple.sql`) that doesn't modify policies.

### "column 'category' does not exist"

**Cause**: The category column is missing from the tasks table.

**Solution**: Run the column addition script.

### "failed to create task"

**Cause**: Missing required columns or incorrect data format.

**Solution**: 
1. Check the database schema using `check_tasks_schema.sql`
2. Add missing columns
3. Check the browser console for detailed error messages

## Verification Steps

1. **Check Current Schema**:
   ```sql
   \i check_tasks_schema.sql
   ```

2. **Test Task Creation**:
   - Try creating a task from the dashboard
   - Check browser console for errors
   - Check database logs for SQL errors

3. **Verify Columns Exist**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'tasks' 
   AND table_schema = 'public';
   ```

## Frontend Debugging

The TaskCreationModal now includes enhanced error logging:

- Check browser console for "TaskCreationModal:" prefixed messages
- Look for detailed error messages in the toast notifications
- Verify that users are loading correctly

## Database Connection Issues

If you can't run the migration scripts:

1. **Check Database Connection**:
   ```bash
   psql -d your_database -c "SELECT version();"
   ```

2. **Check Supabase Status**:
   ```bash
   npx supabase status
   ```

3. **Start Local Supabase** (if using local development):
   ```bash
   npx supabase start
   ```

## Alternative Solutions

If the database migration doesn't work, you can:

1. **Use the simple column addition script**
2. **Manually add columns one by one**
3. **Check if your database has different RLS policies**
4. **Contact your database administrator**

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Run the schema check script to verify current state
3. Try the simple migration script first
4. Check if your database has different table structure