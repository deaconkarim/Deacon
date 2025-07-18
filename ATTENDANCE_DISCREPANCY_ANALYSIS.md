# Attendance Count Discrepancy Analysis

## Issue Summary

The user reported inconsistent attendance counts for Anthony Grose across different pages:
- **Member Profile**: 15 events attended
- **Dashboard**: 17 events attended  
- **Events Page**: 17 events attended

## Root Cause Analysis

### Database State Investigation

After running database queries, we discovered a critical data inconsistency:

1. **Attendance Records Exist**: 18 unique member IDs have attendance records
2. **Members Table Empty**: No members found in the database
3. **Events Table Empty**: No events found in the database
4. **Orphaned Data**: Attendance records reference non-existent members and events

### Data Inconsistency Details

```
📋 Event attendance in database:
- Event: sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z, Member: null, Status: attending
- Event: sunday-service-1743328800000, Member: 2c56ec59-cffb-4eb7-b841-d5d1072dc90c, Status: checked-in
- Event: sunday-service-1743328800000, Member: 419aaf3e-c19b-4881-92e4-2d543afcb0f0, Status: checked-in
... (18 unique member IDs)
```

### Why Different Pages Show Different Counts

1. **Caching Issues**: Different pages might be using cached data from when members existed
2. **Different Data Sources**: Some pages might be using live data, others cached data
3. **Filtering Logic**: Different pages might have different filtering logic for orphaned records
4. **Error Handling**: Some pages might handle missing member data differently

## Solutions

### Immediate Fixes

1. **Data Cleanup**: Remove orphaned attendance records
2. **Cache Invalidation**: Clear all cached attendance data
3. **Error Handling**: Add proper error handling for missing member data

### Long-term Solutions

1. **Foreign Key Constraints**: Ensure proper foreign key constraints prevent orphaned records
2. **Cascade Deletes**: Implement proper cascade delete behavior
3. **Data Validation**: Add validation to prevent data inconsistencies

## Implementation Plan

### Step 1: Clean Up Orphaned Data

```sql
-- Remove attendance records with null member_id
DELETE FROM event_attendance WHERE member_id IS NULL;

-- Remove attendance records for non-existent members
DELETE FROM event_attendance 
WHERE member_id NOT IN (SELECT id FROM members);

-- Remove attendance records for non-existent events
DELETE FROM event_attendance 
WHERE event_id NOT IN (SELECT id FROM events);
```

### Step 2: Clear Application Caches

```javascript
// Clear all attendance-related caches
window.clearAttendanceCache();
```

### Step 3: Add Data Validation

```javascript
// Add validation to prevent orphaned records
const validateAttendanceRecord = async (memberId, eventId) => {
  const [member, event] = await Promise.all([
    supabase.from('members').select('id').eq('id', memberId).single(),
    supabase.from('events').select('id').eq('id', eventId).single()
  ]);
  
  if (!member.data || !event.data) {
    throw new Error('Invalid member or event reference');
  }
};
```

### Step 4: Improve Error Handling

```javascript
// Add proper error handling for missing data
const getMemberAttendance = async (memberId) => {
  try {
    const { data: member } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .eq('id', memberId)
      .single();
    
    if (!member) {
      console.warn(`Member ${memberId} not found`);
      return { totalCount: 0, records: [] };
    }
    
    // Continue with attendance query...
  } catch (error) {
    console.error('Error fetching member attendance:', error);
    return { totalCount: 0, records: [] };
  }
};
```

## Expected Results

After implementing these fixes:

1. **Consistent Counts**: All pages should show the same attendance count (0 until data is restored)
2. **No Orphaned Data**: Clean database without orphaned records
3. **Better Error Handling**: Graceful handling of missing data
4. **Prevention**: Future data inconsistencies prevented

## Testing

Create test scripts to verify:
- No orphaned attendance records
- Consistent attendance counts across all pages
- Proper error handling for missing data
- Cache invalidation working correctly

## Files to Modify

1. **Database**: Clean up orphaned records
2. **frontend/src/lib/unifiedAttendanceService.js**: Add validation and error handling
3. **frontend/src/pages/member-profile.jsx**: Improve error handling
4. **frontend/src/pages/dashboard.jsx**: Improve error handling
5. **frontend/src/pages/events.jsx**: Improve error handling
6. **Cache management**: Clear all attendance caches 

