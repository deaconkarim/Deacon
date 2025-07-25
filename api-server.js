import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Parse JSON bodies
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    openaiKey: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV 
  });
});

// Test environment endpoint
app.get('/api/test-env', (req, res) => {
  res.json({
    message: 'Environment test',
    openaiKey: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    allEnv: Object.keys(process.env).filter(key => key.includes('OPENAI'))
  });
});

// Generate insight endpoint
app.post('/api/ai/generate-insight', async (req, res) => {
  try {
    const { prompt, model = 'gpt-3.5-turbo-16k', max_tokens = 150 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Validate model
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
      max_tokens: Math.min(max_tokens, 200),
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate insight';

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
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

// Generate action endpoint
app.post('/api/ai/generate-action', async (req, res) => {
  try {
    const { prompt, model = 'gpt-3.5-turbo-16k', max_tokens = 200 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Validate model
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
          content: 'You are a senior church leadership consultant specializing in data-driven ministry strategies. Based on the provided data, give 2-3 specific, immediate action steps that church leaders can implement this week. Include specific names, numbers, and timeframes when available. Focus on high-impact, low-effort actions that will show immediate results. IMPORTANT: Write in clear, concise paragraphs. Use simple formatting - avoid excessive bold text, bullet points, or complex lists. Write naturally as if explaining to a colleague.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(max_tokens, 250),
      temperature: 0.6,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate action suggestions';

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
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate action suggestions' });
  }
});

// Generate digest endpoint
app.post('/api/ai/generate-digest', async (req, res) => {
  try {
    const { prompt, model = 'gpt-3.5-turbo-16k', max_tokens = 300 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Validate model
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
          content: 'You are a church communications director with expertise in data storytelling. Create a compelling weekly digest that tells the story of your church\'s ministry through numbers and trends. Highlight specific achievements, identify areas needing attention, and provide context for the data. Use specific names and numbers when available. Make it encouraging but honest - celebrate wins while addressing challenges constructively. Keep it concise but informative. IMPORTANT: Write in clear, concise paragraphs. Use simple formatting - avoid excessive bold text, bullet points, or complex lists. Write naturally as if explaining to a colleague.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(max_tokens, 400),
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate digest';

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
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// Generate prediction endpoint
app.post('/api/ai/generate-prediction', async (req, res) => {
  try {
    const { prompt, model = 'gpt-3.5-turbo-16k', max_tokens = 800 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Validate model
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
          content: 'You are an expert church attendance analyst. You must ALWAYS respond with ONLY valid JSON format. Never include explanations, markdown, or any text outside the JSON structure. Return pure JSON that can be parsed directly. If the user asks for JSON, return exactly that format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(max_tokens, 800),
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate prediction';

    console.log(`AI Prediction generated - Model: ${model}, Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

    res.status(200).json({
      choices: [{
        message: {
          content: response
        }
      }],
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI prediction generation error:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
}); 