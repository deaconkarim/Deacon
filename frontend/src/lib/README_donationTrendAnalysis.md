# Donation Trend Analysis

## Overview

The donation trend analysis provides sophisticated weekly pattern analysis for church donations, accounting for the natural ebb and flow of giving throughout the month.

## Key Features

### 🗓️ Weekly Pattern Recognition
- Analyzes donations by week of the month (1-5 weeks)
- Compares current week to the same week in previous months
- Accounts for typical giving patterns (higher at month start)

### 📊 Multiple Comparison Methods
1. **Last Month Comparison**: Current week vs same week last month
2. **3-Month Average**: Current week vs average of same week across last 3 months

### 🎯 Context-Aware Analysis
- Week 1: "First week of month (typically highest giving)"
- Week 2: "Second week of month"
- Week 3: "Third week of month"
- Week 4: "Fourth week of month"
- Week 5+: "Final week of month"

## Functions

### `calculateDonationTrend()`
Main analysis function that returns:
- `currentWeekDonations`: Donations for current week
- `averageWeekDonations`: Average for this week across 3 months
- `lastMonthWeekDonations`: Same week last month
- `primaryTrend`: Main trend percentage
- `trendType`: 'lastMonth' or 'average'
- `canCalculateTrend`: Whether trend can be calculated
- `trendDescription`: Human-readable description
- `trendContext`: Week-specific context

### `getWeeklyDonationBreakdown()`
Returns weekly breakdown for current month:
- Week-by-week donation totals
- Comparison to historical averages
- Trend percentages for each week

## Usage Example

```javascript
import { calculateDonationTrend } from './donationTrendAnalysis';

const trendAnalysis = await calculateDonationTrend();
console.log('Current week trend:', trendAnalysis.primaryTrend);
console.log('Context:', trendAnalysis.trendContext);
```

## Benefits

1. **More Accurate Trends**: Compares same week of different months
2. **Better Insights**: Provides context about typical giving patterns
3. **Actionable Data**: Identifies if current week is above/below historical patterns
4. **Realistic Expectations**: Accounts for natural giving cycles

## Technical Details

- Uses Supabase for data queries
- Handles year/month rollovers correctly
- Graceful error handling for insufficient data
- Caches results to prevent redundant calculations 