# AI Ministry Insights Implementation

## 🎯 Overview

This implementation provides **cost-efficient AI insights** for church management using a hybrid approach that combines smart SQL queries with lightweight AI APIs. The system delivers powerful ministry intelligence while keeping costs under $1.00 per church per month.

## 🏗️ Architecture

### Hybrid System Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Smart SQL     │    │  Lightweight    │    │   AI Insights   │
│   Queries       │───▶│  AI APIs        │───▶│   Dashboard     │
│   (Free)        │    │  (Pennies)      │    │   (UI)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Cost Breakdown

| Feature | Method | Cost per Month |
|---------|--------|----------------|
| Smart logic on your DB | Supabase SQL | Free |
| Weekly AI summaries | OpenAI GPT-3.5 | ~$0.10 |
| Insight suggestions | OpenAI GPT-3.5 | ~$0.10 |
| Weekly digest email | Resend/Mailgun | ~$0.01 |
| **Total per church** | | **~$0.75–$1.00** |

## 🧩 Core Components

### 1. SmartInsightsQueries (Free SQL Analysis)

**Location**: `frontend/src/lib/aiInsightsService.js`

**Features**:
- **At-risk member detection**: No check-in + no giving + no events in 60 days
- **Volunteer burnout detection**: 5+ events per month per volunteer
- **Giving trend analysis**: Statistical analysis of donation patterns
- **Visitor retention tracking**: New vs. returning visitor analysis

**Example Query**:
```javascript
// At-risk members detection
const atRiskMembers = await SmartInsightsQueries.getAtRiskMembers(organizationId);
// Returns members with no activity in 60 days
```

### 2. AIInsightsGenerator (Lightweight AI)

**Location**: `frontend/src/lib/aiInsightsService.js`

**Features**:
- **Cached responses**: 24-hour cache to reduce API calls
- **Fallback logic**: Works even when AI is unavailable
- **Cost optimization**: Uses GPT-3.5 for most tasks
- **Structured prompts**: Consistent, actionable insights

**Example Usage**:
```javascript
// Generate insight summary
const summary = await AIInsightsGenerator.generateInsightSummary(data, 'at-risk-members');

// Generate action suggestions
const actions = await AIInsightsGenerator.generateActionSuggestions(data, 'volunteer-burnout');
```

### 3. AIInsightsService (Main Interface)

**Location**: `frontend/src/lib/aiInsightsService.js`

**Features**:
- **Comprehensive insights**: Combines all analysis types
- **Dashboard integration**: Ready-to-use for UI components
- **Error handling**: Graceful degradation when services fail
- **Cache management**: Automatic cache clearing and stats

**Example Usage**:
```javascript
// Get all insights for dashboard
const insights = await AIInsightsService.getDashboardInsights(organizationId);

// Get weekly digest
const digest = await AIInsightsService.getWeeklyDigest(organizationId);
```

## 🎨 UI Components

### AIInsightsPanel

**Location**: `frontend/src/components/AIInsightsPanel.jsx`

**Features**:
- **Modern design**: Clean, professional interface
- **Expandable cards**: Click to see detailed actions
- **Real-time updates**: Refresh button for latest insights
- **Loading states**: Smooth loading animations
- **Cost transparency**: Shows cost-efficiency info

**Integration**:
```jsx
// Add to dashboard
<AIInsightsPanel organizationId={user?.user_metadata?.organization_id} />
```

## 🔌 API Endpoints

### 1. Generate Insight
**Endpoint**: `/api/ai/generate-insight`
**Method**: POST
**Purpose**: Generate human-like summaries from structured data

**Request**:
```json
{
  "prompt": "At-risk members analysis...",
  "model": "gpt-3.5-turbo",
  "max_tokens": 150
}
```

**Response**:
```json
{
  "choices": [{
    "message": {
      "content": "3 members haven't been active recently..."
    }
  }],
  "usage": {
    "total_tokens": 45
  }
}
```

### 2. Generate Action
**Endpoint**: `/api/ai/generate-action`
**Method**: POST
**Purpose**: Generate actionable steps for church leadership

### 3. Generate Digest
**Endpoint**: `/api/ai/generate-digest`
**Method**: POST
**Purpose**: Create weekly digest content

## 📧 Email Integration

### WeeklyDigestService

**Location**: `frontend/src/lib/weeklyDigestService.js`

**Features**:
- **HTML email templates**: Beautiful, responsive design
- **Cost tracking**: Shows AI cost per digest
- **Batch sending**: Send to multiple recipients
- **Error handling**: Graceful failure handling

**Usage**:
```javascript
// Send weekly digest
const result = await WeeklyDigestService.sendWeeklyDigest(
  organizationId, 
  ['pastor@church.com', 'admin@church.com']
);
```

## 🚀 Setup Instructions

### 1. Environment Variables

Add to your `.env` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies

