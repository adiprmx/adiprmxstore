// ========================================
// ADIP RMX - Main JavaScript
// ========================================

// Global Variables
let cart = [];
let currentAudio = null;
let isPlaying = false;
let currentTrack = null;

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
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

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
        flmGrid.innerHTML = flmProducts.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <i class="fas fa-music"></i>
                    <div class="product-play" onclick="playAudio('${product.id}', '${product.name}', '${product.audioUrl}')">
                        <i class="fas fa-play"></i>
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
        // Show only first 12 items initially, with load more option
        const initialProducts = samplePackProducts.slice(0, 12);
        sampleGrid.innerHTML = initialProducts.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <i class="fas fa-drum"></i>
                    <div class="product-play" onclick="playAudio('${product.id}', '${product.name}', '${product.audioUrl}')">
                        <i class="fas fa-play"></i>
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
                <i class="fas fa-drum"></i>
                <div class="product-play" onclick="playAudio('${product.id}', '${product.name}', '${product.audioUrl}')">
                    <i class="fas fa-play"></i>
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
        message += `   Tipe: ${item.type}\n`;
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
// AUDIO PLAYER
// ========================================
function initAudioPlayer() {
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlay);
    }
    
    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('ended', () => {
            isPlaying = false;
            updatePlayButton();
        });
    }
}

function playAudio(id, name, url) {
    // For demo purposes, since we don't have actual audio files
    // In production, replace with actual audio URL
    
    if (currentTrack === id) {
        togglePlay();
        return;
    }
    
    currentTrack = id;
    nowPlaying.textContent = `Sedang diputar: ${name}`;
    
    // Show player
    audioPlayer.classList.add('active');
    
    // For demo, we'll just show the player without actual audio
    // In production: audioElement.src = url;
    
    isPlaying = true;
    updatePlayButton();
    
    // Simulate progress for demo
    simulateProgress();
}

function togglePlay() {
    if (!currentTrack) return;
    
    isPlaying = !isPlaying;
    updatePlayButton();
    
    // In production:
    // if (isPlaying) {
    //     audioElement.play();
    // } else {
    //     audioElement.pause();
    // }
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
    }
}

function simulateProgress() {
    // Demo progress simulation
    let percent = 0;
    const interval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(interval);
            return;
        }
        percent += 1;
        if (percent > 100) {
            percent = 0;
            isPlaying = false;
            updatePlayButton();
            clearInterval(interval);
        }
        progress.style.width = percent + '%';
    }, 100);
}

function closePlayer() {
    audioPlayer.classList.remove('active');
    isPlaying = false;
    currentTrack = null;
    updatePlayButton();
    progress.style.width = '0%';
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
});

// ============================
// PROTEKSI WEBSITE (SAFE)
// ============================
(function() {
  const isDev = false; // ubah ke true kalo lagi ngoding
  if (isDev) return;

  setTimeout(() => {

    // ============================
    // DISABLE RIGHT CLICK
    // ============================
    document.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    });

    // ============================
    // DISABLE SHORTCUT INSPECT
    // ============================
    document.addEventListener("keydown", function(e) {
      const key = e.key.toUpperCase();
      const tag = e.target.tagName;

      // biarin input & textarea normal
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // biarin tombol ESC (biar ga nabrak code lu)
      if (key === "ESCAPE") return;

      if (
        key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        (e.ctrlKey && key === "U")
      ) {
        e.preventDefault();
      }
    });

    // ============================
    // DISABLE TEXT SELECT
    // ============================
    document.body.style.userSelect = "none";

    // ============================
    // DETECT DEVTOOLS (HALUS)
    // ============================
    setInterval(function() {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > 160 || heightDiff > 160) {
        console.clear();
        console.log("Ngapain dibuka 😏");
      }
    }, 1500);

  }, 1000); // delay biar aman

})();