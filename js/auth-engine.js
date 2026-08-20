/* ========================================
   ADIP RMX - Auth & Session Engine
   Firebase Authentication (Google Sign-In)
   + Realtime Database user sync
   + Member Dashboard (WhatsApp, Riwayat Transaksi, Quick Actions)
   ======================================== */

// ----------------------------------------
// 1. FIREBASE CONFIG (GANTI DENGAN KONFIG PROYEK FIREBASE KAMU SENDIRI)
// Ambil dari: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
// ----------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyB1HoJT5IhCo3PGImQDOW8kcjyfd6fas30",
    authDomain: "adip-promo.firebaseapp.com",
    databaseURL: "https://adip-promo-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "adip-promo",
    storageBucket: "adip-promo.firebasestorage.app",
    messagingSenderId: "71098832850",
    appId: "1:71098832850:web:34680dd0c474ec9c4dda0b"
};

// Inisialisasi Firebase (compat SDK)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ----------------------------------------
// Daftar email admin. Tambahkan email Google kamu sendiri di sini
// supaya tombol "Dashboard Admin" muncul otomatis di modal member.
// ----------------------------------------
const ADMIN_EMAILS = [
    "adiprmx@gmail.com"
];

// ----------------------------------------
// SUPER ADMIN HARDCODE
// Email ini SELALU dianggap SUPER ADMIN dengan akses penuh, TANPA perlu
// menunggu/mengecek /users/{uid}/role di database terlebih dahulu.
// Dipakai bersama oleh auth-engine.js & admin.js sebagai satu sumber kebenaran.
// ----------------------------------------
const SUPER_ADMIN_EMAIL = "adiprmx@gmail.com";
function isSuperAdmin(user) {
    return !!(user && user.email === SUPER_ADMIN_EMAIL);
}
window.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
window.isSuperAdmin = isSuperAdmin;

// Variabel global yang bisa dipakai script.js lain untuk auto-fill, dsb.
window.currentUser = null;

// ----------------------------------------
// 2. SESI LOGIN PERMANEN (LOCAL PERSISTENCE)
// Sesi tetap tersimpan walau browser/tab ditutup, sampai user logout manual.
// ----------------------------------------
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((err) => console.error("Gagal set persistence:", err));

// ----------------------------------------
// 3. ELEMENT REFERENCES
// ----------------------------------------
const avatarBtn = () => document.getElementById('avatarBtn');
const avatarBtnImg = () => document.getElementById('avatarBtnImg');
const avatarStatusDot = () => document.getElementById('avatarStatusDot');

const memberModal = () => document.getElementById('memberModal');
const memberPanelGuest = () => document.getElementById('memberPanelGuest');
const memberPanelUser = () => document.getElementById('memberPanelUser');

const memberLoginBtn = () => document.getElementById('memberLoginBtn');
const memberLogoutBtn = () => document.getElementById('memberLogoutBtn');

const memberUserPhoto = () => document.getElementById('memberUserPhoto');
const memberUserName = () => document.getElementById('memberUserName');
const memberUserEmail = () => document.getElementById('memberUserEmail');
const memberUserStatus = () => document.getElementById('memberUserStatus');

const memberHistoryList = () => document.getElementById('memberHistoryList');
const memberHistorySearch = () => document.getElementById('memberHistorySearch');
const memberHistoryTabs = () => document.getElementById('memberHistoryTabs');
const memberAdminBtn = () => document.getElementById('memberAdminBtn');
const memberActionsDivider = () => document.getElementById('memberActionsDivider');

const DEFAULT_AVATAR = 'images/default-avatar.svg';
let historyListenerRef = null;
let lastOrdersRaw = null;
window.memberHistoryFilter = { search: '', status: 'all' };

// ----------------------------------------
// 4. MODAL OPEN / CLOSE
// ----------------------------------------
function openMemberModal() {
    const modal = memberModal();
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMemberModal() {
    const modal = memberModal();
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
window.closeMemberModal = closeMemberModal;

document.addEventListener('DOMContentLoaded', () => {
    const btn = avatarBtn();
    if (btn) btn.addEventListener('click', openMemberModal);

    const modal = memberModal();
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeMemberModal();
        });
    }

    const loginBtn = memberLoginBtn();
    if (loginBtn) loginBtn.addEventListener('click', handleGoogleSignIn);

    const logoutBtn = memberLogoutBtn();
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignOut);

    // Search & Tab Filter Riwayat Transaksi (Semua / Lunas / Pending)
    const searchInputEl = memberHistorySearch();
    if (searchInputEl) {
        searchInputEl.addEventListener('input', () => {
            window.applyMemberHistoryFilter(searchInputEl.value, undefined);
        });
    }

    const tabsWrap = memberHistoryTabs();
    if (tabsWrap) {
        tabsWrap.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.member-history-tab');
            if (!tabBtn) return;
            tabsWrap.querySelectorAll('.member-history-tab').forEach((t) => t.classList.toggle('active', t === tabBtn));
            window.applyMemberHistoryFilter(undefined, tabBtn.getAttribute('data-status'));
        });
    }
});

