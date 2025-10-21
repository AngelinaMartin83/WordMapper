// app/api/login/route.js
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/login
 * body: { token: string }  // 必须与 AUTH_TOKEN 一致
 * 返回：Set-Cookie: sid=... (httpOnly)
 */
export async function POST(req) {
  const body = await req.json().catch(()=>null);
  const token = String(body?.token||'');
  const secret = process.env.AUTH_TOKEN || '';

  if (!secret) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }
  if (token !== secret) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const cookie = createSessionCookie('user', secret);
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookie);
  return res;
}