## Issue Summary

The user reported inconsistent attendance counts for Anthony Grose across different pages:
- **Member Profile**: 15 events attended
- **Dashboard**: 17 events attended  
- **Events Page**: 17 events attended

## Root Cause Analysis

### Database State Investigation

After running database queries, we discovered a critical data inconsistency:

1. **Attendance Records Exist**: 18 unique member IDs have attendance records
2. **Members Table Empty**: No members found in the database
3. **Events Table Empty**: No events found in the database
4. **Orphaned Data**: Attendance records reference non-existent members and events

### Data Inconsistency Details

```
📋 Event attendance in database:
- Event: sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z, Member: null, Status: attending
- Event: sunday-service-1743328800000, Member: 2c56ec59-cffb-4eb7-b841-d5d1072dc90c, Status: checked-in
- Event: sunday-service-1743328800000, Member: 419aaf3e-c19b-4881-92e4-2d543afcb0f0, Status: checked-in
... (18 unique member IDs)
```

### Why Different Pages Show Different Counts

1. **Caching Issues**: Different pages might be using cached data from when members existed
2. **Different Data Sources**: Some pages might be using live data, others cached data
3. **Filtering Logic**: Different pages might have different filtering logic for orphaned records
4. **Error Handling**: Some pages might handle missing member data differently

## Solutions

### Immediate Fixes

1. **Data Cleanup**: Remove orphaned attendance records
2. **Cache Invalidation**: Clear all cached attendance data
3. **Error Handling**: Add proper error handling for missing member data

### Long-term Solutions

1. **Foreign Key Constraints**: Ensure proper foreign key constraints prevent orphaned records
2. **Cascade Deletes**: Implement proper cascade delete behavior
3. **Data Validation**: Add validation to prevent data inconsistencies

## Implementation Plan

### Step 1: Clean Up Orphaned Data

```sql
-- Remove attendance records with null member_id
DELETE FROM event_attendance WHERE member_id IS NULL;

-- Remove attendance records for non-existent members
DELETE FROM event_attendance 
WHERE member_id NOT IN (SELECT id FROM members);

-- Remove attendance records for non-existent events
DELETE FROM event_attendance 
WHERE event_id NOT IN (SELECT id FROM events);
```

### Step 2: Clear Application Caches

```javascript
// Clear all attendance-related caches
window.clearAttendanceCache();
```

### Step 3: Add Data Validation

```javascript
// Add validation to prevent orphaned records
const validateAttendanceRecord = async (memberId, eventId) => {
  const [member, event] = await Promise.all([
    supabase.from('members').select('id').eq('id', memberId).single(),
    supabase.from('events').select('id').eq('id', eventId).single()
  ]);
  
  if (!member.data || !event.data) {
    throw new Error('Invalid member or event reference');
  }
};
```

### Step 4: Improve Error Handling

```javascript
// Add proper error handling for missing data
const getMemberAttendance = async (memberId) => {
  try {
    const { data: member } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .eq('id', memberId)
      .single();
    
    if (!member) {
      console.warn(`Member ${memberId} not found`);
      return { totalCount: 0, records: [] };
    }
    
    // Continue with attendance query...
  } catch (error) {
    console.error('Error fetching member attendance:', error);
    return { totalCount: 0, records: [] };
  }
};
```

## Expected Results

After implementing these fixes:

1. **Consistent Counts**: All pages should show the same attendance count (0 until data is restored)
2. **No Orphaned Data**: Clean database without orphaned records
3. **Better Error Handling**: Graceful handling of missing data
4. **Prevention**: Future data inconsistencies prevented

## Testing

Create test scripts to verify:
- No orphaned attendance records
- Consistent attendance counts across all pages
- Proper error handling for missing data
- Cache invalidation working correctly

## Files to Modify

1. **Database**: Clean up orphaned records
2. **frontend/src/lib/unifiedAttendanceService.js**: Add validation and error handling
3. **frontend/src/pages/member-profile.jsx**: Improve error handling
4. **frontend/src/pages/dashboard.jsx**: Improve error handling
5. **frontend/src/pages/events.jsx**: Improve error handling
6. **Cache management**: Clear all attendance caches 

