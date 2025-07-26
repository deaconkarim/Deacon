import fs from 'fs/promises';
import readline from 'readline';

class QualityAssessment {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async loadReport(reportPath) {
    try {
      const data = await fs.readFile(reportPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error loading report:', error.message);
      return null;
    }
  }

  async assessQuality(report) {
    console.log('🎯 Quality Assessment Tool');
    console.log('=' .repeat(50));
    console.log('This tool helps you manually assess the quality of responses from different models.');
    console.log('Rate each response on a scale of 1-10 for different criteria.\n');

    const assessments = {};
    const prompts = [...new Set(report.detailedResults.map(r => r.prompt))];

    for (const prompt of prompts) {
      console.log(`\n📝 Assessing: ${prompt}`);
      console.log('-'.repeat(30));

      const promptResults = report.detailedResults.filter(r => r.prompt === prompt);
      
      for (const result of promptResults) {
        console.log(`\n🤖 Model: ${result.modelName}`);
        console.log(`💰 Cost: $${result.totalCost.toFixed(6)}`);
        console.log(`⏱️  Duration: ${result.duration}ms`);
        console.log(`📊 Tokens: ${result.totalTokens}`);
        console.log('\n📄 Response:');
        console.log(result.response);
        console.log('\n' + '='.repeat(80));

        const assessment = await this.getAssessment(result.modelName, prompt);
        assessments[`${result.model}_${prompt}`] = {
          model: result.modelName,
          prompt: prompt,
          cost: result.totalCost,
          duration: result.duration,
          tokens: result.totalTokens,
          ...assessment
        };
      }
    }

    await this.generateQualityReport(assessments, report);
  }

  async getAssessment(modelName, prompt) {
    console.log(`\n📊 Rate ${modelName} for "${prompt}" (1-10 scale):`);

    const criteria = {
      'Accuracy': 'How accurate and factually correct is the response?',
      'Completeness': 'Does it fully address the prompt requirements?',
      'Clarity': 'Is the response clear and easy to understand?',
      'Creativity': 'How creative and original is the response?',
      'Usefulness': 'How practical and actionable is the response?'
    };

    const scores = {};
    
    for (const [criterion, description] of Object.entries(criteria)) {
      const score = await this.getScore(criterion, description);
      scores[criterion] = score;
    }

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    scores['Overall'] = Math.round(overallScore * 10) / 10;

    return scores;
  }

  async getScore(criterion, description) {
    return new Promise((resolve) => {
      this.rl.question(`${criterion} (${description}): `, (answer) => {
        const score = parseFloat(answer);
        if (isNaN(score) || score < 1 || score > 10) {
          console.log('⚠️  Please enter a number between 1 and 10');
          this.getScore(criterion, description).then(resolve);
        } else {
          resolve(score);
        }
      });
    });
  }

  async generateQualityReport(assessments, originalReport) {
    console.log('\n📊 Generating Quality Assessment Report...');

    const report = {
      timestamp: new Date().toISOString(),
      originalReport: originalReport.timestamp,
      assessments: assessments,
      summary: this.generateQualitySummary(assessments),
      recommendations: this.generateQualityRecommendations(assessments)
    };

    const reportPath = `quality_assessment_${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    const markdownPath = `quality_assessment_${Date.now()}.md`;
    await fs.writeFile(markdownPath, this.generateMarkdownReport(report));

    console.log(`\n📄 Quality reports saved:`);
    console.log(`   📊 Detailed: ${reportPath}`);
    console.log(`   📝 Summary: ${markdownPath}`);

    this.displayQualitySummary(report.summary);
    this.rl.close();
  }

  generateQualitySummary(assessments) {
    const models = [...new Set(Object.values(assessments).map(a => a.model))];
    const summary = {};

    for (const model of models) {
      const modelAssessments = Object.values(assessments).filter(a => a.model === model);
      
      const avgScores = {};
      const criteria = ['Accuracy', 'Completeness', 'Clarity', 'Creativity', 'Usefulness', 'Overall'];
      
      for (const criterion of criteria) {
        const scores = modelAssessments.map(a => a[criterion]).filter(s => s !== undefined);
        avgScores[criterion] = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
      }

      const totalCost = modelAssessments.reduce((sum, a) => sum + a.cost, 0);
      const avgDuration = modelAssessments.reduce((sum, a) => sum + a.duration, 0) / modelAssessments.length;

      summary[model] = {
        avgScores,
        totalCost,
        avgDuration,
        assessmentCount: modelAssessments.length
      };
    }

    return summary;
  }

  generateQualityRecommendations(assessments) {
    const summary = this.generateQualitySummary(assessments);
    const recommendations = [];

    // Best overall quality
    const qualityRanking = Object.entries(summary).map(([model, data]) => ({
      model,
      overallScore: data.avgScores.Overall
    })).sort((a, b) => b.overallScore - a.overallScore);

    recommendations.push({
      type: 'Quality',
      title: 'Best Overall Quality',
      model: qualityRanking[0].model,
      reasoning: `Highest average score: ${qualityRanking[0].overallScore.toFixed(1)}/10`
    });

    // Best value (quality per dollar)
    const valueRanking = Object.entries(summary).map(([model, data]) => ({
      model,
      valueScore: data.avgScores.Overall / data.totalCost
    })).sort((a, b) => b.valueScore - a.valueScore);

    recommendations.push({
      type: 'Value',
      title: 'Best Quality per Dollar',
      model: valueRanking[0].model,
      reasoning: `Highest quality-to-cost ratio: ${valueRanking[0].valueScore.toFixed(1)} points per dollar`
    });

    // Best for specific criteria
    const criteria = ['Accuracy', 'Completeness', 'Clarity', 'Creativity', 'Usefulness'];
    for (const criterion of criteria) {
      const criterionRanking = Object.entries(summary).map(([model, data]) => ({
        model,
        score: data.avgScores[criterion]
      })).sort((a, b) => b.score - a.score);

      recommendations.push({
        type: criterion,
        title: `Best for ${criterion}`,
        model: criterionRanking[0].model,
        reasoning: `Highest ${criterion.toLowerCase()} score: ${criterionRanking[0].score.toFixed(1)}/10`
      });
    }

    return recommendations;
  }

  generateMarkdownReport(report) {
    let markdown = `# Quality Assessment Report\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
    markdown += `**Original Report:** ${new Date(report.originalReport).toLocaleString()}\n\n`;

    // Summary Table
    markdown += `## Quality Summary\n\n`;
    markdown += `| Model | Overall | Accuracy | Completeness | Clarity | Creativity | Usefulness | Cost |\n`;
    markdown += `|-------|---------|----------|--------------|---------|------------|------------|------|\n`;

    Object.entries(report.summary).forEach(([model, data]) => {
      markdown += `| ${model} | ${data.avgScores.Overall.toFixed(1)} | ${data.avgScores.Accuracy.toFixed(1)} | ${data.avgScores.Completeness.toFixed(1)} | ${data.avgScores.Clarity.toFixed(1)} | ${data.avgScores.Creativity.toFixed(1)} | ${data.avgScores.Usefulness.toFixed(1)} | $${data.totalCost.toFixed(4)} |\n`;
    });

    // Recommendations
    markdown += `\n## Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      markdown += `### ${rec.title}\n`;
      markdown += `**Model:** ${rec.model}\n\n`;
      markdown += `${rec.reasoning}\n\n`;
    });

