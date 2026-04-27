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
    logger.error("❌ Module 'Sastrawi' tidak ditemukan. Pastikan sudah menginstal dengan 'pip install Sastrawi'.")
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


class ClassificationService:
    """
    Service klasifikasi pesan ancaman siber.

    Alur klasifikasi (berlapis):
    1. Rule: pesan < 4 karakter           → Tidak Berisiko
    2. Rule: mengandung kata kasar        → Berisiko (langsung, tanpa model)
    3. Rule: token setelah preprocessing < 2 → Tidak Berisiko
    4. Model Naïve Bayes TF-IDF
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
                logger.warning("⚠️  Sastrawi tidak tersedia, menggunakan fallback stopwords terbatas.")

            sw_extra = [
                'anda','kamu','saya','kami','kita','nya','ini','itu',
                'dengan','untuk','ada','akan','sudah','telah',
                'ya','yg','jg','gak','ga','deh','dong','nih','lah','sih',
                'ku','mu','klo','tapi','jadi','bisa','agar','juga',
            ]
            self.stopwords = set(sw_base + sw_extra)
            # Kata kasar JANGAN masuk stopwords agar tetap jadi fitur model
            self.stopwords -= self.kata_kasar
            logger.info(f"✅ NLP initialized ({len(self.stopwords)} stopwords, "
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
                logger.warning(f"⚠️  Model tidak ditemukan di {model_path}")
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
            logger.info(f"✅ Model loaded | Accuracy={meta.get('accuracy','?')} | "
                        f"F1={meta.get('f1_score','?')}")
        except Exception as e:
            logger.error(f"❌ Gagal load model: {e}")
            self.model      = None
            self.vectorizer = None

    # ── Cek Kata Kasar ────────────────────────────────────────────
    def _mengandung_kata_kasar(self, text: str) -> bool:
        """Cek per token setelah case folding agar 'KONTOL!!' tetap terdeteksi."""
        t      = re.sub(r'[^a-z\s]', ' ', str(text).lower())
        tokens = set(t.split())
        return bool(tokens & self.kata_kasar)

    # ── Preprocessing (5 Tahap) ───────────────────────────────────
    def preprocess(self, text: str) -> str:
        # 1. Case Folding
        t = str(text).lower().strip()

        # 2. Tokenisasi + penandaan pola khusus
        pola = self.pola_url or (
            r'(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com'
            r'|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc'
            r'|[\w-]+\.xyz|[\w-]+\.site)\S*'
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
        label: 'Berisiko' atau 'Tidak Berisiko'
        """
        text = str(text).strip()

        # Lapisan 1: Terlalu pendek
        if len(text) < 4:
            return "Tidak Berisiko", 0.99

        # Lapisan 2: Blacklist kata kasar → langsung Berisiko
        if self._mengandung_kata_kasar(text):
            logger.warning(f"📊 [KATA KASAR] Berisiko | '{text[:60]}'")
            return "Berisiko", 0.99

        # Preprocessing
        processed = self.preprocess(text)
        tokens    = processed.split()

        # Lapisan 3: Token hampir kosong
        if len(tokens) < 2:
            return "Tidak Berisiko", 0.90

        # Lapisan 4: Model tidak tersedia
        if not self.model or not self.vectorizer:
            logger.warning("⚠️  Model tidak tersedia, pakai fallback")
            return "Tidak Berisiko", 0.5

        # Lapisan 5: Model Naïve Bayes
        try:
            vec        = self.vectorizer.transform([processed])
            prediction = self.model.predict(vec)[0]       # 1=Berisiko, 0=Tidak
            proba      = self.model.predict_proba(vec)[0]
            confidence = float(max(proba))
            label      = "Berisiko" if prediction == 1 else "Tidak Berisiko"
            logger.info(f"📊 [MODEL] {label} ({confidence:.2f}) | '{text[:60]}'")
            return label, confidence
        except Exception as e:
            logger.error(f"❌ Klasifikasi gagal: {e}")
            return "Tidak Berisiko", 0.5


# Singleton
classification_service = ClassificationService()