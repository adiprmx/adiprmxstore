// ========================================
// Adip Lowkey (formerly ADIP RMX) - Main JavaScript
// ========================================

// ========================================
// BADGE "TERJUAL" REAL-TIME (Firebase Realtime Database)
// Membaca /products/{productId}/sold_count PER PRODUK secara live.
// Sumber data publik (read-only) via REST + SSE — sama seperti pola
// yang dipakai promo-engine.js, jadi TIDAK butuh Firebase SDK tambahan.
//
// WAJIB DIISI: SOLD_CONFIG.FIREBASE_DB_URL (lihat panduan instalasi).
// Boleh pakai Firebase project yang SAMA dengan punya promo-engine.js.
// ========================================
const SOLD_CONFIG = {
    // GANTI dengan URL Realtime Database Anda, contoh:
    // 'https://adiprmx-store-default-rtdb.asia-southeast1.firebasedatabase.app'
    FIREBASE_DB_URL: 'https://adip-promo-default-rtdb.asia-southeast1.firebasedatabase.app',
    PRODUCTS_PATH: '/products.json',
    POLL_INTERVAL: 15 * 1000 // cadangan sinkron ulang tiap 15 detik
};
let soldCountsCache = {};

// Bikin markup badge kosong untuk 1 produk (ditempel di .product-tags,
// diisi angkanya setelah data live berhasil diambil)
function soldBadgeHTML(productId) {
    return `<span class="product-sold-badge" data-sold-id="${productId}">` +
        `<span class="sold-fire">🔥</span><span class="sold-count-text"></span>` +
        `</span>`;
}

// Update 1 badge di DOM sesuai cache terbaru
function applySoldBadge(productId) {
    const el = document.querySelector('.product-sold-badge[data-sold-id="' + productId + '"]');
    if (!el) return;
    const entry = soldCountsCache[productId];
    const raw = entry && entry.sold_count !== undefined ? entry.sold_count : (typeof entry === 'number' ? entry : 0);
    const count = parseInt(raw, 10);
    const textEl = el.querySelector('.sold-count-text');
    if (!isNaN(count) && count > 0) {
        textEl.textContent = count.toLocaleString('id-ID') + ' Terjual';
        el.classList.add('is-visible');
    } else {
        el.classList.remove('is-visible');
    }
}

// Terapkan ke semua badge yang sedang tampil di grid (dipanggil tiap
// render/load-more, dan tiap kali data live berubah)
function applyAllSoldBadges() {
    document.querySelectorAll('.product-sold-badge[data-sold-id]').forEach(function (el) {
        applySoldBadge(el.getAttribute('data-sold-id'));
    });
}

// Ambil snapshot /products.json sekali (dipakai saat load awal & fallback polling)
function fetchSoldCountsOnce() {
    if (!SOLD_CONFIG.FIREBASE_DB_URL) return Promise.resolve();
    const url = SOLD_CONFIG.FIREBASE_DB_URL.replace(/\/+$/, '') + SOLD_CONFIG.PRODUCTS_PATH;
    return fetch(url, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            soldCountsCache = data || {};
            applyAllSoldBadges();
        })
        .catch(function () { /* diam saja, badge cukup tetap tersembunyi */ });
}

// Terapkan 1 event stream (put/patch) dari Firebase SSE ke cache lokal
function applySoldStreamEvent(path, data) {
    if (path === '/') {
        soldCountsCache = data || {};
    } else {
        const parts = path.split('/').filter(Boolean);
        const pid = parts[0];
        if (!pid) return;
        if (!soldCountsCache[pid]) soldCountsCache[pid] = {};
        if (parts.length === 1) {
            soldCountsCache[pid] = data || {};
        } else if (parts[1] === 'sold_count') {
            soldCountsCache[pid].sold_count = data;
        }
    }
    applyAllSoldBadges();
}

// Mulai sinkronisasi real-time: coba SSE (push instan) + polling cadangan
// supaya tetap sinkron walau SSE diblokir jaringan/proxy tertentu.
function startSoldCountSync() {
    if (!SOLD_CONFIG.FIREBASE_DB_URL) {
        console.info('[SoldBadge] FIREBASE_DB_URL belum diisi di js/script.js. Badge "Terjual" nonaktif.');
        return;
    }

    fetchSoldCountsOnce();

    try {
        const streamUrl = SOLD_CONFIG.FIREBASE_DB_URL.replace(/\/+$/, '') + SOLD_CONFIG.PRODUCTS_PATH;
        const es = new EventSource(streamUrl);
        es.addEventListener('put', function (e) {
            try { const p = JSON.parse(e.data); applySoldStreamEvent(p.path, p.data); } catch (err) {}
        });
        es.addEventListener('patch', function (e) {
            try { const p = JSON.parse(e.data); applySoldStreamEvent(p.path, p.data); } catch (err) {}
        });
        es.onerror = function () { /* EventSource auto-reconnect; polling di bawah tetap jaga-jaga */ };
    } catch (err) {
        // Browser lama tanpa dukungan EventSource -> andalkan polling saja
    }

    setInterval(fetchSoldCountsOnce, SOLD_CONFIG.POLL_INTERVAL);
}

// Global Variables
let cart = [];
let currentAudio = null;
let isPlaying = false;
let currentTrack = null;
let currentTrackId = null;
let modalProductId = null; // ID produk yang sedang tampil di modal detail

// Filter & Search State
let currentTab = 'flm';
let searchQuery = '';
let sortOption = 'default';
let priceFilter = 'all';
let genreFilter = 'all';

// DOM Elements
const navbar = document.getElementById('navbar');
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const audioPlayer = document.getElementById('audioPlayer');
const audioElement = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const nowPlaying = document.getElementById('nowPlaying');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const playerImage = document.getElementById('playerImage');
const playerClose = document.getElementById('playerClose');