// ----------------------------------------
// 5. GOOGLE SIGN-IN (Popup, fallback ke Redirect kalau popup diblokir)
// ----------------------------------------
function handleGoogleSignIn() {
    const loginBtn = memberLoginBtn();
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';
    }

    auth.signInWithPopup(googleProvider)
        .then((result) => {
            syncUserToDatabase(result.user);
        })
        .catch((err) => {
            console.error('Login gagal:', err);
            // Fallback otomatis ke redirect jika popup diblokir browser/mobile
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
                auth.signInWithRedirect(googleProvider);
            } else if (typeof showToast === 'function') {
                showToast('Login gagal, silakan coba lagi.');
            }
        })
        .finally(() => {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fab fa-google"></i> Login / Register';
            }
        });
}

function handleSignOut() {
    auth.signOut().then(() => {
        if (typeof showToast === 'function') showToast('Berhasil logout.');
        closeMemberModal();
    }).catch((err) => console.error('Logout gagal:', err));
}

// ----------------------------------------
// 6. SYNC PROFIL USER KE REALTIME DATABASE -> /users/{uid}
// WAJIB dipanggil setiap kali user berhasil login via Google Sign-In.
// Menyimpan: displayName, email, photoURL, whatsapp, role, lastLogin.
// ----------------------------------------
function syncUserToDatabase(user) {
    if (!user) return Promise.resolve();
    const userRef = db.ref('users/' + user.uid);
    // SUPER ADMIN hardcode: email adiprmx@gmail.com SELALU role admin,
    // ditentukan langsung dari email login (tidak bergantung data lama di DB).
    const role = (isSuperAdmin(user) || ADMIN_EMAILS.includes(user.email)) ? 'admin' : 'member';

    return userRef.once('value').then((snapshot) => {
        const existing = snapshot.val() || {};
        const userData = {
            uid: user.uid,
            displayName: user.displayName || existing.displayName || '',
            email: user.email || existing.email || '',
            photoURL: user.photoURL || existing.photoURL || '',
            whatsapp: existing.whatsapp || '',
            role: role,
            lastLogin: Date.now(),
            createdAt: existing.createdAt || Date.now()
        };
        return userRef.set(userData).then(() => userData);
    }).catch((err) => {
        console.error('Gagal sync user ke database:', err);
    });
}

// ----------------------------------------
// 7. RIWAYAT TRANSAKSI / PESANAN SAYA (+ Search & Filter Status)
// Membaca /orders/{uid} secara realtime & merender ke modal member.
// (js/script.js menulis order baru ke path yang sama saat checkout, dan
// admin.js mengubah field "status" menjadi LUNAS -> otomatis realtime di sini)
// ----------------------------------------
function normalizeOrderStatus(rawStatus) {
    const s = (rawStatus || '').toString().toUpperCase();
    if (s.indexOf('LUNAS') !== -1) return { code: 'LUNAS', label: 'LUNAS', cls: 'status-lunas' };
    return { code: 'PENDING', label: 'PENDING', cls: 'status-pending' };
}

function renderOrderHistory() {
    const listEl = memberHistoryList();
    if (!listEl) return;

    if (!lastOrdersRaw) {
        listEl.innerHTML = '<p class="member-history-empty">Belum ada riwayat transaksi.</p>';
        return;
    }

    const filter = window.memberHistoryFilter || { search: '', status: 'all' };
    const q = (filter.search || '').toLowerCase().trim();

    let orders = Object.values(lastOrdersRaw).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    orders = orders.filter((order) => {
        const statusMeta = normalizeOrderStatus(order.status);
        if (filter.status && filter.status !== 'all' && statusMeta.code !== filter.status) return false;
        if (!q) return true;
        const items = Array.isArray(order.items) ? order.items.map((i) => i.name).join(' ') : (order.itemsSummary || '');
        return items.toLowerCase().indexOf(q) !== -1;
    });

    if (!orders.length) {
        listEl.innerHTML = '<p class="member-history-empty">Tidak ada transaksi yang cocok.</p>';
        return;
    }

    listEl.innerHTML = orders.map((order) => {
        const items = Array.isArray(order.items) ? order.items.map((i) => i.name).join(', ') : (order.itemsSummary || 'Pesanan');
        const total = typeof order.total === 'number' ? 'Rp ' + order.total.toLocaleString('id-ID') : '-';
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
        const statusMeta = normalizeOrderStatus(order.status);
        return `
            <div class="member-history-item">
                <div class="member-history-item-top">
                    <span class="member-history-item-products">${items}</span>
                    <span class="member-history-item-status ${statusMeta.cls}">${statusMeta.label}</span>
                </div>
                <div class="member-history-item-meta">
                    <span>${date}</span>
                    <span class="member-history-item-total">${total}</span>
                </div>
            </div>`;
    }).join('');
}
window.renderOrderHistory = renderOrderHistory;

