const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE SEEDER & SCHEMA ---
const seedDatabase = async () => {
  try {
    // 1. Create Tables (Added Users table)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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

    // 2. Clear and Seed Products/Deals
    await db.query('DELETE FROM deals');
    await db.query('DELETE FROM products');

    const productResult = await db.query(`
      INSERT INTO products (name, brand, category) VALUES 
      ('Comprehensive Cover', 'Admiral', 'car-insurance'),
      ('Fixed Rate Mortgage', 'HSBC', 'mortgage'),
      ('Buildings & Contents', 'Aviva', 'home-insurance'),
      ('Dog & Cat', 'Petplan', 'pet-insurance'),
      ('Level Term Life', 'Legal & General', 'life-insurance'),
      ('Full Fibre 100', 'BT', 'broadband'),
      ('Standard Variable', 'Octopus Energy', 'utilities'),
      ('Personal Loan', 'Tesco Bank', 'loans'),
      ('Organic Banana Pack', 'Waitrose', 'groceries'),
      ('Solar Panel Install', 'EcoSave', 'go-green')
      RETURNING id, category;
    `);

    const p = productResult.rows;
    const findId = (cat) => p.find(x => x.category === cat).id;

    await db.query(`
      INSERT INTO deals (product_id, price, original_price, affiliate_link, source) VALUES 
      (${findId('car-insurance')}, 450.00, 520.00, 'https://admiral.com', 'Admiral Direct'),
      (${findId('mortgage')}, 1200.00, 1350.00, 'https://hsbc.co.uk', 'HSBC Bank'),
      (${findId('home-insurance')}, 22.50, 240.00, 'https://aviva.co.uk', 'Aviva Direct'),
      (${findId('pet-insurance')}, 15.99, 180.00, 'https://petplan.co.uk', '£12,000 Limit'),
      (${findId('life-insurance')}, 12.00, 150000.00, 'https://legalandgeneral.com', 'Term: 25 Years'),
      (${findId('broadband')}, 29.99, 100.00, 'https://bt.com', '100Mbps Avg'),
      (${findId('utilities')}, 155.00, 180.00, 'https://octopus.energy', 'Green Tariffs'),
      (${findId('loans')}, 210.00, 5.2, 'https://tescobank.com', '5.2% APR Fixed'),
      (${findId('groceries')}, 1.25, 2.00, 'https://waitrose.com', 'Clubcard Price'),
      (${findId('go-green')}, 4500.00, 5500.00, 'https://ecosave.com', 'Gov Grant Avail');
    `);

    console.log("✅ Database Synced: Users, Products, and Deals are Live!");
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  }
};

seedDatabase();

// --- ROUTES ---

app.get('/', (req, res) => { res.send('Banana API is live and fully loaded 🍌'); });

// 1. User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username",
      [username, email, hash]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "User already exists or data invalid" });
  }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const validPass = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    res.json({ id: user.rows[0].id, username: user.rows[0].username });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// 3. Grocery Price War Engine
app.get('/api/grocery-war', (req, res) => {
  // Static daily data (easily updatable for a weekly 'shame' list)
  const warData = [
    { name: 'Aldi', basket_total: 10.45, status: 'Cheapest of the Bunch' },
    { name: 'Lidl', basket_total: 10.60, status: 'The Contender' },
    { name: 'ASDA', basket_total: 11.20, status: 'Budget Friendly' },
    { name: 'Morrisons', basket_total: 12.10, status: 'The Middle Ground' },
    { name: 'Tesco', basket_total: 12.80, status: 'Overpriced Essentials' },
    { name: 'Sainsburys', basket_total: 14.10, status: 'Brand Tax Alert' },
    { name: 'Waitrose', basket_total: 16.50, status: 'Premium Penalty' }
  ];
  res.json(warData);
});

// 4. Standard Deals Fetcher
app.get('/api/deals', async (req, res) => {
  const { category } = req.query;
  try {
    const result = await db.query(
      `SELECT p.name, p.brand, p.category, d.price, d.original_price, d.affiliate_link, d.source
      FROM products p JOIN deals d ON p.id = d.product_id WHERE p.category = $1`, [category]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`🚀 Server live on ${PORT}`); });
