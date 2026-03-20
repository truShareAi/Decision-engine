// js/app.js

function globalNavSync() {
    const user = localStorage.getItem('bananaUser');
    const authArea = document.getElementById('navAuthSection');

    if (user && authArea) {
        // This fixes the alignment and adds the Home link automatically
        authArea.style.display = "flex";
        authArea.style.alignItems = "center";
        authArea.style.gap = "20px";
        
        authArea.innerHTML = `
            <a href="/index.html" style="color: white; text-decoration: none; font-size: 0.9rem;">Home</a>
            <a href="/pages/dashboard.html" style="color: #ffcc00; text-decoration: none; font-weight: bold; border: 1px solid #ffcc00; padding: 6px 15px; border-radius: 8px;">Hi, ${user}</a>
        `;
    }
}

// Any page that calls this function gets the 'Smart' Nav automatically
function loadNav() {
    fetch('../components/nav.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('mainNav').innerHTML = data;
            globalNavSync(); // The brain kicks in here
        });
}
