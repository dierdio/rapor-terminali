// --- SUPABASE BAĞLANTISI ---
const supabaseUrl = 'https://poxifowrycsxkhduzshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveGlmb3dyeWNzeGtoZHV6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTI1ODAsImV4cCI6MjEwMTk2ODU4MH0.X0HK_oqako8yY7-Sf9wWGRSgUp7VaYtSFdao7g0OaGE';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const appView = document.getElementById('app-view');

// --- YARDIMCI FONKSİYONLAR ---
function showLoading() {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: var(--neon-green);">
            <i class="fas fa-circle-notch fa-spin fa-3x"></i>
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

function showEmpty(msg) {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: var(--text-muted); flex-direction:column; gap:10px;">
            <i class="fas fa-ghost fa-2x"></i>
            <h3>${msg}</h3>
        </div>
    `;
}

// --- VİEW (GÖRÜNÜM) OLUŞTURUCULAR ---

async function renderHome() {
    showLoading();
    const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return showError('Oyunlar yüklenemedi. Tabloyu oluşturduğunuzdan emin olun.');
    }
    
    if (!games || games.length === 0) {
        return showEmpty('Henüz veritabanına hiç oyun eklemediniz.');
    }

    let html = `<div class="view-section"><div class="game-grid">`;
    games.forEach(game => {
        html += `
            <div class="game-card" onclick="openGameDetail('${game.id}')">
                <img src="${game.image_url}" alt="${game.title}" class="game-poster">
            </div>
        `;
    });
    html += `</div></div>`;
    appView.innerHTML = html;
}

async function renderDiscounts() {
    showLoading();
    // İndirimler tablosunu ve ilişkili oyunu (games) çekiyoruz.
    const { data: discounts, error } = await supabase
        .from('discounts')
        .select('*, games(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return showError('İndirimler yüklenemedi. Tablo yapısını kontrol edin.');
    }

    if (!discounts || discounts.length === 0) {
        return showEmpty('Şu an aktif bir indirim bulunmuyor.');
    }

    let html = `<div class="view-section"><div class="game-grid">`;
    discounts.forEach(item => {
        if (!item.games) return; // İlişkili oyun silinmişse atla
        
        let isFree = item.discount_text.toUpperCase() === 'FREE' || item.discount_text === '-100%';
        let badgeStyle = isFree ? 'background-color: #d4af37; color: #000;' : ''; 
        let discountText = isFree ? 'FREE' : item.discount_text;
        
        // Basit ikon eşleştirme (steam -> fab fa-steam)
        let iconClass = 'fas fa-gamepad';
        if (item.platform.toLowerCase().includes('steam')) iconClass = 'fab fa-steam';
        else if (item.platform.toLowerCase().includes('epic')) iconClass = 'fab fa-neos';
        else if (item.platform.toLowerCase().includes('xbox')) iconClass = 'fab fa-xbox';
        else if (item.platform.toLowerCase().includes('playstation')) iconClass = 'fab fa-playstation';

        html += `
            <div class="game-card" onclick="openGameDetail('${item.game_id}')">
                <div class="discount-badge" style="${badgeStyle}">${discountText}</div>
                <div class="platform-logo">
                    <i class="${iconClass}" style="color: white; font-size: 20px;"></i>
                </div>
                <img src="${item.games.image_url}" alt="${item.games.title}" class="game-poster">
            </div>
        `;
    });
    html += `</div></div>`;
    appView.innerHTML = html;
}

async function renderGameDetail(gameId) {
    showLoading();
    
    // Oyun verisini çek
    const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
    if (gameError) return showError('Oyun detayı bulunamadı.');

    // Yorumları çek
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

    // Puanlar yoksa "N/A" veya 0 gösterelim
    let metaScore = game.metacritic_score || 'N/A';
    let ignScore = game.ign_score || 'N/A';
    let pcgScore = game.pcgamer_score || 'N/A';

    let html = `
        <div class="view-section game-detail">
            <div class="game-banner">
                <img src="${game.banner_url || game.image_url}" alt="${game.title} Banner">
            </div>
            
            <div class="scores-grid">
                <div class="score-item">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg" class="score-logo" alt="Metacritic" style="filter: invert(1); height: 30px;">
                    <div class="score-box score-metacritic">${metaScore}</div>
                </div>
                <div class="score-item">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/IGN_Logo.svg" class="score-logo" alt="IGN" style="height: 30px;">
                    <div class="score-box score-ign" style="font-size: 1.4rem;">${ignScore}</div>
                </div>
                <div class="score-item">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/PC_Gamer_logo.svg" class="score-logo" alt="PC Gamer" style="height: 30px; filter: invert(1);">
                    <div class="score-box score-pcgamer">${pcgScore}</div>
                </div>
            </div>

            <div class="comments-section">
    `;

    if (reviews && reviews.length > 0) {
        reviews.forEach(review => {
            let icon = review.is_recommended ? '<i class="fas fa-thumbs-up thumb-up" style="color:#66c0f4"></i>' : '<i class="fas fa-thumbs-down" style="color:#ff3333"></i>';
            let recText = review.is_recommended ? 'Recommended' : 'Not Recommended';
            html += `
                <div class="comment-card">
                    <div class="comment-header">
                        ${icon}
                        <span>${recText} • ${review.play_time || 'Gizli'} • Yazan: ${review.author}</span>
                    </div>
                    <div class="comment-body">
                        ${review.content}
                    </div>
                </div>
            `;
        });
    } else {
        html += `<div style="color:var(--text-muted); text-align:center;">Bu oyun için henüz yorum yapılmamış.</div>`;
    }

    html += `
            </div>
        </div>
    `;
    appView.innerHTML = html;
}

function renderPlaceholder(pageName) {
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; height:50vh; color: var(--text-muted);">
            <h2>${pageName.toUpperCase()} SAYFASI HAZIRLANIYOR</h2>
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
