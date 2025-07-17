# Event Database Fix Script

This script fixes missing master events in your events database and ensures proper event creation going forward.

## Problem

Your database has recurring events that are missing their master events. This causes issues when trying to edit or update events because the system can't find the master event to update the entire series.

## Solution

The script does two main things:

1. **Fixes Missing Master Events**: Creates master events for existing recurring events that don't have them
2. **Ensures Proper Event Creation**: Updates the event creation logic to always create master events for recurring events

## How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run fix-events
```

### Option 2: Direct execution
```bash
node run_event_fix.js
```

### Option 3: Using the main script
```bash
node fix_missing_master_events.js
```

## What the Script Does

### 1. Fix Missing Master Events
- Finds all recurring events that don't have master events
- Groups events by their `parent_event_id`
- Creates master events for each group
- Handles orphaned events (events without `parent_event_id`)
- Updates all instances to point to their master events

### 2. Ensure Proper Event Creation
- Identifies non-recurring events that should be recurring (based on patterns)
- Converts them to proper recurring events with master events
- Updates the `addEvent` function to handle conflicts and existing events

## Database Changes

The script will:
- Create new master events with `is_master: true`
- Update existing instances to have `parent_event_id` pointing to master events
- Ensure all recurring events have proper master-child relationships

## Code Changes

### Updated `addEvent` function in `frontend/src/lib/data.js`:
- Checks for existing master events before creating new ones
- Handles ID conflicts gracefully
- Prevents duplicate instance creation
- Better error handling and logging

## Verification

After running the script, you can verify the fix by:

1. **Check the console output** - Should show "All recurring events now have proper master events!"
2. **Query your database**:
   ```sql
   -- Should return 0
   SELECT COUNT(*) FROM events 
   WHERE is_recurring = true 
   AND is_master = false 
   AND parent_event_id IS NULL;
   ```

## Troubleshooting

### If the script fails:
1. Check your `.env` file has the correct Supabase credentials
2. Ensure you have the required dependencies installed: `npm install`
3. Check the console output for specific error messages

### If events still can't be edited:
1. Run the script again to ensure all events are fixed
2. Check that the `updateEvent` function is working correctly
3. Verify that event IDs are being handled properly in the frontend

## Safety

The script is designed to be safe:
- It checks for existing data before making changes
- It doesn't delete any existing events
- It only creates missing master events
- It has comprehensive error handling

## After Running

Once the script completes:
1. Your event editing should work properly
2. New recurring events will be created with proper master events
3. The system will handle event updates correctly

## Files Created/Modified

- `fix_missing_master_events.js` - Main fix script
- `run_event_fix.js` - Simple runner script
- `frontend/src/lib/data.js` - Updated addEvent function
- `package.json` - Added fix-events script
- `EVENT_FIX_README.md` - This documentation 