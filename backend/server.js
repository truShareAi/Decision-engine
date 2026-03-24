const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Allows your frontend to talk to this API
app.use(express.json()); // Allows the server to read JSON data

// 1. Health Check Route (To see if the server is live)
app.get('/', (req, res) => {
  res.send('Banana API is peeling along nicely! 🍌');
});

// 2. The Main Deals Route
// Usage: GET /deals?category=car-insurance
app.get('/deals', async (req, res) => {
  const { category } = req.query;

  try {
    // We use the 'db' file we created to run the query
    const result = await db.query(
      `SELECT p.name, p.brand, d.price, d.original_price, d.affiliate_link, d.source 
       FROM products p 
       JOIN deals d ON p.id = d.product_id 
       WHERE p.category = $1`,
      [category]
    );

    // Send the results back as JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Database Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

