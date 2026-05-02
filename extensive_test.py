import sys
import os

# Tambahkan folder Bacend ke path agar bisa import app.services
sys.path.append(os.path.join(os.getcwd(), 'Bacend'))

from app.services.classification_service import classification_service

def run_test():
    test_cases = [
        # --- Kategori: Kata Kasar Langsung ---
        ("anjing", "Berisiko"),
        ("ANJING", "Berisiko"),
        ("Anjing", "Berisiko"), # Sebelumnya kena rule nama, sekarang harusnya terdeteksi kasar
        ("dasar bangsat lo", "Berisiko"),
        ("kontol", "Berisiko"),
        ("Kontol", "Berisiko"),
        
        # --- Kategori: Nama Orang (Harus Aman) ---
        ("Dimas Kurniawan", "Tidak Berisiko"),
        ("Budi Santoso", "Tidak Berisiko"),
        ("Siti Aminah", "Tidak Berisiko"),
        ("Andi", "Tidak Berisiko"),
        
        # --- Kategori: URL & Phishing ---
        ("klik link ini bit.ly/test", "Berisiko"),
        ("bit://iy", "Berisiko"),
        ("https://s.id/ancaman", "Berisiko"),
        ("t.ly/palsu", "Berisiko"),
        ("coba cek google.com", "Tidak Berisiko"), # Domain umum biasanya aman
        
        # --- Kategori: Ambigu + Konteks ---
        ("nonton bokep yuk", "Berisiko"),
        ("bagi link porno dong", "Berisiko"),
        ("nonton film bareng", "Tidak Berisiko"),
        ("coba lihat ini", "Tidak Berisiko"),
        
        # --- Kategori: Pesan Normal ---
        ("Halo apa kabar?", "Tidak Berisiko"),
        ("Besok kita kumpul jam 9 ya", "Tidak Berisiko"),
        ("Saya sedang di jalan", "Tidak Berisiko"),
        ("Terima kasih banyak ya", "Tidak Berisiko"),
        
        # --- Kategori: Pesan Pendek/Spesial ---
        ("ok", "Tidak Berisiko"),
        ("wkwk", "Tidak Berisiko"),
        ("!!!", "Tidak Berisiko"),
        ("test", "Tidak Berisiko"),
        
        # --- Kategori: Variasi Penulisan ---
        ("a n j i n g", "Berisiko"), # Tergantung preprocessing
        ("b4ngsat", "Berisiko"), # Tergantung preprocessing
    ]

    print(f"{'INPUT':<40} | {'EKSPEKTASI':<15} | {'HASIL':<15} | {'STATUS'}")
    print("-" * 85)

    passed = 0
    failed = 0

    for text, expected in test_cases:
        label, conf = classification_service.classify(text)
        status = "PASSED" if label == expected else "FAILED"
        
        if status == "PASSED":
            passed += 1
        else:
            failed += 1
            
        print(f"{text[:40]:<40} | {expected:<15} | {label:<15} | {status}")

    print("-" * 85)
    print(f"TOTAL: {len(test_cases)} | PASSED: {passed} | FAILED: {failed}")

if __name__ == "__main__":
    run_test()
