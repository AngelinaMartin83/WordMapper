// Server-side ForcedAligner (纯JS)
export class ForcedAligner {
  constructor() {
    this.g2p = {};
    this.special = {
      'one':'wʌn','once':'wʌns','debris':'deɪbriː',
      'rendezvous':'rɒndeɪvuː','colonel':'kɜːnəl','choir':'kwaɪə'
    };
    this.cost_match = 0;
    this.cost_del   = 1;
    this.cost_ins   = 1000;
    this.cost_force = 10;
    this.ipaDict = {};
    this._initG2P();
  }

  loadIpaDictionary(obj){
    const norm = {};
    for (const k of Object.keys(obj || {})) {
      const key = String(k).trim().toLowerCase();
      let val = obj[k];
      // 支持 ["ipa1","ipa2"] 结构；只取第一项
      if (Array.isArray(val)) val = val[0];
      if (val == null) continue;
      let s = String(val).trim();
      s = s.replace(/^\s*\/|\/\s*$/g, ''); // 去掉 /.../
      norm[key] = [s];
    }
    if (Object.keys(norm).length === 0) {
      throw new Error('解析到 0 个词条。');
    }
    this.ipaDict = norm;
  }

  splitIPA(ipa){
    const phonemeList = [
      'ɪə','eə','ʊə','eɪ','aɪ','ɔɪ','aʊ','əʊ',
      'iː','ɜː','ɑː','ɔː','uː','tʃ','dʒ','ɪ','ʊ','e','ə','æ','ʌ','ɒ',
      'p','b','t','d','k','ɡ','m','n','ŋ','f','v','θ','ð','s','z','ʃ','ʒ','h','l','r','j','w','tr','ts','dz','dr'
    ].sort((a,b)=>b.length-a.length);
    const clean=(ipa||'').replace(/[ˈˌ]/g,'');
    const out=[]; let i=0;
    while(i<clean.length){
      let ok=false;
      for(const ph of phonemeList){
        if(clean.startsWith(ph,i)){ out.push(ph); i+=ph.length; ok=true; break; }
      }
      if(!ok){
        if(clean[i]==='ː'){ if(out.length) out[out.length-1]+='ː'; else out.push('ː'); }
        else { out.push(clean[i]); }
        i++;
      }
    }
    return out;
  }

  getPhonemes(word){
    const w=(word||'').toLowerCase();
    const arr=this.ipaDict[w];
    if(!arr||!arr.length) return null;
    return this.splitIPA(arr[0]);
  }

  isValid(g,p){ return this.g2p[g] && this.g2p[g].has(p); }

  alignWord(word, overrideIpaStr=null){
    const phonemes = overrideIpaStr ? this.splitIPA(overrideIpaStr) : this.getPhonemes(word);
    if(!phonemes) throw new Error(`找不到 “${word}” 的音标，或未加载字典`);
    const result = this.align(word, phonemes);
    return { ...result, ipa: phonemes };
  }

  align(word, phonemes){
    const w=word.toLowerCase(); const phStr=phonemes.join('');
    if(this.special[w]){ const cp=this.special[w]; if(phStr===cp) return {pairs:[[word,cp,'match']], cost:0}; }
    const specialKeys=Object.keys(this.special).sort((a,b)=>b.length-a.length);
    for(const sub of specialKeys){
      if(w.includes(sub)){
        const cp=this.special[sub];
        if(phStr.includes(cp)){ return this._alignWithSpecialSubstring(w, phonemes, sub, cp); }
      }
    }
    return this._alignDP(w, phonemes);
  }

  _alignWithSpecialSubstring(word, phonemes, sub, cp){
    const start=word.indexOf(sub); if(start<0) return this._alignDP(word, phonemes);
    const end=start+sub.length; const phStr=phonemes.join('');
    const pStart=phStr.indexOf(cp); if(pStart<0) return this._alignDP(word, phonemes);
    const pEnd=pStart+cp.length;
    const prefixW=word.slice(0,start), suffixW=word.slice(end);
    const prefixP=this.splitIPA(phStr.slice(0,pStart)); const suffixP=this.splitIPA(phStr.slice(pEnd));
    const pre=this._alignDP(prefixW, prefixP); const suf=this._alignDP(suffixW, suffixP);
    const pairs=[...pre.pairs, [sub, cp, 'match'], ...suf.pairs];
    return {pairs, cost: pre.cost + suf.cost};
  }

