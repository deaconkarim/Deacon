# 🤖 Automated Demo System

## Overview

The Automated Demo System generates and maintains realistic church management data without manual intervention. Perfect for demos, testing, and showcasing your church management features.

## ✨ Features

### 🎯 **Initial Demo Data Generation**
- **100 realistic members** with varied demographics and attendance patterns
- **6 months of historical events** (Sunday services, Bible studies, fellowship activities)
- **Realistic attendance patterns** with seasonal variations
- **Weekly donation records** with appropriate amounts per member type
- **Member profile images** from various placeholder services
- **Demographic data** including gender, marital status, and contact information

### 🔄 **Automated Weekly Maintenance**
- **Upcoming events generation** - Creates next 4 weeks of events
- **Attendance tracking** - Adds realistic attendance to recent events
- **Weekly donations** - Generates donation records for last Sunday
- **New visitors** - Adds 1-3 new visitors each week
- **Data cleanup** - Removes old data (>1 year) to prevent bloat

### 🎨 **Realistic Member Images**
- **AI-generated faces** from ThisPersonDoesNotExist
- **Initials-based avatars** from UI Avatars
- **Geometric patterns** from Boring Avatars
- **Modern avatar styles** from Dicebear
- **Robot/fun avatars** from Robohash

## 🚀 Getting Started

### 1. Deploy Edge Functions

```bash
# Deploy demo data generation function
cd supabase
npx supabase functions deploy generate-demo-data

# Deploy weekly maintenance function  
npx supabase functions deploy weekly-demo-maintenance
```

### 2. Access Demo System

1. Navigate to **Settings** → **Demo System** (Admin only)
2. Click **"🎯 Generate Initial Demo Data"**
3. Wait for completion (generates 100 members, 52+ events, 1000+ attendance records)

### 3. Enable Auto-Maintenance

1. Toggle **"⏰ Enable Auto-Schedule"** in the Demo System settings
2. Weekly maintenance will run automatically every Sunday at 6 AM

## 📊 Data Patterns

### **Member Types & Attendance**
- **Regular Members (60%)**: 90% Sunday attendance, 60% Bible study
- **Occasional Members (30%)**: 40% Sunday attendance, 20% Bible study  
- **Seasonal Members (10%)**: 20% Sunday attendance, 10% Bible study
- **Visitors (20%)**: 20% Sunday attendance, 10% Bible study

### **Event Types & Frequency**
- **Sunday Services**: Weekly at 10:00 AM (90 min duration)
- **Bible Study**: Weekly Wednesday at 7:00 PM (60 min duration)
- **Fellowship Activities**: Monthly first Saturday at 6:00 PM (2 hour duration)

### **Donation Patterns**
- **Regular Members**: $75 average (50-150% variation)
- **Occasional Members**: $45 average (50-150% variation)
- **Seasonal Members**: $25 average (50-150% variation)
- **Visitors**: 10% donation rate

### **Seasonal Variations**
- **Spring/Fall**: Normal attendance levels
- **Summer**: 20-30% reduced attendance
- **Winter**: 10% increased attendance

## 🛠️ Technical Implementation

### **Edge Functions**

#### `generate-demo-data`
```typescript
POST /functions/v1/generate-demo-data
{
  "organizationId": "your-org-id",
  "memberCount": 50,
  "weeksToGenerate": 26
}
```

#### `weekly-demo-maintenance`
```typescript
POST /functions/v1/weekly-demo-maintenance
{
  "organizationId": "your-org-id"
}
```

### **Database Tables**
- `members` - Member profiles with demographics and images
- `events` - Recurring and one-time events
- `event_attendance` - Attendance tracking with realistic patterns
- `donations` - Weekly donation records
- `organizations` - Multi-tenant organization support

## 🎛️ Admin Controls

### **Demo System Settings Panel**
- **📊 Statistics Dashboard** - Real-time data counts and metrics
- **🎯 Generate Initial Data** - One-click setup for new demos
- **🔄 Run Maintenance** - Manual weekly maintenance trigger
- **⏰ Auto-Schedule Toggle** - Enable/disable automated maintenance
- **🗑️ Reset Demo Data** - Clean slate for new demos

### **Status Indicators**
- **Active/Not Set Up** - Current demo system status
- **Auto-Schedule Enabled/Disabled** - Automation status
- **Last Maintenance** - Timestamp of last update

## 🔧 Configuration Options

