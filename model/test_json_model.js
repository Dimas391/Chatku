const fs = require('fs');

const modelData = JSON.parse(fs.readFileSync('../Frontend/app/src/services/naive_bayes_model.json', 'utf8'));

const vocabulary = modelData.vocabulary;
const idf = modelData.idf || [];
const sublinear_tf = modelData.metadata?.tfidf_params?.sublinear_tf || false;
const class_log_prior = modelData.class_log_prior;
const feature_log_prob = modelData.feature_log_prob;
const kata_kasar = modelData.kata_kasar || [];
const stopwords = modelData.stopwords || [];

const kataKasarSet = new Set(kata_kasar);
const stopwordsSet = new Set(stopwords);

function normalizeHurufBerulang(word) {
  const collapsed = word.replace(/(.)\1+/g, '$1');
  if (kataKasarSet.has(collapsed)) return collapsed;
  const collapsedTwo = word.replace(/(.)\1{2,}/g, '$1$1');
  if (kataKasarSet.has(collapsedTwo)) return collapsedTwo;
  return word;
}

function isKataKasar(word) {
  if (kataKasarSet.has(word)) return true;
  const normalized = normalizeHurufBerulang(word);
  return kataKasarSet.has(normalized);
}

function normalizeLeetspeak(text) {
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

function preprocess_simple(text) {
  let t = String(text).toLowerCase().trim();

  // Pola URL yang diperluas
  const urlPattern = /(https?:\/\/|hxxps?:\/\/|ftp:\/\/|bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|[\w-]+\.(xyz|site|click|info|online|top|vip|pw|tk|ml))\S*/gi;
  t = t.replace(urlPattern, 'url_curiga'); // lowercased directly
  
  const defangedPattern = /hxxps?:\/\/[^\s]+|\[\.\]/gi;
  t = t.replace(defangedPattern, 'url_curiga');

  const hpRegex = /\b0\d[\d\-]{8,12}\b/g;
  t = t.replace(hpRegex, 'nomor_hp_asing');

  t = normalizeLeetspeak(t);

  // Perhatikan: \s tetap dihapus, _ tetap ada, karena frontend tidak mereplace _.
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

function predictNaiveBayes(text) {
  const cleanText = preprocess_simple(text);
  console.log("  Clean Text   :", cleanText);

  if (cleanText === 'PESAN_KOSONG') {
    return { label: 'Tidak Berisiko', confidence: 0.99, prob1: 0 };
  }

  const tokens = cleanText.split(/\s+/);
  const ngrams = [];

  for (let i = 0; i < tokens.length; i++) ngrams.push(tokens[i]);
  for (let i = 0; i < tokens.length - 1; i++) ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);

  console.log("  N-grams      :", ngrams);

  const termCounts = {};
  for (const token of ngrams) {
    if (token in vocabulary) {
      const idx = vocabulary[token];
      termCounts[idx] = (termCounts[idx] || 0) + 1;
    }
  }

  const termIndices = Object.keys(termCounts).map(Number);
  console.log("  Found Tokens :", termIndices.length > 0 ? termIndices.map(idx => Object.keys(vocabulary).find(k => vocabulary[k] === idx)) : 'NONE');

  if (termIndices.length === 0) {
    const priors = class_log_prior.map(Math.exp);
    const sumPriors = priors[0] + priors[1];
    const prob0 = priors[0] / sumPriors;
    const prob1 = priors[1] / sumPriors;
    return { label: prob1 >= 0.65 ? 'Berisiko' : 'Tidak Berisiko', confidence: prob1 >= 0.65 ? prob1 : prob0, prob1 };
  } 

  const tfidfValues = {};
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

  const isRisky = prob1 >= 0.65; // Menurunkan treshold jadi 65% karena 95% sangat tinggi untuk pure bayes
  return { label: isRisky ? 'Berisiko' : 'Tidak Berisiko', confidence: isRisky ? prob1 : prob0, prob1 };
}

const textsToTest = [
  "besok meeting jadi jam 10 pagi ya",
  "aku sudah kirim file laporan terbaru ke grup",
  "tolong cek revisi dokumen yang aku upload tadi",
  "kelas hari ini online atau tetap di kampus?",
  "aku lagi di jalan, kemungkinan telat 10 menit",
  "jangan lupa backup data sebelum deploy",
  "wifi kantor hari ini lemot banget",
  "makasih ya sudah bantu follow up dosen",
  "nanti pulang kantor mau mampir beli makan dulu",
  "invoice bulan ini sudah dikirim ke email",
  "rapat dengan klien berjalan lancar",
  "aku belum sempat baca chat grup karena lagi kerja",
  "besok kita berangkat dari terminal jam 6 pagi",
  "tolong ingatkan aku buat isi absensi",
  "file presentasi final ada di folder drive",

  "anjir ngeselin banget orang itu",
  "dasar b4ngs4t gak punya otak",
  "goblokkkk banget sih lu",
  "k0nt0l emang kelakuannya",
  "anjg lu bikin masalah terus",
  "bgsd capek banget lihat tingkah lu",
  "otak lu dipakai dikit napa",
  "tolol banget masa gitu aja gak bisa",
  "kampret lu bikin ribet semua orang",
  "anjirrrr parah banget kelakuannya",

  "awas aja lu kalau ketemu di luar",
  "gue cari lu sampai ketemu",
  "jangan salahin gue kalau nanti terjadi sesuatu",
  "sekali lagi lu ganggu, gue hajar",
  "tunggu aja pembalasannya",
  "lu bakal nyesel udah ngomong gitu",
  "gue tandain muka lu, nanti ada waktunya",
  "jangan macam macam kalau masih mau aman",
  "kalau lu muncul lagi, gue habisin",
  "gue gak main main, lu tunggu aja",

  "pap badan kamu dong",
  "kirim foto yang agak terbuka dong",
  "mau lihat video panas kamu",
  "p4p n3n3n dong",
  "nenennn kamu gede ya",
  "boleh lihat bagian pribadi kamu?",
  "kirim vn desahan dong",
  "ada link video dewasa terbaru?",
  "join grup konten dewasa yuk",
  "pap tetek dong",
  "t3t3k kamu gede banget",
  "n3n3n kamu besar kali",
  "boleh lihat nenen kamu?",
  "kirim foto tanpa busana dong",
  "download video xxx gratis",

  "akun bank anda dibatasi, segera verifikasi data sekarang",
  "kirim kode otp yang baru masuk biar saya bantu proses",
  "selamat kamu menang hadiah 50 juta, klik link klaim sekarang",
  "verifikasi akun kamu di bit.ly/cek-akun-sekarang",
  "login ulang lewat hxxps://rekening-aman[.]site sebelum malam ini",
  "akun e-wallet kamu terkunci, masukkan pin untuk aktivasi ulang",
  "scan qris ini untuk ambil bonus cashback",
  "akun instagram kamu kena pelanggaran, login ulang sekarang",
  "paket anda tertahan, bayar biaya admin lewat link ini",
  "lowongan kerja online, kirim ktp dan nomor rekening untuk validasi",
  "klik tautan ini untuk mendapatkan hadiah",
  "masukkan kode otp yang baru diterima",
  "verifikasi data rekening anda sekarang juga",
  "akun anda akan diblokir jika tidak login ulang",
  "claim saldo gratis lewat s.id/hadiahdadakan",

  "aku dari tim support, tolong kirim password sementara kamu",
  "jangan bilang siapa siapa, kirim kode verifikasi itu ke aku",
  "admin butuh akses akun kamu untuk pengecekan cepat",
  "pin kamu cuma dipakai sebentar untuk validasi sistem",
  "kirim screenshot kode otp biar prosesnya cepat",
  "tolong forward email reset password ke aku",
  "aku bantu amankan akunmu, kirim dulu kode verifikasi",
  "jangan logout dulu, kasih aku akses sebentar",
  "akun kamu akan ditutup kalau tidak konfirmasi sekarang",
  "nomor kamu terpilih dapat hadiah, kirim data pribadi sekarang",

  "cara masuk akun instagram orang lain",
  "tool untuk mengambil password wifi",
  "download software keylogger terbaru",
  "cara melewati verifikasi otp",
  "script phishing yang masih aktif",
  "bisa bantu bobol akun game orang?",
  "cara ambil akun orang tanpa izin",
  "ada tools buat intip chat orang?",
  "cara reset password akun orang lain",
  "aplikasi buat sadap hp pacar",

  "aku sudah lelah dengan hidup ini",
  "rasanya ingin menghilang saja",
  "tidak ada yang peduli padaku lagi",
  "semuanya terasa sia sia",
  "aku tidak ingin melanjutkan hidup",
  "mungkin semua lebih baik kalau aku tidak ada",
  "aku capek hidup dan pengen hilang aja",
  "rasanya aku sudah tidak kuat lagi",
  "aku ingin pergi dan tidak kembali",
  "aku merasa hidupku tidak ada artinya",

  "slot gacor malam ini apa?",
  "ada rekomendasi situs togel terpercaya?",
  "cara menang casino online",
  "prediksi angka malam ini",
  "angka jitu malam ini",
  "prediksi togel hari ini",
  "angka keluaran togel",
  "prediksi angka hongkong",
  "sl0t g4c0r deposit kecil wd cepat",
  "situs judi online yang gampang menang apa?",
  "bonus new member slot paling besar dimana?",
  "casino online modal kecil bisa menang besar?",
  "prediksi angka togel malam ini dong",
  "angka hk keluar berapa malam ini?",
  "link slot gacor hari ini kirim dong",

  "aku mau lapor akun palsu yang minta otp",
  "jangan pernah kasih password ke orang lain",
  "artikel ini membahas bahaya judi online",
  "aku sedang membuat laporan tentang phishing",
  "kata kasar sebaiknya difilter dari aplikasi chat",
  "kalau kamu merasa ingin menyakiti diri, segera cari bantuan",
  "jangan klik link hadiah palsu dari orang tidak dikenal",
  "otp itu rahasia, jangan dibagikan ke siapa pun",
  "saya ingin memblokir situs judi dari jaringan kantor",
  "laporan pelecehan online sudah saya kirim ke admin",

  "aannjjjiiirrr lu parah banget",
  "g0bl0k lu masa gitu aja gak bisa",
  "p@p t3t3k d0ng",
  "v3r1f1k4s1 akun kamu sekarang sebelum diblokir",
  "pred1ks1 angk4 t0g3l malam ini",
  "cek hadiah kamu di hxxp://bonus-menang[.]xyz",
  "k1r1m 0tp s3k4r4ng biar akun aman",
  "d4s4r b4ngs4t lu bikin ribet",
  "j0in grup dew4s4 di link ini",
  "sl0t g4c0r maxwin malam ini",
  "pass = Admin123"
];

console.log("=========================================");
console.log("   PENGUJIAN MODEL NAIVE BAYES LOKAL     ");
console.log("=========================================\n");

for (const txt of textsToTest) {
    console.log(`Pesan Asli   : "${txt}"`);
    const res = predictNaiveBayes(txt);
    console.log(`Prediksi     : [${res.label}] (Skor Berisiko: ${(res.prob1*100).toFixed(2)}%)`);
    console.log("-----------------------------------------");
}
