// ============================================================================
// ADIP RMX — API: SIMPAN PROMO
// Lokasi di repo GitHub:  api/save-promo.js
// ----------------------------------------------------------------------------
// Vercel Serverless Function.
// Menerima data promo dari admin.html lalu menyimpannya ke Firebase Realtime
// Database (node: /promo) memakai Firebase Admin SDK.
//
// Body JSON yang diterima:
//   Simpan promo : { token, promo: { name, discount, start, end } }
//                  start & end = ISO string WIB, mis. "2026-08-20T10:00:00+07:00"
//   Hapus promo  : { token, clear: true }
//
// Env yang dibutuhkan (Vercel > Settings > Environment Variables):
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

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Pastikan env lengkap
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

  // Wajib: token sesi admin dari api/login.js
  if (!verifyToken(body.token, ADMIN_PIN)) {
    return res.status(401).json({ success: false, message: 'Token tidak valid / kedaluwarsa. Silakan login ulang.' });
  }

  const db = getDb();

  // ---- Mode hapus promo (harga langsung kembali normal) ----
  if (body.clear === true) {
    await db.ref('promo').remove();
    return res.status(200).json({ success: true, message: 'Promo dinonaktifkan. Harga kembali normal.' });
  }

  // ---- Mode simpan promo ----
  const promo = body.promo || {};
  const name = String(promo.name || '').trim();
  const discount = Number(promo.discount);
  const start = String(promo.start || '');
  const end = String(promo.end || '');

  if (!name) return badRequest(res, 'Nama promo wajib diisi.');
  if (!Number.isInteger(discount) || discount < 1 || discount > 99) {
    return badRequest(res, 'Diskon harus bilangan bulat 1–99 (%).');
  }
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (isNaN(startMs) || isNaN(endMs)) {
    return badRequest(res, 'Format tanggal/jam mulai & selesai tidak valid.');
  }
  if (endMs <= startMs) {
    return badRequest(res, 'Waktu selesai harus lebih besar dari waktu mulai.');
  }

  const payload = {
    name,
    discount,
    start,               // ISO +07:00 (WIB) — dibandingkan dgn jam server
    end,
    active: true,
    updatedAt: admin.database.ServerValue.TIMESTAMP
  };

  await db.ref('promo').set(payload);

  return res.status(200).json({
    success: true,
    message: `Promo "${name}" (${discount}%) tersimpan.`,
    promo: payload
  });
};
