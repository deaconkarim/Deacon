# Attendance Consistency Fix

## Problem
The attendance numbers were inconsistent across different pages in the application:

- **Member Profile Page**: Anthony Grose showed 19 events attended
- **Dashboard**: Anthony Grose showed 15 events attended  
- **Events Page**: Anthony Grose showed 3 events attended

## Root Cause
The inconsistency was caused by different date ranges being used across the application:

1. **Member Profile**: Used all-time attendance data
2. **Dashboard**: Used last 30 days attendance data
3. **Events Page**: Used all-time attendance data

## Solution
Implemented a unified attendance service with consistent 30-day window across all pages:

### 1. Enhanced Unified Attendance Service
- Added `useLast30Days` option to both `getMemberAttendanceCount()` and `getTopAttendees()` methods
- When `useLast30Days: true`, the service filters events from the last 30 days
- Maintains backward compatibility with existing date range options

### 2. Updated All Pages to Use 30-Day Window
- **Member Profile** (`member-profile.jsx`): Now uses `useLast30Days: true`
- **Dashboard** (`attendanceStats.js`): Now uses `useLast30Days: true` 
- **Events Page** (`events.jsx`): Now uses `useLast30Days: true`

### 3. Consistent Data Filtering
All pages now use the same logic:
- Only past events (no future events)
- Only 'attending' or 'checked-in' status
- Last 30 days from current date
- Same organization filtering

## Files Modified

### Core Service
- `frontend/src/lib/unifiedAttendanceService.js`
  - Added `useLast30Days` parameter to both main methods
  - Implemented 30-day date filtering logic

### Pages Updated
- `frontend/src/pages/member-profile.jsx`
  - Updated `loadAttendance()` to use `useLast30Days: true`

- `frontend/src/lib/data/attendanceStats.js`
  - Updated dashboard attendance stats to use `useLast30Days: true`

- `frontend/src/pages/events.jsx`
  - Updated top attendees section to use `useLast30Days: true`

## Testing
Created `test_attendance_fix.js` to verify consistency:
- Tests member attendance count with 30-day window
- Tests top attendees with 30-day window
- Compares 30-day vs all-time data
- Direct database query verification

## Expected Results
After this fix, Anthony Grose (and all members) should show consistent attendance numbers across all pages:

- **Member Profile**: X events attended (last 30 days)
- **Dashboard**: X events attended (last 30 days)
- **Events Page**: X events attended (last 30 days)

All three pages should now display the same number for the same member.

## Benefits
1. **Consistency**: All pages show the same attendance data
2. **Relevance**: 30-day window shows recent, actionable attendance patterns
3. **Performance**: Smaller date range means faster queries
4. **Maintainability**: Single source of truth for attendance calculations

## Future Considerations
- Consider adding a date range picker to allow users to customize the time period
- Add caching for frequently accessed attendance data
- Consider adding attendance trends over time 