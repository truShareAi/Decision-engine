const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

/* --- FORCED SEEDER (Works on Free Tier) --- */
const seedDatabase = async () => {
  try {
    // 1. Create Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        category VARCHAR(100),
        UNIQUE(brand, category)
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

    // 2. Insert Products (Using ON CONFLICT to avoid errors)
    await db.query(`
      INSERT INTO products (name, brand, category) VALUES 
      ('Comprehensive Cover', 'Admiral', 'car-insurance'),
      ('Fixed Rate Mortgage', 'HSBC', 'mortgage'),
      ('Buildings & Contents', 'Aviva', 'home-insurance')
      ON CONFLICT (brand, category) DO NOTHING;
    `);

    // 3. Clear and Refresh Deals (Keep it simple for now)
    await db.query('DELETE FROM deals');
    await db.query(`
      INSERT INTO deals (product_id, price, original_price, affiliate_link, source)
      SELECT id, 450.00, 520.00, 'https://admiral.com', 'Admiral Direct' FROM products WHERE brand = 'Admiral' UNION ALL
      SELECT id, 1200.00, 1350.00, 'https://hsbc.co.uk', 'HSBC Bank' FROM products WHERE brand = 'HSBC' UNION ALL
      SELECT id, 22.50, 240.00, 'https://aviva.co.uk', 'Aviva Direct' FROM products WHERE brand = 'Aviva';
    `);

    console.log("✅ Database Synced: Home Insurance is now live!");
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  }
};

seedDatabase();

app.get('/', (req, res) => {
  res.send('Banana API is V2 and Peeling! 🍌');
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query(`SELECT DISTINCT category FROM products`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deals', async (req, res) => {
  const { category } = req.query;
  try {
    const result = await db.query(
      `SELECT p.name, p.brand, p.category, d.price, d.original_price, d.affiliate_link, d.source
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
app.listen(PORT, () => {
  console.log(`🚀 Server live on ${PORT}`);
});
