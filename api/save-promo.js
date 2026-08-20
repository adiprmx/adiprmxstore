// ============================================================================
// ADIP RMX — API: SIMPAN PROMO
// Lokasi di repo GitHub:  api/save-promo.js
// ----------------------------------------------------------------------------
// Vercel Serverless Function.
// Menerima data promo dari admin.html lalu menyimpannya ke Firebase Realtime
// Database (node: /promo) memakai Firebase Admin SDK.
//
// AUTH: PIN dihapus total. Sekarang memverifikasi Firebase ID Token milik
// akun Google yang login di admin.html (lihat js/auth-engine.js + admin.js).
// Akun dianggap admin jika emailnya ada di ADMIN_EMAILS (env var) ATAU
// /users/{uid}/role di Realtime Database bernilai "admin".
//
// Body JSON yang diterima:
//   Simpan promo : { idToken, promo: { name, discount, start, end } }
//                  start & end = ISO string WIB, mis. "2026-08-20T10:00:00+07:00"
//   Hapus promo  : { idToken, clear: true }
//
// Env yang dibutuhkan (Vercel > Settings > Environment Variables):
//   ADMIN_EMAILS              = email admin, pisahkan koma kalau lebih dari 1
//                                contoh: adiprmx@gmail.com,partner@gmail.com
//   FIREBASE_DATABASE_URL     = https://PROJECT-default-rtdb.REGION.firebasedatabase.app
//   FIREBASE_SERVICE_ACCOUNT  = isi JSON service account (1 baris utuh)
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
// Mengembalikan decoded token (berisi uid, email) jika akun ini admin,
// atau null jika tidak (tanpa pernah membocorkan email admin ke caller).
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

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Pastikan env lengkap
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

  const db = admin.database();

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
