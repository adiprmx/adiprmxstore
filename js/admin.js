/* ========================================
   ADIP RMX - Admin Dashboard Guard + Transaction Management
   ----------------------------------------------------------
   - Login SEPENUHNYA via Google Sign-In (auth & db dari js/auth-engine.js).
     TIDAK ADA PIN sama sekali.
   - Jika UID/Email akun yang login terdaftar sebagai admin (ADMIN_EMAILS di
     js/auth-engine.js ATAU /users/{uid}/role === "admin" di Realtime DB)
     -> langsung buka dashboard penuh (Promo, Stok, Transaksi).
   - Jika bukan admin -> tampilkan "Akses Ditolak: Akun ini bukan
     Administrator". Alamat email admin TIDAK PERNAH ditampilkan di layar,
     baik di pesan ini maupun di mana pun pada halaman ini.
   - Tabel semua pesanan masuk (/orders/{uid}/{orderId}) + tombol ubah status
     PENDING -> LUNAS (realtime ke dashboard member).
   ======================================== */
(function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    const adminGuestState  = $('adminGuestState');
    const adminDeniedState = $('adminDeniedState');
    const adminPanelState  = $('adminPanelState');
    const adminWhoBadge    = $('adminWhoBadge');
    const adminGateMsg     = $('adminGateMsg');
    const adminGoogleLoginBtn = $('adminGoogleLoginBtn');

    const txnTableWrap = $('txnTableWrap');
    const txnSearch     = $('txnSearch');
    const txnTabs       = $('txnTabs');

    // Halaman ini bukan admin.html (elemen tidak ada) -> tidak perlu jalankan apa pun
    if (!adminGuestState || typeof firebase === 'undefined') return;

    const googleProviderAdmin = new firebase.auth.GoogleAuthProvider();

    let allOrdersFlat = [];
    let activeStatusFilter = 'all';
    let activeSearch = '';
    let ordersListenerRef = null;
    let dashboardInitialized = false;

    function escapeHtml(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function normalizeStatus(raw) {
        const s = (raw || '').toString().toUpperCase();
        return s.indexOf('LUNAS') !== -1 ? 'LUNAS' : 'PENDING';
    }

    // ----------------------------------------
    // TAMPILKAN SALAH SATU STATE: GUEST / DENIED / PANEL
    // ----------------------------------------
    function showState(state) {
        [adminGuestState, adminDeniedState, adminPanelState].forEach(function (el) {
            if (el) el.classList.add('hidden');
        });
        if (state) state.classList.remove('hidden');
    }

    // ----------------------------------------
    // LOGIN / LOGOUT GOOGLE (satu-satunya cara masuk ke admin.html)
    // ----------------------------------------
    if (adminGoogleLoginBtn) {
        adminGoogleLoginBtn.addEventListener('click', function () {
            adminGoogleLoginBtn.disabled = true;
            adminGoogleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';

            auth.signInWithPopup(googleProviderAdmin)
                .catch(function (err) {
                    console.error('Login admin gagal:', err);
                    if (adminGateMsg) {
                        adminGateMsg.textContent = 'Login gagal. Coba lagi.';
                        adminGateMsg.className = 'msg error';
                    }
                    // Fallback ke redirect kalau popup diblokir browser/mobile
                    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
                        auth.signInWithRedirect(googleProviderAdmin);
                    }
                })
                .finally(function () {
                    adminGoogleLoginBtn.disabled = false;
                    adminGoogleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Login dengan Google';
                });
        });
    }

    ['adminLogoutBtn', 'adminDeniedLogoutBtn'].forEach(function (id) {
        const btn = $(id);
        if (btn) btn.addEventListener('click', function () { auth.signOut(); });
    });

    // ----------------------------------------
    // RENDER TABEL TRANSAKSI (dengan Search + Tab Filter Status)
    // ----------------------------------------
    function renderTable() {
        if (!txnTableWrap) return;
        const q = activeSearch.trim().toLowerCase();

        let list = allOrdersFlat.filter(function (o) {
            const statusNorm = normalizeStatus(o.status);
            if (activeStatusFilter !== 'all' && statusNorm !== activeStatusFilter) return false;
            if (!q) return true;
            const productNames = (o.items || []).map(function (i) { return i.name || ''; }).join(' ').toLowerCase();
            const buyer = (o.buyerName || '').toLowerCase();
            return productNames.indexOf(q) !== -1 || buyer.indexOf(q) !== -1;
        });

        list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

        if (!list.length) {
            txnTableWrap.innerHTML = '<p class="hint">Tidak ada transaksi yang cocok.</p>';
            return;
        }

        txnTableWrap.innerHTML = list.map(function (o) {
            const statusNorm = normalizeStatus(o.status);
            const badgeClass = statusNorm === 'LUNAS' ? 'txn-badge-lunas' : 'txn-badge-pending';
            const products = (o.items || []).map(function (i) { return escapeHtml(i.name || '-'); }).join(', ') || '-';
            const noteHtml = o.buyerNote ? '<div class="txn-row-note"><i class="fas fa-note-sticky"></i> ' + escapeHtml(o.buyerNote) + '</div>' : '';
            const total = typeof o.total === 'number' ? 'Rp ' + o.total.toLocaleString('id-ID') : '-';
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
            const actionHtml = statusNorm === 'LUNAS'
                ? '<span class="txn-done-label"><i class="fas fa-check-double"></i> Selesai</span>'
                : '<button type="button" class="btn-mark-paid" data-uid="' + escapeHtml(o.uid) + '" data-oid="' + escapeHtml(o.orderId) + '"><i class="fas fa-check"></i> Tandai LUNAS</button>';

            return '' +
                '<div class="txn-row">' +
                    '<div class="txn-row-main">' +
                        '<span class="txn-row-buyer">' + escapeHtml(o.buyerName || '-') + '</span>' +
                        '<span class="txn-badge ' + badgeClass + '">' + statusNorm + '</span>' +
                    '</div>' +
                    '<div class="txn-row-products">' + products + '</div>' +
                    noteHtml +
                    '<div class="txn-row-meta">' +
                        '<span>' + date + '</span>' +
                        '<span class="txn-row-total">' + total + '</span>' +
                    '</div>' +
                    '<div class="txn-row-action">' + actionHtml + '</div>' +
                '</div>';
        }).join('');
    }

    // ----------------------------------------
    // BACA SEMUA PESANAN (SEMUA UID) SECARA REALTIME
    // Butuh role admin di /users/{uid} sesuai database.rules.json
    // ----------------------------------------
    function listenAllOrders() {
        if (ordersListenerRef) ordersListenerRef.off();
        ordersListenerRef = db.ref('orders');
        ordersListenerRef.on('value', function (snapshot) {
            const data = snapshot.val() || {};
            const flat = [];
            Object.keys(data).forEach(function (uid) {
                const userOrders = data[uid] || {};
                Object.keys(userOrders).forEach(function (orderId) {
                    const o = userOrders[orderId] || {};
                    flat.push(Object.assign({}, o, { uid: uid, orderId: orderId }));
                });
            });
            allOrdersFlat = flat;
            renderTable();
        }, function (err) {
            console.error('Gagal memuat transaksi:', err);
            if (txnTableWrap) txnTableWrap.innerHTML = '<p class="hint">Gagal memuat data transaksi. Pastikan akun ini punya role admin.</p>';
        });
    }

    function stopListenAllOrders() {
        if (ordersListenerRef) {
            ordersListenerRef.off();
            ordersListenerRef = null;
        }
        allOrdersFlat = [];
    }

    // ----------------------------------------
    // AKSI: TANDAI LUNAS
    // Menulis /orders/{uid}/{orderId}/status = "LUNAS"
    // -> otomatis realtime ter-update di dashboard member YBS (js/auth-engine.js)
    // ----------------------------------------
    if (txnTableWrap) {
        txnTableWrap.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-mark-paid');
            if (!btn) return;

            const uid = btn.getAttribute('data-uid');
            const oid = btn.getAttribute('data-oid');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            db.ref('orders/' + uid + '/' + oid + '/status').set('LUNAS')
                .catch(function (err) {
                    console.error('Gagal mengubah status transaksi:', err);
                    alert('Gagal mengubah status transaksi. Coba lagi.');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check"></i> Tandai LUNAS';
                });
        });
    }

    if (txnSearch) {
        txnSearch.addEventListener('input', function () {
            activeSearch = txnSearch.value || '';
            renderTable();
        });
    }

    if (txnTabs) {
        txnTabs.addEventListener('click', function (e) {
            const tab = e.target.closest('.txn-tab');
            if (!tab) return;
            activeStatusFilter = tab.getAttribute('data-status');
            Array.prototype.forEach.call(txnTabs.querySelectorAll('.txn-tab'), function (t) {
                t.classList.toggle('active', t === tab);
            });
            renderTable();
        });
    }

    // ----------------------------------------
    // GUARD ADMIN TUNGGAL: pantau status login Google & cek role
    // (auth & db berasal dari js/auth-engine.js yang sudah dimuat sebelumnya)
    // Ini adalah SATU-SATUNYA gerbang untuk seluruh dashboard admin.html
    // (Promo, Stok "Terjual", & Manajemen Transaksi).
    // ----------------------------------------
    auth.onAuthStateChanged(function (user) {
        if (!user) {
            stopListenAllOrders();
            dashboardInitialized = false;
            showState(adminGuestState);
            return;
        }

        db.ref('users/' + user.uid + '/role').once('value').then(function (snap) {
            const role = snap.val();
            const isAdmin = (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.indexOf(user.email) !== -1) || role === 'admin';

            if (!isAdmin) {
                stopListenAllOrders();
                dashboardInitialized = false;
                showState(adminDeniedState);
                return;
            }

            if (adminWhoBadge) {
                const photo = user.photoURL ? '<img src="' + escapeHtml(user.photoURL) + '" alt="">' : '';
                adminWhoBadge.innerHTML = photo + '<span><i class="fas fa-user-shield"></i> Login sebagai <b>' + escapeHtml(user.displayName || 'Administrator') + '</b></span>';
            }
            showState(adminPanelState);
            listenAllOrders();

            // Muat Promo Engine + Kelola Stok "Terjual" (didefinisikan di
            // admin.html) hanya SEKALI setelah admin terverifikasi.
            if (!dashboardInitialized && typeof window.initAdminDashboard === 'function') {
                dashboardInitialized = true;
                window.initAdminDashboard();
            }
        }).catch(function (err) {
            console.error('Gagal memeriksa role admin:', err);
            showState(adminDeniedState);
        });
    });
})();
