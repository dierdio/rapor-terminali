// --- API AYARLARI ---
const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0';
// Vercel yerel test için '/api' veya canlı URL
const REVIEWS_API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api/get-reviews' 
    : '/api/get-reviews'; // Canlıda Vercel proksisi çalışır

const appView = document.getElementById('app-view');

// Mağaza ID'lerini ikonlara çeviren basit harita
const storeIcons = {
    '1': 'fab fa-steam',        // Steam
    '11': 'fab fa-neos',        // Epic Games (yaklaşık ikon)
    '7': 'fab fa-xbox',         // GOG/Xbox vs.
};

// --- YARDIMCI FONKSİYONLAR ---
function showLoading() {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: var(--neon-green);">
            <div style="text-align:center;">
                <i class="fas fa-circle-notch fa-spin fa-3x"></i>
                <p style="margin-top: 15px; color: var(--text-muted);">Veriler Çekiliyor...</p>
            </div>
        </div>
    `;
}

function showError(msg) {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: #ff3333; flex-direction:column; gap:10px;">
            <i class="fas fa-exclamation-triangle fa-2x"></i>
            <h3>HATA: ${msg}</h3>
        </div>
    `;
}

// Resim URL'sini iyileştir (Bazen çok düşük çözünürlüklü geliyor)
function getHighResImage(url, steamAppID) {
    if (steamAppID && steamAppID !== 'null') {
        // Steam'in kendi yüksek çözünürlüklü kütüphane görselini kullan
        return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/library_600x900.jpg`;
    }
    if (!url) return 'https://via.placeholder.com/300x400?text=Kritr';
    return url.replace('capsule_sm_120', 'capsule_616x353').replace('capsule_231x87', 'header');
}

// --- VİEW (GÖRÜNÜM) OLUŞTURUCULAR ---

async function renderHome() {
    showLoading();
    try {
        // En yüksek Metacritic puanlı oyunları çekelim (Ana Sayfa Vitrini) - 60 Oyun
        const res = await fetch(`${CHEAPSHARK_API}/deals?storeID=1&sortBy=Metacritic&pageSize=60`);
        const games = await res.json();
        
        if (!games || games.length === 0) throw new Error("Oyun bulunamadı");

        let html = `<div class="view-section"><div class="game-grid">`;
        games.forEach(game => {
            const imgUrl = getHighResImage(game.thumb, game.steamAppID);
            // onclick için dealID ve steamAppID paslıyoruz
            html += `
                <div class="game-card" onclick="openGameDetail('${game.gameID}', '${game.dealID}', '${game.steamAppID}')">
                    <img src="${imgUrl}" alt="${game.title}" class="game-poster" onerror="this.onerror=null; this.src='${game.thumb}';">
                </div>
            `;
        });
        html += `</div></div>`;
        appView.innerHTML = html;
    } catch (err) {
        showError('Oyunlar yüklenirken hata oluştu: ' + err.message);
    }
}

async function renderDiscounts() {
    showLoading();
    try {
        // İndirim oranı yüksek olanları çekelim - 60 Oyun
        const res = await fetch(`${CHEAPSHARK_API}/deals?sortBy=Savings&pageSize=60&lowerPrice=1`);
        const discounts = await res.json();

        let html = `<div class="view-section"><div class="game-grid">`;
        discounts.forEach(item => {
            const imgUrl = getHighResImage(item.thumb, item.steamAppID);
            const savings = Math.round(item.savings);
            const iconClass = storeIcons[item.storeID] || 'fas fa-gamepad';

            html += `
                <div class="game-card" onclick="openGameDetail('${item.gameID}', '${item.dealID}', '${item.steamAppID}')">
                    <div class="discount-badge">-${savings}%</div>
                    <div class="platform-logo">
                        <i class="${iconClass}" style="color: white; font-size: 20px;"></i>
                    </div>
                    <img src="${imgUrl}" alt="${item.title}" class="game-poster" onerror="this.onerror=null; this.src='${item.thumb}';">
                </div>
            `;
        });
        html += `</div></div>`;
        appView.innerHTML = html;
    } catch (err) {
        showError('İndirimler yüklenirken hata oluştu.');
    }
}

async function renderGameDetail(gameID, dealID, steamAppID) {
    showLoading();
    try {
        // 1. CheapShark'tan oyun detayını çek (Fiyat, İsim, Metacritic vs.)
        const gameRes = await fetch(`${CHEAPSHARK_API}/games?id=${gameID}`);
        const gameData = await gameRes.json();
        const info = gameData.info;
        
        // 2. Steam'den Yorumları Çek (Vercel API üzerinden)
        let reviews = [];
        if (steamAppID && steamAppID !== 'null') {
            try {
                // Not: Geliştirme ortamında vercel dev çalışmıyorsa direkt atlayabilir
                const revRes = await fetch(`${REVIEWS_API}?appid=${steamAppID}`);
                if (revRes.ok) {
                    const revData = await revRes.json();
                    if (revData.reviews) reviews = revData.reviews;
                    if (revData.query_summary) querySummary = revData.query_summary;
                }
            } catch (e) {
                console.log("Steam yorumları çekilemedi (CORS veya API hatası)", e);
            }
        }

        // Skorlar
        let metaScore = info.metacriticScore && info.metacriticScore !== "0" ? info.metacriticScore : 'N/A';
        
        // Gerçek Steam Puanları
        let steamPercent = 'N/A';
        let steamStatus = 'N/A';
        if (querySummary && querySummary.total_reviews > 0) {
            steamPercent = Math.round((querySummary.total_positive / querySummary.total_reviews) * 100) + '%';
            steamStatus = querySummary.review_score_desc || 'N/A';
        }
        
        let bannerImg = getHighResImage(info.thumb);
        let fallbackBanner = info.thumb;
        if(steamAppID && steamAppID !== 'null') {
            bannerImg = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/library_hero.jpg`;
            fallbackBanner = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/header.jpg`;
        }

        let html = `
            <div class="view-section game-detail">
                <div class="game-banner">
                    <img src="${bannerImg}" alt="${info.title} Banner" onerror="this.onerror=null; this.src='${fallbackBanner}'">
                </div>
                
                <!-- Fiyat Bilgisi (Ekstra) -->
                <div style="text-align: center; color: var(--neon-green); font-size: 1.5rem; font-weight: bold;">
                    En Ucuz Fiyat: $${gameData.cheapestPriceEver.price}
                </div>

                <div class="scores-grid">
                    <div class="score-item">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg" class="score-logo" alt="Metacritic" style="filter: invert(1); height: 30px;">
                        <div class="score-box score-metacritic" style="${metaScore === 'N/A' ? 'background:#444' : ''}">${metaScore}</div>
                    </div>
                    <div class="score-item" style="flex-direction: column; justify-content: center; gap: 5px;">
                        <i class="fab fa-steam" style="font-size: 24px; color: white;"></i>
                        <span style="font-size: 0.7rem; color: #aaa; text-align: center;">Steam Puanı</span>
                        <div class="score-box" style="font-size: 1.2rem; background: ${steamPercent === 'N/A' ? '#444' : '#66c0f4'}; color: #fff;">${steamPercent}</div>
                    </div>
                    <div class="score-item" style="flex-direction: column; justify-content: center; gap: 5px;">
                        <i class="fas fa-users" style="font-size: 24px; color: white;"></i>
                        <span style="font-size: 0.7rem; color: #aaa; text-align: center;">Genel Durum</span>
                        <div class="score-box" style="font-size: 0.8rem; background: ${steamStatus === 'N/A' ? '#444' : 'var(--neon-green)'}; padding: 5px; color: #000; text-align: center;">${steamStatus}</div>
                    </div>
                </div>

                <div class="comments-section">
                    <h3 style="color: #fff; margin-bottom: 10px; padding-left: 5px;">Steam Yorumları</h3>
        `;

        if (reviews.length > 0) {
            reviews.forEach(review => {
                let isRecommended = review.voted_up;
                let icon = isRecommended ? '<i class="fas fa-thumbs-up thumb-up" style="color:#66c0f4"></i>' : '<i class="fas fa-thumbs-down" style="color:#ff3333"></i>';
                let recText = isRecommended ? 'Recommended' : 'Not Recommended';
                let playtime = (review.author.playtime_forever / 60).toFixed(1);

                html += `
                    <div class="comment-card">
                        <div class="comment-header">
                            ${icon}
                            <span>${recText} • ${playtime} hrs on record</span>
                        </div>
                        <div class="comment-body">
                            ${review.review.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div style="color:var(--text-muted); text-align:center;">Bu oyun için Steam yorumu bulunamadı.</div>`;
        }

        html += `
                </div>
            </div>
        `;
        appView.innerHTML = html;
    } catch (err) {
        showError('Oyun detayı yüklenemedi: ' + err.message);
    }
}

function renderPlaceholder(pageName) {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: var(--text-muted);">
            <h2>${pageName.toUpperCase()} SAYFASI HAZIRLANIYOR</h2>
        </div>
    `;
}

// --- YÖNLENDİRME (ROUTING) SİSTEMİ ---
function navigateTo(path) {
    window.history.pushState({}, '', path);
    handleRoute();
}

window.navigate = function(page) {
    let path = page === 'home' ? '/kritr/home' : '/kritr/' + page;
    navigateTo(path);
};

window.openGameDetail = function(gameID, dealID, steamAppID) {
    navigateTo(`/kritr/game/${gameID}?deal=${dealID}&steam=${steamAppID}`);
};

function handleRoute() {
    let path = window.location.pathname;
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    appView.scrollTop = 0;

    if (path.startsWith('/kritr/game/')) {
        const urlParams = new URLSearchParams(window.location.search);
        const gameID = path.split('/')[3]; // /kritr/game/ID
        const dealID = urlParams.get('deal') || 'null';
        const steamAppID = urlParams.get('steam') || 'null';
        
        renderGameDetail(gameID, dealID, steamAppID);
    } else {
        let page = path.replace('/kritr/', '');
        if (!page || page === 'kritr') page = 'home';
        
        let navEl = document.querySelector(`.nav-item[data-target="${page}"]`);
        if(navEl) navEl.classList.add('active');

        if (page === 'home' || page === 'discover') renderHome();
        else if (page === 'discounts') renderDiscounts();
        else renderPlaceholder(page);
    }
}

// Geri / İleri tuşlarına basıldığında rotayı yenile
window.addEventListener('popstate', handleRoute);

// İlk açılışta rotayı yakala
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/kritr' || window.location.pathname === '/kritr/') {
        window.history.replaceState({}, '', '/kritr/home');
    }
    handleRoute();
});
