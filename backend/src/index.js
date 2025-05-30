require('dotenv').config();
const express = require('express');
const cors = require('cors');
const eventsRouter = require('./routes/events');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Routes
app.use(eventsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 