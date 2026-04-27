import joblib # type: ignore
import os
import sys
import __main__

# 1. Definisikan fungsi dengan nama 'preprocessing_fn' (Sesuai error di terminal)
def preprocessing_fn(text):
    # Contoh sederhana: kecilkan huruf dan hapus karakter non-alfanumerik
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text

# 2. Inject ke __main__ agar joblib bisa menemukannya saat loading
setattr(__main__, 'preprocessing_fn', preprocessing_fn)

# 3. Path model
model_path = "E:\\Messaging_Pengamanan_Data\\Bacend\\model\\model_naive_bayes.joblib"

if os.path.exists(model_path):
    try:
        # Load file joblib
        loaded = joblib.load(model_path)
        
        # Sesuai instruksi pemilik code:
        model = loaded['nb_model']
        tfidf = loaded['tfidf_vectorizer']
        # Gunakan fungsi prep asli dari dalam model jika ada
        prep  = loaded.get('preprocessing_fn', preprocessing_fn)

        print(f"✅ Berhasil Load Model!")
        print("-" * 30)

        def prediksi(pesan):
            pesan = str(pesan).strip()
            if len(pesan) < 4:
                return {"label": "Tidak Berisiko", "keyakinan": 99.0}
            
            # Gunakan fungsi preprocessing
            bersih = prep(pesan)
            
            vec = tfidf.transform([bersih])
            label = model.predict(vec)[0]
            prob = max(model.predict_proba(vec)[0]) * 100
            
            return {"label": label, "keyakinan": prob}

        # Test
        test_words = ["k", "pin anda 123456", "kau di mana nga ada nya di sini", "selamat pagi", "bit:iy"]
        for word in test_words:
            hasil = prediksi(word)
            print(f"Pesan: '{word}' -> {hasil['label']} ({hasil['keyakinan']:.2f}%)")

    except Exception as e:
        print(f"❌ Terjadi kesalahan saat load: {e}")
else:
    print(f"❌ File tidak ditemukan!")