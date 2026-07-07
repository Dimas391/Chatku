import modelData from './naive_bayes_model.json';

export interface ClassificationResult {
  label: 'Berisiko' | 'Tidak Berisiko';
  confidence: number;
}

const modelDataAny = modelData as any;
const vocabulary: Record<string, number> = modelData.vocabulary;
const idf: number[] = modelDataAny.idf || [];
const sublinear_tf: boolean = modelDataAny.metadata?.tfidf_params?.sublinear_tf || false;
const class_log_prior: number[] = modelDataAny.class_log_prior;
const feature_log_prob: number[][] = modelDataAny.feature_log_prob;
const kata_kasar: string[] = modelDataAny.kata_kasar || [];
const stopwords: string[] = modelDataAny.stopwords || [];
const pola_url: string = modelDataAny.pola_url || 'http\\S+';

const kataKasarSet = new Set(kata_kasar);
const stopwordsSet = new Set(stopwords);

/**
 * Normalisasi huruf berulang untuk menangkap pengelakan seperti
 * 'ngentott' → 'ngentot', 'anjingg' → 'anjing', 'kontoll' → 'kontol'.
 * Menghapus huruf yang diulang berturut-turut lebih dari yang diperlukan.
 */
function normalizeHurufBerulang(word: string): string {
  // Kurangi huruf berulang berturut-turut menjadi satu huruf
  const collapsed = word.replace(/(.)\1+/g, '$1');
  // Jika versi collapsed cocok dengan kata kasar, gunakan itu
  if (kataKasarSet.has(collapsed)) return collapsed;
  // Coba juga versi dengan maksimal 2 huruf berturut (untuk kata seperti 'massa')
  const collapsedTwo = word.replace(/(.)\1{2,}/g, '$1$1');
  if (kataKasarSet.has(collapsedTwo)) return collapsedTwo;
  // Tidak cocok, kembalikan kata asli
  return word;
}