  _alignDP(word, phonemes){
    const letters=[...word]; const G=letters.length, P=phonemes.length; const INF=1e15;
    const dp=Array.from({length:G+1},()=>Array(P+1).fill(INF));
    const pri=Array.from({length:G+1},()=>Array(P+1).fill(99));
    const bp=Array.from({length:G+1},()=>Array(P+1).fill(null));
    const PR={match:1, del:2, force_match:3, ins:4};
    const tryUpdate=(i,j,c,rec,pr)=>{ if(c<dp[i][j] || (c===dp[i][j] && pr<pri[i][j])){ dp[i][j]=c; pri[i][j]=pr; bp[i][j]=rec; } };
    dp[0][0]=0; pri[0][0]=0;

    for(let i=1;i<=G;i++) tryUpdate(i,0,dp[i-1][0]+this.cost_del,['del',letters[i-1],'（沉默）',i-1,0],PR.del);
    for(let j=1;j<=P;j++) tryUpdate(0,j,dp[0][j-1]+this.cost_ins,['ins','',phonemes[j-1],0,j-1],PR.ins);

    for(let i=1;i<=G;i++){
      for(let j=1;j<=P;j++){
        tryUpdate(i,j,dp[i-1][j]+this.cost_del,['del',letters[i-1],'（沉默）',i-1,j],PR.del);
        tryUpdate(i,j,dp[i][j-1]+this.cost_ins,['ins','',phonemes[j-1],i,j-1],PR.ins);

        const maxG=Math.min(6,i);
        for(let gl=maxG; gl>=1; gl--){
          const gi=i-gl; const gCand=letters.slice(gi,i).join('');
          if(this.g2p[gCand]){
            for(const pStr of this.g2p[gCand]){
              const pSeq=this.splitIPA(pStr); const pl=pSeq.length;
              if(j>=pl && this._eqArr(phonemes.slice(j-pl,j),pSeq)){
                const cost=dp[gi][j-pl]+this.cost_match;
                tryUpdate(i,j,cost,['match',gCand,pStr,gi,j-pl],PR.match);
              }
            }
          }
        }
        for(let gl=Math.min(6,i); gl>=1; gl--){
          const gi=i-gl; const gCand=letters.slice(gi,i).join('');
          if(j>=1){
            const fm=dp[gi][j-1]+this.cost_force;
            tryUpdate(i,j,fm,['force_match',gCand,phonemes[j-1],gi,j-1],PR.force_match);
          }
        }
      }
    }

    if(dp[G][P]>=INF/2) throw new Error(`无法对齐: '${word}'`);

    const pairs=[]; let i=G,j=P;
    while(i>0||j>0){
      const rec=bp[i][j]; if(!rec) break;
      const [op,g,p,pi,pj]=rec;
      if(['match','force_match','del','ins'].includes(op)) pairs.push([g,p,op]);
      i=pi; j=pj;
    }
    pairs.reverse();
    return {pairs, cost:dp[G][P]};
  }