// Search & Filter Elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const sortSelect = document.getElementById('sortSelect');
const priceFilterSelect = document.getElementById('priceFilter');
const genreList = document.getElementById('genreList');
const activeFilters = document.getElementById('activeFilters');
const filterTags = document.getElementById('filterTags');
const resultsCount = document.getElementById('resultsCount');
const flmCount = document.getElementById('flmCount');
const sampleCount = document.getElementById('sampleCount');
const flmNoResults = document.getElementById('flmNoResults');
const sampleNoResults = document.getElementById('sampleNoResults');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavbar();
    initMobileMenu();
    initProductTabs();
    initSearchAndFilter();
    renderProducts();
    renderTestimonials();
    initSmoothScroll();
    initCart();
    initAudioPlayer();
    startSoldCountSync();
});

// ========================================
// NAVBAR
// ========================================
function initNavbar() {
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ========================================
// MOBILE MENU
// ========================================
function initMobileMenu() {
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
    
    // Close menu when clicking on link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });
}

// ========================================
// PRODUCT TABS
// ========================================
function initProductTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            currentTab = tab;
            
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to current
            this.classList.add('active');
            document.getElementById(tab + '-tab').classList.add('active');
            
            // Update sort options based on tab
            updateSortOptions();
            
            // Re-render with current filters
            renderProducts();
        });
    });
}

// ========================================
// SEARCH & FILTER
// ========================================
function initSearchAndFilter() {
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase().trim();
            searchClear.style.display = searchQuery ? 'flex' : 'none';
            renderProducts();
            updateActiveFilters();
        });
    }
    
    // Clear search
    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            searchQuery = '';
            this.style.display = 'none';
            renderProducts();
            updateActiveFilters();
        });
    }
    
    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortOption = this.value;
            renderProducts();
            updateActiveFilters();
        });
    }
    
    // Price filter
    if (priceFilterSelect) {
        priceFilterSelect.addEventListener('change', function() {
            priceFilter = this.value;
            renderProducts();
            updateActiveFilters();
        });
    }
    
    // Genre pills filter
    if (genreList) {
        genreList.addEventListener('click', function(e) {
            if (e.target.classList.contains('genre-pill')) {
                document.querySelectorAll('.genre-pill').forEach(pill => pill.classList.remove('active'));
                e.target.classList.add('active');
                genreFilter = e.target.dataset.genre;
                renderProducts();
                updateActiveFilters();
            }
        });
    }
}

function updateActiveFilters() {
    if (!activeFilters || !filterTags) return;
    
    const tags = [];
    
    if (searchQuery) {
        tags.push({ type: 'search', label: `Cari: "${searchQuery}"` });
    }
    
    if (genreFilter !== 'all') {
        tags.push({ type: 'genre', label: `Genre: ${genreFilter}` });
    }
    
    if (priceFilter !== 'all') {
        const priceLabels = {
            'under50': '< Rp 50rb',
            '50to100': 'Rp 50rb - 100rb',
            '100to150': 'Rp 100rb - 150rb',
            'above150': '> Rp 150rb'
        };
        tags.push({ type: 'price', label: `Harga: ${priceLabels[priceFilter]}` });
    }
    
    if (sortOption !== 'default') {
        const sortLabels = {
            'price-low': 'Harga ↑',
            'price-high': 'Harga ↓',
            'name-asc': 'A - Z',
            'name-desc': 'Z - A',
            'bpm-low': 'BPM ↑',
            'bpm-high': 'BPM ↓'
        };
        tags.push({ type: 'sort', label: `Urut: ${sortLabels[sortOption]}` });
    }
    
    if (tags.length > 0) {
        activeFilters.style.display = 'flex';
        filterTags.innerHTML = tags.map(tag => `
            <span class="filter-tag ${tag.type}">${tag.label}</span>
        `).join('');
    } else {
        activeFilters.style.display = 'none';
    }
}

function clearAllFilters() {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    
    genreFilter = 'all';
    document.querySelectorAll('.genre-pill').forEach(pill => pill.classList.remove('active'));
    document.querySelector('.genre-pill[data-genre="all"]').classList.add('active');
    
    priceFilter = 'all';
    priceFilterSelect.value = 'all';
    
    sortOption = 'default';
    sortSelect.value = 'default';
    
    renderProducts();
    updateActiveFilters();
    showToast('Filter dihapus');
}

function updateSortOptions() {
    // Update sort options based on current tab
    const bpmOptions = sortSelect.querySelectorAll('option[value^="bpm"]');
    
    if (currentTab === 'sample') {
        // Hide BPM options for sample packs
        bpmOptions.forEach(opt => opt.style.display = 'none');
        // Hide genre section for sample packs
        const genreWrap = document.querySelector('.genre-scroll-wrap');
        if (genreWrap) genreWrap.style.display = 'none';
    } else {
        // Show BPM options for FLM
        bpmOptions.forEach(opt => opt.style.display = 'block');
        // Show genre section for FLM
        const genreWrap = document.querySelector('.genre-scroll-wrap');
        if (genreWrap) genreWrap.style.display = 'block';
    }
}

