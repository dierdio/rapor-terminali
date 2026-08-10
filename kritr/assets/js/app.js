// --- MOCK DATA (Sahte Veriler) ---
const mockGames = [
    { id: 'f1-24', title: 'F1 24', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co830s.jpg' },
    { id: 'subnautica', title: 'Subnautica', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1iqw.jpg' },
    { id: 'cuphead', title: 'Cuphead', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tq9.jpg' },
    { id: 'halo-2', title: 'Halo 2', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2kcy.jpg' },
    { id: 'pc-building-sim', title: 'PC Building Simulator', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x76.jpg' },
    { id: 'stardew-valley', title: 'Stardew Valley', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/xrpmydnu9a09nwuteznp.jpg' },
    { id: 'portal-2', title: 'Portal 2', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rs4.jpg' }
];

const mockDiscounts = [
    { id: 'cocoon', title: 'Cocoon', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6i9q.jpg', discount: '-50%', platformIcon: 'fab fa-steam' },
    { id: 'crysis-2', title: 'Crysis 2 Remastered', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p81.jpg', discount: '-60%', platformIcon: 'fab fa-neos' }, // Epic games icon
    { id: 'construction-sim', title: 'Construction Simulator', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co506z.jpg', discount: '-50%', platformIcon: 'fab fa-xbox' },
    { id: 'rdr2', title: 'Red Dead Redemption 2', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg', discount: '-75%', platformIcon: 'fab fa-steam' },
    { id: 'btd6', title: 'Bloons TD 6', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co38g3.jpg', discount: '-75%', platformIcon: 'fab fa-neos' },
    { id: 'metro-2033', title: 'Metro 2033 Redux', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rci.jpg', discount: 'FREE', platformIcon: 'fab fa-steam', isFree: true }
];

// --- VİEW (GÖRÜNÜM) OLUŞTURUCULAR ---

const appView = document.getElementById('app-view');

function renderHome() {
    let html = `<div class="view-section"><div class="game-grid">`;
    mockGames.forEach(game => {
        html += `
            <div class="game-card" onclick="openGameDetail('${game.id}')">
                <img src="${game.image}" alt="${game.title}" class="game-poster">
            </div>
        `;
    });
    html += `</div></div>`;
    appView.innerHTML = html;
}

function renderDiscounts() {
    let html = `<div class="view-section"><div class="game-grid">`;
    mockDiscounts.forEach(game => {
        let badgeStyle = game.isFree ? 'background-color: #d4af37; color: #000;' : ''; // Altın sarısı Free
        let discountText = game.isFree ? 'FREE' : game.discount;
        html += `
            <div class="game-card" onclick="openGameDetail('${game.id}')">
                <div class="discount-badge" style="${badgeStyle}">${discountText}</div>
                <div class="platform-logo">
                    <i class="${game.platformIcon}" style="color: white; font-size: 20px;"></i>
                </div>
                <img src="${game.image}" alt="${game.title}" class="game-poster">
            </div>
        `;
    });
    html += `</div></div>`;
    appView.innerHTML = html;
}

function renderGameDetail(gameId) {
    // Portal 2 mockup'ına uygun sabit tasarım
    const html = `
        <div class="view-section game-detail">
            <div class="game-banner">
                <img src="https://images.igdb.com/igdb/image/upload/t_screenshot_big/ar3tz.jpg" alt="Portal 2 Banner">
            </div>
            
            <div class="scores-grid">
                <div class="score-item">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg" class="score-logo" alt="Metacritic" style="filter: invert(1); height: 30px;">
                    <div class="score-box score-metacritic">95</div>
                </div>
                <div class="score-item">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/IGN_Logo.svg" class="score-logo" alt="IGN" style="height: 30px;">
                    <div class="score-box score-ign" style="font-size: 1.4rem;">9.5</div>
                </div>
                <div class="score-item">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/PC_Gamer_logo.svg" class="score-logo" alt="PC Gamer" style="height: 30px; filter: invert(1);">
                    <div class="score-box score-pcgamer">94</div>
                </div>
            </div>

            <div class="comments-section">
                <!-- Örnek Steam Yorumu 1 -->
                <div class="comment-card">
                    <div class="comment-header">
                        <i class="fas fa-thumbs-up thumb-up"></i>
                        <span>Recommended • 6.5 hrs on record</span>
                    </div>
                    <div class="comment-body">
                        The first Portal had genius, original gameplay mechanics, great story...
                        <br><br>
                        This sequel brings all those qualities to a new level... lots of wow moments, graphics is beautiful.
                    </div>
                </div>
                <!-- Örnek Steam Yorumu 2 -->
                <div class="comment-card">
                    <div class="comment-header">
                        <i class="fas fa-thumbs-up thumb-up"></i>
                        <span>Recommended • 23.8 hrs on record</span>
                    </div>
                    <div class="comment-body">
                        I wish I could wipe my memory of this game just to experience it for the first time all over again.
                    </div>
                </div>
            </div>
        </div>
    `;
    appView.innerHTML = html;
}

function renderPlaceholder(pageName) {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: var(--text-muted);">
            <h2>${pageName.toUpperCase()} SAYFASI YAPIM AŞAMASINDA</h2>
        </div>
    `;
}

// --- NAVİGASYON (ROUTING) KONTROLÜ ---
function navigate(page) {
    // Aktif class'ı güncelle
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${page}"]`).classList.add('active');

    // Sayfayı render et
    if (page === 'home') renderHome();
    else if (page === 'discounts') renderDiscounts();
    else if (page === 'discover') renderHome(); // Discover da anasayfa gibi
    else renderPlaceholder(page);
    
    // Sayfanın en üstüne kaydır
    appView.scrollTop = 0;
}

// --- DETAYA GİT ---
window.openGameDetail = function(gameId) {
    renderGameDetail(gameId);
}

// İlk açılışta Anasayfayı yükle
document.addEventListener('DOMContentLoaded', () => {
    navigate('home');
});
