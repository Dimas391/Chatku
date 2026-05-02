import logging
import joblib # type: ignore
import re
import os
from typing import Tuple

logger = logging.getLogger(__name__)

try:
    from Sastrawi.Stemmer.StemmerFactory import StemmerFactory # pyright: ignore[reportMissingImports]
    from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory # pyright: ignore[reportMissingImports]
    HAS_SASTRAWI = True
except ModuleNotFoundError:
    logger.error("Module 'Sastrawi' tidak ditemukan. Pastikan sudah menginstal dengan 'pip install Sastrawi'.")
    HAS_SASTRAWI = False

# ── Blacklist kata kasar (safety net — berlapis dengan model) ──
BLACKLIST_KATA_KASAR = {
    # Alat kelamin & seksual
    'kontol','memek','pepek','titit','toket','ngentot','entot','ngewe',
    'colmek','coli','masturbasi','bokep','porno','telanjang','bugil',
    'binal','mesum','cabul','bejat',
    # Makian umum
    'anjing','bangsat','bajingan','brengsek','keparat','sialan',
    'babi','goblok','tolol','dungu','geblek','kampret',
    'asu','jancok','jancuk','cuk','kon','taik','tai','setan',
    'iblis','laknat','terkutuk','jahanam','lonte','sundal',
    'pelacur','jalang','murahan','perek', 
    # Ancaman kekerasan verbal
    'kubunuh','mampusin','bacok','hajar','tonjok','siksa',
    'aniaya','habisi','musnahkan','gebuk','cekik',
    # Penghinaan SARA
    'kafir','rasis',
}

# Kata yang ada di blacklist tapi bisa jadi konteks berbeda (perlu cek konteks)
BLACKLIST_KATA_AMBIGUOUS = {
    'porno', 'bugil', 'telanjang', 'mesum',
}

# Konteks yang memperkuat indikasi negatif untuk kata ambigu
KONTEKS_NEGATIF = {
    'yuk','ayo','mau','sini','coba','nonton','lihat','download',
    'kirim','bagi','share','klik','link','join','masuk'
}