// ========================================
// FILTER FUNCTIONS
// ========================================
function filterProducts(products) {
    return products.filter(product => {
        // Search filter
        if (searchQuery) {
            const searchFields = [
                product.name,
                product.category,
                product.genre || '',
                product.key || '',
                (product.bpm || '').toString(),
                (product.items || '')
            ].join(' ').toLowerCase();
            
            if (!searchFields.includes(searchQuery)) {
                return false;
            }
        }
        
        // Genre filter (only for FLM products)
        if (genreFilter !== 'all' && product.genre) {
            if (product.genre !== genreFilter) {
                return false;
            }
        }
        
        // Price filter
        if (priceFilter !== 'all') {
            const price = product.price;
            switch (priceFilter) {
                case 'under50':
                    if (price >= 50000) return false;
                    break;
                case '50to100':
                    if (price < 50000 || price > 100000) return false;
                    break;
                case '100to150':
                    if (price < 100000 || price > 150000) return false;
                    break;
                case 'above150':
                    if (price <= 150000) return false;
                    break;
            }
        }
        
        return true;
    });
}

function sortProducts(products) {
    const sorted = [...products];
    
    switch (sortOption) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'bpm-low':
            sorted.sort((a, b) => (a.bpm || 0) - (b.bpm || 0));
            break;
        case 'bpm-high':
            sorted.sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
            break;
        default:
            // Default order (by ID)
            break;
    }
    
    return sorted;
}

function updateResultsInfo(flmFiltered, sampleFiltered) {
    const flmTotal = flmProducts.length;
    const sampleTotal = samplePackProducts.length;
    const flmShown = flmFiltered.length;
    const sampleShown = sampleFiltered.length;
    
    // Update badge counts
    if (flmCount) flmCount.textContent = flmShown;
    if (sampleCount) sampleCount.textContent = sampleShown;
    
    // Update results text
    if (resultsCount) {
        const totalShown = flmShown + sampleShown;
        const hasActiveFilters = searchQuery || priceFilter !== 'all' || genreFilter !== 'all' || sortOption !== 'default';
        if (hasActiveFilters) {
            resultsCount.textContent = `${totalShown} produk ditemukan`;
        } else {
            resultsCount.textContent = `${totalShown} produk tersedia`;
        }
    }
    
    // Show/hide no results message
    if (flmNoResults) {
        flmNoResults.style.display = flmShown === 0 ? 'block' : 'none';
    }
    if (sampleNoResults) {
        sampleNoResults.style.display = sampleShown === 0 ? 'block' : 'none';
    }
}

// ========================================
// RENDER PRODUCTS + LOAD MORE
// Sistem "Muat Lebih Banyak" (BUKAN pagination).
// Ringan untuk HP kentang: render bertahap per batch,
// gambar lazy-load, animasi hanya opacity/transform.
// ========================================
const PRODUCTS_PER_LOAD = 8; // jumlah produk yang dimuat per klik
let flmDisplayed = 0;
let sampleDisplayed = 0;

// ========================================
// KONDISIONAL PREVIEW AUDIO
// Player audio (tombol preview, play/pause, progress
// bar, skip) HANYA muncul untuk produk yang benar-benar
// punya file audio preview. Kategori 'Sample Pack'
// tidak menampilkan elemen audio sama sekali.
// ========================================
function hasAudioPreview(product) {
    return product.category !== 'Sample Pack' && !!product.audioUrl;
}

function flmCardHTML(product) {
    const playOverlayHTML = hasAudioPreview(product) ? `
                <div class="product-play-overlay" onclick="playAudio('${product.id}', '${product.name}', '${product.audioUrl}', '${product.image}')">
                    <div class="play-btn">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="playing-indicator" id="indicator-${product.id}">
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                </div>` : '';
    return `
        <div class="product-card card-fade-in" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">${playOverlayHTML}
            </div>
            <div class="product-info">
                <div class="product-tags">
                    <span class="product-category">${product.category}</span>
                    <span class="product-genre">${product.genre}</span>
                    ${soldBadgeHTML(product.id)}
                </div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta">
                    <span><i class="fas fa-tachometer-alt"></i> ${product.bpm} BPM</span>
                    <span><i class="fas fa-key"></i> ${product.key}</span>
                    <span><i class="fas fa-clock"></i> ${product.duration}</span>
                </div>
                <div class="product-footer">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="btn-add-cart" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, 'FLM')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function sampleCardHTML(product) {
    return `
        <div class="product-card card-fade-in" data-id="${product.id}">
            <div class="product-image sample-only">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-tags">
                    <span class="product-category">${product.category}</span>
                    ${soldBadgeHTML(product.id)}
                </div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta">
                    <span><i class="fas fa-layer-group"></i> ${product.items}</span>
                    <span><i class="fas fa-hdd"></i> ${product.size}</span>
                </div>
                <div class="product-footer">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="btn-add-cart" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, 'Sample Pack')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Buat / ambil container load more di dalam tab-content
function ensureLoadMoreWrap(tab) {
    const tabContent = document.getElementById(tab + '-tab');
    if (!tabContent) return null;

    let wrap = tabContent.querySelector('.load-more-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'load-more-wrap';
        wrap.innerHTML = `
            <div class="load-more-progress"><div class="load-more-progress-fill"></div></div>
            <span class="load-more-text"></span>
            <button class="btn-load-more" type="button">
                <i class="fas fa-chevron-down"></i> <span class="lm-label">Muat Lebih Banyak</span>
            </button>
        `;
        wrap.querySelector('.btn-load-more').addEventListener('click', function () {
            renderBatch(tab);
        });
        tabContent.appendChild(wrap);
    }
    return wrap;
}

