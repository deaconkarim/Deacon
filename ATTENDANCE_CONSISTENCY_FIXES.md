# Attendance Consistency Fixes

## Problem Identified

The application was showing inconsistent attendance data for the same member (Anthony Grose) across different pages:

- **Member Profile**: 19 events attended
- **Dashboard**: 15 events attended  
- **Events Page**: 17 events attended

## Root Cause Analysis

The inconsistency was caused by different parts of the application using different methods to calculate attendance:

1. **Member Profile**: Used direct database query with basic filtering
2. **Dashboard**: Used complex date range filtering and caching
3. **Events Page**: Used different data processing logic with attendance aggregation

Each method had different:
- Date filtering logic
- Status filtering (attending vs checked-in vs declined)
- Event inclusion criteria (past vs future events)
- Data aggregation methods

## Solution Implemented

### 1. Created Unified Attendance Service

Created `frontend/src/lib/unifiedAttendanceService.js` with consistent methods:

```javascript
export const unifiedAttendanceService = {
  // Get member attendance count - used by member profile
  async getMemberAttendanceCount(memberId, options = {}),
  
  // Get top attendees - used by dashboard and events page
  async getTopAttendees(options = {}),
  
  // Get attendance statistics for dashboard
  async getDashboardAttendanceStats(options = {}),
  
  // Get attendance data for a specific date range
  async getAttendanceDataForRange(startDate, endDate, options = {})
};
```

### 2. Standardized Filtering Logic

All methods now use consistent filtering:

```javascript
// Standard status filtering
if (!includeDeclined) {
  query = query.in('status', ['attending', 'checked-in']);
}

// Standard date filtering
if (!includeFutureEvents) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  query = query.lt('events.start_date', today.toISOString());
}

// Standard organization filtering
query = query.eq('events.organization_id', organizationId)
             .eq('members.organization_id', organizationId);
```

### 3. Updated All Components

**Member Profile Page** (`frontend/src/pages/member-profile.jsx`):
```javascript
// Before: Direct database query
const { data, error } = await supabase
  .from('event_attendance')
  .select(`*, events (*)`)
  .eq('member_id', memberId);

// After: Unified service
const attendanceData = await unifiedAttendanceService.getMemberAttendanceCount(memberId, {
  includeFutureEvents: false,
  includeDeclined: false
});
```

**Dashboard** (`frontend/src/lib/data/attendanceStats.js`):
```javascript
// Before: Complex manual aggregation
const memberStatsObj = attendance.reduce((acc, record) => {
  if (record.status === 'checked-in' || record.status === 'attending') {
    // ... manual counting logic
  }
  return acc;
}, {});

// After: Unified service
const topAttendees = await unifiedAttendanceService.getTopAttendees({
  limit: 10,
  dateRange: { startDate: startDateStr, endDate: endDateStr },
  includeFutureEvents: false,
  includeDeclined: false
});
```

**Events Page** (`frontend/src/pages/events.jsx`):
```javascript
// Before: Manual aggregation from attendance data
const topAttendees = useMemo(() => {
  const memberAttendanceCount = {};
  Object.values(attendanceData.attendanceByEvent).forEach(eventAttendance => {
    // ... manual counting logic
  });
  return Object.entries(memberAttendanceCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
}, [attendanceData.attendanceByEvent]);

// After: Unified service
const [topAttendees, setTopAttendees] = useState([]);
useEffect(() => {
  const loadTopAttendees = async () => {
    const attendees = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      includeFutureEvents: false,
      includeDeclined: false
    });
    setTopAttendees(attendees);
  };
  loadTopAttendees();
}, []);
```

## Key Benefits

### 1. **Consistency**
- All pages now show the same attendance numbers for the same member
- Consistent filtering logic across the entire application
- Standardized data processing

### 2. **Maintainability**
- Single source of truth for attendance calculations
- Easy to modify filtering logic in one place
- Reduced code duplication

### 3. **Performance**
- Optimized database queries with proper joins
- Consistent caching strategies
- Reduced redundant data processing

### 4. **Flexibility**
- Configurable options for different use cases
- Easy to add new filtering criteria
- Support for different date ranges and status filters

## Configuration Options

The unified service supports various options:

```javascript
// Member attendance count options
{
  includeFutureEvents: false,    // Include future events
  includeDeclined: false,        // Include declined RSVPs
  dateRange: {                   // Filter by date range
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  }
}

// Top attendees options
{
  limit: 10,                     // Number of top attendees to return
  dateRange: { startDate, endDate },
  includeFutureEvents: false,
  includeDeclined: false
}
```

## Testing

Created `test_attendance_consistency.js` to verify:
- Member attendance counts are consistent
- Top attendees calculations match
- Direct database queries align with service results

## Files Modified

1. **`frontend/src/lib/unifiedAttendanceService.js`** - New unified service
2. **`frontend/src/pages/member-profile.jsx`** - Updated to use unified service
3. **`frontend/src/lib/data/attendanceStats.js`** - Updated to use unified service
4. **`frontend/src/pages/events.jsx`** - Updated to use unified service
5. **`test_attendance_consistency.js`** - Test script for verification

## Expected Results

After these fixes, Anthony Grose (and all other members) should show the same attendance count across:
- Member Profile Page
- Dashboard Top Attendees
- Events Page Top Attendees

The exact number will depend on the actual attendance records in the database, but it will be consistent across all pages. 