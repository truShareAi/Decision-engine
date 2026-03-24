const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- THE AUTO-SEEDER (Run once to build tables) ---
const seedDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        category VARCHAR(100)
      );
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        price DECIMAL(10, 2),
        original_price DECIMAL(10, 2),
        affiliate_link TEXT,
        source VARCHAR(100)
      );
    `);
    
    // Check if data already exists
    const check = await db.query('SELECT COUNT(*) FROM products');
    if (parseInt(check.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO products (name, brand, category) VALUES 
        ('Comprehensive Cover', 'Admiral', 'car-insurance'),
        ('Fixed Rate Mortgage', 'HSBC', 'mortgage');
        
        INSERT INTO deals (product_id, price, original_price, affiliate_link, source) VALUES 
        (1, 450.00, 520.00, 'https://admiral.com', 'Admiral Direct'),
        (2, 1200.00, 1350.00, 'https://hsbc.co.uk', 'HSBC Bank');
      `);
      console.log("✅ Database Seeded Successfully!");
    }
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  }
};
seedDatabase();
// ------------------------------------------------

app.get('/', (req, res) => res.send('Banana API is peeling along nicely! 🍌'));

app.get('/deals', async (req, res) => {
  const { category } = req.query;
  try {
    const result = await db.query(
      `SELECT p.name, p.brand, d.price, d.original_price, d.affiliate_link, d.source 
       FROM products p 
       JOIN deals d ON p.id = d.product_id 
       WHERE p.category = $1`,
      [category]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
