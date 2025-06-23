import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const defaultTemplates = [
  {
    name: 'Prayer Request Notification',
    description: 'Notify prayer team of new prayer request',
    template_text: 'New Prayer Request from {name}:\n\n{request}\n\nPhone: {phone}',
    variables: ['name', 'request', 'phone'],
    is_active: true
  },
  {
    name: 'Event Reminder',
    description: 'Remind members of upcoming events',
    template_text: 'Reminder: {event_title} on {event_date} at {event_time}. {event_description}',
    variables: ['event_title', 'event_date', 'event_time', 'event_description'],
    is_active: true
  },
  {
    name: 'Emergency Notification',
    description: 'Send urgent notifications to all members',
    template_text: 'URGENT: {message}',
    variables: ['message'],
    is_active: true
  },
  {
    name: 'Welcome Message',
    description: 'Welcome new members to the church',
    template_text: 'Welcome {name}! We\'re so glad you\'re here. If you have any questions, feel free to reach out.',
    variables: ['name'],
    is_active: true
  },
  {
    name: 'Birthday Greeting',
    description: 'Send birthday greetings to members',
    template_text: 'Happy Birthday {name}! We hope you have a wonderful day filled with joy and blessings.',
    variables: ['name'],
    is_active: true
  },
  {
    name: 'Service Cancellation',
    description: 'Notify members of service cancellations',
    template_text: 'IMPORTANT: {service_name} has been cancelled due to {reason}. We\'ll keep you updated.',
    variables: ['service_name', 'reason'],
    is_active: true
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Insert default templates
    const { data, error } = await supabaseClient
      .from('sms_templates')
      .insert(defaultTemplates)
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS templates seeded successfully',
        templates: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Template seeding error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 