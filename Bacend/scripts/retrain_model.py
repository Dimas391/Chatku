import pandas as pd
import numpy as np
import joblib
import re
import os
import time
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

def tokenisasi(text):
    # Tandai pola URL mencurigakan
    text = re.sub(
        r'(https?://\S+|bit\.ly\S+|s\.id\S+|rb\.gy\S+|t\.ly\S+'
        r'|cutt\.ly\S+|ow\.ly\S+|tinyurl\S+|shorturl\S+)',
        'url_mencurigakan', text
    )
    # Tandai nomor HP
    text = re.sub(r'\b0\d{8,12}\b', 'nomor_hp_asing', text)
    # Tandai kode OTP (4-8 digit)
    text = re.sub(r'\b\d{4,8}\b', 'kode_otp', text)
    # Tandai nominal uang
    text = re.sub(
        r'rp\s?\d+[\.,]?\d*\s*(juta|ribu|rb)?',
        'nominal_uang', text
    )
    # Hapus karakter selain huruf, angka, underscore
    text = re.sub(r'[^a-z0-9_\s]', ' ', text)
    # Pecah menjadi token
    tokens = text.split()
    return tokens

# Setup Stopwords
sw_factory     = StopWordRemoverFactory()
base_stopwords = sw_factory.get_stop_words()
extra_stopwords = [
    'anda','kamu','saya','kami','kita','nya','ini','itu',
    'di','ke','dari','dan','atau','yang','dengan','untuk',
    'ada','akan','sudah','telah','bisa','tidak','jangan',
    'tolong','mohon','segera','sekarang','hari','bulan',
    'tahun','jam','menit','juta','ribu','rb','rp','ya',
    'yg','jg','gak','ga','deh','dong','nih','lah','sih',
    'ku','mu','klo','kalau','tapi','jadi','bisa','agar',
]
STOPWORDS = set(base_stopwords + extra_stopwords)

def hapus_stopword(tokens):
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]

# Setup Stemmer
stemmer_factory = StemmerFactory()
stemmer         = stemmer_factory.create_stemmer()

def stemming(tokens):
    hasil = []
    for token in tokens:
        # Token khusus tidak di-stem agar maknanya tidak berubah
        if token.startswith(('url_', 'nomor_', 'kode_', 'nominal_')):
            hasil.append(token)
        else:
            hasil.append(stemmer.stem(token))
    return hasil

def preprocessing_lengkap(text):
    """Fungsi preprocessing lengkap untuk dipakai saat prediksi."""
    # Case Folding
    text = str(text).lower()
    # Tokenisasi
    tokens = tokenisasi(text)
    # Stopword Removal
    tokens = hapus_stopword(tokens)
    # Stemming
    tokens = stemming(tokens)
    return ' '.join(tokens)

def main():
    print("=" * 60)
    print("  PELATIHAN ULANG MODEL NAÏVE BAYES ")
    print("=" * 60)

    # Resolve paths relative to script location
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
    
    print("\n[1] Memuat dataset...")
    dataset_path = os.path.join(PROJECT_ROOT, 'Dataset', 'dataset_deteksi_pesan_improved.csv')
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        return

    df = pd.read_csv(dataset_path, encoding='latin-1')
    print(f"    Total data   : {len(df)} baris")

    print("\n[2] Preprocessing (Case Folding, Tokenisasi, Stopword, Stemming)...")
    print("    Proses ini memerlukan waktu, harap tunggu...")
    
    start = time.time()
    # Step by step to match notebook logic
    df['step_casefolding'] = df['pesan'].apply(lambda x: str(x).lower())
    df['step_tokenisasi'] = df['step_casefolding'].apply(tokenisasi)
    df['step_stopword'] = df['step_tokenisasi'].apply(hapus_stopword)
    df['step_stemming'] = df['step_stopword'].apply(stemming)
    df['teks_bersih'] = df['step_stemming'].apply(lambda x: ' '.join(x))
    elapsed = time.time() - start
    print(f"    Selesai dalam {elapsed:.1f} detik")

    print("\n[3] Split Data Training dan Testing (80:20)...")
    X = df['teks_bersih']
    y = df['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\n[4] Ekstraksi Fitur — TF-IDF...")
    tfidf = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
        min_df=2
    )
    X_train_tfidf = tfidf.fit_transform(X_train)
    X_test_tfidf  = tfidf.transform(X_test)

    print("\n[5] Training Model Multinomial Naïve Bayes...")
    nb_model = MultinomialNB(alpha=0.5)
    nb_model.fit(X_train_tfidf, y_train)

    print("\n[6] Evaluasi Model...")
    y_pred = nb_model.predict(X_test_tfidf)
    acc  = accuracy_score(y_test, y_pred)
    print(f"    Accuracy : {acc*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print("\n[7] Menyimpan model...")
    # Save to multiple locations to be safe
    output_paths = [
        os.path.join(PROJECT_ROOT, 'model_naive_bayes.joblib'),
        os.path.join(PROJECT_ROOT, 'Bacend', 'model', 'model_naive_bayes.joblib')
    ]

    model_data = {
        'model':              nb_model, # classification_service.py expects 'model'
        'nb_model':           nb_model, # notebook expects 'nb_model'
        'vectorizer':         tfidf,    # classification_service.py expects 'vectorizer'
        'tfidf_vectorizer':   tfidf,    # notebook expects 'tfidf_vectorizer'
        'preprocessing_fn':   preprocessing_lengkap,
        'stopwords':          list(STOPWORDS),
        'labels':             list(df['label'].unique()),
        'categories':         list(df['kategori'].unique()),
        'metadata': {
            'total_data':     len(df),
            'accuracy':       round(acc, 4),
        }
    }

    for path in output_paths:
        dir_name = os.path.dirname(path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name)
        joblib.dump(model_data, path)
        print(f"    Model disimpan ke: {path}")

    print("\n" + "=" * 60)
    print("  RETRAINING SELESAI")
    print("=" * 60)

if __name__ == "__main__":
    main()
