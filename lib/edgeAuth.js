// lib/edgeAuth.js — HMAC (SHA-256) implemented via Web Crypto for Edge runtime
export async function hmacHex(input, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(input || '')));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createSidCookie(secret) {
  const uid = crypto.randomUUID();
  const ts  = Date.now().toString();
  const raw = `${uid}.${ts}`;
  const sig = await hmacHex(raw, secret);
  const val = `${raw}.${sig}`;
  // httpOnly cookie for 7 days; adjust as needed
  return `sid=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*7}`;
}
