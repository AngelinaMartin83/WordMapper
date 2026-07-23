import { UK_ACCENT_PROFILE } from './ukAccentProfile.js';

// Server-side UK IPA aligner. Keep this in sync with the UK profile used by
// EnglishWordsLearning/index.html.
export class ForcedAligner {
  constructor(profile = UK_ACCENT_PROFILE) {
    this.cost_match = 0;
    this.cost_del = 1;
    this.cost_ins = 1000;
    this.cost_force = 10;
    this.transparent_split_penalty = 0.25;
    this.ipaDict = {};
    this.ipaDictRaw = {};
    this.ipaDictRawLower = {};
    this.setProfile(profile);
  }

  setProfile(profile) {
    if (!profile) throw new Error('ForcedAligner 需要 UK Accent Profile');
    this.profile = profile;
    this.g2p = {};
    this.special = { ...(profile.specialPronunciations || {}) };
    for (const [grapheme, sounds] of Object.entries(profile.g2p || {})) {
      this._add(grapheme, sounds);
    }
  }

  loadIpaDictionary(obj) {
    const norm = {};
    const raw = {};
    const rawLower = {};
    for (const key of Object.keys(obj || {})) {
      let value = obj[key];
      if (Array.isArray(value)) value = value[0];
      if (value == null) continue;
      const exactKey = String(key).trim();
      const normalizedKey = exactKey.toLowerCase();
      const ipa = String(value).trim().replace(/^\s*\/|\/\s*$/g, '');
      raw[exactKey] = ipa;
      // Exact spelling wins. This secondary index only supplies a
      // case-insensitive fallback for words without an exact entry.
      if (!(normalizedKey in rawLower)
        || exactKey === normalizedKey) rawLower[normalizedKey] = ipa;
      norm[normalizedKey] = [ipa];
    }
    if (!Object.keys(norm).length) throw new Error('解析到 0 个词条。');
    this.ipaDict = norm;
    this.ipaDictRaw = raw;
    this.ipaDictRawLower = rawLower;
  }

  sanitizeIPAForAlignment(ipaStr) {
    if (!ipaStr) return '';
    let value = this.profile.normalizeIpaForAlignment(String(ipaStr).replace(/\(r\)/gi, ''));
    value = value.replace(/[ˈˌ\.͡\/\[\]\(\)\{\}\s]/g, '');
    value = value.replace(/[ʰʷʲ˞ˀˁ̚˕˖˔˩˥˦˧˨]/g, '');
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC').trim();
  }

  splitIPA(ipa) {
    const clean = String(ipa || '').replace(/ɪəʊ/g, 'ɪ·əʊ');
    const out = [];
    let index = 0;
    while (index < clean.length) {
      if (clean[index] === '·') {
        index += 1;
        continue;
      }
      const phoneme = this.profile.tokenizerPhonemes.find(item => clean.startsWith(item, index));
      if (phoneme) {
        out.push(phoneme);
        index += phoneme.length;
      } else {
        if (clean[index] === 'ː' && out.length) out[out.length - 1] += 'ː';
        else out.push(clean[index]);
        index += 1;
      }
    }
    return out;
  }

  getPhonemes(word) {
    const exactKey = String(word || '').trim();
    const raw = this.ipaDictRaw[exactKey] || this.ipaDictRawLower[exactKey.toLowerCase()];
    return raw ? this.splitIPA(this.sanitizeIPAForAlignment(raw)) : null;
  }

  isValid(grapheme, phoneme) {
    return Boolean(this.g2p[grapheme]?.has(phoneme));
  }

  alignWord(word, overrideIpaStr = null) {
    const exactKey = String(word || '').trim();
    const key = exactKey.toLowerCase();
    const dictionaryIpa = this.ipaDictRaw[exactKey] || this.ipaDictRawLower[key] || '';
    const ipaDisplay = overrideIpaStr || dictionaryIpa;
    if (!ipaDisplay) throw new Error(`未在词典中找到单词 “${word}”`);
    const ipaText = this.sanitizeIPAForAlignment(ipaDisplay);
    const phonemes = this.splitIPA(ipaText);
    const result = this.align(key, ipaText);
    return { ...result, ipaAligned: phonemes, ipaDisplay };
  }

  align(word, ipaInput) {
    const normalizedWord = String(word || '').toLowerCase();
    const ipaText = Array.isArray(ipaInput) ? ipaInput.join('') : String(ipaInput || '');
    if (this.special[normalizedWord] === ipaText) {
      return { pairs: [[word, ipaText, 'match']], cost: 0 };
    }
    return this._alignDP(normalizedWord, ipaText);
  }

