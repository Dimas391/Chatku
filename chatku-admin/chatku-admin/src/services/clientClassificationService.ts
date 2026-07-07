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

const KATA_AMBIGUOUS = new Set(['porno', 'bugil', 'telanjang', 'mesum']);
const KONTEKS_NEGATIF = new Set([
  'yuk', 'ayo', 'mau', 'sini', 'coba', 'nonton', 'lihat', 'download',
  'kirim', 'bagi', 'share', 'klik', 'link', 'join', 'masuk'
]);

const KONTEKS_PHISHING = new Set([
  'hadiah', 'gratis', 'undian', 'menang', 'selamat', 'pulsa', 'saldo',
  'klaim', 'claim', 'login', 'verifikasi', 'akun', 'password', 'sandi',
  'diblokir', 'retas', 'segera', 'konfirmasi', 'bantuan', 'dana', 'pinjaman',
  'resmi', 'promo', 'cashback', 'bonus'
]);

/**
 * Daftar kata kasar tambahan yang sering dipakai sehari-hari
 * tapi belum ada di data latih model asli.
 */
const KATA_KASAR_TAMBAHAN = [
  'bacot', 'bangke', 'bangkai', 'ajg', 'njir', 'njing', 'nying',
  'bgst', 'bngst', 'gblk', 'tll', 'kntl', 'mmk', 'pki',
  'monyet', 'kera', 'binatang', 'hewan', 'bedebah', 'biadab',
  'bejad', 'keparat', 'sinting', 'gila', 'edan', 'stress',
  'pelakor', 'pecundang', 'pengecut', 'sampah', 'busuk',
  'mampus', 'matilah', 'mati aja', 'bunuh diri',
  'bego', 'bodoh', 'pantek', 'pantek kau', 'pukimak',
  'kimak', 'cibai', 'lancau', 'sial', 'celaka',
  'ngehe', 'kenthu', 'jembud', 'itil', 'tempik',
  'jablay', 'pecun', 'sundel', 'longor', 'memak', 'meki',
  'pepek', 'peler', 'titit', 'ngentot', 'ngewe', 'ewe', 'babi', 'anjing'
];

const kataKasarSet = new Set([...kata_kasar, ...KATA_KASAR_TAMBAHAN]);
const stopwordsSet = new Set(stopwords);
const kataKasarKeras = new Set([...kataKasarSet].filter(x => !KATA_AMBIGUOUS.has(x)));

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

/** Cek apakah sebuah kata cocok dengan daftar kata kasar (termasuk variasi berulang) */
function isKataKasar(word: string): boolean {
  if (kataKasarSet.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return kataKasarSet.has(normalized);
}

/** Cek apakah kata cocok dengan kata kasar keras (termasuk variasi berulang) */
function isKataKasarKeras(word: string): boolean {
  if (kataKasarKeras.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return kataKasarKeras.has(normalized);
}

/** Cek apakah kata cocok dengan kata ambigu (termasuk variasi berulang) */
function isKataAmbiguous(word: string): boolean {
  if (KATA_AMBIGUOUS.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return KATA_AMBIGUOUS.has(normalized);
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

/** 
 * Menyatukan kata kasar yang sengaja dipisah spasi (misal: "a n j i n g", "b a n g s a t")
 * Membangun regex dinamis untuk tiap kata kasar keras.
 */
function normalizeSpacedBadWords(text: string): string {
  let result = text;
  // Urutkan kata dari yang terpanjang agar tidak tumpang tindih
  const sortedWords = Array.from(kataKasarKeras).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    if (word.length < 3) continue; // Abaikan kata yang terlalu pendek untuk menghindari false positive
    // Buat regex misal "anjing" -> \ba\s*n\s*j\s*i\s*n\s*g\b
    const spacedPattern = word.split('').join('\\s*');
    const regex = new RegExp('\\b' + spacedPattern + '\\b', 'gi');
    result = result.replace(regex, word);
  }
  return result;
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

  const urlRegex = new RegExp(pola_url, 'gi');
  t = t.replace(urlRegex, 'URL_CURIGA');

  const hpRegex = /\b0\d[\d\-]{8,12}\b/g;
  t = t.replace(hpRegex, 'NOMOR_HP_ASING');

  t = normalizeLeetspeak(t);
  t = normalizeSpacedBadWords(t);

  t = t.replace(/[^a-z\s]/gi, ' ');

  const tokens = t.split(/\s+/).filter(x => x.length > 0);

  const filteredTokens = tokens.filter(x => {
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

    let tNormalized = normalizeLeetspeak(pesanStrip.toLowerCase());
    tNormalized = normalizeSpacedBadWords(tNormalized);
    const tClean = tNormalized.replace(/[^a-z\s]/gi, ' ');
    const tokens = new Set(tClean.split(/\s+/).filter(w => w.length > 0));

    let hasKataKasarKeras = false;
    for (const token of tokens) {
      if (isKataKasarKeras(token)) {
        hasKataKasarKeras = true;
        break;
      }
    }
    if (hasKataKasarKeras) {
      return {
        label: 'Berisiko',
        confidence: 0.99
      };
    }

    let hasAmbigu = false;
    let hasKonteksNegatif = false;
    for (const token of tokens) {
      if (isKataAmbiguous(token)) {
        hasAmbigu = true;
      }
      if (KONTEKS_NEGATIF.has(token)) {
        hasKonteksNegatif = true;
      }
    }
    if (hasAmbigu && hasKonteksNegatif) {
      return {
        label: 'Berisiko',
        confidence: 0.92
      };
    }

    // 1. Deteksi link yang sangat berisiko: IP Address, domain tingkat rendah (.xyz, dll), atau shortener yang MEMILIKI path (misal bit.ly/123)
    const polaMaliciousUrl = /(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b[\w-]+\.(xyz|site|top|vip|click|pw|cc|biz)(\/\S*)?|\b(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc)\/\S+)/i;
    if (polaMaliciousUrl.test(pesanStrip.toLowerCase())) {
      return {
        label: 'Berisiko',
        confidence: 0.95
      };
    }

    // 2. Deteksi link umum (termasuk https://short.example/a1b2c3), tetapi HANYA DIBLOKIR JIKA disertai kata-kata phishing/penipuan
    const polaUrlUmum = /(https?:\/\/\S+|\bwww\.\S+\.\S+|\b\w+\.(com|net|org|id|co\.id|io|me)\/\S*)/i;
    if (polaUrlUmum.test(pesanStrip.toLowerCase())) {
      let isPhishingContext = false;
      for (const token of tokens) {
        if (KONTEKS_PHISHING.has(token) || KONTEKS_NEGATIF.has(token)) {
          isPhishingContext = true;
          break;
        }
      }
      if (isPhishingContext) {
        return {
          label: 'Berisiko',
          confidence: 0.92
        };
      }
    }

    return predictNaiveBayes(pesanStrip);
  }
}

const clientClassificationService = new ClientClassificationService();
export default clientClassificationService;