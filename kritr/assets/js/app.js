// --- API AYARLARI ---
const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0';
// Vercel yerel test için '/api' veya canlı URL
const REVIEWS_API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api/get-reviews' 
    : '/api/get-reviews'; // Canlıda Vercel proksisi çalışır

// --- SUPABASE AYARLARI ---
const SUPABASE_URL = 'https://poxifowrycsxkhduzshx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveGlmb3dyeWNzeGtoZHV6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTI1ODAsImV4cCI6MjEwMTk2ODU4MH0.X0HK_oqako8yY7-Sf9wWGRSgUp7VaYtSFdao7g0OaGE';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

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

// --- ÖNBELLEK (CACHE) DURUMU ---
const stateCache = {
    home: { html: '', scrollY: 0, currentPage: 0, hasMore: true, searchTerm: '' },
    discounts: { html: '', scrollY: 0, currentPage: 0, hasMore: true, searchTerm: '' }
};

// --- SONSUZ KAYDIRMA (INFINITE SCROLL) ---
let currentView = '';
let currentPage = 0;
let isLoadingMore = false;
let hasMore = true;
let scrollObserver = null;

let currentSearch = '';
let searchTimeout = null;

// --- ARAMA İŞLEMİ (API ÜZERİNDEN) ---
window.triggerSearch = function() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const newSearch = searchInput.value.trim().toLowerCase();
    if (newSearch === currentSearch) return; // Değişmediyse işlem yapma
    
    currentSearch = newSearch;
    
    // Kullanıcı yazmayı bitirene kadar bekle (Debounce)
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // Eski önbellekleri temizle ki arama sonuçlarıyla karışmasın
        if (currentView === 'home') stateCache.home.html = '';
        if (currentView === 'discounts') stateCache.discounts.html = '';
        
        if (currentView === 'discounts') {
            renderDiscounts();
        } else if (currentView === 'home') {
            renderHome();
        } else {
            navigate('home');
        }
    }, 500);
};

function setupInfiniteScroll(loadFunction) {
    if (scrollObserver) scrollObserver.disconnect();
    
    scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
            currentPage++;
            loadFunction(true);
        }
    }, { rootMargin: '400px' }); // Sayfa sonuna 400px kala tetikle

    setTimeout(() => {
        let sentinel = document.getElementById('scroll-sentinel');
        if (sentinel) scrollObserver.observe(sentinel);
    }, 100);
}

// --- VİEW (GÖRÜNÜM) OLUŞTURUCULAR ---

async function renderHome(isLoadMore = false) {
    if (!isLoadMore) {
        // Eğer geri gelindiyse (farklı bir view'dan 'home'a geçiliyorsa) ve önbellek varsa
        if (stateCache.home.html && currentView !== 'home') {
            appView.innerHTML = stateCache.home.html;
            appView.scrollTop = stateCache.home.scrollY;
            currentPage = stateCache.home.currentPage;
            hasMore = stateCache.home.hasMore;
            currentSearch = stateCache.home.searchTerm || '';
            const sInput = document.getElementById('search-input');
            if (sInput) sInput.value = currentSearch;
            
            currentView = 'home';
            setupInfiniteScroll(renderHome);
            return;
        }

        currentView = 'home';
        // Arama varsa her zaman sayfa 0'dan başlar, yoksa rastgele sayfa
        currentPage = currentSearch ? 0 : Math.floor(Math.random() * 30);
        hasMore = true;
        showLoading();
    }
    
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;

    try {
        let apiUrl = `${CHEAPSHARK_API}/deals?storeID=1&sortBy=Metacritic&pageSize=60&pageNumber=${currentPage}`;
        if (currentSearch) {
            apiUrl = `${CHEAPSHARK_API}/deals?storeID=1&title=${encodeURIComponent(currentSearch)}&pageSize=60&pageNumber=${currentPage}`;
        }
        
        const res = await fetch(apiUrl);
        const games = await res.json();
        
        if (!games || games.length === 0) {
            hasMore = false;
            isLoadingMore = false;
            if(!isLoadMore) appView.innerHTML = '<div class="view-section">Oyun bulunamadı.</div>';
            return;
        }

        let html = '';
        games.forEach(game => {
            const imgUrl = getHighResImage(game.thumb, game.steamAppID);
            html += `
                <div class="game-card" onclick="openGameDetail('${game.gameID}', '${game.dealID}', '${game.steamAppID}')">
                    <img loading="lazy" src="${imgUrl}" alt="${game.title}" class="game-poster" onerror="this.onerror=null; this.src='${game.thumb}';">
                </div>
            `;
        });

        if (!isLoadMore) {
            appView.innerHTML = `
                <div class="view-section">
                    <div class="game-grid" id="main-grid">${html}</div>
                    <div id="scroll-sentinel" style="height: 20px; width: 100%; margin-top: 20px;"></div>
                </div>
            `;
            setupInfiniteScroll(renderHome);
        } else {
            document.getElementById('main-grid').insertAdjacentHTML('beforeend', html);
        }
    } catch (err) {
        if(!isLoadMore) showError('Oyunlar yüklenirken hata oluştu: ' + err.message);
    } finally {
        isLoadingMore = false;
    }
}