// Render 1 batch produk ke grid (dipanggil awal & tiap klik load more)
function renderBatch(tab) {
    const isFlm = tab === 'flm';
    const data = isFlm ? (window.filteredFlm || []) : (window.filteredSample || []);
    const grid = document.getElementById(isFlm ? 'flmGrid' : 'sampleGrid');
    if (!grid) return;

    let shown = isFlm ? flmDisplayed : sampleDisplayed;
    const batch = data.slice(shown, shown + PRODUCTS_PER_LOAD);
    const html = batch.map(p => isFlm ? flmCardHTML(p) : sampleCardHTML(p)).join('');
    grid.insertAdjacentHTML('beforeend', html);
    shown += batch.length;

    if (isFlm) flmDisplayed = shown; else sampleDisplayed = shown;
    grid.style.display = data.length ? 'grid' : 'none';

    // Terapkan angka "Terjual" real-time ke kartu yang baru saja dirender
    applyAllSoldBadges();

    // Update UI load more
    const wrap = ensureLoadMoreWrap(tab);
    if (wrap) {
        const total = data.length;
        wrap.querySelector('.load-more-progress-fill').style.width = total ? (shown / total * 100) + '%' : '0%';
        wrap.querySelector('.load-more-text').textContent = `Menampilkan ${shown} dari ${total} produk`;

        if (shown >= total) {
            wrap.style.display = 'none';
        } else {
            wrap.style.display = 'flex';
            wrap.querySelector('.lm-label').textContent = `Muat Lebih Banyak (${total - shown} lagi)`;
        }
    }
}

function renderProducts() {
    // Filter and sort FLM products
    let flmFiltered = filterProducts(flmProducts);
    flmFiltered = sortProducts(flmFiltered);

    // Filter and sort Sample Pack products
    let sampleFiltered = filterProducts(samplePackProducts);
    sampleFiltered = sortProducts(sampleFiltered);

    // Update results info
    updateResultsInfo(flmFiltered, sampleFiltered);

    // Store filtered arrays for load more functionality
    window.filteredFlm = flmFiltered;
    window.filteredSample = sampleFiltered;

    // Reset & render batch pertama (Load More system)
    flmDisplayed = 0;
    sampleDisplayed = 0;

    const flmGrid = document.getElementById('flmGrid');
    const sampleGrid = document.getElementById('sampleGrid');
    if (flmGrid) flmGrid.innerHTML = '';
    if (sampleGrid) sampleGrid.innerHTML = '';

    renderBatch('flm');
    renderBatch('sample');
}

// ========================================
// RENDER TESTIMONIALS
// ========================================
function renderTestimonials() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (testimonialsGrid && typeof testimonials !== 'undefined') {
        testimonialsGrid.innerHTML = testimonials.map(testi => `
            <div class="testimonial-card">
                <div class="testimonial-image">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="testimonial-content">
                    <div class="testimonial-header">
                        <div class="testimonial-avatar">${testi.avatar}</div>
                        <div class="testimonial-info">
                            <h4>${testi.name}</h4>
                            <span>${testi.role}</span>
                        </div>
                    </div>
                    <div class="testimonial-rating">
                        ${Array(testi.rating).fill('<i class="fas fa-star"></i>').join('')}
                    </div>
                    <p class="testimonial-text">"${testi.text}"</p>
                </div>
            </div>
        `).join('');
    }
}

// ========================================
// CART FUNCTIONS
// ========================================
function initCart() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('adiprmx_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
    
    // Cart button click
    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }
}

function addToCart(id, name, price, type) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        showToast('Produk sudah ada di keranjang!');
        return;
    }

    // Ambil artwork produk agar thumbnail tampil di keranjang
    // (tetap tersimpan di localStorage setelah halaman di-refresh)
    const product = findProductById(id);

    cart.push({
        id: id,
        name: name,
        price: price,
        type: type,
        quantity: 1,
        image: product ? product.image : null
    });
    
    saveCart();
    updateCartUI();
    showToast('Produk ditambahkan ke keranjang!');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
    showToast('Produk dihapus dari keranjang!');
}