```bash
npm install openai@^4.28.0
```

### 3. API Routes Setup

Ensure your API routes are properly configured in your deployment platform (Vercel, Netlify, etc.).

### 4. Database Permissions

Ensure your Supabase RLS policies allow the AI service to access:
- `members` table
- `donations` table
- `event_attendance` table
- `families` table

## 🎯 Usage Examples

### Dashboard Integration

The AI insights panel is automatically integrated into the dashboard and will appear for users with `members:view` permission.

### Manual API Calls

```javascript
// Get specific insights
const atRiskMembers = await SmartInsightsQueries.getAtRiskMembers(orgId);
const givingInsights = await SmartInsightsQueries.getGivingInsights(orgId);

// Generate AI summaries
const summary = await AIInsightsGenerator.generateInsightSummary(atRiskMembers, 'at-risk-members');
```

### Weekly Digest

```javascript
// Send weekly digest to leadership
const result = await WeeklyDigestService.sendWeeklyDigest(
  organizationId,
  ['pastor@church.com']
);
```

## 🔧 Customization

### Adding New Insight Types

1. **Add SQL query** in `SmartInsightsQueries`:
```javascript
static async getNewInsightType(organizationId) {
  // Your SQL logic here
  return data;
}
```

2. **Add AI prompt** in `AIInsightsGenerator`:
```javascript
static buildPrompt(data, insightType) {
  switch (insightType) {
    case 'new-insight-type':
      return `Your prompt for ${insightType}...`;
  }
}
```

3. **Update dashboard** in `AIInsightsPanel`:
```javascript
const insightCards = [
  // ... existing cards
  {
    key: 'newInsightType',
    title: 'New Insight Type',
    icon: NewIcon,
    color: 'border-purple-500',
    // ... other properties
  }
];
```

### Customizing AI Prompts

Modify the prompt builders in `AIInsightsGenerator`:

```javascript
static buildPrompt(data, insightType) {
  const basePrompt = "You are a church insights assistant...";
  
  switch (insightType) {
    case 'at-risk-members':
      return `${basePrompt}
      Custom prompt for at-risk members...
      `;
  }
}
```

## 📊 Monitoring & Analytics

### Cache Statistics

```javascript
// Get cache stats
const stats = AIInsightsService.getCacheStats();
console.log(`Cache size: ${stats.size}`);
```

### Cost Tracking

The system logs token usage for cost monitoring:
```
AI Insight generated - Model: gpt-3.5-turbo, Tokens: 45
```

### Error Handling

All AI calls include fallback logic:
- **Network errors**: Returns fallback summaries
- **API limits**: Graceful degradation
- **Invalid responses**: Uses cached or default content

## 🎯 Best Practices

### 1. Cost Optimization
- Use GPT-3.5 for most tasks (cheaper than GPT-4)
- Implement caching to reduce API calls
- Batch similar requests together
- Set reasonable token limits

### 2. Performance
- Cache insights for 24 hours
- Use async/await for non-blocking operations
- Implement loading states in UI
- Handle errors gracefully

### 3. User Experience
- Show cost transparency
- Provide fallback content when AI is unavailable
- Use consistent, encouraging language
- Make insights actionable

### 4. Security
- Validate all API inputs
- Use environment variables for API keys
- Implement rate limiting
- Log usage for monitoring

## 🔮 Future Enhancements

### Planned Features
1. **Embedding search** for sermon archives and policies
2. **Automated scheduling** of weekly digests
3. **Custom insight types** per church needs
4. **Advanced analytics** with trend prediction
5. **Integration** with external church management tools

### Scalability Considerations
- **Database optimization**: Index frequently queried fields
- **API rate limiting**: Implement proper throttling
- **Caching strategy**: Redis for larger deployments
- **Monitoring**: Add comprehensive logging and alerts

## 💡 Tips for Success

1. **Start small**: Begin with basic insights and expand
2. **Monitor costs**: Track API usage monthly
3. **Gather feedback**: Ask church leaders what insights are most valuable
4. **Iterate**: Refine prompts based on real-world usage
5. **Document**: Keep track of what works for your specific church

## 🆘 Troubleshooting

### Common Issues

**AI not generating insights**
- Check OpenAI API key
- Verify API endpoint is accessible
- Check network connectivity

**High costs**
- Review token usage logs
- Implement more aggressive caching
- Use GPT-3.5 instead of GPT-4

**Slow performance**
- Check database query performance
- Implement proper indexing
- Consider caching strategies

### Support

For issues or questions:
1. Check the browser console for errors
2. Review API response logs
3. Verify environment variables
4. Test with fallback content

---

**🎉 Congratulations!** You now have a cost-efficient AI insights system that provides powerful ministry intelligence while keeping costs minimal. The hybrid approach ensures you get the benefits of AI without the high costs typically associated with such systems.