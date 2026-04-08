const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

/* --- AUTO-SEEDER --- */
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

    const check = await db.query('SELECT COUNT(*) FROM products');

    // If database is empty, fill it with Car, Mortgage, and Home data
    if (parseInt(check.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO products (name, brand, category) VALUES 
        ('Comprehensive Cover', 'Admiral', 'car-insurance'),
        ('Fixed Rate Mortgage', 'HSBC', 'mortgage'),
        ('Buildings & Contents', 'Aviva', 'home-insurance');

        INSERT INTO deals (product_id, price, original_price, affiliate_link, source) VALUES 
        (1, 450.00, 520.00, 'https://admiral.com', 'Admiral Direct'),
        (2, 1200.00, 1350.00, 'https://hsbc.co.uk', 'HSBC Bank'),
        (3, 22.50, 240.00, 'https://aviva.co.uk', 'Aviva Direct');
      `);

      console.log("✅ Database Seeded with Home Insurance!");
    }
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  }
};

seedDatabase();

app.get('/', (req, res) => {
  res.send('Banana API is live 🍌');
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
      `SELECT p.name, p.brand, p.category, d.price, d.original_price, d.affiliate_link, d.source,
        (d.original_price - d.price) AS savings,
        ((d.original_price - d.price) / d.price) AS score
      FROM products p
      JOIN deals d ON p.id = d.product_id
      WHERE p.category = $1
      ORDER BY score DESC`,
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
