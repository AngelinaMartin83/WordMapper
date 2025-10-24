// app/api/align/route.js — prefers httpOnly cookie auth; keeps Bearer fallback
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ForcedAligner } from '@/lib/aligner';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';

function loadDict() {
  const dictPath = path.join(process.cwd(), 'server-data', 'beep_uk_ipa.json');
  const raw = fs.readFileSync(dictPath, 'utf8');
  return JSON.parse(raw);
}

function isAuthorized(req) {
  const serverToken = process.env.AUTH_TOKEN || '';
  // 1) Cookie session (httpOnly) via middleware
  const sess = verifySession(req, serverToken);
  if (sess) return true;
  // 2) Fallback: Bearer token (for your own debugging if needed)
  const auth = req.headers.get('authorization') || '';
  if (serverToken && auth === `Bearer ${serverToken}`) return true;
  return false;
}

export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const words = Array.isArray(body?.words) ? body.words : [];
  const override = typeof body?.ipaOverride === 'string' ? body.ipaOverride.trim() : null;
  if (!words.length) {
    return NextResponse.json({ error: 'No words' }, { status: 400 });
  }

  try {
    const dict = loadDict(); // server-side only
    const aligner = new ForcedAligner();
    aligner.loadIpaDictionary(dict);

    const results = words.map((w) => {
      try {
        const r = aligner.alignWord(w, override);
        return {
          word: w,
          pairs: r.pairs,
          cost: r.cost,
          ipaAligned: r.ipaAligned, // 内部使用（必要时调试）
          ipaDisplay: r.ipaDisplay   // 前端展示用（完整原始 IPA）
        };
      } catch (e) {
        return { word: w, error: String(e?.message || e) };
      }
    });

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
