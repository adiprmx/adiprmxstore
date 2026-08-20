// ============================================================================
// ADIP RMX — API: UPDATE ANGKA "TERJUAL" PER PRODUK
// Lokasi di repo GitHub:  api/update-sold.js
// ----------------------------------------------------------------------------
// Vercel Serverless Function.
// Mengubah /products/{productId}/sold_count di Firebase Realtime Database
// UNTUK SATU PRODUK SAJA — produk lain sama sekali tidak tersentuh, karena
// path yang ditulis selalu spesifik ke productId yang dikirim admin.html.
//
// Body JSON yang diterima (token WAJIB — dari api/login.js, sama seperti
// yang dipakai save-promo.js):
//   Tombol (+1)      : { token, productId, mode: 'increment' }
//   Input manual     : { token, productId, mode: 'set', value: 123 }
//
// Increment memakai Firebase Transaction, jadi aman walau admin klik (+1)
// dari 2 tab/device sekaligus (tidak akan ada angka yang "ketimpa" / hilang).
//
// Env yang dibutuhkan (SAMA PERSIS dengan api/save-promo.js):
//   ADMIN_PIN                = pin rahasia (dipakai juga utk verifikasi token)
//   FIREBASE_DATABASE_URL    = https://PROJECT-default-rtdb.REGION.firebasedatabase.app
//   FIREBASE_SERVICE_ACCOUNT = isi JSON service account (1 baris utuh)
// ============================================================================

const crypto = require('crypto');
const admin = require('firebase-admin');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// --- Verifikasi token yang diterbitkan api/login.js (HMAC-SHA256) ----------
// (identik dengan verifyToken di api/save-promo.js — WAJIB SAMA)
function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.sub === 'admin' && typeof data.exp === 'number' && data.exp > Date.now();
  } catch (e) {
    return false;
  }
}

// --- Inisialisasi Firebase Admin (sekali per instance serverless) ----------
function getDb() {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  return admin.database();
}

function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

// ID produk kita batasi ke pola aman (huruf/angka/strip) — mencegah path
// Firebase yang aneh-aneh dikirim lewat body request.
const PRODUCT_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { ADMIN_PIN, FIREBASE_DATABASE_URL, FIREBASE_SERVICE_ACCOUNT } = process.env;
  if (!ADMIN_PIN || !FIREBASE_DATABASE_URL || !FIREBASE_SERVICE_ACCOUNT) {
    return res.status(500).json({
      success: false,
      message: 'Environment Variables belum lengkap (ADMIN_PIN / FIREBASE_DATABASE_URL / FIREBASE_SERVICE_ACCOUNT).'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (e) {
    return badRequest(res, 'Body bukan JSON valid.');
  }

  // Wajib: token sesi admin dari api/login.js (sama seperti save-promo.js)
  if (!verifyToken(body.token, ADMIN_PIN)) {
    return res.status(401).json({ success: false, message: 'Token tidak valid / kedaluwarsa. Silakan login ulang.' });
  }

  const productId = String(body.productId || '').trim();
  if (!productId || !PRODUCT_ID_RE.test(productId)) {
    return badRequest(res, 'productId tidak valid.');
  }

  const mode = String(body.mode || '');
  if (mode !== 'increment' && mode !== 'set') {
    return badRequest(res, 'mode harus "increment" atau "set".');
  }

  const db = getDb();
  // Path SELALU spesifik ke 1 productId -> produk lain tidak pernah tersentuh
  const soldRef = db.ref('products/' + productId + '/sold_count');

  try {
    if (mode === 'increment') {
      const result = await soldRef.transaction(function (current) {
        return (Number(current) || 0) + 1;
      });
      const newValue = result.committed ? result.snapshot.val() : null;
      return res.status(200).json({
        success: true,
        message: `+1 tersimpan untuk "${productId}".`,
        productId,
        sold_count: newValue
      });
    }

    // ---- mode "set": input angka manual ----
    const value = Number(body.value);
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      return badRequest(res, 'value harus bilangan bulat >= 0.');
    }
    await soldRef.set(value);
    return res.status(200).json({
      success: true,
      message: `Angka "Terjual" untuk "${productId}" diset ke ${value}.`,
      productId,
      sold_count: value
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menulis ke Firebase: ' + (err && err.message ? err.message : 'unknown error') });
  }
};