## Issue Summary

The user reported inconsistent attendance counts for Anthony Grose across different pages:
- **Member Profile**: 15 events attended
- **Dashboard**: 17 events attended  
- **Events Page**: 17 events attended

## Root Cause Analysis

### Database State Investigation

After running database queries, we discovered a critical data inconsistency:

1. **Attendance Records Exist**: 18 unique member IDs have attendance records
2. **Members Table Empty**: No members found in the database
3. **Events Table Empty**: No events found in the database
4. **Orphaned Data**: Attendance records reference non-existent members and events

### Data Inconsistency Details

```
📋 Event attendance in database:
- Event: sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z, Member: null, Status: attending
- Event: sunday-service-1743328800000, Member: 2c56ec59-cffb-4eb7-b841-d5d1072dc90c, Status: checked-in
- Event: sunday-service-1743328800000, Member: 419aaf3e-c19b-4881-92e4-2d543afcb0f0, Status: checked-in
... (18 unique member IDs)
```

### Why Different Pages Show Different Counts

1. **Caching Issues**: Different pages might be using cached data from when members existed
2. **Different Data Sources**: Some pages might be using live data, others cached data
3. **Filtering Logic**: Different pages might have different filtering logic for orphaned records
4. **Error Handling**: Some pages might handle missing member data differently

## Solutions

### Immediate Fixes

1. **Data Cleanup**: Remove orphaned attendance records
2. **Cache Invalidation**: Clear all cached attendance data
3. **Error Handling**: Add proper error handling for missing member data

### Long-term Solutions

1. **Foreign Key Constraints**: Ensure proper foreign key constraints prevent orphaned records
2. **Cascade Deletes**: Implement proper cascade delete behavior
3. **Data Validation**: Add validation to prevent data inconsistencies

## Implementation Plan

### Step 1: Clean Up Orphaned Data

```sql
-- Remove attendance records with null member_id
DELETE FROM event_attendance WHERE member_id IS NULL;

-- Remove attendance records for non-existent members
DELETE FROM event_attendance 
WHERE member_id NOT IN (SELECT id FROM members);

-- Remove attendance records for non-existent events
DELETE FROM event_attendance 
WHERE event_id NOT IN (SELECT id FROM events);
```

### Step 2: Clear Application Caches

```javascript
// Clear all attendance-related caches
window.clearAttendanceCache();
```

### Step 3: Add Data Validation

```javascript
// Add validation to prevent orphaned records
const validateAttendanceRecord = async (memberId, eventId) => {
  const [member, event] = await Promise.all([
    supabase.from('members').select('id').eq('id', memberId).single(),
    supabase.from('events').select('id').eq('id', eventId).single()
  ]);
  
  if (!member.data || !event.data) {
    throw new Error('Invalid member or event reference');
  }
};
```

### Step 4: Improve Error Handling

```javascript
// Add proper error handling for missing data
const getMemberAttendance = async (memberId) => {
  try {
    const { data: member } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .eq('id', memberId)
      .single();
    
    if (!member) {
      console.warn(`Member ${memberId} not found`);
      return { totalCount: 0, records: [] };
    }
    
    // Continue with attendance query...
  } catch (error) {
    console.error('Error fetching member attendance:', error);
    return { totalCount: 0, records: [] };
  }
};
```

## Expected Results

After implementing these fixes:

1. **Consistent Counts**: All pages should show the same attendance count (0 until data is restored)
2. **No Orphaned Data**: Clean database without orphaned records
3. **Better Error Handling**: Graceful handling of missing data
4. **Prevention**: Future data inconsistencies prevented

## Testing

Create test scripts to verify:
- No orphaned attendance records
- Consistent attendance counts across all pages
- Proper error handling for missing data
- Cache invalidation working correctly

## Files to Modify

1. **Database**: Clean up orphaned records
2. **frontend/src/lib/unifiedAttendanceService.js**: Add validation and error handling
3. **frontend/src/pages/member-profile.jsx**: Improve error handling
4. **frontend/src/pages/dashboard.jsx**: Improve error handling
5. **frontend/src/pages/events.jsx**: Improve error handling
6. **Cache management**: Clear all attendance caches 