### **Member Generation**
```typescript
const config = {
  memberCount: 100,       // Number of members to generate
  weeksToGenerate: 26,    // Weeks of historical data
  organizationId: 'uuid', // Target organization
  startDate: new Date()   // Historical data start point
}
```

### **Event Types**
```typescript
const eventTypes = {
  'Sunday Service': {
    frequency: 'weekly',
    day: 'sunday',
    time: '10:00',
    duration: 90,
    expectedAttendance: 70
  },
  'Bible Study': {
    frequency: 'weekly', 
    day: 'wednesday',
    time: '19:00',
    duration: 60,
    expectedAttendance: 24
  },
  'Fellowship Activity': {
    frequency: 'monthly',
    day: 'first-saturday',
    time: '18:00',
    duration: 120,
    expectedAttendance: 50
  }
}
```

## 📈 Performance Metrics

### **Data Generation Speed**
- **100 members**: ~3 seconds
- **52 events**: ~1 second  
- **1000+ attendance records**: ~5 seconds
- **26 donation batches**: ~2 seconds
- **Total generation time**: ~15 seconds

### **Weekly Maintenance Performance**
- **New events**: ~1 second
- **Attendance updates**: ~2 seconds
- **Donation generation**: ~1 second
- **New visitors**: ~1 second
- **Data cleanup**: ~2 seconds
- **Total maintenance time**: ~10 seconds

## 🔄 Automation Schedule

### **Weekly Maintenance Tasks**
1. **Sunday 6:00 AM**: Run automated maintenance
2. **Generate upcoming events** for next 4 weeks
3. **Add attendance** to events from past week
4. **Create donation records** for last Sunday
5. **Add new visitors** (1-3 random profiles)
6. **Clean up old data** (>1 year old)

### **Cron Configuration**
```bash
# Example cron job (if using external scheduler)
0 6 * * 0 curl -X POST https://your-project.supabase.co/functions/v1/weekly-demo-maintenance
```

## 🎯 Use Cases

### **Sales Demos**
- **Instant realistic data** for product demonstrations
- **Consistent experience** across multiple demo sessions
- **No manual data entry** required

### **Development Testing**
- **Realistic data volumes** for performance testing
- **Edge case scenarios** with varied member types
- **Data relationships** between members, events, and donations

### **Training & Onboarding**
- **Safe environment** for user training
- **Realistic scenarios** for learning workflows
- **Consistent data** for training materials

## 🛡️ Security & Privacy

### **Data Safety**
- **Placeholder emails** (@example.com domain)
- **Fake phone numbers** (555 prefix)
- **AI-generated images** (no real people)
- **Randomized data** (no personal information)

### **Access Control**
- **Admin-only access** to demo system controls
- **Organization isolation** (multi-tenant safe)
- **RLS policies** enforce data boundaries

## 🚨 Troubleshooting

### **Common Issues**

#### **Functions Not Deploying**
```bash
# Check Supabase CLI version
npx supabase --version

# Re-authenticate
npx supabase login

# Deploy with verbose logging
npx supabase functions deploy generate-demo-data --debug
```

#### **No Data Generated**
1. Check organization ID in browser dev tools
2. Verify Edge Function permissions
3. Check Supabase logs for errors
4. Ensure RLS policies allow data insertion

#### **Images Not Loading**
1. Verify image URLs in database
2. Check network connectivity to image services
3. Consider using different image service if one is down
4. Images may load slowly on first view (external services)

### **Debug Mode**
```typescript
// Enable console logging in Edge Functions
console.log('📊 Generated data:', { members, events, attendance, donations })
```

## 📚 API Reference

### **DemoDataGenerator Class**
```typescript
class DemoDataGenerator {
  generateMembers(): Member[]
  generateEvents(): Event[]
  generateAttendance(members: Member[], events: Event[]): Attendance[]
  generateDonations(members: Member[]): Donation[]
  generateMemberImage(firstName: string, lastName: string, gender: string): string
}
```

### **WeeklyDemoMaintenance Class**
```typescript
class WeeklyDemoMaintenance {
  generateUpcomingEvents(): Promise<number>
  addAttendanceToRecentEvents(): Promise<number>
  generateWeeklyDonations(): Promise<number>
  addNewVisitors(): Promise<number>
  cleanupOldData(): Promise<boolean>
}
```

## 📄 License

This automated demo system is part of the Church Management System and follows the same licensing terms.

---

**Happy Demoing!** 🎉

For questions or support, please refer to the main project documentation or open an issue in the repository. 