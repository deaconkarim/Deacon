import OpenAI from 'openai';
import { supabase } from '../lib/supabaseClient';

// Initialize OpenAI with environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configurations with pricing (per 1K tokens)
const MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    input_cost: 0.0025,  // $2.50 per 1M tokens
    output_cost: 0.01,   // $10.00 per 1M tokens
    max_tokens: 1000
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    input_cost: 0.00015, // $0.15 per 1M tokens
    output_cost: 0.0006, // $0.60 per 1M tokens
    max_tokens: 1000
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    input_cost: 0.01,    // $10.00 per 1M tokens
    output_cost: 0.03,   // $30.00 per 1M tokens
    max_tokens: 1000
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    input_cost: 0.0005,  // $0.50 per 1M tokens
    output_cost: 0.0015, // $1.50 per 1M tokens
    max_tokens: 1000
  }
};

// Helper function to get sample data for testing
async function getSampleData(organizationId, dataType) {
  if (!organizationId) {
    return null;
  }

  try {
    switch (dataType) {
      case 'member_insights':
        // Get sample member data
        const { data: members } = await supabase
          .from('members')
          .select('id, first_name, last_name, email, created_at, organization_id')
          .eq('organization_id', organizationId)
          .limit(10);
        
        return {
          memberCount: members?.length || 0,
          sampleMembers: members?.slice(0, 3) || [],
          dataType: 'member_insights'
        };

      case 'attendance_prediction':
        // Get sample attendance data
        const { data: events } = await supabase
          .from('events')
          .select('id, title, event_date, organization_id')
          .eq('organization_id', organizationId)
          .gte('event_date', new Date().toISOString())
          .limit(5);
        
        return {
          upcomingEvents: events || [],
          dataType: 'attendance_prediction'
        };

      case 'communication_strategy':
        // Get sample communication data
        const { data: communications } = await supabase
          .from('sms_conversations')
          .select('id, conversation_type, title, created_at, organization_id')
          .eq('organization_id', organizationId)
          .limit(10);
        
        return {
          communicationHistory: communications || [],
          dataType: 'communication_strategy'
        };

      case 'event_optimization':
        // Get sample event performance data
        const { data: pastEvents } = await supabase
          .from('events')
          .select('id, title, event_date, organization_id')
          .eq('organization_id', organizationId)
          .lt('event_date', new Date().toISOString())
          .order('event_date', { ascending: false })
          .limit(10);
        
        return {
          pastEvents: pastEvents || [],
          dataType: 'event_optimization'
        };

      default:
        return {
          message: 'Sample data for testing',
          dataType: 'general'
        };
    }
  } catch (error) {
    console.error('Error fetching sample data:', error);
    return {
      message: 'Sample data for testing',
      dataType: 'general'
    };
  }
}

// Helper function to build context-aware prompts
function buildPrompt(basePrompt, sampleData, dataType) {
  let contextPrompt = basePrompt;
  
  if (sampleData) {
    contextPrompt += `\n\nContext Data:\n`;
    
    switch (dataType) {
      case 'member_insights':
        contextPrompt += `- Organization has ${sampleData.memberCount} members\n`;
        if (sampleData.sampleMembers.length > 0) {
          contextPrompt += `- Sample members: ${sampleData.sampleMembers.map(m => `${m.first_name} ${m.last_name}`).join(', ')}\n`;
        }
        break;
        
      case 'attendance_prediction':
        if (sampleData.upcomingEvents.length > 0) {
          contextPrompt += `- Upcoming events: ${sampleData.upcomingEvents.map(e => e.title).join(', ')}\n`;
        }
        break;
        
      case 'communication_strategy':
        if (sampleData.communicationHistory.length > 0) {
          contextPrompt += `- Recent communication types: ${sampleData.communicationHistory.map(c => c.conversation_type).join(', ')}\n`;
        }
        break;
        
      case 'event_optimization':
        if (sampleData.pastEvents.length > 0) {
          contextPrompt += `- Recent past events: ${sampleData.pastEvents.map(e => e.title).join(', ')}\n`;
        }
        break;
    }
  }
  
  return contextPrompt;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, prompt, organizationId, scenario } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }

    // Validate model
    if (!MODELS[model]) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    const modelConfig = MODELS[model];
    const startTime = Date.now();

    // Get sample data based on scenario
    let sampleData = null;
    if (organizationId && scenario) {
      sampleData = await getSampleData(organizationId, scenario);
    }

    // Build enhanced prompt with context
    const enhancedPrompt = buildPrompt(prompt, sampleData, scenario);

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert church analytics consultant with 20+ years of experience helping churches grow and engage their communities. Provide specific, actionable insights based on the data provided. Be concise but thorough in your analysis.'
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: modelConfig.max_tokens,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = completion.choices[0]?.message?.content || 'Unable to generate response';
    const usage = completion.usage || {};

    // Calculate cost
    const inputCost = (usage.prompt_tokens / 1000) * modelConfig.input_cost;
    const outputCost = (usage.completion_tokens / 1000) * modelConfig.output_cost;
    const totalCost = inputCost + outputCost;

    // Log usage for cost tracking
    console.log(`Model test - Model: ${model}, Tokens: ${usage.total_tokens || 'unknown'}, Cost: $${totalCost.toFixed(6)}, Duration: ${duration}ms`);

    res.status(200).json({
      response: response,
      cost: totalCost,
      duration: duration,
      tokens: usage.total_tokens || 0,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      model: model,
      modelName: modelConfig.name
    });

  } catch (error) {
    console.error('Model test error:', error);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ error: 'Insufficient API quota' });
    }

    res.status(500).json({ error: 'Failed to test model' });
  }
}