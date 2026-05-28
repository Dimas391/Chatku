const fs = require('fs');
const modelData = JSON.parse(fs.readFileSync('e:/Messaging_Pengamanan_Data/model/naive_bayes_model.json', 'utf8'));

const KATA_AMBIGUOUS = new Set(['porno', 'bugil', 'telanjang', 'mesum']);
const KONTEKS_NEGATIF = new Set([
  'yuk', 'ayo', 'mau', 'sini', 'coba', 'nonton', 'lihat', 'download',
  'kirim', 'bagi', 'share', 'klik', 'link', 'join', 'masuk'
]);

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
  'jablay', 'pecun', 'sundel', 'longor',
];

const kataKasarSet = new Set([...modelData.kata_kasar, ...KATA_KASAR_TAMBAHAN]);
const kataKasarKeras = new Set([...kataKasarSet].filter(x => !KATA_AMBIGUOUS.has(x)));

function normalizeHurufBerulang(word) {
  const collapsed = word.replace(/(.)\1+/g, '$1');
  if (kataKasarSet.has(collapsed)) return collapsed;
  const collapsedTwo = word.replace(/(.)\1{2,}/g, '$1$1');
  if (kataKasarSet.has(collapsedTwo)) return collapsedTwo;
  return word;
}

function isKataKasarKeras(word) {
  if (kataKasarKeras.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return kataKasarKeras.has(normalized);
}

const texts = [
  "Untuk tugas akhir nanti, kita perlu mengimplementasikan algoritma AES-256 dan RSA dalam modul keamanan chat. Jadi semua teks asli akan diubah menjadi ciphertext sebelum masuk ke MongoDB.",
  "Selamat siang Dokter, saya ingin berkonsultasi mengenai keluhan pada organ reproduksi saya. Ada radang dan nyeri di sekitar alat vital yang terasa mengganggu sejak dua hari lalu. Mohon arahannya, Dok.",
  "Tolong! Tolong respon pesan ini segera! Akun perbankan saya baru saja diretas orang dan saya kehilangan akses total. Saya sangat panik, apakah data yang saya simpan di aplikasi ini masih aman?"
];

function _is_kemungkinan_nama(text) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0 || words.length > 5) return false;
  
  const allCap = words.every(w => {
    if (w.length === 0) return true;
    const firstChar = w.charAt(0);
    return firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
  });
  
  const noSpecial = /^[A-Za-z\s]+$/.test(trimmed);
  const mengandungKasar = words.some(w => kataKasarSet.has(w.toLowerCase()));
  
  return allCap && noSpecial && !mengandungKasar;
}

function isKataAmbiguous(word) {
  if (KATA_AMBIGUOUS.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return KATA_AMBIGUOUS.has(normalized);
}

texts.forEach(text => {
  console.log('---');
  console.log('Text:', text);
  
  const pesanStrip = text.trim();
  
  if (pesanStrip.length < 4) {
    console.log('Reason: too short');
    return;
  }
  
  if (_is_kemungkinan_nama(pesanStrip)) {
    console.log('Reason: looks like a name');
    return;
  }
  
  const tClean = pesanStrip.toLowerCase().replace(/[^a-z\s]/gi, ' ');
  const tokens = new Set(tClean.split(/\s+/).filter(w => w.length > 0));
  
  let hasKataKasarKeras = false;
  let matchingKasarKeras = [];
  for (const token of tokens) {
    if (isKataKasarKeras(token)) {
      hasKataKasarKeras = true;
      matchingKasarKeras.push(token);
    }
  }
  if (hasKataKasarKeras) {
    console.log('Reason: KataKasarKeras matched:', matchingKasarKeras);
    return;
  }
  
  let hasAmbigu = false;
  let hasKonteksNegatif = false;
  for (const token of tokens) {
    if (isKataAmbiguous(token)) hasAmbigu = true;
    if (KONTEKS_NEGATIF.has(token)) hasKonteksNegatif = true;
  }
  if (hasAmbigu && hasKonteksNegatif) {
    console.log('Reason: Ambigu + Konteks Negatif');
    return;
  }
  
  const polaLuas = /((https?|ftp|bit|s|t|rb|cutt):\/\/\S+|(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|[\w-]+\.xyz|[\w-]+\.site)\S*)/i;
  if (polaLuas.test(pesanStrip.toLowerCase())) {
    console.log('Reason: URL detected', pesanStrip.toLowerCase().match(polaLuas));
    return;
  }
  
  console.log('Reason: fallback to Naive Bayes');
  
  // Naive Bayes
  let preprocess_t = tClean;
  const hpRegex = /\b0\d[\d\-]{8,12}\b/g;
  preprocess_t = preprocess_t.replace(hpRegex, 'NOMOR_HP_ASING');
  let filtered = preprocess_t.split(/\s+/).filter(x => {
    return isKataKasarKeras(x) || (!new Set(modelData.stopwords).has(x) && x.length > 1);
  });
  
  const toks = filtered;
  let termCounts = {};
  for (const t of toks) {
    if (t in modelData.vocabulary) {
      const idx = modelData.vocabulary[t];
      termCounts[idx] = (termCounts[idx] || 0) + 1;
    }
  }
  
  const termIndices = Object.keys(termCounts).map(Number);
  let tfidfValues = {};
  let sumSquares = 0;
  for (const idx of termIndices) {
    const count = termCounts[idx];
    const tfVal = modelData.sublinear_tf ? (1 + Math.log(count)) : count;
    const tfidfVal = tfVal * modelData.idf[idx];
    tfidfValues[idx] = tfidfVal;
    sumSquares += tfidfVal * tfidfVal;
  }
  
  if (sumSquares > 0) {
    const l2Len = Math.sqrt(sumSquares);
    for (const idx of termIndices) {
      tfidfValues[idx] /= l2Len;
    }
  }
  
  let logLikelihood0 = modelData.class_log_prior[0];
  let logLikelihood1 = modelData.class_log_prior[1];
  
  for (const idx of termIndices) {
    const tfidfValNorm = tfidfValues[idx];
    logLikelihood0 += tfidfValNorm * modelData.feature_log_prob[0][idx];
    logLikelihood1 += tfidfValNorm * modelData.feature_log_prob[1][idx];
  }
  
  const maxLog = Math.max(logLikelihood0, logLikelihood1);
  const exp0 = Math.exp(logLikelihood0 - maxLog);
  const exp1 = Math.exp(logLikelihood1 - maxLog);
  const sumExp = exp0 + exp1;
  const prob0 = exp0 / sumExp;
  const prob1 = exp1 / sumExp;
  
  console.log('Prob0 (Tidak Berisiko):', prob0);
  console.log('Prob1 (Berisiko):', prob1);
});