// Dipanggil oleh event Search Bar & Tab Filter di js/script.js / listener di atas
window.applyMemberHistoryFilter = function (search, status) {
    if (!window.memberHistoryFilter) window.memberHistoryFilter = { search: '', status: 'all' };
    if (search !== undefined) window.memberHistoryFilter.search = search;
    if (status !== undefined) window.memberHistoryFilter.status = status;
    renderOrderHistory();
};

function listenOrderHistory(uid) {
    const listEl = memberHistoryList();
    if (!listEl) return;

    // Lepas listener sebelumnya (misal ganti akun) agar tidak dobel
    if (historyListenerRef) {
        historyListenerRef.off();
    }

    historyListenerRef = db.ref('orders/' + uid).orderByChild('createdAt').limitToLast(50);
    historyListenerRef.on('value', (snapshot) => {
        lastOrdersRaw = snapshot.val();
        renderOrderHistory();
    }, (err) => {
        console.error('Gagal memuat riwayat transaksi:', err);
        listEl.innerHTML = '<p class="member-history-empty">Gagal memuat riwayat transaksi.</p>';
    });
}

function stopOrderHistory() {
    if (historyListenerRef) {
        historyListenerRef.off();
        historyListenerRef = null;
    }
    lastOrdersRaw = null;
    window.memberHistoryFilter = { search: '', status: 'all' };
    const listEl = memberHistoryList();
    if (listEl) listEl.innerHTML = '<p class="member-history-empty">Belum ada riwayat transaksi.</p>';
}

// ----------------------------------------
// 8. CLOUD CART ENGINE -> /carts/{uid}
// Keranjang belanja TIDAK lagi disimpan permanen di localStorage begitu user
// login. Setiap perubahan (tambah/hapus/checkout) disinkronkan ke Firebase
// Realtime Database di /carts/{uid}, dan dimuat ulang otomatis setiap kali
// user login / ganti akun Google (realtime, termasuk lintas device/tab).
// Selama user BELUM login, keranjang tetap disimpan sementara di
// localStorage ('adiprmx_cart') oleh js/script.js, lalu otomatis dipindahkan
// (migrasi) ke cloud begitu login berhasil.
// ----------------------------------------
const GUEST_CART_KEY = 'adiprmx_cart';
let cartListenerRef = null;

// Dipanggil oleh js/script.js (saveCart()) setiap kali isi keranjang / nama
// pemesan berubah, HANYA ketika user sedang login.
window.syncCartToCloud = function (items, buyerName) {
    if (!window.currentUser || !window.currentUser.uid) return;
    db.ref('carts/' + window.currentUser.uid).set({
        items: Array.isArray(items) ? items : [],
        buyerName: buyerName || '',
        updatedAt: Date.now()
    }).catch((err) => console.error('Gagal sync keranjang ke cloud:', err));
};

// Pindahkan keranjang sementara (guest, localStorage) ke /carts/{uid} MILIK
// akun yang baru login -- tapi hanya jika akun tsb belum punya keranjang
// tersimpan di cloud (supaya tidak menimpa keranjang lama akun tsb saat
// ganti-ganti akun Google).
function migrateGuestCartToCloud(uid) {
    let guestCart = [];
    try {
        guestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    } catch (e) {
        guestCart = [];
    }
    if (!Array.isArray(guestCart) || !guestCart.length) return Promise.resolve();

    return db.ref('carts/' + uid).once('value').then((snap) => {
        const existing = snap.val();
        if (existing && Array.isArray(existing.items) && existing.items.length) {
            // Akun ini sudah punya keranjang sendiri di cloud -> cloud yang menang
            return;
        }
        return db.ref('carts/' + uid).set({
            items: guestCart,
            buyerName: '',
            updatedAt: Date.now()
        });
    }).catch((err) => console.error('Gagal migrasi keranjang guest ke cloud:', err));
}

