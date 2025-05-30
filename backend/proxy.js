const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

app.get('/api/events', async (req, res) => {
  try {
    console.log('Fetching events from church website...');
    const response = await axios.get('https://www.blb.church/events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Log the entire HTML for debugging
    console.log('Full HTML:', response.data);
    
    // Log specific elements we're looking for
    const h2Elements = response.data.match(/<h2[^>]*>.*?<\/h2>/gs);
    const h3Elements = response.data.match(/<h3[^>]*>.*?<\/h3>/gs);
    const pElements = response.data.match(/<p[^>]*>.*?<\/p>/gs);
    
    console.log('H2 elements:', h2Elements);
    console.log('H3 elements:', h3Elements);
    console.log('P elements:', pElements);
    
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    res.status(500).json({ 
      error: 'Failed to fetch events',
      message: error.message,
      details: error.response ? {
        status: error.response.status,
        headers: error.response.headers
      } : null
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 