// 前端逻辑：界面与元素ID保持不变，调用 /api/align 获取结果
const $ = (id) => document.getElementById(id);
const out = $('out');
const wordsEl = $('words');
const ipaInput = $('ipaInput');
const dictInfo = $('dictInfo');
const dictError = $('dictError');

function esc(s){
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, ch => map[ch]);
}
function p(html){ const el=document.createElement('p'); el.innerHTML=html; return el; }

$('runBtn')?.addEventListener('click', runAll);
$('clearBtn')?.addEventListener('click', ()=>{ out.innerHTML=''; });
$('sampleBtn')?.addEventListener('click', ()=>{ dictError.textContent='生产环境使用服务器端字典；当前按钮不再加载本地示例。'; });
$('dictFile')?.addEventListener('change', ()=>{ dictError.textContent='生产环境使用服务器端字典；如需自定义字典，请联系管理员在后端更新。'; });

wordsEl?.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); runAll(); }
});

function showDictInfoServer(){
  dictInfo.innerHTML='';
  const a=document.createElement('span'); a.className='tag'; a.textContent=`词条：后端私有字典`; dictInfo.appendChild(a);
  const b=document.createElement('span'); b.className='tag'; b.textContent=`来源：server-data/beep_uk_ipa.json`; dictInfo.appendChild(b);
}
showDictInfoServer();

async function runAll(){
  const lines=(wordsEl?.value||'').split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length){ alert('请先输入至少一个单词'); return; }
  out.innerHTML='';
  for(const w of lines){ await runOne(w); }
}

function prettifyWordIPAWithOptionalR(word, phonemes){
  if (!phonemes || !phonemes.length) return '';
  const lower = (word || '').toLowerCase().trim();
  const endsWithR = /(r|re)$/.test(lower);
  const last = phonemes[phonemes.length - 1];
  const explicitFinalR = (last === 'r');
  if (endsWithR && !explicitFinalR) {
    const out = phonemes.slice();
    out[out.length - 1] = out[out.length - 1] + '(r)';
    return out.join(' ');
  }
  return phonemes.join(' ');
}

async function runOne(word){
  try{
    const headers = { 'Content-Type':'application/json' };
    if (window.AUTH_TOKEN) headers['Authorization'] = 'Bearer ' + window.AUTH_TOKEN;

    const resp = await fetch('/api/align', {
      method:'POST',
      credentials: 'include', // 关键：携带/发送 httpOnly Cookie
      headers,
      body: JSON.stringify({ words:[word], ipaOverride: (ipaInput?.value||'').trim() || null })
    });
    if(!resp.ok){
      const text = await resp.text();
      card(word, null, null, 'API 错误：' + resp.status + ' ' + text);
      return;
    }
    const data = await resp.json();
    if(!data?.ok || !Array.isArray(data.results) || !data.results.length){
      card(word, null, null, '无结果');
      return;
    }
    const r = data.results[0];
    if(r.error){ card(word, null, null, r.error); return; }
    card(word, r.ipa, {pairs:r.pairs, cost:r.cost}, null);
  }catch(err){
    card(word, null, null, String(err));
  }
}

function card(word, phonemes, res, error){
  const outEl = document.getElementById('out');
  const box = document.createElement('div'); 
  box.className = 'card'; 
  box.style.marginTop = '12px';

  const pad = document.createElement('div'); 
  pad.className = 'pane'; 
  box.appendChild(pad);

  const head = document.createElement('div'); 
  head.style.display = 'flex'; 
  head.style.justifyContent = 'space-between'; 
  head.style.alignItems = 'center';
  head.innerHTML = `<div style="font-size:28px;font-weight:900">${esc(word)}</div>` +
                   (res ? `<span class="tag cost">总代价 cost = ${res.cost}</span>` : '');
  pad.appendChild(head);

  if (error){
    pad.appendChild(p(`<span class="muted">${esc(error)}</span>`));
    outEl.appendChild(box);
    return;
  }

  const prettyIPA = prettifyWordIPAWithOptionalR(word, phonemes);
  pad.appendChild(
    p(`<div class="muted" style="font-size:18px">音位：
         <span class="mono" style="font-size:22px">/${esc(prettyIPA)}/</span>
       </div>`)
  );

  const grid = document.createElement('div');
  grid.className = 'pairs-grid';

  for (const row of res.pairs) {
    const [g, p, op] = row.length === 3 ? row : [row[0], row[1], null];

    const col = document.createElement('div');
    col.className = 'pair-col';

    const gBox = document.createElement('div');
    gBox.className = 'box-g';
    gBox.textContent = g || '∅';
    if (op === 'del') gBox.classList.add('muted');
    if (op === 'ins') gBox.classList.add('insert');
    col.appendChild(gBox);

    const chip = document.createElement('div');
    chip.className = 'chip-p';

    if (op === 'del') chip.classList.add('silent');
    else if (op === 'ins') chip.classList.add('insert');
    else if (op === 'match') chip.classList.add('ok');
    else if (op === 'force_match') chip.classList.add('force');

    chip.innerHTML = (p === '（沉默）' || op === 'del')
      ? 'silent'
      : `<span class="ipa">/${esc(p)}/</span>`;

    col.appendChild(chip);
    grid.appendChild(col);
  }

  pad.appendChild(grid);
  outEl.appendChild(box);
}
