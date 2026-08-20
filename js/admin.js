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

    // ---- Modal "Tambah Transaksi" (manual, tersimpan ke /transactions) ----
    const openAddTxnBtn   = $('openAddTxnBtn');
    const addTxnModal     = $('addTxnModal');
    const closeAddTxnBtn  = $('closeAddTxnBtn');
    const cancelAddTxnBtn = $('cancelAddTxnBtn');
    const addTxnForm      = $('addTxnForm');
    const addTxnMsg       = $('addTxnMsg');
    const txnBuyerInput   = $('txnBuyerInput');
    const txnProductSelect = $('txnProductSelect');
    const txnNote         = $('txnNote');
    const txnStatusSelect = $('txnStatusSelect');
    const txnDateInput    = $('txnDateInput');

    // ---- Modal "Kelola Admin & Member" (kelola role user) ----
    const openManageRoleBtn  = $('openManageRoleBtn');
    const manageRoleModal    = $('manageRoleModal');
    const closeManageRoleBtn = $('closeManageRoleBtn');
    const cancelManageRoleBtn = $('cancelManageRoleBtn');
    const manageRoleForm     = $('manageRoleForm');
    const manageRoleMsg      = $('manageRoleMsg');
    const roleUserInput      = $('roleUserInput');
    const roleSelect         = $('roleSelect');

    // Halaman ini bukan admin.html (elemen tidak ada) -> tidak perlu jalankan apa pun
    if (!adminGuestState || typeof firebase === 'undefined') return;

    // SUPER_ADMIN_EMAIL & isSuperAdmin() didefinisikan di js/auth-engine.js
    // (dimuat sebelum file ini). Fallback jika suatu saat urutan berubah.
    const SUPER_ADMIN = (typeof SUPER_ADMIN_EMAIL !== 'undefined') ? SUPER_ADMIN_EMAIL : 'adiprmx@gmail.com';
    function checkSuperAdmin(user) {
        if (typeof isSuperAdmin === 'function') return isSuperAdmin(user);
        return !!(user && user.email === SUPER_ADMIN);
    }

    const googleProviderAdmin = new firebase.auth.GoogleAuthProvider();

    let allOrdersFlat = [];
    let allTxnsFlat = [];
    let activeStatusFilter = 'all';
    let activeSearch = '';
    let ordersListenerRef = null;
    let txnsListenerRef = null;
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
    // Gabungkan /orders (checkout otomatis dari pembeli) + /transactions
    // (input manual admin lewat modal "Tambah Transaksi") jadi 1 daftar
    // seragam untuk ditampilkan di tabel Manajemen Transaksi.
    function buildUnifiedList() {
        const fromOrders = allOrdersFlat.map(function (o) {
            return {
                source: 'order',
                uid: o.uid,
                id: o.orderId,
                buyerName: o.buyerName || '-',
                products: (o.items || []).map(function (i) { return i.name || '-'; }).join(', ') || '-',
                note: o.buyerNote || '',
                total: typeof o.total === 'number' ? o.total : null,
                status: o.status,
                createdAt: o.createdAt || 0
            };
        });

        const fromTxns = allTxnsFlat.map(function (t) {
            return {
                source: 'txn',
                uid: t.userId || '',
                id: t.id,
                buyerName: t.buyerEmail || t.buyerId || '-',
                products: t.productName || t.productId || '-',
                note: t.note || '',
                total: null,
                status: t.status,
                createdAt: t.createdAt || 0
            };
        });

        return fromOrders.concat(fromTxns);
    }

    function renderTable() {
        if (!txnTableWrap) return;
        const q = activeSearch.trim().toLowerCase();

        let list = buildUnifiedList().filter(function (o) {
            const statusNorm = normalizeStatus(o.status);
            if (activeStatusFilter !== 'all' && statusNorm !== activeStatusFilter) return false;
            if (!q) return true;
            const productNames = (o.products || '').toLowerCase();
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
            const products = escapeHtml(o.products || '-');
            const noteHtml = o.note ? '<div class="txn-row-note"><i class="fas fa-note-sticky"></i> ' + escapeHtml(o.note) + '</div>' : '';
            const total = typeof o.total === 'number' ? 'Rp ' + o.total.toLocaleString('id-ID') : (o.source === 'txn' ? '<span class="hint" style="margin:0;">Input manual</span>' : '-');
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
            const actionHtml = statusNorm === 'LUNAS'
                ? '<span class="txn-done-label"><i class="fas fa-check-double"></i> Selesai</span>'
                : '<button type="button" class="btn-mark-paid" data-source="' + o.source + '" data-uid="' + escapeHtml(o.uid) + '" data-oid="' + escapeHtml(o.id) + '"><i class="fas fa-check"></i> Tandai LUNAS</button>';

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
    // BACA SEMUA TRANSAKSI MANUAL (/transactions) SECARA REALTIME
    // Diisi lewat modal "Tambah Transaksi" di bawah.
    // ----------------------------------------
    function listenAllTxns() {
        if (txnsListenerRef) txnsListenerRef.off();
        txnsListenerRef = db.ref('transactions');
        txnsListenerRef.on('value', function (snapshot) {
            const data = snapshot.val() || {};
            allTxnsFlat = Object.keys(data).map(function (id) {
                return Object.assign({}, data[id], { id: id });
            });
            renderTable();
        }, function (err) {
            console.error('Gagal memuat transaksi manual:', err);
        });
    }

    function stopListenAllTxns() {
        if (txnsListenerRef) {
            txnsListenerRef.off();
            txnsListenerRef = null;
        }
        allTxnsFlat = [];
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

            const source = btn.getAttribute('data-source');
            const uid = btn.getAttribute('data-uid');
            const oid = btn.getAttribute('data-oid');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const statusRef = source === 'txn'
                ? db.ref('transactions/' + oid + '/status')
                : db.ref('orders/' + uid + '/' + oid + '/status');

            statusRef.set('LUNAS')
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
            stopListenAllTxns();
            dashboardInitialized = false;
            showState(adminGuestState);
            return;
        }

        function grantAdminAccess(isSuper) {
            if (adminWhoBadge) {
                const photo = user.photoURL ? '<img src="' + escapeHtml(user.photoURL) + '" alt="">' : '';
                const roleLabel = isSuper
                    ? '<i class="fas fa-crown"></i> SUPER ADMIN'
                    : '<i class="fas fa-user-shield"></i> Administrator';
                adminWhoBadge.innerHTML = photo + '<span>Login sebagai <b>' + escapeHtml(user.displayName || 'Administrator') + '</b> &middot; ' + roleLabel + '</span>';
            }
            showState(adminPanelState);
            listenAllOrders();
            listenAllTxns();

            // Tombol "Kelola Admin & Member" HANYA untuk Super Admin / role admin
            // (guard tambahan juga ada di handler submit-nya).
            if (openManageRoleBtn) openManageRoleBtn.style.display = 'inline-flex';

            // Muat Promo Engine + Kelola Stok "Terjual" (didefinisikan di
            // admin.html) hanya SEKALI setelah admin terverifikasi.
            if (!dashboardInitialized && typeof window.initAdminDashboard === 'function') {
                dashboardInitialized = true;
                window.initAdminDashboard();
            }
        }

        // ----------------------------------------
        // SUPER ADMIN HARDCODE: jika email === SUPER_ADMIN_EMAIL, LANGSUNG
        // buka dashboard penuh TANPA menunggu/cek /users/{uid}/role di
        // database terlebih dahulu (anti-terkunci kalau data role hilang/
        // belum tersinkron/rule DB bermasalah).
        // ----------------------------------------
        if (checkSuperAdmin(user)) {
            grantAdminAccess(true);
            return;
        }

        db.ref('users/' + user.uid + '/role').once('value').then(function (snap) {
            const role = snap.val();
            const isAdmin = (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.indexOf(user.email) !== -1) || role === 'admin';

            if (!isAdmin) {
                stopListenAllOrders();
                stopListenAllTxns();
                dashboardInitialized = false;
                showState(adminDeniedState);
                return;
            }

            grantAdminAccess(false);
        }).catch(function (err) {
            console.error('Gagal memeriksa role admin:', err);
            showState(adminDeniedState);
        });
    });

    // ========================================================================
    // MODAL "TAMBAH TRANSAKSI" (manual, khusus admin) -> menulis ke /transactions
    // Field: Email/UID Pembeli, Pilih Produk, Catatan Pembeli, Status, Tanggal.
    // Ditulis lewat db.ref('transactions').push(), diizinkan oleh
    // database.rules.json karena akun yang login sudah dipastikan role admin
    // oleh guard di atas.
    // ========================================================================
    function todayDateInputValue() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function populateTxnProductSelect() {
        if (!txnProductSelect) return;
        const list = []
            .concat(typeof flmProducts !== 'undefined' ? flmProducts : [])
            .concat(typeof samplePackProducts !== 'undefined' ? samplePackProducts : []);

        txnProductSelect.innerHTML = '<option value="">— Pilih produk —</option>' +
            list.map(function (p) {
                return '<option value="' + escapeHtml(p.id) + '" data-name="' + escapeHtml(p.name) + '">' +
                    escapeHtml(p.name) + ' (' + escapeHtml(p.category || '-') + ')' +
                    '</option>';
            }).join('');
    }

    function openAddTxnModal() {
        if (!addTxnModal) return;
        if (addTxnForm) addTxnForm.reset();
        if (addTxnMsg) { addTxnMsg.className = 'msg'; addTxnMsg.textContent = ''; }
        populateTxnProductSelect();
        if (txnDateInput) txnDateInput.value = todayDateInputValue();
        addTxnModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeAddTxnModal() {
        if (!addTxnModal) return;
        addTxnModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (openAddTxnBtn) openAddTxnBtn.addEventListener('click', openAddTxnModal);
    if (closeAddTxnBtn) closeAddTxnBtn.addEventListener('click', closeAddTxnModal);
    if (cancelAddTxnBtn) cancelAddTxnBtn.addEventListener('click', closeAddTxnModal);
    if (addTxnModal) {
        addTxnModal.addEventListener('click', function (e) {
            if (e.target === addTxnModal) closeAddTxnModal();
        });
    }

    // Cari UID member terdaftar berdasarkan email yang diketik admin (kalau ada),
    // supaya transaksi manual tetap muncul di riwayat akun member tsb.
    // Kalau tidak ditemukan (atau admin memasukkan UID langsung), field
    // "userId" tetap diisi dengan input mentah agar tetap tersimpan.
    function resolveBuyerIdentity(rawInput) {
        const value = (rawInput || '').trim();
        const looksLikeEmail = value.indexOf('@') !== -1;

        if (!looksLikeEmail) {
            // Diperlakukan sebagai UID langsung
            return Promise.resolve({ userId: value, buyerId: value, buyerEmail: '' });
        }

        return db.ref('users').orderByChild('email').equalTo(value).limitToFirst(1).once('value')
            .then(function (snap) {
                const data = snap.val();
                if (data) {
                    const uid = Object.keys(data)[0];
                    return { userId: uid, buyerId: uid, buyerEmail: value };
                }
                // Email belum terdaftar -> tetap simpan sebagai identitas mentah
                return { userId: '', buyerId: value, buyerEmail: value };
            })
            .catch(function () {
                return { userId: '', buyerId: value, buyerEmail: value };
            });
    }

    if (addTxnForm) {
        addTxnForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitBtn = $('submitAddTxnBtn');

            const buyerRaw = (txnBuyerInput && txnBuyerInput.value || '').trim();
            const productId = txnProductSelect ? txnProductSelect.value : '';
            const productOpt = txnProductSelect ? txnProductSelect.options[txnProductSelect.selectedIndex] : null;
            const productName = productOpt ? (productOpt.getAttribute('data-name') || productOpt.textContent) : '';
            const note = (txnNote && txnNote.value || '').trim();
            const status = txnStatusSelect ? txnStatusSelect.value : 'PENDING';
            const dateVal = txnDateInput ? txnDateInput.value : '';

            if (!buyerRaw || !productId || !dateVal) {
                if (addTxnMsg) {
                    addTxnMsg.textContent = 'Lengkapi semua field wajib (Pembeli, Produk, Tanggal).';
                    addTxnMsg.className = 'msg error';
                }
                return;
            }

            if (submitBtn) submitBtn.disabled = true;

            // Tanggal dari input dianggap WIB (UTC+7), jam disamakan dengan
            // waktu sekarang supaya urutan transaksi tetap masuk akal.
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            const createdAt = new Date(dateVal + 'T' + hh + ':' + mm + ':' + ss + '+07:00').getTime();

            resolveBuyerIdentity(buyerRaw).then(function (identity) {
                const currentAdmin = firebase.auth().currentUser;
                const payload = {
                    buyerId: identity.buyerId,
                    buyerEmail: identity.buyerEmail,
                    userId: identity.userId,
                    productId: productId,
                    productName: productName,
                    note: note,
                    status: status,
                    createdAt: createdAt,
                    createdBy: currentAdmin ? currentAdmin.uid : ''
                };

                return db.ref('transactions').push(payload);
            }).then(function () {
                if (addTxnMsg) {
                    addTxnMsg.textContent = 'Transaksi berhasil disimpan.';
                    addTxnMsg.className = 'msg success';
                }
                setTimeout(closeAddTxnModal, 700);
            }).catch(function (err) {
                console.error('Gagal menyimpan transaksi manual:', err);
                if (addTxnMsg) {
                    addTxnMsg.textContent = 'Gagal menyimpan transaksi. Pastikan akun ini admin & coba lagi.';
                    addTxnMsg.className = 'msg error';
                }
            }).finally(function () {
                if (submitBtn) submitBtn.disabled = false;
            });
        });
    }

    // ========================================================================
    // MODUL "KELOLA ADMIN & MEMBER" -> update /users/{uid}/role secara realtime
    // Hanya bisa dibuka & berhasil menyimpan jika akun yang login Super Admin
    // (adiprmx@gmail.com) atau sudah punya role "admin" -- selaras dengan
    // database.rules.json yang menolak write /users dari user biasa.
    // ========================================================================
    function openManageRoleModal() {
        if (!manageRoleModal) return;
        if (manageRoleForm) manageRoleForm.reset();
        if (manageRoleMsg) { manageRoleMsg.className = 'msg'; manageRoleMsg.textContent = ''; }
        manageRoleModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeManageRoleModal() {
        if (!manageRoleModal) return;
        manageRoleModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (openManageRoleBtn) openManageRoleBtn.addEventListener('click', openManageRoleModal);
    if (closeManageRoleBtn) closeManageRoleBtn.addEventListener('click', closeManageRoleModal);
    if (cancelManageRoleBtn) cancelManageRoleBtn.addEventListener('click', closeManageRoleModal);
    if (manageRoleModal) {
        manageRoleModal.addEventListener('click', function (e) {
            if (e.target === manageRoleModal) closeManageRoleModal();
        });
    }

    // Terima input berupa Email ATAU UID Firebase langsung. Kalau berupa
    // email, dicari dulu UID-nya di /users (butuh user tsb sudah pernah
    // login/registrasi minimal sekali supaya nodenya ada di database).
    function resolveUserUidByEmailOrUid(rawInput) {
        const value = (rawInput || '').trim();
        const looksLikeEmail = value.indexOf('@') !== -1;

        if (!looksLikeEmail) {
            return db.ref('users/' + value).once('value').then(function (snap) {
                return snap.exists() ? value : null;
            });
        }

        return db.ref('users').orderByChild('email').equalTo(value).limitToFirst(1).once('value')
            .then(function (snap) {
                const data = snap.val();
                if (!data) return null;
                return Object.keys(data)[0];
            });
    }

    if (manageRoleForm) {
        manageRoleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitBtn = $('submitManageRoleBtn');
            const currentUser = firebase.auth().currentUser;

            // Guard ekstra di sisi client (rule DB tetap jadi penjaga utama):
            // hanya Super Admin / role admin yang boleh menyimpan.
            if (!currentUser || !checkSuperAdmin(currentUser)) {
                db.ref('users/' + (currentUser ? currentUser.uid : '') + '/role').once('value').then(function (snap) {
                    if (snap.val() !== 'admin') {
                        if (manageRoleMsg) {
                            manageRoleMsg.textContent = 'Hanya Super Admin / Administrator yang boleh mengubah role user.';
                            manageRoleMsg.className = 'msg error';
                        }
                    }
                });
            }

            const rawInput = (roleUserInput && roleUserInput.value || '').trim();
            const newRole = roleSelect ? roleSelect.value : 'MEMBER';
            const roleValue = newRole === 'ADMINISTRATOR' ? 'admin' : 'member';

            if (!rawInput) {
                if (manageRoleMsg) {
                    manageRoleMsg.textContent = 'Isi Email atau UID user terlebih dahulu.';
                    manageRoleMsg.className = 'msg error';
                }
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            if (manageRoleMsg) { manageRoleMsg.className = 'msg'; manageRoleMsg.textContent = 'Memproses...'; }

            resolveUserUidByEmailOrUid(rawInput).then(function (uid) {
                if (!uid) {
                    throw new Error('NOT_FOUND');
                }
                // Cegah Super Admin tidak sengaja menurunkan role akunnya sendiri
                // lewat form ini (akses Super Admin tetap hardcode, tapi supaya
                // tidak membingungkan di tabel role, tetap ditolak di sini).
                if (currentUser && uid === currentUser.uid && checkSuperAdmin(currentUser) && roleValue !== 'admin') {
                    throw new Error('CANNOT_DEMOTE_SELF');
                }
                return db.ref('users/' + uid + '/role').set(roleValue);
            }).then(function () {
                if (manageRoleMsg) {
                    manageRoleMsg.textContent = 'Role user berhasil disimpan.';
                    manageRoleMsg.className = 'msg success';
                }
                setTimeout(closeManageRoleModal, 700);
            }).catch(function (err) {
                console.error('Gagal menyimpan role user:', err);
                let text = 'Gagal menyimpan role. Pastikan akun ini Super Admin/Administrator.';
                if (err && err.message === 'NOT_FOUND') {
                    text = 'User tidak ditemukan. User harus login/registrasi minimal 1x dulu sebelum role-nya bisa diatur.';
                } else if (err && err.message === 'CANNOT_DEMOTE_SELF') {
                    text = 'Tidak bisa menurunkan role akun Super Admin sendiri dari sini.';
                }
                if (manageRoleMsg) {
                    manageRoleMsg.textContent = text;
                    manageRoleMsg.className = 'msg error';
                }
            }).finally(function () {
                if (submitBtn) submitBtn.disabled = false;
            });
        });
    }
})();