  _alignDP(word, ipaText) {
    const letters = [...word];
    const graphemeLength = letters.length;
    const target = String(ipaText || '');
    const ipaLength = target.length;
    const phonemeSpans = this._getPhonemeSpans(target);
    const infinity = 1e15;
    const epsilon = 1e-9;
    const dp = Array.from({ length: graphemeLength + 1 }, () => Array(ipaLength + 1).fill(infinity));
    const priority = Array.from({ length: graphemeLength + 1 }, () => Array(ipaLength + 1).fill(99));
    const preference = Array.from({ length: graphemeLength + 1 }, () => Array(ipaLength + 1).fill(-infinity));
    const backPointer = Array.from({ length: graphemeLength + 1 }, () => Array(ipaLength + 1).fill(null));
    const operationPriority = { match: 1, del: 2, force_match: 3, ins: 4 };
    const update = (i, j, cost, record, rank, preferScore = 0) => {
      if (cost < dp[i][j] - epsilon
        || (Math.abs(cost - dp[i][j]) <= epsilon
          && (rank < priority[i][j]
            || (rank === priority[i][j] && preferScore > preference[i][j])))) {
        dp[i][j] = cost;
        priority[i][j] = rank;
        preference[i][j] = preferScore;
        backPointer[i][j] = record;
      }
    };

    dp[0][0] = 0;
    priority[0][0] = 0;
    preference[0][0] = 0;

    for (let i = 0; i <= graphemeLength; i += 1) {
      for (let j = 0; j <= ipaLength; j += 1) {
        if (dp[i][j] >= infinity / 2) continue;
        if (i < graphemeLength) {
          if (this._isWordSeparator(letters[i])) {
            update(i + 1, j, dp[i][j], ['sep', letters[i], '（沉默）', i, j],
              operationPriority.del, preference[i][j]);
            continue;
          }
          update(i + 1, j, dp[i][j] + this.cost_del,
            ['del', letters[i], '（沉默）', i, j], operationPriority.del, preference[i][j]);
        }

        const nextSound = this._nextIpaUnit(target, j);
        if (nextSound) {
          update(i, j + nextSound.length, dp[i][j] + this.cost_ins,
            ['ins', '', nextSound, i, j], operationPriority.ins, preference[i][j]);
        }

        for (let length = Math.min(6, graphemeLength - i); length >= 1; length -= 1) {
          const nextI = i + length;
          const grapheme = letters.slice(i, nextI).join('');
          if (this._hasWordSeparator(grapheme) || !this.g2p[grapheme]) continue;
          for (const phonemeText of this.g2p[grapheme]) {
            if (phonemeText === '（沉默）') continue;
            if (!this._isContextualMappingAllowed(
              grapheme, phonemeText, i, nextI, graphemeLength, word
            )) continue;
            if (!target.startsWith(phonemeText, j)) continue;
            const phonemes = this.splitIPA(phonemeText);
            const splitPenalty = this._shouldPreferTransparentSplit(grapheme, phonemes)
              ? this.transparent_split_penalty : 0;
            const boundaryPenalty = this._getPhonemeBoundaryPenalty(
              j, j + phonemeText.length, phonemeSpans
            );
            const preferScore = preference[i][j]
              + this._getCompletePhonemePreference(j, j + phonemeText.length, phonemeSpans);
            update(nextI, j + phonemeText.length,
              dp[i][j] + this.cost_match + splitPenalty + boundaryPenalty,
              ['match', grapheme, phonemeText, i, j], operationPriority.match, preferScore);
          }
        }

        if (nextSound) {
          for (let length = Math.min(6, graphemeLength - i); length >= 1; length -= 1) {
            const nextI = i + length;
            const grapheme = letters.slice(i, nextI).join('');
            if (this._hasWordSeparator(grapheme)) continue;
            update(nextI, j + nextSound.length, dp[i][j] + this.cost_force,
              ['force_match', grapheme, nextSound, i, j],
              operationPriority.force_match, preference[i][j]);
          }
        }
      }
    }

    const pairs = [];
    let i = graphemeLength;
    let j = ipaLength;
    while (i > 0 || j > 0) {
      const record = backPointer[i][j];
      if (!record) break;
      const [operation, grapheme, phoneme, previousI, previousJ] = record;
      pairs.push([grapheme, phoneme, operation]);
      i = previousI;
      j = previousJ;
    }
    pairs.reverse();
    return { pairs, cost: dp[graphemeLength][ipaLength] };
  }