function saveCart() {
    localStorage.setItem('adiprmx_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    const cartFooter = document.getElementById('cartFooter');

    // ===== Kondisi KOSONG: empty state estetik + CTA belanja =====
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h4 class="cart-empty-title">Keranjang masih kosong</h4>
                <p class="cart-empty-text">Belum ada produk yang dipilih. Yuk jelajahi FLM Project &amp; Sample Pack berkualitas!</p>
                <button class="btn btn-primary cart-empty-cta" onclick="startShopping()">
                    <i class="fas fa-shopping-bag"></i> Mulai Belanja
                </button>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
    } else {
        // ===== Kondisi TERISI: daftar produk rapi + thumbnail artwork =====
        cartItems.innerHTML = cart.map(item => {
            const thumb = item.image
                ? `<img src="${item.image}" alt="${item.name}" loading="lazy">`
                : `<i class="fas ${item.type === 'FLM' ? 'fa-music' : 'fa-drum'}"></i>`;
            const typeLabel = item.type === 'FLM' ? 'FLM Project' : item.type;
            return `
            <div class="cart-item">
                <div class="cart-item-image${item.image ? ' has-thumb' : ''}">
                    ${thumb}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-type">${typeLabel}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Hapus item" aria-label="Hapus ${item.name} dari keranjang">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        }).join('');
        if (cartFooter) cartFooter.style.display = 'flex';
    }

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);
}

// CTA empty state: tutup keranjang lalu scroll halus ke section produk
function startShopping() {
    closeCart();
    const produkSection = document.getElementById('produk');
    if (produkSection) {
        const offsetTop = produkSection.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
}

function openCart() {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (typeof autoFillCheckoutForm === 'function') {
        autoFillCheckoutForm();
    }
}

function closeCart() {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// AUTO-FILL FORM CHECKOUT DARI AKUN GOOGLE (Firebase Auth)
// Dipanggil otomatis oleh js/auth-engine.js saat status login berubah,
// dan juga dipanggil ulang setiap kali modal keranjang dibuka.
// ========================================
function autoFillCheckoutForm() {
    const nameInput = document.getElementById('buyerName');
    const emailInput = document.getElementById('buyerEmail');
    const phoneInput = document.getElementById('buyerPhone');
    const autofillNote = document.getElementById('checkoutAutofillNote');
    if (!nameInput || !phoneInput) return;

    const user = window.currentUser;

    if (user) {
        // Nama diisi dari profil Google
        if (!nameInput.value || nameInput.dataset.autofilled === 'true') {
            nameInput.value = user.displayName || nameInput.value;
            nameInput.dataset.autofilled = 'true';
        }

        // Email diisi dari profil Google (field tersembunyi, dipakai untuk riwayat pesanan)
        if (emailInput) {
            emailInput.value = user.email || (user.dbData && user.dbData.email) || '';
        }

        // No WhatsApp diisi dari data tersimpan di /users/{uid}/whatsapp (jika ada)
        const savedWhatsapp = user.dbData && user.dbData.whatsapp ? user.dbData.whatsapp : '';
        if (savedWhatsapp && (!phoneInput.value || phoneInput.dataset.autofilled === 'true')) {
            phoneInput.value = savedWhatsapp;
            phoneInput.dataset.autofilled = 'true';
        }

        if (autofillNote) autofillNote.style.display = 'flex';

        // Simpan no WhatsApp yang diketik manual ke database supaya auto-fill
        // makin akurat di checkout berikutnya.
        phoneInput.addEventListener('change', function () {
            phoneInput.dataset.autofilled = 'false';
            if (window.currentUser && window.currentUser.uid && typeof firebase !== 'undefined') {
                firebase.database().ref('users/' + window.currentUser.uid + '/whatsapp').set(phoneInput.value);
            }
        });
        nameInput.addEventListener('change', function () {
            nameInput.dataset.autofilled = 'false';
        });
    } else {
        if (autofillNote) autofillNote.style.display = 'none';
    }
}
window.autoFillCheckoutForm = autoFillCheckoutForm;

// ========================================
// CHECKOUT WHATSAPP
// ========================================
function checkout() {
    if (cart.length === 0) {
        showToast('Keranjang masih kosong!');
        return;
    }

    const buyerNameInput = document.getElementById('buyerName');
    const buyerPhoneInput = document.getElementById('buyerPhone');
    const buyerName = buyerNameInput ? buyerNameInput.value.trim() : '';
    const buyerPhone = buyerPhoneInput ? buyerPhoneInput.value.trim() : '';

    if (!buyerName || !buyerPhone) {
        showToast('Lengkapi Nama & No WhatsApp pemesan terlebih dahulu!');
        return;
    }
    
    const phoneNumber = '6285893523975';
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    let message = `*ORDER ADIP LOWKEY*\n`;
    message += `===================\n\n`;
    message += `*Nama Pemesan:* ${buyerName}\n`;
    message += `*No WhatsApp:* ${buyerPhone}\n`;
    message += `*Tanggal:* ${dateString}\n`;
    message += `*Waktu:* ${timeString} WIB\n\n`;
    message += `*PESANAN:*\n`;
    message += `-------------------\n`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Tipe: ${item.type}\n`;
        message += `   Harga: ${formatPrice(item.price)}\n\n`;
    });
    
    message += `-------------------\n`;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `*TOTAL: ${formatPrice(total)}*\n\n`;
    message += `===================\n`;
    message += `Terima kasih telah order di Adip Lowkey!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Simpan pesanan ke Riwayat Transaksi member (/orders/{uid}) jika user login
    if (window.currentUser && window.currentUser.uid && typeof firebase !== 'undefined') {
        const buyerEmailInput = document.getElementById('buyerEmail');
        const orderRef = firebase.database().ref('orders/' + window.currentUser.uid).push();
        orderRef.set({
            buyerName: buyerName,
            buyerEmail: buyerEmailInput ? buyerEmailInput.value.trim() : (window.currentUser.email || ''),
            buyerPhone: buyerPhone,
            items: cart.map((item) => ({ name: item.name, type: item.type, price: item.price, quantity: item.quantity })),
            total: total,
            status: 'Menunggu Konfirmasi',
            createdAt: Date.now()
        }).catch((err) => console.error('Gagal menyimpan riwayat transaksi:', err));
    }

    window.open(whatsappUrl, '_blank');
    
    // Clear cart after checkout
    cart = [];
    saveCart();
    updateCartUI();
    closeCart();
}

// ========================================
// AUDIO PLAYER - NEW CONCEPT (Spotify-like)
// ========================================
function initAudioPlayer() {
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlay);
    }
    
    if (playerClose) {
        playerClose.addEventListener('click', closePlayer);
    }
    
    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('loadedmetadata', updateDuration);
        // Listener 'play' & 'pause' = satu sumber kebenaran status.
        // Semua UI (player bawah + player di modal) ikut sinkron otomatis.
        audioElement.addEventListener('play', () => {
            isPlaying = true;
            updatePlayButton();
        });
        audioElement.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayButton();
            hideAllIndicators();
        });
        audioElement.addEventListener('ended', () => {
            isPlaying = false;
            updatePlayButton();
            resetProgress();
            hideAllIndicators();
        });
    }
    
    // Progress bar click to seek
    if (progressBar) {
        progressBar.addEventListener('click', seekAudio);
    }
}

function playAudio(id, name, url, image) {
    // If clicking the same track
    if (currentTrackId === id) {
        togglePlay();
        return;
    }
    
    // Stop previous track
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }
    
    // Update current track info
    currentTrackId = id;
    currentTrack = name;
    nowPlaying.textContent = name;
    
    // Update player image
    if (playerImage && image) {
        playerImage.src = image;
        playerImage.style.display = 'block';
    }
    
    // Set audio source
    if (audioElement && url && url !== '#') {
        audioElement.src = url;
        audioElement.load();
        
        // Play audio
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updatePlayButton();
                showPlayer();
                updatePlayingIndicator(id);
            }).catch(error => {
                console.error('Audio play error:', error);
                showToast('Gagal memutar audio');
            });
        }
    } else {
        showToast('Audio tidak tersedia');
    }
}

function togglePlay() {
    if (!currentTrackId) return;
    
    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
        hideAllIndicators();
    } else {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updatePlayingIndicator(currentTrackId);
            }).catch(error => {
                console.error('Audio play error:', error);
            });
        }
    }
    updatePlayButton();
}

function updatePlayButton() {
    if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    // Sinkronkan tombol Play/Pause di dalam modal detail produk
    syncModalPlayerUI();
}

function updateProgress() {
    if (audioElement.duration) {
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = percent + '%';
        
        // Update current time
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audioElement.currentTime);
        }
        
        // Sinkron real-time ke progress bar & waktu di dalam modal
        if (modalProductId && currentTrackId === modalProductId) {
            const modalProgressEl = document.getElementById('modalProgress');
            const modalCurrentEl = document.getElementById('modalCurrentTime');
            if (modalProgressEl) modalProgressEl.style.width = percent + '%';
            if (modalCurrentEl) modalCurrentEl.textContent = formatTime(audioElement.currentTime);
        }
    }
}

function updateDuration() {
    if (durationEl && audioElement.duration) {
        durationEl.textContent = formatTime(audioElement.duration);
    }
    // Sinkronkan durasi di dalam modal detail produk
    if (modalProductId && currentTrackId === modalProductId) {
        const modalDurationEl = document.getElementById('modalDuration');
        if (modalDurationEl && audioElement.duration) {
            modalDurationEl.textContent = formatTime(audioElement.duration);
        }
    }
}

function resetProgress() {
    progress.style.width = '0%';
    if (currentTimeEl) {
        currentTimeEl.textContent = '0:00';
    }
    // Reset juga tampilan progress di dalam modal
    const modalProgressEl = document.getElementById('modalProgress');
    const modalCurrentEl = document.getElementById('modalCurrentTime');
    if (modalProgressEl) modalProgressEl.style.width = '0%';
    if (modalCurrentEl) modalCurrentEl.textContent = '0:00';
}

function seekAudio(e) {
    if (!audioElement.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioElement.currentTime = percent * audioElement.duration;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showPlayer() {
    audioPlayer.classList.add('active');
}

function closePlayer() {
    audioPlayer.classList.remove('active');
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }
    isPlaying = false;
    currentTrackId = null;
    currentTrack = null;
    updatePlayButton();
    resetProgress();
    hideAllIndicators();
}

function updatePlayingIndicator(id) {
    hideAllIndicators();
    const indicator = document.getElementById(`indicator-${id}`);
    if (indicator) {
        indicator.classList.add('active');
    }
}

function hideAllIndicators() {
    document.querySelectorAll('.playing-indicator').forEach(ind => {
        ind.classList.remove('active');
    });
}

// ========================================
// REQUEST MODAL
// ========================================
let currentRequestType = '';

function openRequestModal(type) {
    currentRequestType = type;
    const modal = document.getElementById('requestModal');
    const title = document.getElementById('requestTitle');
    
    const titles = {
        'remix': 'Request Remix',
        'edit': 'Request Edit',
        'custom': 'Request Custom Project'
    };
    
    title.textContent = titles[type] || 'Request';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRequestModal() {
    const modal = document.getElementById('requestModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('requestForm').reset();
}

function submitRequest() {
    const name = document.getElementById('reqName').value;
    const song = document.getElementById('reqSong').value;
    const artist = document.getElementById('reqArtist').value;
    const detail = document.getElementById('reqDetail').value;
    
    if (!name || !song || !artist) {
        showToast('Mohon lengkapi data yang wajib diisi!');
        return;
    }
    
    const phoneNumber = '6285893523975';
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const typeLabels = {
        'remix': 'Request Remix',
        'edit': 'Request Edit',
        'custom': 'Request Custom Project'
    };
    
    let message = `*${typeLabels[currentRequestType].toUpperCase()}*\n`;
    message += `===================\n\n`;
    message += `*Tanggal:* ${dateString}\n`;
    message += `*Waktu:* ${timeString} WIB\n\n`;
    message += `*Data Pemesan:*\n`;
    message += `Nama: ${name}\n\n`;
    message += `*Detail Request:*\n`;
    message += `Judul Lagu: ${song}\n`;
    message += `Artis: ${artist}\n`;
    if (detail) {
        message += `Detail: ${detail}\n`;
    }
    message += `\n===================`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    closeRequestModal();
    showToast('Request berhasil dikirim!');
}

// ========================================
// SERVICE ORDER
// ========================================
function orderService(type) {
    const services = {
        'chord': { name: 'Analisis Chord', price: 15000 },
        'bpm': { name: 'Analisis BPM', price: 10000 },
        'paket': { name: 'Paket Lengkap (Chord + BPM)', price: 20000 }
    };
    
    const service = services[type];
    const phoneNumber = '6285893523975';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    let message = `*ORDER JASA ${service.name.toUpperCase()}*\n`;
    message += `===================\n\n`;
    message += `*Tanggal:* ${dateString}\n`;
    message += `*Waktu:* ${timeString} WIB\n\n`;
    message += `*Layanan:* ${service.name}\n`;
    message += `*Harga:* ${formatPrice(service.price)}\n\n`;
    message += `Mohon info lagu yang akan dianalisis.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    showToast('Order jasa berhasil dikirim!');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatPrice(price) {
    return 'Rp ' + price.toLocaleString('id-ID');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Nomor rekening disalin!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Nomor rekening disalin!');
    });
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target === cartModal) {
        closeCart();
    }
    if (e.target.id === 'requestModal') {
        closeRequestModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCart();
        closeRequestModal();
        closePlayer();
    }
    
    // Spacebar to toggle play/pause
    if (e.key === ' ' && currentTrackId) {
        e.preventDefault();
        togglePlay();
    }
});

