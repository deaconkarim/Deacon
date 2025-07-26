import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configurations with pricing (per 1K tokens)
const MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    input_cost: 0.0025,  // $2.50 per 1M tokens
    output_cost: 0.01,   // $10.00 per 1M tokens
    description: 'Most advanced model, best reasoning and creativity'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    input_cost: 0.00015, // $0.15 per 1M tokens
    output_cost: 0.0006, // $0.60 per 1M tokens
    description: 'Fast and efficient, good for most tasks'
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    input_cost: 0.01,    // $10.00 per 1M tokens
    output_cost: 0.03,   // $30.00 per 1M tokens
    description: 'Previous generation, still very capable'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    input_cost: 0.0005,  // $0.50 per 1M tokens
    output_cost: 0.0015, // $1.50 per 1M tokens
    description: 'Fastest and most cost-effective'
  }
};

// Test prompts covering different use cases
const TEST_PROMPTS = [
  {
    name: 'Code Generation',
    prompt: `Write a Python function that implements a binary search algorithm. Include proper error handling, type hints, and docstring. The function should return the index of the target element or -1 if not found.`,
    category: 'Programming'
  },
  {
    name: 'Creative Writing',
    prompt: `Write a short story (200-300 words) about a person who discovers they can see through time. Make it engaging and include a surprising twist at the end.`,
    category: 'Creative'
  },
  {
    name: 'Analysis & Reasoning',
    prompt: `Analyze the following scenario: A company wants to implement a 4-day workweek while maintaining the same productivity. What are the potential benefits and challenges? Provide a balanced analysis with specific recommendations.`,
    category: 'Analysis'
  },
  {
    name: 'Technical Explanation',
    prompt: `Explain how blockchain technology works in simple terms that a high school student could understand. Include analogies and avoid technical jargon.`,
    category: 'Education'
  },
  {
    name: 'Problem Solving',
    prompt: `You have 12 balls that look identical, but one is slightly heavier. You have a balance scale and can only use it 3 times. How do you find the heavier ball? Explain your reasoning step by step.`,
    category: 'Logic'
  }
];

class ModelComparisonTool {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async testModel(modelId, prompt, maxRetries = 3) {
    const model = MODELS[modelId];
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    console.log(`\n🧪 Testing ${model.name} with prompt: "${prompt.name}"`);
    
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const startTime = Date.now();
        
