const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

    console.log("✅ Database Synced: All 10 Categories Live!");
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  }
};

seedDatabase();

app.get('/', (req, res) => { res.send('Banana API is live and fully loaded 🍌'); });

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
