const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

/* --- CLEAN & FRESH SEEDER --- */
const seedDatabase = async () => {
  try {
    // Create Tables if they don't exist
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

    // WIPE OLD DATA TO PREVENT CONFLICTS
    await db.query('DELETE FROM deals');
    await db.query('DELETE FROM products');

    // INSERT FRESH DATA
    const productResult = await db.query(`
      INSERT INTO products (name, brand, category) VALUES 
      ('Comprehensive Cover', 'Admiral', 'car-insurance'),
      ('Fixed Rate Mortgage', 'HSBC', 'mortgage'),
      ('Buildings & Contents', 'Aviva', 'home-insurance')
      RETURNING id, category;
    `);

    // Map the IDs to the deals
    const products = productResult.rows;
    const carId = products.find(p => p.category === 'car-insurance').id;
    const mortgageId = products.find(p => p.category === 'mortgage').id;
    const homeId = products.find(p => p.category === 'home-insurance').id;

    await db.query(`
      INSERT INTO deals (product_id, price, original_price, affiliate_link, source) VALUES 
      (${carId}, 450.00, 520.00, 'https://admiral.com', 'Admiral Direct'),
      (${mortgageId}, 1200.00, 1350.00, 'https://hsbc.co.uk', 'HSBC Bank'),
      (${homeId}, 22.50, 240.00, 'https://aviva.co.uk', 'Aviva Direct');
    `);

    console.log("✅ Database Synced Successfully!");
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