    // Detailed Assessments
    markdown += `## Detailed Assessments\n\n`;
    
    const models = [...new Set(Object.values(report.assessments).map(a => a.model))];
    for (const model of models) {
      markdown += `### ${model}\n\n`;
      
      const modelAssessments = Object.values(report.assessments).filter(a => a.model === model);
      for (const assessment of modelAssessments) {
        markdown += `#### ${assessment.prompt}\n`;
        markdown += `- **Cost:** $${assessment.cost.toFixed(6)}\n`;
        markdown += `- **Duration:** ${assessment.duration}ms\n`;
        markdown += `- **Overall Score:** ${assessment.Overall}/10\n`;
        markdown += `- **Accuracy:** ${assessment.Accuracy}/10\n`;
        markdown += `- **Completeness:** ${assessment.Completeness}/10\n`;
        markdown += `- **Clarity:** ${assessment.Clarity}/10\n`;
        markdown += `- **Creativity:** ${assessment.Creativity}/10\n`;
        markdown += `- **Usefulness:** ${assessment.Usefulness}/10\n\n`;
      }
    }

    return markdown;
  }

  displayQualitySummary(summary) {
    console.log('\n📈 QUALITY ASSESSMENT SUMMARY');
    console.log('=' .repeat(60));

    console.log('\n📊 Quality Scores (1-10 scale):');
    console.log('Model'.padEnd(15) + 'Overall'.padEnd(10) + 'Accuracy'.padEnd(10) + 'Complete'.padEnd(10) + 'Clarity'.padEnd(10) + 'Creative'.padEnd(10) + 'Useful'.padEnd(10) + 'Cost');
    console.log('-'.repeat(90));

    Object.entries(summary).forEach(([model, data]) => {
      console.log(
        model.padEnd(15) +
        `${data.avgScores.Overall.toFixed(1)}`.padEnd(10) +
        `${data.avgScores.Accuracy.toFixed(1)}`.padEnd(10) +
        `${data.avgScores.Completeness.toFixed(1)}`.padEnd(10) +
        `${data.avgScores.Clarity.toFixed(1)}`.padEnd(10) +
        `${data.avgScores.Creativity.toFixed(1)}`.padEnd(10) +
        `${data.avgScores.Usefulness.toFixed(1)}`.padEnd(10) +
        `$${data.totalCost.toFixed(4)}`
      );
    });

    console.log('\n💡 Key Insights:');
    const bestOverall = Object.entries(summary).sort((a, b) => b[1].avgScores.Overall - a[1].avgScores.Overall)[0];
    console.log(`   • Best overall quality: ${bestOverall[0]} (${bestOverall[1].avgScores.Overall.toFixed(1)}/10)`);

    const bestValue = Object.entries(summary).sort((a, b) => (b[1].avgScores.Overall / b[1].totalCost) - (a[1].avgScores.Overall / a[1].totalCost))[0];
    const valueScore = bestValue[1].avgScores.Overall / bestValue[1].totalCost;
    console.log(`   • Best value for money: ${bestValue[0]} (${valueScore.toFixed(1)} points per dollar)`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node quality_assessment.js <report_file.json>');
    console.log('Example: node quality_assessment.js model_comparison_report_1234567890.json');
    process.exit(1);
  }

  const reportPath = args[0];
  const assessor = new QualityAssessment();
  
  console.log(`📂 Loading report: ${reportPath}`);
  const report = await assessor.loadReport(reportPath);
  
  if (!report) {
    console.error('❌ Failed to load report');
    process.exit(1);
  }

  console.log(`✅ Loaded report with ${report.detailedResults.length} results`);
  
  await assessor.assessQuality(report);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default QualityAssessment;