// ========================================
// PRODUCT DETAIL MODAL
// - Muncul di tengah layar saat kartu produk
//   diklik (kecuali tombol 'Tambah Keranjang'
//   dan tombol play preview)
// - Animasi smooth fade in & fade out
//   (opacity + scale) via CSS transition
// - Otomatis tertutup saat area luar /
//   backdrop modal diklik
// ========================================
const productModal = document.getElementById('productModal');
const productDetailBody = document.getElementById('productDetailBody');

function findProductById(id) {
    if (typeof flmProducts !== 'undefined') {
        const flm = flmProducts.find(p => p.id === id);
        if (flm) return flm;
    }
    if (typeof samplePackProducts !== 'undefined') {
        const sample = samplePackProducts.find(p => p.id === id);
        if (sample) return sample;
    }
    return null;
}

function openProductModal(id) {
    const product = findProductById(id);
    if (!product || !productModal || !productDetailBody) return;

    const isFlm = product.category === 'FLM Project';

    const tagsHTML = isFlm
        ? `<span class="product-category">${product.category}</span>
           <span class="product-genre">${product.genre}</span>`
        : `<span class="product-category">${product.category}</span>`;

    const metaHTML = isFlm
        ? `<span><i class="fas fa-tachometer-alt"></i> ${product.bpm} BPM</span>
           <span><i class="fas fa-key"></i> ${product.key}</span>
           <span><i class="fas fa-clock"></i> ${product.duration}</span>`
        : `<span><i class="fas fa-layer-group"></i> ${product.items}</span>
           <span><i class="fas fa-hdd"></i> ${product.size}</span>`;

    const descText = isFlm
        ? `Project FL Studio Mobile (FLM) genre ${product.genre} siap pakai. File project lengkap dengan struktur rapi, mudah dipelajari dan dikembangkan untuk produksi musikmu.`
        : `Sample pack berkualitas berisi ${product.items} siap pakai untuk produksi musik. Suara jernih, format standar, dan kompatibel dengan semua DAW.`;

    // Custom Audio Player lengkap di dalam card modal:
    // Play/Pause, skip -3s & +3s, progress bar, waktu berjalan & durasi.
    // Player ini berbagi SATU elemen <audio> global (audioElement),
    // sehingga statusnya selalu sinkron dengan player utama.
    // KONDISIONAL: untuk kategori 'Sample Pack' (atau produk tanpa
    // file audio preview) seluruh elemen player TIDAK dirender.
    const showAudioPlayer = hasAudioPreview(product);
    const audioPlayerHTML = showAudioPlayer ? `
        <div class="modal-audio-player" id="modalAudioPlayer">
            <div class="modal-player-header">
                <span class="modal-player-label"><i class="fas fa-headphones-alt"></i> Preview Audio</span>
                <span class="modal-player-status" id="modalPlayerStatus"></span>
            </div>
            <div class="modal-player-controls">
                <button class="modal-skip-btn" id="modalSkipBack" title="Mundur 3 detik" aria-label="Mundur 3 detik">
                    <i class="fas fa-rotate-left"></i>
                    <span class="skip-label">-3s</span>
                </button>
                <button class="modal-play-btn" id="modalPlayPauseBtn" aria-label="Putar / Jeda preview">
                    <i class="fas fa-play"></i>
                </button>
                <button class="modal-skip-btn" id="modalSkipForward" title="Maju 3 detik" aria-label="Maju 3 detik">
                    <i class="fas fa-rotate-right"></i>
                    <span class="skip-label">+3s</span>
                </button>
            </div>
            <div class="modal-player-timeline">
                <span class="modal-time" id="modalCurrentTime">0:00</span>
                <div class="modal-progress-bar" id="modalProgressBar">
                    <div class="modal-progress" id="modalProgress">
                        <div class="modal-progress-handle"></div>
                    </div>
                </div>
                <span class="modal-time" id="modalDuration">${isFlm ? product.duration : '--:--'}</span>
            </div>
        </div>
    ` : '';

    productDetailBody.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
            <div class="product-detail-tags">${tagsHTML}</div>
            <h3 class="product-detail-name">${product.name}</h3>
            <div class="product-detail-meta">${metaHTML}</div>
            <p class="product-detail-desc">${descText}</p>
            ${audioPlayerHTML}
            <div class="product-detail-footer">
                <span class="product-detail-price">${formatPrice(product.price)}</span>
                <div class="product-detail-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${isFlm ? 'FLM' : 'Sample Pack'}')">
                        <i class="fas fa-plus"></i> Tambah Keranjang
                    </button>
                </div>
            </div>
        </div>
    `;

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Inisialisasi & sinkronkan player modal dengan state audio global.
    // Jika lagu produk ini sudah diputar dari luar sebelum modal dibuka,
    // player modal melanjutkan posisi & status yang sama (tidak reset).
    // KONDISIONAL: hanya untuk produk yang punya preview audio
    // (kategori 'Sample Pack' dilewati karena playernya tidak dirender).
    if (showAudioPlayer) {
        initModalPlayer(product);
    } else {
        modalProductId = null;
    }
}

function closeProductModal() {
    if (!productModal) return;
    productModal.classList.remove('active');
    document.body.style.overflow = '';
    modalProductId = null;
}

// ========================================
// CUSTOM AUDIO PLAYER DI MODAL DETAIL PRODUK
// - Player lengkap: tombol Play/Pause, skip -3s & +3s,
//   progress bar (klik untuk seek), waktu & durasi
// - Sinkron global/real-time dengan player utama karena
//   keduanya mengontrol SATU elemen <audio> yang sama
// - Modal dibuka saat lagu sedang diputar -> lanjut dari
//   posisi berjalan, tanpa mengulang dari awal
// ========================================
function getModalPlayerEls() {
    return {
        btn: document.getElementById('modalPlayPauseBtn'),
        skipBack: document.getElementById('modalSkipBack'),
        skipForward: document.getElementById('modalSkipForward'),
        bar: document.getElementById('modalProgressBar'),
        fill: document.getElementById('modalProgress'),
        current: document.getElementById('modalCurrentTime'),
        duration: document.getElementById('modalDuration'),
        status: document.getElementById('modalPlayerStatus')
    };
}

function initModalPlayer(product) {
    modalProductId = product.id;

    const els = getModalPlayerEls();
    if (!els.btn) return;

    els.btn.addEventListener('click', function() {
        modalTogglePlay(product);
    });
    els.skipBack.addEventListener('click', function() {
        modalSkip(-3);
    });
    els.skipForward.addEventListener('click', function() {
        modalSkip(3);
    });
    els.bar.addEventListener('click', modalSeek);

    // Samakan tampilan modal dengan kondisi audio global saat ini
    syncModalPlayerUI();
}

// Play/Pause dari dalam modal
function modalTogglePlay(product) {
    if (currentTrackId === product.id) {
        // Track yang sama -> lanjutkan / jeda tanpa mengulang dari awal
        togglePlay();
    } else {
        // Track berbeda / belum ada -> mulai putar track produk ini
        playAudio(product.id, product.name, product.audioUrl, product.image);
    }
}

// Skip -3s / +3s (dengan batas 0 s/d durasi)
function modalSkip(seconds) {
    if (!audioElement || !audioElement.duration) return;
    if (currentTrackId !== modalProductId) return;

    let newTime = audioElement.currentTime + seconds;
    newTime = Math.max(0, Math.min(newTime, audioElement.duration));
    audioElement.currentTime = newTime;
    updateProgress(); // langsung perbarui player bawah & modal
}

// Klik progress bar di modal untuk seek
function modalSeek(e) {
    if (!audioElement || !audioElement.duration) return;
    if (currentTrackId !== modalProductId) return;

    const bar = document.getElementById('modalProgressBar');
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioElement.currentTime = percent * audioElement.duration;
    updateProgress();
}

// Menyinkronkan SELURUH tampilan player modal dengan state audio global:
// ikon Play/Pause, label status, waktu berjalan, durasi, dan progress bar.
function syncModalPlayerUI() {
    const els = getModalPlayerEls();
    if (!els.btn) return; // modal sedang tidak menampilkan player

    const isCurrent = currentTrackId && currentTrackId === modalProductId;
    const playing = isCurrent && audioElement && !audioElement.paused && !audioElement.ended;

    els.btn.innerHTML = playing
        ? '<i class="fas fa-pause"></i>'
        : '<i class="fas fa-play"></i>';

    if (isCurrent) {
        if (els.status) {
            els.status.textContent = playing ? 'Sedang diputar' : 'Dijeda';
            els.status.classList.toggle('live', playing);
        }
        if (els.current) els.current.textContent = formatTime(audioElement.currentTime);
        if (els.duration && audioElement.duration) {
            els.duration.textContent = formatTime(audioElement.duration);
        }
        if (els.fill && audioElement.duration) {
            els.fill.style.width = (audioElement.currentTime / audioElement.duration * 100) + '%';
        }
    } else {
        // Track modal bukan track yang sedang aktif -> tampilan idle
        if (els.status) {
            els.status.textContent = '';
            els.status.classList.remove('live');
        }
        if (els.current) els.current.textContent = '0:00';
        if (els.fill) els.fill.style.width = '0%';
    }
}

// ========================================
// AUTO-PAUSE SAAT PINDAH TAB / KELUAR HALAMAN
// - visibilitychange: audio berhenti saat user pindah
//   tab / minimize browser, UI ikut sinkron otomatis
// - beforeunload & pagehide: pastikan audio berhenti
//   saat halaman ditutup / ditinggalkan
// ========================================
document.addEventListener('visibilitychange', function() {
    if (document.hidden && audioElement && !audioElement.paused) {
        audioElement.pause(); // event 'pause' otomatis sinkron ke semua UI player
    }
});

window.addEventListener('beforeunload', function() {
    if (audioElement && !audioElement.paused) {
        audioElement.pause();
    }
});

window.addEventListener('pagehide', function() {
    if (audioElement && !audioElement.paused) {
        audioElement.pause();
    }
});

// Klik kartu produk -> buka modal detail
// (delegasi event agar kartu hasil "Muat Lebih Banyak" tetap berfungsi)
function initProductDetailModal() {
    ['flmGrid', 'sampleGrid'].forEach(function(gridId) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        grid.addEventListener('click', function(e) {
            // Abaikan klik pada tombol 'Tambah Keranjang'
            if (e.target.closest('.btn-add-cart')) return;
            // Abaikan klik pada tombol play (tetap memutar preview audio)
            if (e.target.closest('.product-play-overlay')) return;

            const card = e.target.closest('.product-card');
            if (card && card.dataset.id) {
                openProductModal(card.dataset.id);
            }
        });
    });

    // Tutup modal saat area luar / backdrop diklik
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }
}

// Tutup modal dengan tombol Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// Inisialisasi setelah DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductDetailModal);
} else {
    initProductDetailModal();
}
