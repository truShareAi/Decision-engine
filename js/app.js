// =========================================
// AXIOS — LUXURY FRONTEND SYSTEM
// =========================================

// OPTIONAL API CONNECTION
// Keep for future product/deal integration

const API_URL = 'https://banana-api-engine.onrender.com';


// =========================================
// NAVBAR SCROLL EFFECT
// =========================================

window.addEventListener('scroll', () => {

    const nav = document.querySelector('.top-nav');

    if (!nav) return;

    if (window.scrollY > 40) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

});


// =========================================
// HERO CINEMATIC SLIDER
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    const slides = document.querySelectorAll('.hero-slide');

    if (!slides.length) return;

    let currentSlide = 0;

    function changeSlide() {

        slides[currentSlide].classList.remove('active');

        currentSlide++;

        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        slides[currentSlide].classList.add('active');

    }

    setInterval(changeSlide, 5000);

});


// =========================================
// PREMIUM IMAGE REVEAL ANIMATION
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    const cards = document.querySelectorAll('.product-card');

    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add('visible');

            }

        });

    }, {
        threshold: 0.15
    });

    cards.forEach((card) => {
        observer.observe(card);
    });

});


// =========================================
// OPTIONAL DEAL FETCHING SYSTEM
// Future backend integration
// =========================================

async function displayDeals(category) {

    const container = document.getElementById('dealsContainer');

    if (!container) return;

    try {

        const response = await fetch(`${API_URL}/deals?category=${category}`);

        const deals = await response.json();

        container.innerHTML = '';

        deals.forEach(deal => {

            container.innerHTML += `

                <div class="product-card dynamic-product">

                    <div class="product-meta">

                        <div class="product-category">
                            ${deal.brand}
                        </div>

                        <div class="product-row">

                            <div class="product-title">
                                ${deal.name}
                            </div>

                            <div class="product-price">
                                £${deal.price}
                            </div>

                        </div>

                    </div>

                </div>

            `;

        });

    } catch (err) {

        console.error('Failed to fetch deals:', err);

    }

}