  _eqArr(a,b){ if(a.length!==b.length) return false; for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return false; } return true; }
  _add(g,list){ if(!this.g2p[g]) this.g2p[g]=new Set(); (Array.isArray(list)?list:[list]).forEach(x=>this.g2p[g].add(x)); }

  _initG2P(){
    const add = (g, p) => this._add(g, p);
    add('a', ['eɪ','ɑː','ɔː','e','ə','æ','ɒ']);
    add('b', ['b']);
    add('c', ['k','s','ʃ']);
    add('d', ['d','dʒ']);
    add('e', ['iː','ɪ','e','ə','ɪə','（沉默）']);
    add('f', ['f']);
    add('g', ['dʒ','ɡ']);
    add('h', ['h','（沉默）']);
    add('i', ['aɪ','iː','ɪ','ə']);
    add('j', ['dʒ']);
    add('k', ['k','（沉默）']);
    add('l', ['l']);
    add('m', ['m']);
    add('n', ['n','ŋ']);
    add('o', ['əʊ','ɔː','ʊ','ə','ʌ','ɒ']);
    add('p', ['p']);
    add('q', ['k']);
    add('r', ['r','ər','（沉默）']);
    add('s', ['s','z','ʃ','ʒ']);
    add('t', ['t']);
    add('u', ['uː','ɪ','ʊ','ə','ʌ','juː','jʊ','jʊə','ʒʊə']);
    add('v', ['v']);
    add('w', ['w','（沉默）']);
    add('x', ['ks','z','ɡz','eks','kʃ']);
    add('y', ['aɪ','iː','ɪ','j']);
    add('z', ['z']);
    add('ai', ['eɪ']); add('al', ['əl']); add('ar', ['ɑː','ə']); add('au', ['ɔː']); add('aw', ['ɔː']); add('ay', ['eɪ']);
    add('bt', ['t']); add('ci', ['ʃ']); add('ch', ['tʃ','k','ʃ']); add('ck', ['k']); add('dg', ['dʒ']);
    add('ea', ['eɪ','iː','e']); add('ed', ['ɪd','t','d']); add('ee', ['iː']); add('ei', ['eɪ','aɪ','iː']);
    add('er', ['ɜː','ə']); add('ew', ['uː','juː']); add('ey', ['eɪ','iː']);
    add('gh', ['f','g','（沉默）']); add('gn', ['n']); add('ie', ['aɪ','iː']); add('ir', ['ɜː']);
    add('kn', ['n']); add('le', ['əl']); add('lf', ['f']); add('lk', ['k']); add('mb', ['m']); add('mn', ['m']);
    add('ng', ['ŋ','ŋɡ']); add('oa', ['əʊ']); add('oi', ['ɔɪ']); add('oo', ['uː','ʊ','ɔː']); add('or', ['ɜː','ɔː','ə']);
    add('ou', ['aʊ','əʊ','ɔː','uː','ʌ']); add('ow', ['aʊ','əʊ']); add('oy', ['ɔɪ']); add('ph', ['f']); add('pn', ['n']); add('ps', ['s']); add('pt', ['t']);
    add('qu', ['kw']); add('re', ['rɪ','riː']); add('rh', ['r']); add('sc', ['s','sk']); add('sh', ['ʃ']); add('ss', ['s','ʃ']);
    add('th', ['θ','ð']); add('ue', ['uː','juː']); add('ur', ['ɜː']); add('wh', ['h','w']); add('wr', ['r']);
    add('air', ['eə']); add('are', ['eə']); add('dge', ['dʒ']); add('ear', ['ɪə','eə','ɜː']); add('ere', ['ɪə','eə']);
    add('gue', ['ɡ']); add('igh', ['aɪ']); add('ing', ['ɪŋ']); add('our', ['ʊə','ɔː','ə']); add('ous', ['əs']);
    add('que', ['k']); add('sch', ['sk','ʃ']); add('tch', ['tʃ']); add('ure', ['ʊə','jʊə']); add('augh', ['ɑːf','ɔː']);
    add('eigh', ['eɪ']); add('ough', ['aʊ','əʊ','ɔː','uː','ʌf','ɒf']); add('sion', ['ʃən','ʒən']); add('sure', ['ʃə','ʒə']);
    add('tial', ['ʃəl']); add('tion', ['ʃn']); add('ture', ['tʃə']); add('cious', ['ʃəs']); add('tious', ['ʃəs']);
    add('ism', ['ɪzəm']); add('age', ['ɪdʒ']); add('oor', ['ɔː']); add('gu', ['ɡw']); add('asm', ['æzəm']);
    add('tr', ['tr']); add('ts', ['ts']); add('dr', ['dr']); add('ds', ['dz']);
    add('bb', ['b']); add('cc', ['k']); add('dd', ['d']); add('ff', ['f']); add('gg', ['g']);
    add('kk', ['k']); add('ll', ['l']); add('mm', ['m']); add('nn', ['n']); add('pp', ['p']); add('rr', ['r']); add('ss', ['s']); add('tt', ['t']); add('zz', ['z']);
  }
}
