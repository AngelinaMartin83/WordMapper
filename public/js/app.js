// 简单 URL 参数控制：?showCost=1 开启显示
const params = new URLSearchParams(window.location.search);
window.__SHOW_COST__ = params.get('showCost') === '1';

// 如果想用 CSS 控制隐藏/显示，可以给 body 加个类名
if (window.__SHOW_COST__) {
  document.body.classList.add('show-cost');
}
// 前端逻辑：界面与元素ID保持不变，调用 /api/align 获取结果
const $ = (id) => document.getElementById(id);
const out = $('out');
const wordsEl = $('words');
const ipaInput = $('ipaInput');
const dictInfo = $('dictInfo');
const dictError = $('dictError');
// ==== 音标音频播放配置 ====

// 音频文件基础路径（放在 public/audio/phonemes/ 目录下）
const PHONEME_AUDIO_BASE = '/audio/phonemes/';
const PHONEME_AUDIO_EXT = '.mp3';

// 从你提供的 IPA 对照表提取出来的映射：音标 -> 文件名（不含路径和后缀）
const PHONEME_AUDIO_MAP = {
  'iː': '01_ee_see_words',
  'i': '01_ee_see_words',
  'ɑː': '02_a_car_words',
  'ɔː': '03_o_ball_words',
  'uː': '04_oo_food_words',
  'ɜː': '05_ir_bird_words',
  'ɪ':  '06_i_ship_words',
  'ʊ':  '07_oo_book_words',
  'e':  '08_e_bed_words',
  'æ':  '09_a_cat_words',
  'ʌ':  '10_u_cup_words',
  'ɒ':  '11_o_dog_words',
  'ə':  '12_e_pencil_words',
  'eɪ': '13_ei_rain_words',
  'aɪ': '14_ai_kite_words',
  'ɔɪ': '15_oi_boy_words',
  'aʊ': '16_au_house_words',
  'əʊ': '17_o_snow_words',
  'ɪə': '18_ear_ear_words',
  'eə': '19_air_chair_words',
  'ʊə': '20_our_tour_words',
  'p':  '21_p_pig_words',
  'b':  '22_b_bag_words',
  't':  '23_t_ten_words',
  'd':  '24_d_door_words',
  'k':  '25_k_cat_words',
  'g':  '26_g_game_words',
  'f':  '27_f_fish_words',
  'v':  '28_v_five_words',
  'θ':  '29_th_think_words',
  'ð':  '30_th_father_words',
  's':  '31_s_sun_words',
  'z':  '32_z_zoo_words',
  'ʃ':  '33_sh_machine_words',
  'ʒ':  '34_sh_measure_words',
  'tʃ': '35_ch_chair_words',
  'dʒ': '36_ch_bridge_words',
  'm':  '37_m_monkey_words',
  'n':  '38_n_nose_words',
  'ŋ':  '39_ng_sing_words',
  'h':  '40_h_hat_words',
  'l':  '41_l_bell_words',
  'r':  '42_r_red_words',
  'j':  '43_j_yes_words',
  'w':  '44_w_what_words',
  'dr': '45_dr_drink_words',
  'dz': '46_dz_kids_words',
  'tr': '47_tr_tree_words',
  'ts': '48_ts_fruits_words',
};

// 复用一个 Audio 实例，避免多音频叠加
let phonemeAudio = null;

function getPhonemeAudioUrl(phoneme) {
  const key = String(phoneme || '').trim();
  if (!key) return null;
  const fileKey = PHONEME_AUDIO_MAP[key];
  if (!fileKey) return null;
  return PHONEME_AUDIO_BASE + fileKey + PHONEME_AUDIO_EXT;
}

function playPhoneme(phoneme) {
  const url = getPhonemeAudioUrl(phoneme);
  if (!url) return;
  try {
    if (!phonemeAudio) phonemeAudio = new Audio();
    phonemeAudio.src = url;
    phonemeAudio.currentTime = 0;
    phonemeAudio.play().catch(() => {
      console.warn('无法播放音标音频：', phoneme, url);
    });
  } catch (e) {
    console.warn('播放音频出错：', e);
  }
}
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
  if (!dictInfo) return; 
  dictInfo.innerHTML='';
  const a=document.createElement('span'); a.className='tag'; a.textContent=`词条：后端私有字典`; dictInfo.appendChild(a);
  const b=document.createElement('span'); b.className='tag'; b.textContent=`来源：server-data/beep_uk_ipa.json`; dictInfo.appendChild(b);
}
showDictInfoServer();
// 在结果区域上做事件代理：点击音标块播放音频
if (out) {
  out.addEventListener('click', (e) => {
    // 找到最近的 .chip-p.clickable 元素
    const chip = e.target.closest('.chip-p.clickable');
    if (!chip) return;
    const phoneme = chip.dataset.phoneme;
    if (!phoneme) return;
    playPhoneme(phoneme);
  });
}
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
    card(word, r.ipaDisplay, {pairs:r.pairs, cost:r.cost}, null);
  }catch(err){
    card(word, null, null, String(err));
  }
}

function card(word, ipaDisplay, res, error){
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
                 (res && window.__SHOW_COST__ ? `<span class="tag cost">总代价 cost = ${res.cost}</span>` : '');
  pad.appendChild(head);

  if (error){
    pad.appendChild(p(`<span class="muted">${esc(error)}</span>`));
    outEl.appendChild(box);
    return;
  }

  const prettyIPA = typeof ipaDisplay === 'string' ? ipaDisplay : '';
  pad.appendChild(
    p(`<div class="muted" style="font-size:18px">音标：
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

    if (p === '（沉默）' || op === 'del' || !p) {
      // 沉默/删除：不显示音标，也不绑定音频
      chip.innerHTML = '';
    } else {
      // 正常有音标：展示并挂上 data-phoneme，供点击播放
      chip.innerHTML = `<span class="ipa">/${esc(p)}/</span>`;
      chip.dataset.phoneme = p;
      chip.classList.add('clickable');
    }

    col.appendChild(chip);
    grid.appendChild(col);
  }

  pad.appendChild(grid);
  outEl.appendChild(box);
}