// Pantau /carts/{uid} secara realtime -> otomatis update tampilan keranjang
// + Nama Pemesan setiap kali datanya berubah (termasuk dari device/tab lain).
function listenCartRealtime(uid) {
    if (cartListenerRef) cartListenerRef.off();
    cartListenerRef = db.ref('carts/' + uid);
    cartListenerRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        const items = Array.isArray(data.items) ? data.items : [];

        if (typeof window.setCartFromCloud === 'function') {
            window.setCartFromCloud(items);
        }

        const nameInput = document.getElementById('buyerName');
        if (nameInput && data.buyerName && !nameInput.value) {
            nameInput.value = data.buyerName;
            nameInput.dataset.autofilled = 'false';
        }
    }, (err) => {
        console.error('Gagal memuat keranjang cloud:', err);
    });
}

function stopCartRealtime() {
    if (cartListenerRef) {
        cartListenerRef.off();
        cartListenerRef = null;
    }
    if (typeof window.setCartFromCloud === 'function') {
        window.setCartFromCloud([]);
    }
}

// ----------------------------------------
// 9. AUTH STATE OBSERVER
// Otomatis update Avatar Header + Modal Area Member (dashboard lengkap)
// ketika status login berubah.
// ----------------------------------------
auth.onAuthStateChanged((user) => {
    const dot = avatarStatusDot();
    const imgBtn = avatarBtnImg();

    if (user) {
        // --- LOGGED IN ---
        window.currentUser = user;

        if (imgBtn) imgBtn.src = user.photoURL || DEFAULT_AVATAR;
        if (dot) dot.classList.add('online');

        if (memberPanelGuest()) memberPanelGuest().style.display = 'none';
        if (memberPanelUser()) memberPanelUser().style.display = 'flex';

        if (memberUserPhoto()) memberUserPhoto().src = user.photoURL || DEFAULT_AVATAR;
        if (memberUserName()) memberUserName().textContent = user.displayName || 'Member ADIP RMX';
        if (memberUserEmail()) memberUserEmail().textContent = user.email || '-';

        // Diferensiasi Role: MEMBER (cyan glow) vs ADMINISTRATOR (gold/red glow)
        // SUPER ADMIN (hardcode email) otomatis dianggap admin tanpa cek DB.
        const isAdminUser = isSuperAdmin(user) || ADMIN_EMAILS.includes(user.email);
        if (memberUserStatus()) {
            memberUserStatus().className = 'member-status-badge ' + (isAdminUser ? 'role-admin' : 'role-member');
            memberUserStatus().innerHTML = isAdminUser
                ? '<i class="fas fa-crown"></i> ADMINISTRATOR'
                : '<i class="fas fa-star"></i> MEMBER';
        }

        // Tombol "Kelola Panel Admin": hanya tampil jika email termasuk ADMIN_EMAILS
        const adminBtn = memberAdminBtn();
        if (adminBtn) adminBtn.style.display = isAdminUser ? 'flex' : 'none';
        const actionsDivider = memberActionsDivider();
        if (actionsDivider) actionsDivider.style.display = isAdminUser ? 'block' : 'none';

        // WAJIB: simpan/update profil user ke Realtime Database /users/{uid}
        syncUserToDatabase(user).then((userData) => {
            window.currentUser = Object.assign({}, user, { dbData: userData || {} });

            if (typeof window.autoFillCheckoutForm === 'function') {
                window.autoFillCheckoutForm();
            }
        });

        // Riwayat transaksi realtime
        listenOrderHistory(user.uid);

        // Cloud Cart: migrasi keranjang guest (kalau ada) -> lalu pantau
        // /carts/{uid} realtime supaya isi keranjang & Nama Pemesan akun ini
        // otomatis termuat (berlaku juga saat pindah/ganti akun Google).
        migrateGuestCartToCloud(user.uid).then(() => {
            localStorage.removeItem(GUEST_CART_KEY);
            listenCartRealtime(user.uid);
        });
    } else {
        // --- GUEST / LOGGED OUT ---
        window.currentUser = null;

        if (imgBtn) imgBtn.src = DEFAULT_AVATAR;
        if (dot) dot.classList.remove('online');

        if (memberPanelGuest()) memberPanelGuest().style.display = 'flex';
        if (memberPanelUser()) memberPanelUser().style.display = 'none';

        const adminBtnOff = memberAdminBtn();
        if (adminBtnOff) adminBtnOff.style.display = 'none';
        const actionsDividerOff = memberActionsDivider();
        if (actionsDividerOff) actionsDividerOff.style.display = 'none';

        stopOrderHistory();

        // Logout -> lepas cloud cart akun sebelumnya; keranjang baru (kalau
        // ada) akan kembali disimpan sementara di localStorage sampai login lagi.
        stopCartRealtime();
    }
});
