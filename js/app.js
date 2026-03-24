// 1. Point this to your NEW Render URL
const API_URL = 'https://banana-api-engine.onrender.com';

async function displayDeals(category) {
    const container = document.getElementById('dealsContainer');
    if (!container) return; // Only runs on pages that have a dealsContainer div

    try {
        const response = await fetch(`${API_URL}/deals?category=${category}`);
        const deals = await response.json();

        // Clear the "Loading..." or dummy text
        container.innerHTML = '';

        deals.forEach(deal => {
            // This injects the data into your existing CSS design
            container.innerHTML += `
                <div class="product-card">
                    <h3>${deal.brand} - ${deal.name}</h3>
                    <p class="price">£${deal.price} <span class="old-price">£${deal.original_price}</span></p>
                    <p class="source">Via: ${deal.source}</p>
                    <a href="${deal.affiliate_link}" class="buy-btn">View Deal</a>
                </div>
            `;
        });
    } catch (err) {
        console.error("Failed to fetch deals:", err);
        container.innerHTML = '<p>Peeling the data... please refresh.</p>';
    }
}
