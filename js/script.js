// ========================================
// ADIP RMX - Main JavaScript
// ========================================

// Global Variables
let cart = [];
let currentAudio = null;
let isPlaying = false;
let currentTrack = null;
let currentTrackId = null;

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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavbar();
    initMobileMenu();
    initProductTabs();
    renderProducts();
    renderTestimonials();
    initSmoothScroll();
    initCart();
    initAudioPlayer();
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
            
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to current
            this.classList.add('active');
            document.getElementById(tab + '-tab').classList.add('active');
        });
    });
}

// ========================================
// RENDER PRODUCTS
// ========================================
function renderProducts() {
    // Render FLM Products
    const flmGrid = document.getElementById('flmGrid');
    if (flmGrid && typeof flmProducts !== 'undefined') {
        flmGrid.innerHTML = flmProducts.map((product, index) => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
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
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
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
        `).join('');
    }
    
    // Render Sample Pack Products
    const sampleGrid = document.getElementById('sampleGrid');
    if (sampleGrid && typeof samplePackProducts !== 'undefined') {
        // Show only first 12 items initially
        const initialProducts = samplePackProducts.slice(0, 12);
        sampleGrid.innerHTML = initialProducts.map((product, index) => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
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
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
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
        `).join('');
        
        // Add load more button if there are more products
        if (samplePackProducts.length > 12) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.className = 'load-more-container';
            loadMoreBtn.style.gridColumn = '1 / -1';
            loadMoreBtn.style.textAlign = 'center';
            loadMoreBtn.style.marginTop = '20px';
            loadMoreBtn.innerHTML = `
                <button class="btn btn-outline" onclick="loadMoreSamples()">
                    <i class="fas fa-chevron-down"></i> Lihat Lebih Banyak
                </button>
            `;
            sampleGrid.appendChild(loadMoreBtn);
        }
    }
}

// Load more sample packs
let loadedSamples = 12;
function loadMoreSamples() {
    const sampleGrid = document.getElementById('sampleGrid');
    const loadMoreContainer = sampleGrid.querySelector('.load-more-container');
    
    const nextProducts = samplePackProducts.slice(loadedSamples, loadedSamples + 12);
    
    nextProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
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
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
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
        `;
        sampleGrid.insertBefore(productCard, loadMoreContainer);
    });
    
    loadedSamples += 12;
    
    // Hide load more button if all products loaded
    if (loadedSamples >= samplePackProducts.length) {
        loadMoreContainer.style.display = 'none';
    }
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
    
    cart.push({
        id: id,
        name: name,
        price: price,
        type: type,
        quantity: 1
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
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Keranjang masih kosong</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="fas ${item.type === 'FLM' ? 'fa-music' : 'fa-drum'}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);
}

function openCart() {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// CHECKOUT WHATSAPP
// ========================================
function checkout() {
    if (cart.length === 0) {
        showToast('Keranjang masih kosong!');
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
    
    let message = `*ORDER ADIP RMX*\n`;
    message += `===================\n\n`;
    message += `*Tanggal:* ${dateString}\n`;
    message += `*Waktu:* ${timeString} WIB\n\n`;
    message += `*PESANAN:*\n`;
    message += `-------------------\n`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Tipe: *${item.type}\n*`;
        message += `   Harga: ${formatPrice(item.price)}\n\n`;
    });
    
    message += `-------------------\n`;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `*TOTAL: ${formatPrice(total)}*\n\n`;
    message += `===================\n`;
    message += `Terima kasih telah order di ADIP RMX!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
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
}

function updateProgress() {
    if (audioElement.duration) {
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = percent + '%';
        
        // Update current time
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audioElement.currentTime);
        }
    }
}

function updateDuration() {
    if (durationEl && audioElement.duration) {
        durationEl.textContent = formatTime(audioElement.duration);
    }
}

function resetProgress() {
    progress.style.width = '0%';
    if (currentTimeEl) {
        currentTimeEl.textContent = '0:00';
    }
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

  (function () {
  setTimeout(() => {
    // ============================
    // DETECT DEVTOOLS (HALUS)
    // ============================
    setInterval(function () {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > 160 || heightDiff > 160) {
        console.clear();
        console.log(
          "%c⚠️ akses developer tools terdeteksi",
          "font-size:20px; font-weight:bold; color:red;"
        );
        console.log(
          "%csource code website ini dilindungi.\ndilarang menyalin atau memodifikasi tanpa izin developer 😛",
          "font-size:14px; color:orange;"
        );
      }
    }, 1500);
  }, 1000); // delay biar aman
})();

// ============================
// MATIIN KLIK KANAN
// ============================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// ============================
// MATIIN TEXT SELECTION
// ============================
document.addEventListener("selectstart", (e) => {
  e.preventDefault();
});

// ============================
// MATIIN COPY
// ============================
document.addEventListener("copy", (e) => {
  e.preventDefault();
});

// ============================
// BLOCK SHORTCUT INSPECT & VIEW SOURCE
// ============================
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  // F12
  if (e.key === "F12") {
    e.preventDefault();
    return false;
  }

  // Ctrl+U
  if (e.ctrlKey && key === "u") {
    e.preventDefault();
    alert("⚠️ source code website ini dilindungi.");
    return false;
  }

  // Ctrl+Shift+I / J / C
  if (
    e.ctrlKey &&
    e.shiftKey &&
    ["i", "j", "c"].includes(key)
  ) {
    e.preventDefault();
    return false;
  }
});
