const SILENT = '（沉默）';

const COMMON_CONSONANTS = [
  'p', 'b', 't', 'd', 'k', 'ɡ', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ',
  'h', 'tʃ', 'dʒ', 'm', 'n', 'ŋ', 'l', 'r', 'j', 'w'
];

const UK_VOWELS = [
  'iː', 'ɪ', 'e', 'æ', 'ɑː', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ʌ', 'ɜː', 'ə',
  'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'ɪə', 'eə', 'ʊə'
];

const COMMON_G2P = {
  b: ['b'], c: ['k', 's', 'ʃ'], d: ['d', 'dʒ'], f: ['f'], h: ['h', SILENT],
  j: ['dʒ'], k: ['k', SILENT], l: ['l'], m: ['m'], n: ['n', 'ŋ'],
  p: ['p'], q: ['k'], s: ['s', 'z', 'ʃ', 'ʒ'], t: ['t', 'tʃ'], v: ['v'],
  w: ['w', SILENT], x: ['ks', 'z', 'ɡz', 'kʃ'], z: ['z'],
  bt: ['t'], ci: ['ʃ'], ch: ['tʃ', 'k', 'ʃ'], ck: ['k'], dg: ['dʒ'],
  ed: ['ɪd', 't', 'd'], gh: ['f', 'g', SILENT], gn: ['n'], kn: ['n'],
  lf: ['f'], lk: ['k'], mb: ['m'], mn: ['m'], ng: ['ŋ'], ph: ['f'],
  pn: ['n'], ps: ['s'], pt: ['t'], qu: ['kw'], rh: ['r'], sc: ['s', 'sk'],
  sh: ['ʃ'], ss: ['s', 'ʃ'], th: ['θ', 'ð'], wh: ['h', 'w'], wr: ['r'],
  dge: ['dʒ'], igh: ['aɪ'], ing: ['ɪŋ'], ous: ['əs'], que: ['k'],
  sch: ['sk', 'ʃ'], tch: ['tʃ'], eigh: ['eɪ'], sion: ['ʃən', 'ʒən'],
  sure: ['ʃə', 'ʒə'], tial: ['ʃəl'], tion: ['ʃn', 'ʃən'], ture: ['tʃə'],
  cious: ['ʃəs'], tious: ['ʃəs'], ism: ['ɪzəm'], age: ['ɪdʒ'],
  asm: ['æzəm'], sm: ['zəm'], ysm: ['ɪzəm', 'zəm'], tr: ['tr'], ts: ['ts'],
  dr: ['dr'], ds: ['dz'], bb: ['b'], cc: ['k'], dd: ['d'], ff: ['f'],
  kk: ['k'], ll: ['l'], mm: ['m'], nn: ['n'], pp: ['p'], rr: ['r'],
  tt: ['t'], zz: ['z']
};

function mergeMappings(base, overrides) {
  const output = {};
  for (const [key, values] of Object.entries(base)) output[key] = [...values];
  for (const [key, values] of Object.entries(overrides)) output[key] = [...values];
  return output;
}

