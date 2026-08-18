/* ============================================================================
   ADIP RMX — PROMO ENGINE v1.0
   Harga Promo Otomatis Global • Anti-Bypass (patokan jam SERVER Vercel)
   ----------------------------------------------------------------------------
   CARA KERJA SINGKAT:
   1. Mengambil data promo dari Firebase Realtime Database (REST, read publik).
   2. Mengambil WAKTU ASLI SERVER Vercel lewat:  fetch('/', {method:'HEAD'})
      -> header "Date". Jam HP pengunjung TIDAK dipakai, jadi mengubah jam
      HP tidak akan bisa membuka/menutup promo (anti-bypass).
   3. Jika promo sedang aktif:
      - semua harga di situs otomatis didiskon (produk, jasa, keranjang,
        total, bahkan pesan order WhatsApp ikut harga promo),
      - harga normal dicoret + badge diskon + banner countdown muncul.
   4. Jika promo berakhir -> semua harga otomatis kembali normal di semua
      perangkat (tanpa perlu deploy ulang).
   ----------------------------------------------------------------------------
   WAJIB DIISI: FIREBASE_DB_URL di bawah ini (lihat PANDUAN-INSTALASI.md)
   ============================================================================ */
(function () {
  'use strict';

  var CONFIG = {
    // GANTI dengan URL Realtime Database Anda, contoh:
    // 'https://adiprmx-store-default-rtdb.asia-southeast1.firebasedatabase.app'
    FIREBASE_DB_URL: 'https://adip-promo-default-rtdb.asia-southeast1.firebasedatabase.app',
    PROMO_PATH: '/promo.json',       // node tempat admin menyimpan promo
    REFETCH_PROMO: 30 * 1000,        // cek ulang data promo tiap 30 detik
    RESYNC_SERVER_TIME: 5 * 60 * 1000 // sinkron ulang jam server tiap 5 menit
  };

  // Jika URL belum diisi, engine diam saja (situs tampil normal).
  if (!CONFIG.FIREBASE_DB_URL || CONFIG.FIREBASE_DB_URL.indexOf('https://adip-promo-default-rtdb.asia-southeast1.firebasedatabase.app') !== -1) {
    console.info('[PromoEngine] FIREBASE_DB_URL belum diisi. Engine nonaktif.');
    return;
  }

  /* ------------------------------------------------------------------------
     STATE
     ------------------------------------------------------------------------ */
  var state = {
    promo: null,          // data promo mentah dari Firebase
    active: false,        // promo sedang berjalan?
    upcoming: false,      // promo sudah dijadwalkan tapi belum mulai?
    serverOffset: 0,      // selisih (jam server - jam HP), kunci anti-bypass
    bannerEl: null,
    styleEl: null,
    countdownTimer: null,
    promoTimer: null,
    resyncTimer: null,
    observer: null,
    wrapped: false        // checkout/orderService sudah dibungkus?
  };

  /* ------------------------------------------------------------------------
     WAKTU SERVER (ANTI-BYPASS)
     Header "Date" dari respons server Vercel adalah waktu absolut (GMT).
     Kita bandingkan dengan jam HP SEKALI, lalu semua perhitungan memakai
     Date.now() + offset -> countdown tetap akurat walau jam HP diubah.
     ------------------------------------------------------------------------ */
  function nowMs() {
    return Date.now() + state.serverOffset;
  }

  function syncServerTime() {
    return fetch('/', { method: 'HEAD', cache: 'no-store' })
      .then(function (res) {
        var dateHeader = res.headers.get('Date');
        if (!dateHeader) throw new Error('Header Date tidak ada');
        var serverMs = new Date(dateHeader).getTime();
        if (isNaN(serverMs)) throw new Error('Header Date tidak valid');
        state.serverOffset = serverMs - Date.now();
        return serverMs;
      })
      .catch(function (err) {
        // Fallback terakhir: jam HP (lebih baik daripada tidak sama sekali)
        console.warn('[PromoEngine] Gagal ambil jam server, pakai jam lokal.', err);
        state.serverOffset = 0;
        return Date.now();
      });
  }

  /* ------------------------------------------------------------------------
     DATA PROMO (Firebase Realtime Database - REST API)
     ------------------------------------------------------------------------ */
  function fetchPromo() {
    var url = CONFIG.FIREBASE_DB_URL.replace(/\/+$/, '') + CONFIG.PROMO_PATH;
    return fetch(url, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  function parseMs(iso) {
    var t = new Date(iso).getTime();
    return isNaN(t) ? null : t;
  }

  /* ------------------------------------------------------------------------
     HARGA: hitung diskon & format
     ------------------------------------------------------------------------ */
  function discountOf() {
    return state.promo && state.promo.discount ? Number(state.promo.discount) : 0;
  }
  function discounted(price) {
    return Math.round(price * (1 - discountOf() / 100));
  }
  function rp(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID');
  }
  // Ambil angka dari teks seperti "Rp 75.000" -> 75000
  function parsePrice(text) {
    var digits = String(text).replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : null;
  }

  /* ------------------------------------------------------------------------
     TAMPILAN: CSS yang disuntik saat promo aktif
     ------------------------------------------------------------------------ */
  function injectStyles() {
    if (state.styleEl) return;
    var css = ''
      + '#promo-banner{position:fixed;top:0;left:0;right:0;z-index:1001;'
      + 'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;'
      + 'gap:6px 14px;padding:8px 12px;min-height:44px;text-align:center;'
      + 'background:linear-gradient(90deg,#dc2626,#ef4444,#dc2626);color:#fff;'
      + 'font-family:inherit;font-size:13px;font-weight:600;letter-spacing:.3px;'
      + 'box-shadow:0 2px 12px rgba(220,38,38,.45);}'
      + '#promo-banner .pb-name{text-transform:uppercase;}'
      + '#promo-banner .pb-badge{background:#fff;color:#dc2626;border-radius:999px;'
      + 'padding:2px 10px;font-weight:800;}'
      + '#promo-banner .pb-timer{font-variant-numeric:tabular-nums;background:rgba(0,0,0,.25);'
      + 'border-radius:6px;padding:2px 8px;font-weight:700;}'
      + '#promo-banner.pb-upcoming{background:linear-gradient(90deg,#7c3aed,#8b5cf6,#7c3aed);}'
      + 'body.promo-on .navbar{top:44px !important;}'
      + 'body.promo-on{padding-top:44px;}'
      + '.promo-old{color:#9ca3af !important;text-decoration:line-through !important;'
      + 'font-size:.78em !important;font-weight:500 !important;margin-right:8px;}'
      + '.promo-new{color:#f87171 !important;font-weight:800 !important;}'
      + '.promo-badge{display:inline-block;margin-left:8px;background:#dc2626;color:#fff;'
      + 'font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;'
      + 'vertical-align:middle;animation:promoPulse 1.2s ease-in-out infinite;}'
      + '@keyframes promoPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}'
      + '@media(max-width:640px){#promo-banner{font-size:11px;gap:4px 8px;}}';
    var el = document.createElement('style');
    el.id = 'promo-engine-styles';
    el.textContent = css;
    document.head.appendChild(el);
    state.styleEl = el;
  }

  function removeStyles() {
    if (state.styleEl) { state.styleEl.remove(); state.styleEl = null; }
  }

  /* ------------------------------------------------------------------------
     BANNER + COUNTDOWN
     ------------------------------------------------------------------------ */
  function two(n) { return String(n).padStart(2, '0'); }

  function buildBanner() {
    if (state.bannerEl) state.bannerEl.remove();
    var el = document.createElement('div');
    el.id = 'promo-banner';
    if (state.upcoming) el.classList.add('pb-upcoming');
    el.innerHTML =
      '<span><i class="fas fa-fire"></i> <span class="pb-name"></span></span>' +
      '<span class="pb-badge"></span>' +
      '<span class="pb-label"></span>' +
      '<span class="pb-timer"></span>';
    document.body.prepend(el);
    state.bannerEl = el;
  }

  function updateBanner() {
    if (!state.bannerEl) return;
    var p = state.promo;
    var now = nowMs();
    var startMs = parseMs(p.start);
    var endMs = parseMs(p.end);
    var target = state.upcoming ? startMs : endMs;
    var diff = Math.max(0, target - now);

    var dd = Math.floor(diff / 86400000);
    var hh = Math.floor((diff % 86400000) / 3600000);
    var mm = Math.floor((diff % 3600000) / 60000);
    var ss = Math.floor((diff % 60000) / 1000);
    var text = (dd > 0 ? dd + ' hari ' : '') + two(hh) + ':' + two(mm) + ':' + two(ss);

    state.bannerEl.querySelector('.pb-name').textContent = p.name || 'PROMO';
    state.bannerEl.querySelector('.pb-badge').textContent = '-' + discountOf() + '%';
    state.bannerEl.querySelector('.pb-label').textContent = state.upcoming
      ? 'dimulai dalam' : 'berakhir dalam';
    state.bannerEl.querySelector('.pb-timer').textContent = text;

    // Countdown habis -> evaluasi ulang status promo (aktif/berakhir)
    if (diff <= 0) evaluate(true);
  }

  /* ------------------------------------------------------------------------
     TRANSFORMASI HARGA DI DOM (produk, jasa, keranjang, total)
     ------------------------------------------------------------------------ */
  var PRICE_SELECTORS = '.product-price, .service-price, .cart-item-price, #cartTotal, .cart-total-price';

  function transformEl(el) {
    if (!el || el.dataset.promoApplied === '1') return;
    var suffix = '';
    // Pertahankan "<span>/lagu</span>" pada kartu jasa
    var suffixEl = el.querySelector('span');
    if (el.classList.contains('service-price') && suffixEl) {
      suffix = suffixEl.outerHTML;
    }
    var original = parsePrice(el.textContent);
    if (original === null) return;
    el.dataset.promoApplied = '1';
    el.dataset.promoOriginal = String(original);
    el.dataset.promoSuffix = suffix;
    el.innerHTML =
      '<span class="promo-old">' + rp(original) + '</span>' +
      '<span class="promo-new">' + rp(discounted(original)) + '</span>' +
      '<span class="promo-badge">-' + discountOf() + '%</span>' + suffix;
  }

  function restoreEl(el) {
    if (!el || el.dataset.promoApplied !== '1') return;
    var original = el.dataset.promoOriginal;
    el.innerHTML = rp(original) + (el.dataset.promoSuffix || '');
    delete el.dataset.promoApplied;
    delete el.dataset.promoOriginal;
    delete el.dataset.promoSuffix;
  }

  function applyAll() {
    if (!state.active) return;
    document.querySelectorAll(PRICE_SELECTORS).forEach(transformEl);
  }

  function restoreAll() {
    document.querySelectorAll(PRICE_SELECTORS).forEach(restoreEl);
    // Render ulang produk & keranjang ke kondisi asli jika fungsi situs tersedia
    try { if (typeof window.renderProducts === 'function') window.renderProducts(); } catch (e) {}
    try { if (typeof window.updateCartUI === 'function') window.updateCartUI(); } catch (e) {}
  }

  // Produk/keranjang di-render ulang oleh script.js setiap filter/keranjang
  // berubah -> observer ini menerapkan diskon lagi secara otomatis.
  function startObserver() {
    if (state.observer) return;
    var scheduled = false;
    state.observer = new MutationObserver(function () {
      if (!state.active || scheduled) return;
      scheduled = true;
      setTimeout(function () { scheduled = false; applyAll(); }, 50);
    });
    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (state.observer) { state.observer.disconnect(); state.observer = null; }
  }

  /* ------------------------------------------------------------------------
     PESAN WHATSAPP IKUT HARGA PROMO
     checkout() & orderService() milik script.js memakai formatPrice().
     Saat promo aktif, kita bungkus sesaat agar nominal di pesan WA = harga
     diskon (tanpa mengubah file script.js sama sekali).
     ------------------------------------------------------------------------ */
  function wrapWhatsAppPrices() {
    if (state.wrapped) return;
    ['checkout', 'orderService'].forEach(function (fnName) {
      var original = window[fnName];
      if (typeof original !== 'function') return;
      window[fnName] = function () {
        if (!state.active) return original.apply(this, arguments);
        var origFmt = window.formatPrice;
        window.formatPrice = function (p) { return origFmt(discounted(p)); };
        try { return original.apply(this, arguments); }
        finally { window.formatPrice = origFmt; }
      };
    });
    state.wrapped = true;
  }

  /* ------------------------------------------------------------------------
     AKTIVASI / DEAKTIVASI
     ------------------------------------------------------------------------ */
  function activate() {
    state.active = true;
    state.upcoming = false;
    injectStyles();
    document.body.classList.add('promo-on');
    buildBanner();
    updateBanner();
    wrapWhatsAppPrices();
    startObserver();
    applyAll();
    startCountdown();
    console.info('[PromoEngine] Promo AKTIF:', state.promo.name, '-' + discountOf() + '%');
  }

  function activateUpcoming() {
    state.active = false;
    state.upcoming = true;
    injectStyles();
    document.body.classList.add('promo-on');
    buildBanner();
    updateBanner();
    startCountdown();
    console.info('[PromoEngine] Promo terjadwal, menunggu jam mulai (waktu server).');
  }

  function deactivate() {
    state.active = false;
    state.upcoming = false;
    stopCountdown();
    stopObserver();
    restoreAll();
    if (state.bannerEl) { state.bannerEl.remove(); state.bannerEl = null; }
    document.body.classList.remove('promo-on');
    removeStyles();
    console.info('[PromoEngine] Promo berakhir — semua harga kembali normal.');
  }

  function startCountdown() {
    stopCountdown();
    state.countdownTimer = setInterval(updateBanner, 1000);
  }
  function stopCountdown() {
    if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
  }

  /* ------------------------------------------------------------------------
     EVALUASI STATUS PROMO berdasarkan WAKTU SERVER
     ------------------------------------------------------------------------ */
  function evaluate(fromTick) {
    var p = state.promo;
    if (!p || p.active === false || !parseMs(p.start) || !parseMs(p.end)) {
      if (state.active || state.upcoming) deactivate();
      return;
    }
    var now = nowMs();
    var startMs = parseMs(p.start);
    var endMs = parseMs(p.end);

    if (now >= startMs && now <= endMs) {
      // Sedang berjalan
      if (state.upcoming) { deactivate(); activate(); }
      else if (!state.active) activate();
    } else if (now < startMs) {
      // Terjadwal, belum mulai
      if (state.active) { deactivate(); }
      if (!state.upcoming) activateUpcoming();
    } else {
      // Sudah lewat -> harga normal lagi
      if (state.active || state.upcoming) deactivate();
    }
    if (!fromTick && state.bannerEl) updateBanner();
  }

  /* ------------------------------------------------------------------------
     LOOP UTAMA
     ------------------------------------------------------------------------ */
  function refreshPromo() {
    return fetchPromo().then(function (promo) {
      var changed = JSON.stringify(promo) !== JSON.stringify(state.promo);
      state.promo = promo;
      if (changed) {
        // Data berubah (admin update) -> reset tampilan lalu evaluasi ulang
        var wasOn = state.active || state.upcoming;
        if (wasOn) deactivate();
        evaluate();
      }
    });
  }

  function boot() {
    syncServerTime()
      .then(refreshPromo)
      .then(evaluate)
      .then(function () {
        // Sinkron ulang berkala (tetap anti-bypass meski jam HP diubah
        // di tengah sesi, karena patokan selalu header Date server).
        state.resyncTimer = setInterval(function () {
          syncServerTime().then(evaluate);
        }, CONFIG.RESYNC_SERVER_TIME);
        // Cek data promo berkala (perubahan dari panel admin langsung kebaca)
        state.promoTimer = setInterval(refreshPromo, CONFIG.REFETCH_PROMO);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