async function renderDiscounts(isLoadMore = false) {
    if (!isLoadMore) {
        if (stateCache.discounts.html && currentView !== 'discounts') {
            appView.innerHTML = stateCache.discounts.html;
            appView.scrollTop = stateCache.discounts.scrollY;
            currentPage = stateCache.discounts.currentPage;
            hasMore = stateCache.discounts.hasMore;
            currentSearch = stateCache.discounts.searchTerm || '';
            const sInput = document.getElementById('search-input');
            if (sInput) sInput.value = currentSearch;

            currentView = 'discounts';
            setupInfiniteScroll(renderDiscounts);
            return;
        }

        currentView = 'discounts';
        currentPage = 0;
        hasMore = true;
        showLoading();
    }
    
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;

    try {
        let apiUrl = `${CHEAPSHARK_API}/deals?sortBy=Savings&pageSize=60&lowerPrice=1&pageNumber=${currentPage}`;
        if (currentSearch) {
            apiUrl += `&title=${encodeURIComponent(currentSearch)}`;
        }
        const res = await fetch(apiUrl);
        const discounts = await res.json();

        if (!discounts || discounts.length === 0) {
            hasMore = false;
            isLoadingMore = false;
            if(!isLoadMore) appView.innerHTML = '<div class="view-section">İndirim bulunamadı.</div>';
            return;
        }

        let html = '';
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
                    <img loading="lazy" src="${imgUrl}" alt="${item.title}" class="game-poster" onerror="this.onerror=null; this.src='${item.thumb}';">
                </div>
            `;
        });

        if (!isLoadMore) {
            appView.innerHTML = `
                <div class="view-section">
                    <div class="game-grid" id="main-grid">${html}</div>
                    <div id="scroll-sentinel" style="height: 20px; width: 100%; margin-top: 20px;"></div>
                </div>
            `;
            setupInfiniteScroll(renderDiscounts);
        } else {
            document.getElementById('main-grid').insertAdjacentHTML('beforeend', html);
        }
    } catch (err) {
        if(!isLoadMore) showError('İndirimler yüklenirken hata oluştu.');
    } finally {
        isLoadingMore = false;
    }
}

async function renderGameDetail(gameID, dealID, steamAppID) {
    currentView = 'game_detail';
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

// --- AUTH FONKSİYONLARI & LOGIN VIEW ---
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
};

window.doLogout = async function() {
    await _supabase.auth.signOut();
    window.location.reload();
};

window.handleLoginSubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const isRegister = document.getElementById('auth-mode-toggle').checked;
    
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit-btn');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Bekleyin...';
    
    try {
        if (isRegister) {
            const username = document.getElementById('login-username').value.trim();
            const { data, error } = await _supabase.auth.signUp({ 
                email, 
                password: pass,
                options: {
                    data: {
                        username: username,
                        display_name: username
                    }
                }
            });
            if (error) throw error;
            alert("Kayıt başarılı! Lütfen e-posta adresinize gelen doğrulama bağlantısına tıklayın.");
            document.getElementById('auth-mode-toggle').checked = false;
            window.updateAuthModeUI();
        } else {
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            window.location.href = '/kritr/home';
        }
    } catch (err) {
        errEl.textContent = err.message || "Bir hata oluştu.";
        errEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = isRegister ? 'Kayıt Ol' : 'Giriş Yap';
    }
};

window.updateAuthModeUI = function() {
    const isRegister = document.getElementById('auth-mode-toggle').checked;
    document.getElementById('login-title').textContent = isRegister ? 'Hesap Oluştur' : 'Giriş Yap';
    document.getElementById('login-submit-btn').textContent = isRegister ? 'Kayıt Ol' : 'Giriş Yap';
    
    const userGroup = document.getElementById('username-group');
    const userInput = document.getElementById('login-username');
    if (userGroup && userInput) {
        if (isRegister) {
            userGroup.style.display = 'flex';
            userInput.required = true;
        } else {
            userGroup.style.display = 'none';
            userInput.required = false;
        }
    }
};

function renderLogin() {
    currentView = 'login';
    appView.innerHTML = `
        <div class="view-section" style="display:flex; justify-content:center; align-items:center; min-height:70vh;">
            <div class="login-card">
                <div class="logo" style="text-align:center; font-size:2.5rem; margin-bottom:20px;">KRITR</div>
                <h2 id="login-title" style="text-align:center; margin-bottom:25px; color:var(--text-light);">Giriş Yap</h2>
                
                <form id="login-form" onsubmit="handleLoginSubmit(event)">
                    <div class="form-group" id="username-group" style="display:none;">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="login-username" placeholder="Oyuncu Adınız" class="login-input">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="login-email" required placeholder="ornek@email.com" class="login-input">
                    </div>
                    <div class="form-group">
                        <label>Şifre</label>
                        <input type="password" id="login-password" required placeholder="••••••••" class="login-input">
                    </div>
                    
                    <div class="auth-toggle-wrapper">
                        <span class="auth-toggle-label">Giriş</span>
                        <label class="switch">
                            <input type="checkbox" id="auth-mode-toggle" onchange="updateAuthModeUI()">
                            <span class="slider round"></span>
                        </label>
                        <span class="auth-toggle-label">Kayıt Ol</span>
                    </div>

                    <div id="login-error" style="display:none; color:#ff3333; text-align:center; margin-bottom:15px; font-size:0.9rem;"></div>
                    
                    <button type="submit" class="submit-btn" id="login-submit-btn">Giriş Yap</button>
                </form>
            </div>
        </div>
    `;
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
    
    // Yönlendirme öncesi mevcut view'in durumunu kaydet (Scroll, İçerik vs.)
    if (currentView === 'home' || currentView === 'discounts') {
        stateCache[currentView].html = appView.innerHTML;
        stateCache[currentView].scrollY = appView.scrollTop;
        stateCache[currentView].currentPage = currentPage;
        stateCache[currentView].hasMore = hasMore;
        stateCache[currentView].searchTerm = currentSearch;
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (path.startsWith('/kritr/game/')) {
        appView.scrollTop = 0;
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
        else if (page === 'login') renderLogin();
        else renderPlaceholder(page);
    }
}

// Geri / İleri tuşlarına basıldığında rotayı yenile
window.addEventListener('popstate', handleRoute);

// İlk açılışta rotayı yakala
document.addEventListener('DOMContentLoaded', async () => {
    // --- SUPABASE HATA AYIKLAMA (URL'den Hata Okuma) ---
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const authError = urlParams.get('error_description') || hashParams.get('error_description');
    
    if (authError) {
        alert("Doğrulama Hatası: " + decodeURIComponent(authError).replace(/\+/g, ' '));
        // URL'yi temizle
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Session Kontrolü
    const { data } = await _supabase.auth.getSession();
    const btnHeader = document.querySelector('.login-btn-header');
    const profileBtn = document.getElementById('profile-avatar-btn');
    const emailDisp = document.getElementById('user-email-display');
    
    if (data.session) {
        currentUser = data.session.user;
        if(btnHeader) btnHeader.style.display = 'none';
        if(profileBtn) profileBtn.style.display = 'block';
        
        // Eğer kullanıcı adı varsa onu göster, yoksa e-posta
        const displayName = currentUser.user_metadata?.username || currentUser.email;
        if(emailDisp) emailDisp.textContent = displayName;
    } else {
        if(btnHeader) btnHeader.style.display = 'block';
        if(profileBtn) profileBtn.style.display = 'none';
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', triggerSearch);
    }

    if (window.location.pathname === '/kritr' || window.location.pathname === '/kritr/') {
        window.history.replaceState({}, '', '/kritr/home');
    }
    handleRoute();
});
