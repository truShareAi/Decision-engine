const axios = require('axios');

const API_URL = 'https://decision-engine-d9bs.onrender.com/api';

const initialData = [
    { name: 'Aldi', basket_total: 12.45, status: 'Verified 04:00 AM' },
    { name: 'Lidl', basket_total: 12.52, status: 'Verified 04:00 AM' },
    { name: 'Asda', basket_total: 13.10, status: 'Verified 04:00 AM' },
    { name: 'Tesco', basket_total: 13.40, status: 'Verified 04:00 AM' },
    { name: 'Sainsburys', basket_total: 13.90, status: 'Verified 04:00 AM' },
    { name: 'Morrisons', basket_total: 14.20, status: 'Verified 04:00 AM' },
    { name: 'Waitrose', basket_total: 15.80, status: 'Verified 04:00 AM' }
];

async function seedEngine() {
    console.log("Connecting to Banana Engine...");
    try {
        for (let store of initialData) {
            await axios.post(`${API_URL}/grocery-comparison`, store);
            console.log(`✅ Synced: ${store.name}`);
        }
        console.log("Bingo. The API is live and populated.");
    } catch (err) {
        console.error("❌ Sync Failed: Make sure your API route POST /grocery-comparison exists.");
    }
}

seedEngine();
