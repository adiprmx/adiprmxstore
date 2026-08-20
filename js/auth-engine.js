/* ========================================
   ADIP RMX - Auth & Session Engine
   Firebase Authentication (Google Sign-In)
   + Realtime Database user sync
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

const DEFAULT_AVATAR = 'images/default-avatar.svg';

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
// ----------------------------------------
function syncUserToDatabase(user) {
    if (!user) return;
    const userRef = db.ref('users/' + user.uid);

    userRef.once('value').then((snapshot) => {
        const existing = snapshot.val();
        const userData = {
            uid: user.uid,
            name: user.displayName || (existing && existing.name) || '',
            email: user.email || (existing && existing.email) || '',
            photoURL: user.photoURL || (existing && existing.photoURL) || '',
            phone: (existing && existing.phone) || '',
            status: (existing && existing.status) || 'member',
            lastLogin: Date.now(),
            createdAt: (existing && existing.createdAt) || Date.now()
        };
        userRef.set(userData).catch((err) => console.error('Gagal sync user ke database:', err));
    }).catch((err) => console.error('Gagal membaca data user:', err));
}

// ----------------------------------------
// 7. AUTH STATE OBSERVER
// Otomatis update Avatar Header + Modal Area Member ketika status login berubah.
// ----------------------------------------
auth.onAuthStateChanged((user) => {
    window.currentUser = user;

    const dot = avatarStatusDot();
    const imgBtn = avatarBtnImg();

    if (user) {
        // --- LOGGED IN ---
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

        // Ambil data tambahan (no HP tersimpan, status) dari database untuk auto-fill checkout
        db.ref('users/' + user.uid).once('value').then((snap) => {
            const data = snap.val();
            window.currentUser = Object.assign({}, user, { dbData: data || {} });
            if (typeof window.autoFillCheckoutForm === 'function') {
                window.autoFillCheckoutForm();
            }
        });
    } else {
        // --- GUEST / LOGGED OUT ---
        if (imgBtn) imgBtn.src = DEFAULT_AVATAR;
        if (dot) dot.classList.remove('online');

        if (memberPanelGuest()) memberPanelGuest().style.display = 'flex';
        if (memberPanelUser()) memberPanelUser().style.display = 'none';
    }
});
