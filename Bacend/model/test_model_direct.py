import re
import joblib # type: ignore
import os
import sys
import warnings

# Abaikan peringatan versi scikit-learn agar output bersih
from sklearn.exceptions import InconsistentVersionWarning
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

# 1. Path model
# Gunakan path relatif agar lebih fleksibel atau sesuaikan dengan path absolut Anda
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(ROOT_DIR, "model", "model_naive_bayes.joblib")

if os.path.exists(model_path):
    try:
        # Load file joblib
        data = joblib.load(model_path)
        # Perbaikan KEY: Sesuai isi file joblib
        model      = data.get('model')
        tfidf      = data.get('vectorizer')
        kata_kasar = set(data.get('kata_kasar', []))
        stopwords  = set(data.get('stopwords', []))
        pola_url   = data.get('pola_url')

        # Konstanta baru dari notebook fixed
        KATA_AMBIGUOUS = {'porno', 'bugil', 'telanjang', 'mesum'}
        KONTEKS_NEGATIF = {
            'yuk','ayo','mau','sini','coba','nonton','lihat','download',
            'kirim','bagi','share','klik','link','join','masuk'
        }

        if not model or not tfidf:
            raise ValueError("Model atau Vectorizer tidak ditemukan dalam file joblib!")

        print(f"Berhasil Load Model!")
        print(f"Accuracy Model: {data.get('metadata', {}).get('accuracy', '?')}")
        print("-" * 50)

        def _is_kemungkinan_nama(text):
            words = text.strip().split()
            if not words or len(words) > 5: return False
            all_cap = all(w[0].isupper() for w in words if w)
            no_special = bool(re.match(r'^[A-Za-z\s]+$', text.strip()))
            # Cek kata kasar
            mengandung_kasar = any(w.lower() in kata_kasar for w in words)
            return all_cap and no_special and not mengandung_kasar

        def preprocess_simple(text):
            """Logika preprocessing yang mendekati production"""
            t = str(text).lower().strip()
            t = re.sub(pola_url or r'http\S+', 'URL_CURIGA', t)
            t = re.sub(r'\b0\d[\d\-]{8,12}\b', 'NOMOR_HP_ASING', t)
            t = re.sub(r'[^a-z\s]', ' ', t)
            tokens = [x for x in t.split() if len(x) > 0]
            tokens = [x for x in tokens if x in kata_kasar or (x not in stopwords and len(x) > 1)]
            return ' '.join(tokens) if tokens else 'PESAN_KOSONG'

        def prediksi(pesan):
            pesan_strip = str(pesan).strip()
            
            # Rule 1: Pendek
            if len(pesan_strip) < 4:
                return {"label": "Tidak Berisiko", "keyakinan": 99.0, "metode": "Rule: Pendek"}
            
            # Rule 2: Nama Orang (NEW)
            if _is_kemungkinan_nama(pesan_strip):
                return {"label": "Tidak Berisiko", "keyakinan": 95.0, "metode": "Rule: Nama Orang"}

            # Rule 3: Kata Kasar Keras
            t_clean = re.sub(r'[^a-z\s]', ' ', pesan_strip.lower())
            tokens = set(t_clean.split())
            kata_kasar_keras = kata_kasar - KATA_AMBIGUOUS
            if tokens & kata_kasar_keras:
                return {"label": "Berisiko", "keyakinan": 99.0, "metode": "Rule: Kata Kasar"}
            
            # Rule 4: Kata Ambigu + Konteks (NEW)
            if (tokens & KATA_AMBIGUOUS) and (tokens & KONTEKS_NEGATIF):
                return {"label": "Berisiko", "keyakinan": 92.0, "metode": "Rule: Ambigu+Konteks"}

            # Rule 4b: URL Mencurigakan (NEW)
            pola_luas = r'((https?|ftp|bit|s|t|rb|cutt)://\S+|(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|[\w-]+\.xyz|[\w-]+\.site)\S*)'
            if re.search(pola_luas, pesan_strip.lower()):
                return {"label": "Berisiko", "keyakinan": 92.0, "metode": "Rule: URL Terdeteksi"}

            # Rule 5: Model Naive Bayes (Threshold 65%)
            bersih = preprocess_simple(pesan_strip)
            vec = tfidf.transform([bersih])
            proba = model.predict_proba(vec)[0]
            
            is_risky = proba[1] >= 0.65
            label = "Berisiko" if is_risky else "Tidak Berisiko"
            return {"label": label, "keyakinan": max(proba) * 100, "metode": "Model: Naive Bayes"}

        # Test
        test_words = [
            "bit.ly", 
            "bit://iy",
            "dasar anjing lo bangsat", 
            "selamat pagi apa kabar", 
            "k",
            "Dimas Kurniawan",
            "Kontol"
        ]
        
        for word in test_words:
            hasil = prediksi(word)
            print(f"[{hasil['metode']}]")
            print(f"Pesan: '{word}'")
            print(f"Hasil: {hasil['label']} ({hasil['keyakinan']:.2f}%)\n")

    except Exception as e:
        print(f"❌ Terjadi kesalahan: {e}")
        import traceback
        traceback.print_exc()
else:
    print(f"❌ File tidak ditemukan di: {model_path}")
