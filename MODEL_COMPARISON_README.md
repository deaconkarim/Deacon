# OpenAI Model Comparison Tool

This tool helps you compare different OpenAI models to evaluate their performance, cost-effectiveness, and quality for your specific use cases.

## 🚀 Quick Start

1. **Set up your OpenAI API key:**
   ```bash
   # Create a .env file in your project root
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

2. **Run the comparison:**
   ```bash
   npm run test-models
   ```

## 📊 What It Tests

The tool compares the following OpenAI models:

| Model | Description | Input Cost | Output Cost |
|-------|-------------|------------|-------------|
| **GPT-4o** | Most advanced model, best reasoning and creativity | $2.50/1M tokens | $10.00/1M tokens |
| **GPT-4o Mini** | Fast and efficient, good for most tasks | $0.15/1M tokens | $0.60/1M tokens |
| **GPT-4 Turbo** | Previous generation, still very capable | $10.00/1M tokens | $30.00/1M tokens |
| **GPT-3.5 Turbo** | Fastest and most cost-effective | $0.50/1M tokens | $1.50/1M tokens |

## 🧪 Test Categories

The tool tests each model with 5 different types of prompts:

1. **Code Generation** - Python binary search implementation
2. **Creative Writing** - Short story with time travel theme
3. **Analysis & Reasoning** - 4-day workweek analysis
4. **Technical Explanation** - Blockchain explanation for high school students
5. **Problem Solving** - Logic puzzle with 12 balls and balance scale

## 📈 What You'll Get

### Console Output
- Real-time progress updates
- Performance metrics for each test
- Summary table with key statistics

### Generated Reports
1. **JSON Report** (`model_comparison_report_[timestamp].json`)
   - Complete raw data
   - All responses and metrics
   - Detailed cost breakdown

2. **Markdown Summary** (`model_comparison_summary_[timestamp].md`)
   - Human-readable format
   - Performance comparison tables
   - Recommendations
   - Sample responses

## 💡 Key Metrics

- **Total Cost** - Combined cost for all tests
- **Average Duration** - Response time in milliseconds
- **Average Tokens** - Token usage per response
- **Success Rate** - Percentage of successful completions
- **Cost per Token** - Efficiency metric

## 🎯 Recommendations

The tool provides three types of recommendations:

1. **Most Cost-Effective** - Lowest cost per token
2. **Fastest Model** - Quickest average response time
3. **Best Value for Money** - Best balance of cost and performance

## 🔧 Customization

You can modify the tool to test different scenarios:

### Add Custom Prompts
Edit the `TEST_PROMPTS` array in `model_comparison_tool.js`:

```javascript
const TEST_PROMPTS = [
  // ... existing prompts ...
  {
    name: 'Your Custom Test',
    prompt: 'Your specific prompt here',
    category: 'Your Category'
  }
];
```

### Test Specific Models
Modify the `MODELS` object to test only certain models:

```javascript
const MODELS = {
  'gpt-4o': { /* ... */ },
  'gpt-4o-mini': { /* ... */ }
  // Remove models you don't want to test
};
```

### Adjust Test Parameters
Modify the API call parameters in the `testModel` function:

```javascript
const response = await openai.chat.completions.create({
  model: modelId,
  messages: [/* ... */],
  max_tokens: 1000,  // Adjust token limit
  temperature: 0.7   // Adjust creativity level
});
```

## 💰 Cost Estimation

The total cost for a full comparison is typically:
- **GPT-4o**: ~$0.05-0.10
- **GPT-4o Mini**: ~$0.005-0.01
- **GPT-4 Turbo**: ~$0.15-0.30
- **GPT-3.5 Turbo**: ~$0.01-0.02

**Total estimated cost: $0.20-0.45**

## 🚨 Important Notes

1. **API Key Security**: Never commit your `.env` file to version control
2. **Rate Limits**: The tool includes retry logic for API rate limits
3. **Cost Monitoring**: Monitor your OpenAI usage dashboard during testing
4. **Model Availability**: Some models may not be available in all regions

## 📝 Example Output

```
🚀 Starting OpenAI Model Comparison Test
============================================================

📝 Testing prompt: Code Generation (Programming)
----------------------------------------

🧪 Testing GPT-4o with prompt: "Code Generation"
✅ GPT-4o completed in 2341ms
   Tokens: 456 (input: 89, output: 367)
   Cost: $0.003675

📈 SUMMARY RESULTS
============================================================

📊 Performance Summary:
Model           Cost         Duration     Tokens     Success
------------------------------------------------------------
GPT-4o          $0.0187      2341ms       456        100%
GPT-4o Mini     $0.0012      1234ms       456        100%
GPT-4 Turbo     $0.0456      3456ms       456        100%
GPT-3.5 Turbo   $0.0023      987ms        456        100%

💡 Key Insights:
   • Total test cost: $0.0678
   • Fastest model: GPT-3.5 Turbo (987ms avg)
   • Most cost-effective: GPT-4o Mini ($0.0012)
```

## 🤝 Contributing

Feel free to enhance the tool by:
- Adding more test categories
- Implementing quality scoring
- Adding support for other AI providers
- Creating visualization tools for the results

## 📞 Support

If you encounter issues:
1. Check your OpenAI API key is valid
2. Ensure you have sufficient API credits
3. Verify your internet connection
4. Check OpenAI's service status

---

**Happy testing! 🎉**