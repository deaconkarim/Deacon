import OpenAI from 'openai';

// Initialize OpenAI with environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { insights, model = 'gpt-3.5-turbo', max_tokens = 300 } = req.body;

    if (!insights) {
      return res.status(400).json({ error: 'Insights data is required' });
    }

    // Validate model to ensure cost efficiency
    const allowedModels = ['gpt-3.5-turbo', 'gpt-4o-mini'];
    if (!allowedModels.includes(model)) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Build the prompt from insights data
    const prompt = `Create a weekly church insights digest based on this data:

    • At-risk members: ${insights.atRiskCount || 0}
    • Volunteers at burnout risk: ${insights.volunteerBurnoutCount || 0}
    • Monthly giving: $${insights.monthlyGiving || 0}
    • Visitor retention rate: ${insights.visitorRetentionRate?.toFixed(1) || 0}%
    • New visitors this week: ${insights.newVisitors || 0}

    Write a brief, encouraging summary highlighting key areas for attention and celebration. Keep it under 150 words.`;

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a church leadership assistant. Create encouraging weekly digests that highlight both areas needing attention and reasons to celebrate. Be concise and actionable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(max_tokens, 350), // Cap at 350 tokens for cost efficiency
      temperature: 0.7, // Balanced creativity
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate weekly digest';

    // Log usage for cost tracking
    console.log(`AI Digest generated - Model: ${model}, Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

    res.status(200).json({
      choices: [{
        message: {
          content: response
        }
      }],
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI digest generation error:', error);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate weekly digest' });
  }
}