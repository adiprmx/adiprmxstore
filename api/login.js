// ============================================================================
// ADIP RMX — API: LOGIN ADMIN
// Lokasi di repo GitHub:  api/login.js
// ----------------------------------------------------------------------------
// Vercel Serverless Function.
// Memvalidasi PIN Admin yang dikirim dari admin.html terhadap Environment
// Variable ADMIN_PIN (diset di Dashboard Vercel, BUKAN di kode).
// Jika benar -> mengembalikan token HMAC (berlaku 2 jam) yang dipakai
// admin.html untuk mengakses api/save-promo.js.
//
// Env yang dibutuhkan (Vercel > Settings > Environment Variables):
//   ADMIN_PIN = pin rahasia Anda, contoh: 739184
// ============================================================================

const crypto = require('crypto');

// Umur token sesi admin: 2 jam
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function signToken(secret) {
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const ADMIN_PIN = process.env.ADMIN_PIN;
  if (!ADMIN_PIN) {
    return res.status(500).json({
      success: false,
      message: 'ADMIN_PIN belum diset di Environment Variables Vercel.'
    });
  }

  let pin;
  try {
    // Vercel otomatis parse JSON body; jaga-jaga jika berupa string
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    pin = String(body.pin || '');
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Body tidak valid.' });
  }

  // Perbandingan timing-safe agar PIN tidak bisa ditebak via timing attack
  const a = Buffer.from(pin);
  const b = Buffer.from(String(ADMIN_PIN));
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    return res.status(401).json({ success: false, message: 'PIN salah.' });
  }

  return res.status(200).json({
    success: true,
    token: signToken(ADMIN_PIN),
    expiresIn: TOKEN_TTL_MS / 1000
  });
};
