# AI Model Testing Guide

## 🚀 New Feature: AI Model Comparison

I've added a comprehensive AI model testing panel to your dashboard that allows you to compare different OpenAI models with your actual church data.

## 📍 Location

The new **"AI Model Testing"** panel appears on your dashboard right after the AI Insights panel. It's only visible to users with Settings View permissions.

## 🧪 What You Can Test

### Pre-built Test Scenarios

1. **Member Insights Analysis** - Tests how well each model analyzes member engagement patterns
2. **Attendance Prediction** - Compares model performance on predicting event attendance
3. **Communication Strategy** - Tests model ability to generate communication strategies
4. **Event Optimization** - Evaluates models on suggesting event improvements

### Custom Testing

You can also create your own custom prompts to test specific scenarios relevant to your church.

## 🎯 How to Use

### Step 1: Access the Panel
1. Go to your dashboard
2. Look for the **"AI Model Testing"** panel (purple gradient card with brain icon)
3. Make sure you have Settings View permissions

### Step 2: Choose Your Test
1. **Select a Scenario**: Click on one of the pre-built test scenarios
2. **Or Create Custom**: Switch to "Custom Test" tab and write your own prompt
3. **Review Models**: The panel shows all 4 models that will be tested:
   - GPT-4o (Most advanced)
   - GPT-4o Mini (Fast and efficient)
   - GPT-4 Turbo (Previous generation)
   - GPT-3.5 Turbo (Most cost-effective)

### Step 3: Run the Test
1. Click **"Run Comparison"** button
2. Watch the progress bar as each model is tested
3. View real-time results as they complete

### Step 4: Analyze Results
1. **Quick Results**: See immediate cost and performance metrics
2. **Detailed Analysis**: Click "View Details" for comprehensive comparison
3. **Recommendations**: Get suggestions for best model based on your needs

## 📊 What You'll See

### Performance Metrics
- **Cost**: Exact dollar amount for each test
- **Duration**: Response time in milliseconds
- **Tokens**: Token usage (input + output)
- **Success Rate**: Whether the model completed successfully

### Recommendations
- **Fastest Model**: Quickest response time
- **Most Cost-Effective**: Lowest cost per test
- **Best Value**: Balance of performance and cost

## 💰 Cost Information

Estimated costs per test:
- **GPT-4o**: ~$0.01-0.03
- **GPT-4o Mini**: ~$0.001-0.003
- **GPT-4 Turbo**: ~$0.03-0.08
- **GPT-3.5 Turbo**: ~$0.002-0.005

**Total for all 4 models**: ~$0.04-0.12

## 🔧 Technical Details

### Backend Integration
- Uses your existing OpenAI API key and AI endpoints
- Leverages existing `/api/ai/generate-insight` endpoint
- Includes proper error handling and rate limiting
- Logs all usage for cost tracking

### Data Privacy
- Only uses sample data from your organization
- No sensitive information is sent to OpenAI
- All tests are logged for audit purposes

## 🎯 Use Cases

### For Church Leaders
- **Budget Planning**: See exactly how much AI features will cost
- **Performance Comparison**: Choose the best model for your needs
- **Quality Assessment**: Evaluate if premium models are worth the cost

### For Developers
- **Model Selection**: Test different models before implementation
- **Cost Optimization**: Find the most efficient model for each task
- **Performance Monitoring**: Track response times and reliability

## 🚨 Important Notes

1. **API Key Required**: Make sure your OpenAI API key is set in environment variables
2. **Rate Limits**: Tests are spaced out to avoid hitting rate limits
3. **Cost Monitoring**: All costs are logged - monitor your OpenAI usage
4. **Data Context**: Tests use your actual church data for realistic results

## 🔄 Updating Models

The panel automatically uses the latest model configurations. If OpenAI releases new models, you can update the `MODELS` configuration in:
- Frontend: `frontend/src/components/ModelComparisonPanel.jsx`
- Backend: `api/ai/generate-insight.js` (add new models to allowedModels array)

## 📈 Next Steps

1. **Run your first test** with a scenario relevant to your church
2. **Compare results** to see which model performs best for your use cases
3. **Consider costs** vs. quality to make informed decisions
4. **Share results** with your team to get consensus on model selection

## 🆘 Troubleshooting

### Common Issues

**"Organization ID is required"**
- Make sure you're logged in and have proper permissions
- Check that your user account is associated with an organization

**"Rate limit exceeded"**
- Wait a few minutes and try again
- The system automatically handles retries

**"Invalid API key"**
- Check your OpenAI API key in environment variables
- Ensure you have sufficient credits in your OpenAI account

**"Failed to test model"**
- Check your internet connection
- Verify OpenAI service status
- Contact support if the issue persists

## 💡 Tips for Best Results

1. **Test with Real Data**: Use scenarios that match your actual needs
2. **Compare Multiple Scenarios**: Different tasks may work better with different models
3. **Consider Volume**: If you'll use AI frequently, cost differences add up
4. **Quality vs. Speed**: Balance response quality with speed requirements
5. **Monitor Usage**: Keep track of your OpenAI usage and costs

---

**Happy testing! 🎉**

This tool will help you make informed decisions about which AI models to use for your church's specific needs.