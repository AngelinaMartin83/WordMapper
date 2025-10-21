// lib/auth.js
import crypto from 'node:crypto';

const COOKIE_NAME = 'sid';
const ALG = 'sha256';

/**
 * Create a signed cookie value "uid.timestamp.signature"
 */
export function createSessionCookie(uid, secret, maxAgeSec = 60*60*24*7) {
  const ts = Date.now().toString();
  const base = `${uid}.${ts}`;
  const sig = sign(base, secret);
  const value = `${base}.${sig}`;
  const cookie = [
    `${COOKIE_NAME}=${value}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSec}`
  ].join('; ');
  return cookie;
}

export function readSessionFromRequest(req) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  const value = m[1];
  const parts = value.split('.'); // [uid, ts, sig]
  if (parts.length !== 3) return null;
  return { uid: parts[0], ts: parts[1], sig: parts[2], raw: `${parts[0]}.${parts[1]}` };
}

export function verifySession(req, secret) {
  const sess = readSessionFromRequest(req);
  if (!sess) return null;
  const expected = sign(sess.raw, secret);
  if (!timingSafeEqual(expected, sess.sig)) return null;
  return { uid: sess.uid };
}

function sign(input, secret) {
  return crypto.createHmac(ALG, String(secret||''))
    .update(String(input||''))
    .digest('hex');
}

function timingSafeEqual(a, b) {
  const A = Buffer.from(String(a||''));
  const B = Buffer.from(String(b||''));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}