const g2p = mergeMappings(COMMON_G2P, {
  a: ['eɪ', 'ɑː', 'ɔː', 'e', 'ə', 'æ', 'ɒ'],
  b: ['b', 'biː'], c: ['k', 's', 'ʃ', 'siː'], d: ['d', 'dʒ', 'diː'],
  e: ['iː', 'i', 'ɪ', 'e', 'ə', 'ɪə', SILENT], f: ['f', 'ef'],
  g: ['dʒ', 'ɡ', 'dʒiː'], h: ['h', 'eɪtʃ', SILENT],
  i: ['aɪ', 'iː', 'i', 'ɪ', 'ə'], j: ['dʒ', 'dʒeɪ'],
  k: ['k', 'keɪ', SILENT], l: ['l', 'el'], m: ['m', 'em'],
  n: ['n', 'ŋ', 'en'], o: ['əʊ', 'ɔː', 'uː', 'ʊ', 'ə', 'ʌ', 'ɒ'],
  p: ['p', 'piː'], q: ['k', 'kjuː'], r: ['r', 'ɑː', SILENT],
  s: ['s', 'z', 'ʃ', 'ʒ', 'es'], t: ['t', 'tʃ', 'tiː'],
  v: ['v', 'viː'], w: ['w', 'dʌbljuː', SILENT],
  u: ['uː', 'u', 'ɪ', 'ʊ', 'ə', 'ʊə', 'ʌ', 'juː', 'ju', 'jʊ', 'jʊə', 'jə', 'ʒʊə'],
  y: ['aɪ', 'iː', 'i', 'ɪ', 'j', 'waɪ'], z: ['z', 'zed'],
  ai: ['eɪ'], al: ['əl'], ar: ['ɑː', 'ə'], au: ['ɔː'], aw: ['ɔː'],
  ay: ['eɪ'], ea: ['eɪ', 'iː', 'e'], ee: ['iː'], ei: ['eɪ', 'aɪ', 'iː'],
  er: ['ɜː', 'ə'], ew: ['uː', 'juː'], ey: ['eɪ', 'i', 'iː'],
  ie: ['aɪ', 'iː'], ir: ['ɜː'], le: ['əl'], oa: ['əʊ', 'ɔː'],
  oi: ['ɔɪ'], oo: ['uː', 'ʊ', 'ɔː'], or: ['ɜː', 'ɔː', 'ə'],
  ou: ['aʊ', 'əʊ', 'ɔː', 'uː', 'u', 'ʌ', 'ə'], ow: ['aʊ', 'əʊ'],
  oy: ['ɔɪ'], tu: ['tʃə'], ue: ['uː', 'juː'], ur: ['ɜː'],
  air: ['eə'], are: ['eə'], ear: ['ɪə', 'eə', 'ɜː'], ere: ['ɪə', 'eə'],
  gue: ['ɡ'], our: ['ʊə', 'ɔː', 'ə'], ure: ['ʊə', 'jʊə'],
  augh: ['ɑːf', 'ɔː'], ough: ['aʊ', 'əʊ', 'ɔː', 'uː', 'ʌf', 'ɒf'],
  oor: ['ɔː'], gu: ['ɡw'], gg: ['ɡ'], x: ['ks', 'z', 'ɡz', 'eks', 'kʃ']
});

const tokenizerExtras = [
  'juː', 'ju', 'jʊ', 'jʊə', 'ʒʊə', 'əl', 'ɪd', 'ɪŋ', 'əs', 'ʃən', 'ʒən',
  'ʃə', 'ʒə', 'ʃəl', 'tʃə', 'ʃəs', 'ɪzəm', 'æzəm', 'ɪdʒ', 'tr', 'dr',
  'ts', 'ks', 'kw'
];

const IPA_CONSONANT_CHARS = 'pbtdkgɡfvθðszʃʒhmnŋlrjw';

function formatOptionalSchwaForDisplay(ipa) {
  const text = String(ipa || '');
  const end = '(?=$|[\\s/\\]\\}])';
  const implicitSchwa = new RegExp(`([${IPA_CONSONANT_CHARS}])([lmn])${end}`, 'gu');
  return text.replace(implicitSchwa, '$1(ə)$2');
}

export const UK_ACCENT_PROFILE = Object.freeze({
  id: 'uk',
  version: 'uk-v2',
  g2p: Object.freeze(g2p),
  tokenizerPhonemes: Object.freeze(
    [...new Set([...UK_VOWELS, ...COMMON_CONSONANTS, ...tokenizerExtras])]
      .sort((left, right) => right.length - left.length)
  ),
  specialPronunciations: Object.freeze({
    one: 'wʌn',
    once: 'wʌns',
    w: 'dʌbljuː',
    q: 'kjuː',
    debris: 'deɪbriː',
    rendezvous: 'rɒndeɪvuː',
    colonel: 'kɜːnəl',
    choir: 'kwaɪə'
  }),
  normalizeIpaForAlignment(ipa) {
    return formatOptionalSchwaForDisplay(ipa).replace(/\(ə\)/gu, '');
  }
});
