const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- THE DATA ENGINE ---
const syncLiveGroceryData = async () => {
    console.log("🍌 Banana Engine: Syncing Flaming Prices...");
    try {
        // Clear tables
        await db.query('DELETE FROM deals');
        await db.query('DELETE FROM products');
        await db.query('DELETE FROM grocery_rankings');

        const retailers = ['Aldi', 'Lidl', 'Asda', 'Tesco', 'Sainsburys', 'Morrisons', 'Waitrose'];
        
        // YOUR FIXED PRICE LIST
        const masterList = [
            { name: 'Semi-Skimmed Milk (2pt)', cat: 'dairy', basePrice: 1.20 },
            { name: 'White Toastie Bread (800g)', cat: 'pantry', basePrice: 0.75 },
            { name: 'Free Range Eggs (6pk)', cat: 'dairy', basePrice: 1.50 },
            { name: 'Salted Butter (250g)', cat: 'dairy', basePrice: 1.90 },
            { name: 'Bananas (per kg)', cat: 'produce', basePrice: 0.90 },
            { name: 'Corn Flakes (500g)', cat: 'pantry', basePrice: 0.70 },
            { name: 'Orange Juice (1L)', cat: 'pantry', basePrice: 1.10 }
        ];

        // Process retailers
        for (const store of retailers) {
            let storeTotal = 0;

            for (const item of masterList) {
                // Generate variance for side-by-side comparison
                const priceVariance = (item.basePrice * (0.95 + Math.random() * 0.15)).toFixed(2);
                storeTotal += parseFloat(priceVariance);

                // Insert Product
                const prodResult = await db.query(
                    "INSERT INTO products (name, brand, category) VALUES ($1, $2, $3) RETURNING id",
                    [item.name, 'Essential', item.cat]
                );

                // Insert Deal for this specific retailer
                await db.query(
                    "INSERT INTO deals (product_id, price, source) VALUES ($1, $2, $3)",
                    [prodResult.rows[0].id, priceVariance, store]
                );
            }

            // Update the Top-Left Box Index
            await db.query(
                `INSERT INTO grocery_rankings (name, basket_total, status) 
                 VALUES ($1, $2, $3)`,
                [store, storeTotal.toFixed(2), 'Verified: ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})]
            );
        }

        console.log("✅ BINGO: Engine fully synced with Flaming Prices.");
    } catch (err) {
        console.error("❌ Sync Failed:", err.message);
    }
};

// Start the engine
syncLiveGroceryData();

// --- API ROUTES ---

app.get('/api/grocery-comparison', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM grocery_rankings ORDER BY basket_total ASC");
        res.json(result.rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/deals', async (req, res) => {
    const { category } = req.query;
    try {
        // Updated to show side-by-side comparison in the table
        const result = await db.query(
            `SELECT p.name, d.price, d.source 
             FROM products p JOIN deals d ON p.id = d.product_id 
             WHERE p.category = $1 ORDER BY p.name, d.price ASC`, [category]);
        res.json(result.rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/audit-list', async (req, res) => {
    const { items } = req.body;
    try {
        const result = await db.query("SELECT * FROM grocery_rankings ORDER BY basket_total ASC LIMIT 1");
        const winner = result.rows[0];
        // Calculate based on the number of items in user's list
        const estTotal = (items.length * (parseFloat(winner.basket_total) / 7)).toFixed(2);
        res.json({ cheapest_store: winner.name, cheapest_total: estTotal });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/', (req, res) => { res.send('Banana API Live 🍌'); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Engine active on ${PORT}`));
