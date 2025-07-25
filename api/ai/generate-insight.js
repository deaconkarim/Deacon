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
    const { prompt, model = 'gpt-3.5-turbo-16k', max_tokens = 200 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate model to ensure cost efficiency
    const allowedModels = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo-16k'];
    if (!allowedModels.includes(model)) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert church analytics consultant with 20+ years of experience helping churches grow and engage their communities. Analyze the provided data and give specific, actionable insights that church leaders can implement immediately. Focus on concrete steps, specific numbers, and practical strategies. Be encouraging but direct. Avoid generic advice - provide specific recommendations based on the actual data provided. IMPORTANT: Write in clear, concise paragraphs. Use simple formatting - avoid excessive bold text, bullet points, or complex lists. Write naturally as if explaining to a colleague.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(max_tokens, 250), // Cap at 250 tokens for cost efficiency
      temperature: 0.7, // Balanced creativity
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate insight';

    // Log usage for cost tracking
    console.log(`AI Insight generated - Model: ${model}, Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

    res.status(200).json({
      choices: [{
        message: {
          content: response
        }
      }],
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI insight generation error:', error);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate insight' });
  }
}