  _getPhonemeSpans(ipaText) {
    const clean = String(ipaText || '');
    const spans = [];
    let index = 0;
    while (index < clean.length) {
      if (clean.startsWith('ɪəʊ', index)) {
        spans.push({ phoneme: 'ɪ', start: index, end: index + 1 });
        spans.push({ phoneme: 'əʊ', start: index + 1, end: index + 3 });
        index += 3;
        continue;
      }
      const matched = this.profile.tokenizerPhonemes.find(item => clean.startsWith(item, index));
      if (matched) {
        spans.push({ phoneme: matched, start: index, end: index + matched.length });
        index += matched.length;
      } else {
        if (clean[index] === 'ː' && spans.length) {
          spans[spans.length - 1].phoneme += 'ː';
          spans[spans.length - 1].end = index + 1;
        } else {
          spans.push({ phoneme: clean[index], start: index, end: index + 1 });
        }
        index += 1;
      }
    }
    return spans;
  }

  _isPhonemeBoundary(index, spans) {
    return index === 0 || spans.some(span => span.start === index || span.end === index);
  }

  _getPhonemeBoundaryPenalty(start, end, spans) {
    return this._isPhonemeBoundary(start, spans) && this._isPhonemeBoundary(end, spans)
      ? 0 : 0.2;
  }

  _getCompletePhonemePreference(start, end, spans) {
    return spans.reduce((score, span) => (
      span.start >= start && span.end <= end ? score + span.phoneme.length : score
    ), 0);
  }

  _nextIpaUnit(ipaText, index) {
    if (index >= ipaText.length) return '';
    return this.splitIPA(ipaText.slice(index))[0] || ipaText[index] || '';
  }

  _isWordSeparator(char) {
    return char === '-' || /\s/.test(char || '');
  }

  _hasWordSeparator(text) {
    return /[-\s]/.test(String(text || ''));
  }

  _isContextualMappingAllowed(grapheme, phonemeText, start, end, wordLength, word = '') {
    if (grapheme === 'ed' && ['ɪd', 't', 'd'].includes(phonemeText)) return end === wordLength;
    if (['tr', 'dr'].includes(grapheme) && phonemeText === grapheme) {
      return this._isTeachingClusterAtSyllableOnset(start, word);
    }
    if (grapheme === 'ts' && phonemeText === 'ts') return end === wordLength;
    return true;
  }

  _isTeachingClusterAtSyllableOnset(start, word) {
    if (start === 0) return true;
    const whole = String(word || '').toLowerCase();
    const left = whole.slice(0, start + 1);
    const right = whole.slice(start + 1);
    return !(left.length >= 2 && right.length >= 2
      && this.ipaDictRawLower[left] && this.ipaDictRawLower[right]);
  }

  _shouldPreferTransparentSplit(grapheme, phonemes) {
    if (!grapheme || grapheme.length <= 1 || phonemes.length <= 1) return false;
    const teachingGroups = new Set([
      'al', 'le', 'ing', 'dge', 'tch', 'igh', 'eigh', 'augh', 'ough',
      'air', 'are', 'ear', 'ere', 'our', 'ous', 'ure', 'tion', 'sion',
      'sure', 'tial', 'ture', 'cious', 'tious', 'ism', 'asm', 'age', 'tu'
    ]);
    return !teachingGroups.has(grapheme)
      && this._canSpellWithSingleLetters([...grapheme], phonemes, 0, 0);
  }

  _canSpellWithSingleLetters(letters, phonemes, graphemeIndex, phonemeIndex) {
    if (graphemeIndex === letters.length && phonemeIndex === phonemes.length) return true;
    if (graphemeIndex >= letters.length || phonemeIndex > phonemes.length) return false;
    const options = this.g2p[letters[graphemeIndex]];
    if (!options) return false;
    for (const phonemeText of options) {
      if (phonemeText === '（沉默）') {
        if (this._canSpellWithSingleLetters(
          letters, phonemes, graphemeIndex + 1, phonemeIndex
        )) return true;
        continue;
      }
      const sequence = this.splitIPA(phonemeText);
      const candidate = phonemes.slice(phonemeIndex, phonemeIndex + sequence.length);
      if (this._equalArrays(candidate, sequence)
        && this._canSpellWithSingleLetters(
          letters, phonemes, graphemeIndex + 1, phonemeIndex + sequence.length
        )) return true;
    }
    return false;
  }

  _equalArrays(left, right) {
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }

  _add(grapheme, sounds) {
    if (!this.g2p[grapheme]) this.g2p[grapheme] = new Set();
    (Array.isArray(sounds) ? sounds : [sounds]).forEach(sound => this.g2p[grapheme].add(sound));
  }
}
