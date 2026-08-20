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

const memberWhatsappInput = () => document.getElementById('memberWhatsappInput');
const memberWhatsappSaveBtn = () => document.getElementById('memberWhatsappSaveBtn');
const memberHistoryList = () => document.getElementById('memberHistoryList');
const memberAdminBtn = () => document.getElementById('memberAdminBtn');

const DEFAULT_AVATAR = 'images/default-avatar.svg';
let historyListenerRef = null;

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

    const waSaveBtn = memberWhatsappSaveBtn();
    if (waSaveBtn) waSaveBtn.addEventListener('click', handleSaveWhatsapp);
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
    const role = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'member';

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
// 7. SIMPAN NO. WHATSAPP MEMBER (Section Dashboard)
// ----------------------------------------
function handleSaveWhatsapp() {
    const input = memberWhatsappInput();
    const saveBtn = memberWhatsappSaveBtn();
    const user = auth.currentUser;
    if (!input || !user) return;

    const value = input.value.trim();
    if (!value) {
        if (typeof showToast === 'function') showToast('Masukkan No. WhatsApp terlebih dahulu.');
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    db.ref('users/' + user.uid + '/whatsapp').set(value)
        .then(() => {
            if (typeof showToast === 'function') showToast('No. WhatsApp berhasil disimpan.');
            if (window.currentUser) {
                window.currentUser.dbData = Object.assign({}, window.currentUser.dbData, { whatsapp: value });
            }
            if (typeof window.autoFillCheckoutForm === 'function') {
                window.autoFillCheckoutForm();
            }
        })
        .catch((err) => {
            console.error('Gagal simpan No. WhatsApp:', err);
            if (typeof showToast === 'function') showToast('Gagal menyimpan No. WhatsApp.');
        })
        .finally(() => {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i>';
            }
        });
}

// ----------------------------------------
// 8. RIWAYAT TRANSAKSI / PESANAN SAYA
// Membaca /orders/{uid} secara realtime & merender ke modal member.
// (js/script.js menulis order baru ke path yang sama saat checkout)
// ----------------------------------------
function listenOrderHistory(uid) {
    const listEl = memberHistoryList();
    if (!listEl) return;

    // Lepas listener sebelumnya (misal ganti akun) agar tidak dobel
    if (historyListenerRef) {
        historyListenerRef.off();
    }

    historyListenerRef = db.ref('orders/' + uid).orderByChild('createdAt').limitToLast(20);
    historyListenerRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            listEl.innerHTML = '<p class="member-history-empty">Belum ada riwayat transaksi.</p>';
            return;
        }

        const orders = Object.values(data).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        listEl.innerHTML = orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items.map((i) => i.name).join(', ') : (order.itemsSummary || 'Pesanan');
            const total = typeof order.total === 'number' ? 'Rp ' + order.total.toLocaleString('id-ID') : '-';
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
            const status = order.status || 'Menunggu Konfirmasi';
            return `
                <div class="member-history-item">
                    <div class="member-history-item-top">
                        <span class="member-history-item-products">${items}</span>
                        <span class="member-history-item-status">${status}</span>
                    </div>
                    <div class="member-history-item-meta">
                        <span>${date}</span>
                        <span class="member-history-item-total">${total}</span>
                    </div>
                </div>`;
        }).join('');
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
    const listEl = memberHistoryList();
    if (listEl) listEl.innerHTML = '<p class="member-history-empty">Belum ada riwayat transaksi.</p>';
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
        if (memberUserStatus()) {
            memberUserStatus().innerHTML = '<i class="fas fa-star"></i> Member Aktif';
        }

        // Tombol Dashboard Admin: hanya tampil jika email termasuk ADMIN_EMAILS
        const adminBtn = memberAdminBtn();
        if (adminBtn) adminBtn.style.display = ADMIN_EMAILS.includes(user.email) ? 'flex' : 'none';

        // WAJIB: simpan/update profil user ke Realtime Database /users/{uid}
        syncUserToDatabase(user).then((userData) => {
            window.currentUser = Object.assign({}, user, { dbData: userData || {} });

            const waInput = memberWhatsappInput();
            if (waInput) waInput.value = (userData && userData.whatsapp) || '';

            if (typeof window.autoFillCheckoutForm === 'function') {
                window.autoFillCheckoutForm();
            }
        });

        // Riwayat transaksi realtime
        listenOrderHistory(user.uid);
    } else {
        // --- GUEST / LOGGED OUT ---
        window.currentUser = null;

        if (imgBtn) imgBtn.src = DEFAULT_AVATAR;
        if (dot) dot.classList.remove('online');

        if (memberPanelGuest()) memberPanelGuest().style.display = 'flex';
        if (memberPanelUser()) memberPanelUser().style.display = 'none';

        stopOrderHistory();
    }
});
