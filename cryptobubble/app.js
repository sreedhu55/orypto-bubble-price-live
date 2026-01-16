const container = document.getElementById("bubble-container");
const searchInput = document.getElementById("search");
const popup = document.getElementById("popup");

let allCoins = [];
let currentDays = 1;
let zoom = 1;
let bubbles = [];

/* Get % based on selected time */
function getChange(coin, days) {
    if (days === 1) return coin.price_change_percentage_24h;
    if (days === 7) return coin.price_change_percentage_7d_in_currency;
    if (days === 30) return coin.price_change_percentage_30d_in_currency;
    return 0;
}

/* Load top 200 coins (FAST) */
function loadData(days) {
    currentDays = days;
    container.innerHTML = "Loading...";
    allCoins = [];

    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&price_change_percentage=24h,7d,30d")
        .then(r => r.json())
        .then(data => {
            allCoins = data;
            render(allCoins);
        })
        .catch(() => {
            container.innerHTML = "API error. Use hosting or Live Server.";
        });
}

/* Draw bubbles */
function render(data) {
    container.innerHTML = "";
    bubbles = [];

    const W = container.clientWidth;
    const H = container.clientHeight;

    function overlap(x, y, s) {
        return bubbles.some(b => {
            const dx = b.x - x;
            const dy = b.y - y;
            return Math.sqrt(dx * dx + dy * dy) < (b.s + s) / 2;
        });
    }

    data.forEach(coin => {
        const change = getChange(coin, currentDays);
        if (change === null || change === undefined) return;

        const b = document.createElement("div");
        b.className = "bubble";

        let size = Math.sqrt(coin.market_cap || 1) / 600;
        size = Math.max(45, Math.min(120, size));

        b.style.width = b.style.height = size + "px";

        b.style.background = change >= 0
            ? "radial-gradient(circle,#00ff99,#008060)"
            : "radial-gradient(circle,#ff4d4d,#800000)";

        b.innerHTML = `
            <img src="${coin.image}" loading="lazy">
            <div>${coin.symbol.toUpperCase()}</div>
            <div>${change.toFixed(1)}%</div>
        `;

        let x, y;
        do {
            x = Math.random() * (W - size);
            y = Math.random() * (H - size);
        } while (overlap(x, y, size));

        b.style.transform = `translate(${x}px,${y}px)`;
        b.onclick = () => showPopup(coin);

        container.appendChild(b);

        bubbles.push({
            el: b,
            x, y, s: size,
            dx: (Math.random() - 0.5) * 1.2,
            dy: (Math.random() - 0.5) * 1.2
        });
    });
}

/* Smooth animation */
function animate() {
    const W = container.clientWidth;
    const H = container.clientHeight;

    bubbles.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;

        if (b.x < 0 || b.x > W - b.s) b.dx *= -1;
        if (b.y < 0 || b.y > H - b.s) b.dy *= -1;

        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    });

    requestAnimationFrame(animate);
}
animate();

/* Search */
searchInput.oninput = () => {
    const v = searchInput.value.toLowerCase();
    render(allCoins.filter(c =>
        c.name.toLowerCase().includes(v) ||
        c.symbol.toLowerCase().includes(v)
    ));
};

/* Zoom */
window.onwheel = e => {
    zoom += e.deltaY * -0.001;
    zoom = Math.min(Math.max(zoom, 0.6), 2);
    container.style.transform = `scale(${zoom})`;
};

/* Popup */
function showPopup(coin) {
    popup.style.display = "flex";
    document.getElementById("pimg").src = coin.image;
    document.getElementById("pname").innerText = coin.name;
    document.getElementById("pprice").innerText = "Price: $" + coin.current_price;
    document.getElementById("p24h").innerText = "24h: " + coin.price_change_percentage_24h.toFixed(2) + "%";
    document.getElementById("p7d").innerText = "7d: " + coin.price_change_percentage_7d_in_currency.toFixed(2) + "%";
    document.getElementById("p30d").innerText = "30d: " + coin.price_change_percentage_30d_in_currency.toFixed(2) + "%";
}

/* Close popup */
document.getElementById("close").onclick = () => {
    popup.style.display = "none";
};

/* Initial load */
loadData(1);
