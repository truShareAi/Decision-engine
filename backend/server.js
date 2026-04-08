const express = require('express');
const cors = require('cors');
const db = require('./db');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- THE LIVE THIRD-PARTY LINK ---
const SYNC_URL = 'https://groceries.api.price-data.io/v1/uk/index'; 

const syncLiveGroceryData = async () => {
    console.log("🍌 Banana Scraper: Pinging 3rd-Party Price Feed...");
    try {
        // 1. FETCH from the 3rd-party source
        const response = await axios.get(SYNC_URL);
        const liveData = response.data.items; // This is the live 3rd-party data

        // 2. CLEAR and RESET local DB
        await db.query('DELETE FROM deals');
        await db.query('DELETE FROM products');
        await db.query('DELETE FROM grocery_rankings');

        // 3. MAP THE LIVE DATA TO YOUR BOXES
        for (const item of liveData) {
            // Update the Ranking Table (Top Left Box)
            await db.query(
                `INSERT INTO grocery_rankings (name, basket_total, status) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (name) DO UPDATE SET basket_total = EXCLUDED.basket_total`,
                [item.retailer, item.basket_price, 'Live Audit']
            );

            // Update the Sector Deals (Middle Table)
            // This maps 'dairy', 'meats', etc., from the API to your buttons
            const prod = await db.query(
                "INSERT INTO products (name, brand, category) VALUES ($1, $2, $3) RETURNING id",
                [item.product_name, item.brand, item.category]
            );

            await db.query(
                "INSERT INTO deals (product_id, price, source) VALUES ($1, $2, $3)",
                [prod.rows[0].id, item.price, item.retailer]
            );
        }

        console.log("✅ BINGO: Third-party sync successful.");
    } catch (err) {
        console.error("❌ Sync Failed: 3rd-party service unreachable.", err.message);
    }
};

// Run the link-up on start
syncLiveGroceryData();

// --- ROUTES FOR YOUR HTML ---
app.get('/api/grocery-comparison', async (req, res) => {
    const result = await db.query("SELECT * FROM grocery_rankings ORDER BY basket_total ASC");
    res.json(result.rows);
});

app.get('/api/deals', async (req, res) => {
    const { category } = req.query;
    const result = await db.query(
        `SELECT p.name, d.price, d.source FROM products p 
         JOIN deals d ON p.id = d.product_id WHERE p.category = $1`, [category]);
    res.json(result.rows);
});

app.post('/api/audit-list', async (req, res) => {
    const { items } = req.body;
    const result = await db.query("SELECT * FROM grocery_rankings ORDER BY basket_total ASC LIMIT 1");
    const winner = result.rows[0];
    const estTotal = items.length * (parseFloat(winner.basket_total) / 5);
    res.json({ cheapest_store: winner.name, cheapest_total: estTotal });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Engine live on ${PORT}`));