        const response = await openai.chat.completions.create({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Provide clear, accurate, and well-structured responses.'
            },
            {
              role: 'user',
              content: prompt.prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          model: modelId,
          modelName: model.name,
          prompt: prompt.name,
          category: prompt.category,
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          response: response.choices[0].message.content,
          duration: duration,
          inputCost: (response.usage.prompt_tokens / 1000) * model.input_cost,
          outputCost: (response.usage.completion_tokens / 1000) * model.output_cost,
          totalCost: ((response.usage.prompt_tokens / 1000) * model.input_cost) + 
                    ((response.usage.completion_tokens / 1000) * model.output_cost)
        };

        console.log(`✅ ${model.name} completed in ${duration}ms`);
        console.log(`   Tokens: ${result.totalTokens} (input: ${result.inputTokens}, output: ${result.outputTokens})`);
        console.log(`   Cost: $${result.totalCost.toFixed(6)}`);
        
        return result;
        
      } catch (error) {
        attempt++;
        console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= maxRetries) {
          throw new Error(`Failed to test ${modelId} after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async runComparison() {
    console.log('🚀 Starting OpenAI Model Comparison Test');
    console.log('=' .repeat(60));
    
    const modelsToTest = Object.keys(MODELS);
    
    for (const prompt of TEST_PROMPTS) {
      console.log(`\n📝 Testing prompt: ${prompt.name} (${prompt.category})`);
      console.log('-'.repeat(40));
      
      for (const modelId of modelsToTest) {
        try {
          const result = await this.testModel(modelId, prompt);
          this.results.push(result);
        } catch (error) {
          console.error(`❌ Error testing ${modelId}: ${error.message}`);
        }
      }
    }
    
    await this.generateReport();
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      summary: this.generateSummary(),
      detailedResults: this.results,
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    const reportPath = `model_comparison_report_${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    const summaryPath = `model_comparison_summary_${Date.now()}.md`;
    await fs.writeFile(summaryPath, this.generateMarkdownReport(report));
    
    console.log(`\n📄 Reports saved:`);
    console.log(`   📊 Detailed: ${reportPath}`);
    console.log(`   📝 Summary: ${summaryPath}`);
    
    this.displaySummary(report.summary);
  }

  generateSummary() {
    const summary = {};
    
    for (const modelId of Object.keys(MODELS)) {
      const modelResults = this.results.filter(r => r.model === modelId);
      
      if (modelResults.length === 0) continue;
      
      summary[modelId] = {
        name: MODELS[modelId].name,
        totalCost: modelResults.reduce((sum, r) => sum + r.totalCost, 0),
        avgDuration: modelResults.reduce((sum, r) => sum + r.duration, 0) / modelResults.length,
        avgTokens: modelResults.reduce((sum, r) => sum + r.totalTokens, 0) / modelResults.length,
        totalTokens: modelResults.reduce((sum, r) => sum + r.totalTokens, 0),
        successRate: modelResults.length / TEST_PROMPTS.length,
        responses: modelResults.map(r => ({
          prompt: r.prompt,
          category: r.category,
          tokens: r.totalTokens,
          cost: r.totalCost,
          duration: r.duration,
          response: r.response.substring(0, 200) + '...' // Truncate for summary
        }))
      };
    }
    
    return summary;
  }

  generateRecommendations() {
    const summary = this.generateSummary();
    const recommendations = [];
    
    // Find most cost-effective model
    const costPerToken = Object.entries(summary).map(([modelId, data]) => ({
      modelId,
      name: data.name,
      costPerToken: data.totalCost / data.totalTokens
    })).sort((a, b) => a.costPerToken - b.costPerToken);
    
    recommendations.push({
      type: 'Cost Efficiency',
      title: 'Most Cost-Effective Model',
      model: costPerToken[0].name,
      reasoning: `Lowest cost per token at $${costPerToken[0].costPerToken.toFixed(6)}`
    });
    
    // Find fastest model
    const speedRanking = Object.entries(summary).map(([modelId, data]) => ({
      modelId,
      name: data.name,
      avgDuration: data.avgDuration
    })).sort((a, b) => a.avgDuration - b.avgDuration);
    
    recommendations.push({
      type: 'Speed',
      title: 'Fastest Model',
      model: speedRanking[0].name,
      reasoning: `Average response time of ${speedRanking[0].avgDuration.toFixed(0)}ms`
    });
    
    // Best value for money (considering both cost and performance)
    const valueRanking = Object.entries(summary).map(([modelId, data]) => ({
      modelId,
      name: data.name,
      valueScore: (1 / data.totalCost) * (1000 / data.avgDuration) // Higher is better
    })).sort((a, b) => b.valueScore - a.valueScore);
    
    recommendations.push({
      type: 'Value',
      title: 'Best Value for Money',
      model: valueRanking[0].name,
      reasoning: 'Best balance of cost and performance'
    });
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    let markdown = `# OpenAI Model Comparison Report\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
    markdown += `**Total Test Duration:** ${(report.totalDuration / 1000).toFixed(1)} seconds\n\n`;
    
    // Summary Table
    markdown += `## Summary\n\n`;
    markdown += `| Model | Total Cost | Avg Duration | Avg Tokens | Success Rate |\n`;
    markdown += `|------|------------|--------------|------------|--------------|\n`;
    
    Object.entries(report.summary).forEach(([modelId, data]) => {
      markdown += `| ${data.name} | $${data.totalCost.toFixed(4)} | ${data.avgDuration.toFixed(0)}ms | ${data.avgTokens.toFixed(0)} | ${(data.successRate * 100).toFixed(0)}% |\n`;
    });
    
    // Recommendations
    markdown += `\n## Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      markdown += `### ${rec.title}\n`;
      markdown += `**Model:** ${rec.model}\n\n`;
      markdown += `${rec.reasoning}\n\n`;
    });
    
    // Detailed Results
    markdown += `## Detailed Results\n\n`;
    
    for (const prompt of TEST_PROMPTS) {
      markdown += `### ${prompt.name} (${prompt.category})\n\n`;
      markdown += `**Prompt:** ${prompt.prompt}\n\n`;
      
      const promptResults = this.results.filter(r => r.prompt === prompt.name);
      
      for (const result of promptResults) {
        markdown += `#### ${result.modelName}\n`;
        markdown += `- **Cost:** $${result.totalCost.toFixed(6)}\n`;
        markdown += `- **Duration:** ${result.duration}ms\n`;
        markdown += `- **Tokens:** ${result.totalTokens} (${result.inputTokens} input, ${result.outputTokens} output)\n`;
        markdown += `- **Response:** ${result.response.substring(0, 300)}${result.response.length > 300 ? '...' : ''}\n\n`;
      }
    }
    
    return markdown;
  }

  displaySummary(summary) {
    console.log('\n📈 SUMMARY RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Performance Summary:');
    console.log('Model'.padEnd(15) + 'Cost'.padEnd(12) + 'Duration'.padEnd(12) + 'Tokens'.padEnd(10) + 'Success');
    console.log('-'.repeat(60));
    
    Object.entries(summary).forEach(([modelId, data]) => {
      console.log(
        data.name.padEnd(15) +
        `$${data.totalCost.toFixed(4)}`.padEnd(12) +
        `${data.avgDuration.toFixed(0)}ms`.padEnd(12) +
        `${data.avgTokens.toFixed(0)}`.padEnd(10) +
        `${(data.successRate * 100).toFixed(0)}%`
      );
    });
    
    console.log('\n💡 Key Insights:');
    const totalCost = Object.values(summary).reduce((sum, data) => sum + data.totalCost, 0);
    console.log(`   • Total test cost: $${totalCost.toFixed(4)}`);
    
    const fastestModel = Object.entries(summary).sort((a, b) => a[1].avgDuration - b[1].avgDuration)[0];
    console.log(`   • Fastest model: ${fastestModel[1].name} (${fastestModel[1].avgDuration.toFixed(0)}ms avg)`);
    
    const cheapestModel = Object.entries(summary).sort((a, b) => a[1].totalCost - b[1].totalCost)[0];
    console.log(`   • Most cost-effective: ${cheapestModel[1].name} ($${cheapestModel[1].totalCost.toFixed(4)})`);
  }
}

// CLI interface
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    console.log('Please set your OpenAI API key in a .env file or environment variable');
    process.exit(1);
  }

  const tool = new ModelComparisonTool();
  
  try {
    await tool.runComparison();
  } catch (error) {
    console.error('❌ Error running comparison:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ModelComparisonTool;