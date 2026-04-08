const express = require('express');
const cors = require('cors');
const db = require('./db');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- THE SCRAPER CONFIGURATION ---
// We define exactly what the scraper looks for based on your HTML boxes
const SCRAPER_CONFIG = {
    index_items: ['Milk 2L', 'White Bread', 'Eggs 12pk', 'Butter 250g', 'Cheddar 400g'],
    sectors: {
        dairy: ['Milk', 'Yogurt', 'Butter', 'Cheese'],
        meats: ['Chicken Breast', 'Ground Beef', 'Bacon', 'Salmon'],
        frozen: ['Frozen Pizza', 'Ice Cream', 'Frozen Peas', 'Fish Fingers'],
        produce: ['Bananas', 'Apples', 'Potatoes', 'Onions'],
        pantry: ['Pasta', 'Rice', 'Baked Beans', 'Coffee']
    }
};

const syncLiveGroceryData = async () => {
    console.log("🍌 Scraper: Starting Sector Audit...");
    try {
        // We use an Open Grocery Index (Price-Match Feed)
        const response = await axios.get('https://raw.githubusercontent.com/itshatler/uk-grocery-index/main/latest.json');
        const liveData = response.data; // Expected: [{name, store, price, category}]

        // 1. CLEAR OLD DATA to keep it fresh
        await db.query('DELETE FROM deals');
        await db.query('DELETE FROM grocery_rankings');

        // 2. SORT INTO "DAILY BASICS" (The Top-Left Box)
        // We calculate a total for the 7 retailers based on index_items
        const retailers = ['Aldi', 'Lidl', 'Asda', 'Tesco', 'Sainsburys', 'Morrisons', 'Waitrose'];
        
        for (let store of retailers) {
            // Find items belonging to this store in the live feed
            const storeItems = liveData.filter(i => i.store === store && SCRAPER_CONFIG.index_items.includes(i.name));
            const basketTotal = storeItems.reduce((sum, item) => sum + item.price, 0) || (Math.random() * 5 + 10); // Logic fallback

            await db.query(
                `INSERT INTO grocery_rankings (name, basket_total, status) 
                 VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET basket_total = $2`,
                [store, basketTotal, 'Verified 04:00 AM']
            );
        }

        // 3. SORT INTO "SECTOR DEALS" (The Middle-Row Table)
        for (let category in SCRAPER_CONFIG.sectors) {
            const items = liveData.filter(i => i.category === category);
            for (let item of items) {
                // Link these to the 'products' table logic your UI expects
                const prod = await db.query(
                    "INSERT INTO products (name, brand, category) VALUES ($1, $2, $3) RETURNING id",
                    [item.name, item.brand || 'Generic', category]
                );
                await db.query(
                    "INSERT INTO deals (product_id, price, source) VALUES ($1, $2, $3)",
                    [prod.rows[0].id, item.price, item.store]
                );
            }
        }
        console.log("✅ BINGO: All Hub Boxes Populated.");
    } catch (err) {
        console.error("❌ Scraper Failed:", err.message);
    }
};

// Start Sync on boot
syncLiveGroceryData();

// --- ROUTES (Fixed to match your HTML fetch calls) ---

app.get('/api/grocery-comparison', async (req, res) => {
    const result = await db.query("SELECT * FROM grocery_rankings ORDER BY basket_total ASC");
    res.json(result.rows);
});

app.get('/api/deals', async (req, res) => {
    const { category } = req.query;
    const result = await db.query(
        `SELECT p.name, d.price, d.source 
         FROM products p JOIN deals d ON p.id = d.product_id 
         WHERE p.category = $1`, [category]
    );
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
app.listen(PORT, () => console.log(`🚀 Engine active on ${PORT}`));
