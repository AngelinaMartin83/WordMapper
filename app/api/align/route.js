import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ForcedAligner } from '@/lib/aligner';

export const runtime = 'nodejs';

function loadDict() {
  const dictPath = path.join(process.cwd(), 'server-data', 'beep_uk_ipa.json');
  const raw = fs.readFileSync(dictPath, 'utf8');
  return JSON.parse(raw);
}

export async function POST(req) {
  const auth = req.headers.get('authorization') || '';
  const token = process.env.AUTH_TOKEN || '';
  if (!token || auth !== `Bearer ${token}`) {
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
    const dict = loadDict();
    const aligner = new ForcedAligner();
    aligner.loadIpaDictionary(dict);

    const results = words.map((w) => {
      try {
        const r = aligner.alignWord(w, override);
        return { word: w, pairs: r.pairs, cost: r.cost, ipa: r.ipa };
      } catch (e) {
        return { word: w, error: String(e?.message || e) };
      }
    });

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
