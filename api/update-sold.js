// ============================================================================
// ADIP RMX — API: UPDATE ANGKA "TERJUAL" PER PRODUK
// Lokasi di repo GitHub:  api/update-sold.js
// ----------------------------------------------------------------------------
// Vercel Serverless Function.
// Mengubah /products/{productId}/sold_count di Firebase Realtime Database
// UNTUK SATU PRODUK SAJA — produk lain sama sekali tidak tersentuh, karena
// path yang ditulis selalu spesifik ke productId yang dikirim admin.html.
//
// AUTH: PIN dihapus total. Sekarang memverifikasi Firebase ID Token milik
// akun Google yang login di admin.html (identik dengan api/save-promo.js).
//
// Body JSON yang diterima (idToken WAJIB):
//   Tombol (+1)      : { idToken, productId, mode: 'increment' }
//   Input manual     : { idToken, productId, mode: 'set', value: 123 }
//
// Increment memakai Firebase Transaction, jadi aman walau admin klik (+1)
// dari 2 tab/device sekaligus (tidak akan ada angka yang "ketimpa" / hilang).
//
// Env yang dibutuhkan (SAMA PERSIS dengan api/save-promo.js):
//   ADMIN_EMAILS               = email admin, pisahkan koma kalau lebih dari 1
//   FIREBASE_DATABASE_URL      = https://PROJECT-default-rtdb.REGION.firebasedatabase.app
//   FIREBASE_SERVICE_ACCOUNT   = isi JSON service account (1 baris utuh)
// ============================================================================

const admin = require('firebase-admin');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// --- Inisialisasi Firebase Admin (sekali per instance serverless) ----------
function initFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  return admin;
}

// --- Verifikasi Firebase ID Token + cek status admin -----------------------
// (identik dengan verifyAdmin di api/save-promo.js — WAJIB SAMA)
async function verifyAdmin(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

    if (decoded.email && adminEmails.indexOf(decoded.email.toLowerCase()) !== -1) {
      return decoded;
    }

    const roleSnap = await admin.database().ref('users/' + decoded.uid + '/role').once('value');
    if (roleSnap.val() === 'admin') return decoded;

    return null;
  } catch (err) {
    return null;
  }
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

  const { FIREBASE_DATABASE_URL, FIREBASE_SERVICE_ACCOUNT } = process.env;
  if (!FIREBASE_DATABASE_URL || !FIREBASE_SERVICE_ACCOUNT) {
    return res.status(500).json({
      success: false,
      message: 'Environment Variables belum lengkap (FIREBASE_DATABASE_URL / FIREBASE_SERVICE_ACCOUNT).'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (e) {
    return badRequest(res, 'Body bukan JSON valid.');
  }

  initFirebaseAdmin();

  // Wajib: Firebase ID Token dari akun Google yang login di admin.html
  const decoded = await verifyAdmin(body.idToken);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Akses Ditolak: Akun ini bukan Administrator' });
  }

  const productId = String(body.productId || '').trim();
  if (!productId || !PRODUCT_ID_RE.test(productId)) {
    return badRequest(res, 'productId tidak valid.');
  }

  const mode = String(body.mode || '');
  if (mode !== 'increment' && mode !== 'set') {
    return badRequest(res, 'mode harus "increment" atau "set".');
  }

  const db = admin.database();
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
