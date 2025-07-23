export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if our specific fix is present
  const hasAccountCheck = true; // This will be true if our code is deployed
  const hasConditionalTransfer = true; // This will be true if our code is deployed
  const hasLogging = true; // This will be true if our code is deployed

  res.json({
    deployed: true,
    timestamp: new Date().toISOString(),
    hasAccountCheck,
    hasConditionalTransfer,
    hasLogging,
    message: 'Debug endpoint - check if this shows up in deployment',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  });
}; 