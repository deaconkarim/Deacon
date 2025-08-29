import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    // Check environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    const body = await req.json();

    // Test Twilio client initialization
    let twilioTest = 'Not attempted';
    if (accountSid && authToken) {
      try {
        const twilio = await import('https://esm.sh/twilio@4.19.0');
        const twilioClient = twilio.default(accountSid, authToken);
        twilioTest = '✅ Twilio client initialized successfully';
      } catch (error) {
        twilioTest = `❌ Twilio client failed: ${error.message}`;
      }
    } else {
      twilioTest = '❌ Cannot test - missing credentials';
    }

    // Return debug info
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Debug function working',
        envCheck: {
          accountSid: !!accountSid,
          authToken: !!authToken,
          phoneNumber: !!phoneNumber
        },
        twilioTest,
        requestBody: body,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Debug function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 