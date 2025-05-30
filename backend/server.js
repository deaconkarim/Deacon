const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { fetchEvents } = require('./services/eventsService');
const { fetchPrayerRequests } = require('./services/prayerRequestsService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Members routes
app.get('/api/members', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([req.body])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Events endpoints
app.post('/api/events/fetch', async (req, res) => {
  try {
    const events = await fetchEvents();
    res.json({ count: events.length, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Prayer requests endpoints
app.post('/api/prayer-requests/fetch', async (req, res) => {
  try {
    const count = await fetchPrayerRequests();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching prayer requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 