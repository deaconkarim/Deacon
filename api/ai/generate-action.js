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
    const { prompt, model = 'gpt-3.5-turbo', max_tokens = 200 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate model to ensure cost efficiency
    const allowedModels = ['gpt-3.5-turbo', 'gpt-4o-mini'];
    if (!allowedModels.includes(model)) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a church leadership consultant. Provide 2-3 specific, actionable steps that church leaders can take. Be practical and encouraging. Format as numbered list.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(max_tokens, 250), // Cap at 250 tokens for cost efficiency
      temperature: 0.6, // Slightly more focused for action items
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate action suggestions';

    // Log usage for cost tracking
    console.log(`AI Action generated - Model: ${model}, Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

    res.status(200).json({
      choices: [{
        message: {
          content: response
        }
      }],
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI action generation error:', error);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate action suggestions' });
  }
}