/** Cek apakah sebuah kata cocok dengan daftar kata kasar dari model (termasuk variasi berulang) */
function isKataKasar(word: string): boolean {
  if (kataKasarSet.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return kataKasarSet.has(normalized);
}

/** Normalisasi karakter alay/leetspeak agar bisa dicocokkan dengan kata asli */
function normalizeLeetspeak(text: string): string {
  return text
    .replace(/0/g, 'o')
    .replace(/1|!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4|@/g, 'a')
    .replace(/5|\$/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g');
}

function _is_kemungkinan_nama(text: string): boolean {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0 || words.length > 5) return false;

  const allCap = words.every(w => {
    if (w.length === 0) return true;
    const firstChar = w.charAt(0);
    return firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
  });

  const noSpecial = /^[A-Za-z\s]+$/.test(trimmed);
  const mengandungKasar = words.some(w => isKataKasar(w.toLowerCase()));

  return allCap && noSpecial && !mengandungKasar;
}

function preprocess_simple(text: string): string {
  let t = String(text).toLowerCase().trim();

  // Pola URL yang diperluas
  const urlPattern = /(https?:\/\/|hxxps?:\/\/|ftp:\/\/|bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|[\w-]+\.(xyz|site|click|info|online|top|vip|pw|tk|ml))\S*/gi;
  t = t.replace(urlPattern, 'url_curiga');
  
  // Tangkap format defanged url seperti hxxps://domain[.]com
  const defangedPattern = /hxxps?:\/\/[^\s]+|\[\.\]/gi;
  t = t.replace(defangedPattern, 'url_curiga');

  const hpRegex = /\b0\d[\d\-]{8,12}\b/g;
  t = t.replace(hpRegex, 'nomor_hp_asing');

  t = normalizeLeetspeak(t);

  t = t.replace(/[^a-z_\s]/gi, ' ');

  const tokens = t.split(/\s+/).filter(x => x.length > 0);

  const filteredTokens = tokens.map(x => {
    // Return normalized word if it matches kata kasar
    if (kataKasarSet.has(x)) return x;
    const norm = normalizeHurufBerulang(x);
    if (kataKasarSet.has(norm)) return norm;
    return x;
  }).filter(x => {
    return isKataKasar(x) || (!stopwordsSet.has(x) && x.length > 1);
  });

  return filteredTokens.length > 0 ? filteredTokens.join(' ') : 'PESAN_KOSONG';
}

function predictNaiveBayes(text: string): { label: 'Berisiko' | 'Tidak Berisiko'; confidence: number } {
  const cleanText = preprocess_simple(text);

  if (cleanText === 'PESAN_KOSONG') {
    return {
      label: 'Tidak Berisiko',
      confidence: 0.99
    };
  }

  const tokens = cleanText.split(/\s+/);
  const ngrams: string[] = [];

  // Unigrams
  for (let i = 0; i < tokens.length; i++) {
    ngrams.push(tokens[i]);
  }
  
  // Bigrams
  for (let i = 0; i < tokens.length - 1; i++) {
    ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  const termCounts: Record<number, number> = {};
  for (const token of ngrams) {
    if (token in vocabulary) {
      const idx = vocabulary[token];
      termCounts[idx] = (termCounts[idx] || 0) + 1;
    }
  }

  const termIndices = Object.keys(termCounts).map(Number);
  if (termIndices.length === 0) {
    const priors = class_log_prior.map(Math.exp);
    const sumPriors = priors[0] + priors[1];
    const prob0 = priors[0] / sumPriors;
    const prob1 = priors[1] / sumPriors;
    const isRisky = prob1 >= 0.65;
    return {
      label: isRisky ? 'Berisiko' : 'Tidak Berisiko',
      confidence: isRisky ? prob1 : prob0
    };
  }

  const tfidfValues: Record<number, number> = {};
  let sumSquares = 0;
  for (const idx of termIndices) {
    const count = termCounts[idx];
    const tfVal = sublinear_tf ? (1 + Math.log(count)) : count;
    const tfidfVal = (idf && idf.length > 0) ? tfVal * idf[idx] : tfVal;
    tfidfValues[idx] = tfidfVal;
    sumSquares += tfidfVal * tfidfVal;
  }

  if (sumSquares > 0) {
    const l2Len = Math.sqrt(sumSquares);
    for (const idx of termIndices) {
      tfidfValues[idx] /= l2Len;
    }
  }

  let logLikelihood0 = class_log_prior[0];
  let logLikelihood1 = class_log_prior[1];

  for (const idx of termIndices) {
    const tfidfValNorm = tfidfValues[idx];
    logLikelihood0 += tfidfValNorm * feature_log_prob[0][idx];
    logLikelihood1 += tfidfValNorm * feature_log_prob[1][idx];
  }

  const maxLog = Math.max(logLikelihood0, logLikelihood1);
  const exp0 = Math.exp(logLikelihood0 - maxLog);
  const exp1 = Math.exp(logLikelihood1 - maxLog);
  const sumExp = exp0 + exp1;
  const prob0 = exp0 / sumExp;
  const prob1 = exp1 / sumExp;

  const isRisky = prob1 >= 0.65;
  const label = isRisky ? 'Berisiko' : 'Tidak Berisiko';
  const confidence = isRisky ? prob1 : prob0;

  return {
    label,
    confidence
  };
}

class ClientClassificationService {
  preprocess(text: string): string {
    return preprocess_simple(text);
  }

  classify(text: string): ClassificationResult {
    const pesanStrip = text.trim();

    if (pesanStrip.length < 4) {
      return {
        label: 'Tidak Berisiko',
        confidence: 0.99
      };
    }

    if (_is_kemungkinan_nama(pesanStrip)) {
      return {
        label: 'Tidak Berisiko',
        confidence: 0.95
      };
    }

    return predictNaiveBayes(pesanStrip);
  }
}

const clientClassificationService = new ClientClassificationService();
export default clientClassificationService;