class ClassificationService:
    """
    Service klasifikasi pesan ancaman siber.

    Alur klasifikasi (berlapis):
    1. Rule: pesan < 4 karakter           → Tidak Berisiko
    2. Rule: kemungkinan nama orang       → Tidak Berisiko
    3. Rule: mengandung kata kasar keras  → Berisiko
    4. Rule: kata ambigu + konteks negatif → Berisiko
    5. Rule: token setelah preprocessing < 2 → Tidak Berisiko
    6. Model Naïve Bayes TF-IDF (Threshold 65%)
    """

    def __init__(self):
        self.model        = None
        self.vectorizer   = None
        self.stopwords    = set()
        self.kata_kasar   = set(BLACKLIST_KATA_KASAR)
        self.pola_url     = None
        self.stemmer      = None
        self._init_nlp()
        self._load_model()

    # ── Inisialisasi NLP ──────────────────────────────────────────
    def _init_nlp(self):
        try:
            if HAS_SASTRAWI:
                self.stemmer = StemmerFactory().create_stemmer()
                sw_base  = StopWordRemoverFactory().get_stop_words()
            else:
                self.stemmer = None
                sw_base = ['yang','dan','di','dari','ke','pada','ini','itu']
                logger.warning("Sastrawi tidak tersedia, menggunakan fallback stopwords terbatas.")

            sw_extra = [
                'anda','kamu','saya','kami','kita','nya','ini','itu',
                'with','untuk','ada','akan','sudah','telah',
                'ya','yg','jg','gak','ga','deh','dong','nih','lah','sih',
                'ku','mu','klo','tapi','jadi','bisa','agar','juga',
            ]
            self.stopwords = set(sw_base + sw_extra)
            # Kata kasar JANGAN masuk stopwords agar tetap jadi fitur model
            self.stopwords -= self.kata_kasar
            logger.info(f"NLP initialized ({len(self.stopwords)} stopwords, "
                        f"{len(self.kata_kasar)} kata kasar di blacklist)")
        except Exception as e:
            logger.error(f"NLP init failed: {e}")
            self.stopwords = {'yang','dan','di','dari','ke','pada','ini','itu'}

    # ── Load Model ────────────────────────────────────────────────
    def _load_model(self):
        try:
            ROOT_DIR   = os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            )
            model_path = os.path.join(ROOT_DIR, "model", "model_naive_bayes.joblib")

            if not os.path.exists(model_path):
                logger.warning(f"Model tidak ditemukan di {model_path}")
                return

            data = joblib.load(model_path)
            self.model      = data.get('model')
            self.vectorizer = data.get('vectorizer')
            self.pola_url   = data.get('pola_url')

            # Gabung stopwords & kata_kasar dari model
            self.stopwords.update(data.get('stopwords', []))
            self.kata_kasar.update(data.get('kata_kasar', []))
            self.stopwords -= self.kata_kasar  # pastikan tidak tumpang tindih

            meta = data.get('metadata', {})
            logger.info(f"Model loaded | Accuracy={meta.get('accuracy','?')} | "
                        f"F1={meta.get('f1_score','?')}")
        except Exception as e:
            logger.error(f"Gagal load model: {e}")
            self.model      = None
            self.vectorizer = None

    # ── Deteksi Nama Orang ────────────────────────────────────────
    def _is_kemungkinan_nama(self, text: str) -> bool:
        """Cek apakah pesan hanya berisi nama (tiap kata diawali kapital & bukan kata kasar)."""
        words = text.strip().split()
        if not words or len(words) > 5:
            return False
        
        # Tiap kata diawali huruf besar & hanya berisi alfabet
        all_cap    = all(w[0].isupper() for w in words if w)
        no_special = bool(re.match(r'^[A-Za-z\s]+$', text.strip()))
        
        # PENTING: Pastikan tidak ada kata kasar di dalam calon nama ini
        mengandung_kasar = any(w.lower() in self.kata_kasar for w in words)
        
        return all_cap and no_special and not mengandung_kasar

    # ── Preprocessing (5 Tahap) ───────────────────────────────────
    def preprocess(self, text: str) -> str:
        # 1. Case Folding
        t = str(text).lower().strip()

        # 2. Tokenisasi + penandaan pola khusus
        pola = self.pola_url or (
            r'((https?|ftp|bit|s|t|rb|cutt)://\S+|'
            r'(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|'
            r'shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|'
            r'[\w-]+\.xyz|[\w-]+\.site)\S*)'
        )
        t = re.sub(pola,                   'URL_CURIGA',     t)
        t = re.sub(r'\b0\d[\d\-]{8,12}\b', 'NOMOR_HP_ASING', t)
        t = re.sub(r'\b\d{5,8}\b',         'KODE_OTP',       t)
        t = re.sub(r'rp[\s]?\d+[\.,]?\d*\s*(juta|ribu|rb)?', 'NOMINAL_UANG', t)
        t = re.sub(r'\b\d+\b', '', t)
        t = re.sub(r'[^a-z_\s]', ' ', t)

        tokens = [x for x in t.split() if len(x) > 0]

        # 3. Stopword Removal (jaga token kapital & kata kasar)
        tokens = [
            x for x in tokens
            if x.isupper()
            or x in self.kata_kasar
            or (x not in self.stopwords and len(x) > 1)
        ]

        # 4. Stemming (skip token kapital & kata kasar)
        if self.stemmer:
            tokens = [
                x if (x.isupper() or x in self.kata_kasar)
                else self.stemmer.stem(x)
                for x in tokens
            ]

        # 5. Gabung
        return ' '.join(tokens) if tokens else 'PESAN_KOSONG'

    # ── Klasifikasi ───────────────────────────────────────────────
    def classify(self, text: str) -> Tuple[str, float]:
        """
        Returns: (label, confidence)
        """
        original_text = str(text).strip()
        
        # Lapisan 1: Terlalu pendek
        if len(original_text) < 4:
            return "Tidak Berisiko", 0.99

        # Lapisan 2: Kemungkinan nama orang
        if self._is_kemungkinan_nama(original_text):
            logger.info(f"[NAMA] Tidak Berisiko | '{original_text}'")
            return "Tidak Berisiko", 0.95

        # --- NORMALISASI EKSTREM (Fix False Negative: a n j i n g, b4ngsat) ---
        # 1. Leet speak sederhana
        t_leet = original_text.lower()
        t_leet = t_leet.replace('4','a').replace('3','e').replace('1','i').replace('0','o').replace('5','s')
        # 2. Hapus spasi dan simbol (teks rapat)
        t_flat = re.sub(r'[^a-z]', '', t_leet)
        
        kata_kasar_keras = self.kata_kasar - BLACKLIST_KATA_AMBIGUOUS
        for kasar in kata_kasar_keras:
            if len(kasar) > 3 and kasar in t_flat:
                logger.warning(f"[KATA KASAR VARIASI] Berisiko | '{original_text[:60]}'")
                return "Berisiko", 0.99

        # Persiapan token untuk rule-based standar
        t_lower = original_text.lower()
        t_clean = re.sub(r'[^a-z\s]', ' ', t_lower)
        tokens  = set(t_clean.split())

        # Lapisan 3: Blacklist kata kasar KERAS standar
        if tokens & kata_kasar_keras:
            logger.warning(f"[KATA KASAR] Berisiko | '{original_text[:60]}'")
            return "Berisiko", 0.99

        # Lapisan 4: Kata ambigu + konteks negatif
        if (tokens & BLACKLIST_KATA_AMBIGUOUS) and (tokens & KONTEKS_NEGATIF):
            logger.warning(f"[AMBIGU+KONTEKS] Berisiko | '{original_text[:60]}'")
            return "Berisiko", 0.92

        # Lapisan 4b: URL mencurigakan
        pola_luas = r'((https?|ftp|bit|s|t|rb|cutt)://\S+|(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|[\w-]+\.xyz|[\w-]+\.site)\S*)'
        if re.search(pola_luas, original_text.lower()):
            logger.warning(f"[URL] Berisiko | '{original_text[:60]}'")
            return "Berisiko", 0.92

        # Preprocessing untuk model
        processed = self.preprocess(original_text)
        proc_tokens = processed.split()

        # Lapisan 5: Token hasil preprocessing terlalu sedikit
        if len(proc_tokens) < 2:
            return "Tidak Berisiko", 0.90

        # Lapisan 6: Model Naïve Bayes
        if not self.model or not self.vectorizer:
            return "Tidak Berisiko", 0.5

        try:
            vec   = self.vectorizer.transform([processed])
            proba = self.model.predict_proba(vec)[0]
            
            # Gunakan threshold yang lebih ketat (85%) untuk menghindari False Positive
            # Terutama untuk pesan yang mengandung kata sapaan umum
            is_risky   = proba[1] >= 0.85
            
            # Khusus salam/sapaan/kata umum: Jika mengandung 'halo', 'apa kabar', 'selamat', 'coba', 'lihat'
            # Kita lebih toleran kecuali model SANGAT yakin (>95%)
            common_safe_words = {
                'halo', 'hallo', 'hai', 'hi', 'pagi', 'siang', 'sore', 'malam', 
                'apa', 'kabar', 'selamat', 'coba', 'lihat', 'cek', 'mohon'
            }
            if tokens & common_safe_words:
                is_risky = proba[1] >= 0.95
            
            label      = "Berisiko" if is_risky else "Tidak Berisiko"
            confidence = float(max(proba))
            
            logger.info(f"[MODEL] {label} ({confidence:.2f}) | '{original_text[:60]}'")
            return label, confidence
        except Exception as e:
            logger.error(f"Klasifikasi gagal: {e}")
            return "Tidak Berisiko", 0.5


# Singleton
classification_service = ClassificationService()