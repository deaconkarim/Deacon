import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = 'gpt-3.5-turbo-16k', max_tokens = 800 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert church attendance analyst. Analyze attendance predictions and provide enhanced insights with specific recommendations. Always respond with valid JSON format.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    const usage = completion.usage;

    res.status(200).json({
      choices: [{
        message: {
          content
        }
      }],
      usage
    });

  } catch (error) {
    console.error('AI prediction generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate prediction',
      details: error.message 
    });
  }
} 