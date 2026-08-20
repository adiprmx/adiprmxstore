/* ========================================
   ADIP RMX - Admin Transaction Management
   Login via Google (memakai auth & db dari js/auth-engine.js)
   + Tabel semua pesanan masuk (/orders/{uid}/{orderId})
   + Tombol ubah status PENDING -> LUNAS (realtime ke dashboard member)
   ======================================== */
(function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    const txnGuestState  = $('txnGuestState');
    const txnAdminState  = $('txnAdminState');
    const txnDeniedState = $('txnDeniedState');
    const txnAdminWho    = $('txnAdminWho');
    const txnTableWrap   = $('txnTableWrap');
    const txnSearch      = $('txnSearch');
    const txnTabs        = $('txnTabs');
    const txnMsg         = $('txnMsg');
    const txnGoogleLoginBtn = $('txnGoogleLoginBtn');

    // Halaman ini bukan admin.html (elemen tidak ada) -> tidak perlu jalankan apa pun
    if (!txnGuestState || typeof firebase === 'undefined') return;

    const googleProviderAdmin = new firebase.auth.GoogleAuthProvider();

    let allOrdersFlat = [];
    let activeStatusFilter = 'all';
    let activeSearch = '';
    let ordersListenerRef = null;

    function escapeHtml(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function normalizeStatus(raw) {
        const s = (raw || '').toString().toUpperCase();
        return s.indexOf('LUNAS') !== -1 ? 'LUNAS' : 'PENDING';
    }

    function showState(state) {
        [txnGuestState, txnAdminState, txnDeniedState].forEach(function (el) {
            if (el) el.classList.add('hidden');
        });
        if (state) state.classList.remove('hidden');
    }

    // ----------------------------------------
    // LOGIN / LOGOUT GOOGLE (khusus panel Manajemen Transaksi)
    // ----------------------------------------
    if (txnGoogleLoginBtn) {
        txnGoogleLoginBtn.addEventListener('click', function () {
            txnGoogleLoginBtn.disabled = true;
            txnGoogleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';

            auth.signInWithPopup(googleProviderAdmin)
                .catch(function (err) {
                    console.error('Login admin gagal:', err);
                    if (txnMsg) {
                        txnMsg.textContent = 'Login gagal. Coba lagi.';
                        txnMsg.className = 'msg error';
                    }
                })
                .finally(function () {
                    txnGoogleLoginBtn.disabled = false;
                    txnGoogleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Login dengan Google';
                });
        });
    }

    ['txnLogoutBtn', 'txnDeniedLogoutBtn'].forEach(function (id) {
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
    // Butuh role admin di /users/{uid}/role sesuai database.rules.json
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
    // GUARD ADMIN: pantau status login Google & cek role
    // (auth & db berasal dari js/auth-engine.js yang sudah dimuat sebelumnya)
    // ----------------------------------------
    auth.onAuthStateChanged(function (user) {
        if (!user) {
            stopListenAllOrders();
            showState(txnGuestState);
            return;
        }

        db.ref('users/' + user.uid + '/role').once('value').then(function (snap) {
            const role = snap.val();
            const isAdmin = ADMIN_EMAILS.indexOf(user.email) !== -1 || role === 'admin';

            if (!isAdmin) {
                stopListenAllOrders();
                showState(txnDeniedState);
                return;
            }

            if (txnAdminWho) {
                txnAdminWho.innerHTML = '<i class="fas fa-user-shield"></i> Login sebagai <b>' + escapeHtml(user.displayName || user.email) + '</b>';
            }
            showState(txnAdminState);
            listenAllOrders();
        }).catch(function (err) {
            console.error('Gagal memeriksa role admin:', err);
            showState(txnDeniedState);
        });
    });
})();
