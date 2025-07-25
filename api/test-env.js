export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.status(200).json({
      message: 'Environment test',
      openaiKey: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      allEnv: Object.keys(process.env).filter(key => key.includes('OPENAI'))
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
} 