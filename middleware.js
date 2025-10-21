// middleware.js (Edge Runtime) — Auto-issue signed httpOnly cookie on first visit
import { NextResponse } from 'next/server';
import { createSidCookie } from '@/lib/edgeAuth';

export const config = {
  // Apply to all paths except static assets (tweak if needed)
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};

export async function middleware(req) {
  const res = NextResponse.next();
  const secret = process.env.AUTH_TOKEN;
  if (!secret) return res; // server not configured; skip

  const cookie = req.cookies.get('sid');
  if (!cookie) {
    const set = await createSidCookie(secret);
    res.headers.append('Set-Cookie', set);
  }
  return res;
}
