# Panduan Implementasi Arsitektur E2EE Murni & Klasifikasi Sisi Klien (Client-Side)

Dokumen ini menjelaskan alur sistem akhir dalam bentuk kalimat dan langkah-langkah pengerjaan proyek untuk bermigrasi dari arsitektur *Server-Side Decryption* ke arsitektur **Client-Side Classification & E2EE Murni (Privasi Mutlak ala WhatsApp)**.

---

## 1. Alur Sistem Aplikasi Akhir (Dalam Kalimat)

Berikut adalah alur perjalanan pesan dari pengirim ke penerima ketika sistem sudah selesai dibangun:

1. **Pengguna Mengetik Pesan:** Pengirim menulis pesan teks pada kolom input obrolan di aplikasi HP (Frontend).
2. **Prapemrosesan Teks Lokal:** Ketika tombol "Kirim" diklik, aplikasi menahan pengiriman pesan dan memproses teks tersebut di dalam RAM HP pengirim. Teks diubah menjadi huruf kecil, simbol-simbol dibuang, kata-kata yang tidak penting (stopwords) disaring, dan kata berimbuhan diubah ke kata dasar (stemming).
3. **Deteksi Ancaman Lokal (AI Naïve Bayes):** Teks yang telah bersih kemudian dianalisis secara lokal di HP menggunakan algoritma Naïve Bayes dan daftar kata kasar (*Safety Net*) yang terpasang di memori aplikasi.
4. **Keputusan Pengiriman Lokal:**
   * **Jika Pesan Berisiko (Bahaya):** Proses pengiriman langsung dibatalkan secara sepihak oleh HP pengirim. Pesan dihancurkan dari memori RAM, lalu aplikasi menampilkan peringatan keamanan (misalnya: *"Pesan Anda terdeteksi mengandung unsur siber/kata kasar dan telah diblokir secara lokal"*). Pesan ini **tidak pernah terkirim ke internet** dan tidak pernah sampai ke server.
   * **Jika Pesan Aman:** Proses berlanjut ke tahap enkripsi.
5. **Enkripsi E2EE di HP Pengirim:** HP pengirim membuat kunci AES-256 baru secara acak untuk mengunci pesan tersebut menjadi kode acak (*ciphertext*). Kunci AES ini kemudian dikunci menggunakan **RSA Public Key milik Penerima**. Pengirim juga menghitung nilai hash SHA-256 dari teks asli pesan sebagai segel pengaman.
6. **Pengiriman Paket Terenkripsi:** HP pengirim mengirimkan paket berisi *ciphertext*, kunci AES penerima yang terkunci, IV, dan hash pesan ke server backend melalui koneksi WebSocket. **Tidak ada teks biasa atau kunci server yang dikirim.**
7. **Penyimpanan Buta di Server:** Server backend menerima paket data tersebut. Karena server tidak memiliki kunci privat penerima, server **sama sekali tidak bisa membaca isi pesan**. Server hanya menyimpan data acak (*ciphertext*) tersebut ke database MongoDB dan menyalurkannya ke HP penerima.
8. **Dekripsi Lokal di HP Penerima:** HP penerima mendapatkan paket terenkripsi tersebut. HP penerima menggunakan **RSA Private Key miliknya sendiri** untuk membuka kunci AES, lalu menggunakan kunci AES untuk mengembalikan *ciphertext* menjadi teks asli yang dapat dibaca di layar chat. Penerima juga memverifikasi hash untuk memastikan pesan tidak dimanipulasi.

---

## 2. Alur Pengerjaan Proyek (Implementation Plan)

Untuk bermigrasi ke sistem ini, proyek dikerjakan dalam 5 tahapan utama berikut:

### Tahap 1: Ekspor Model AI dari Backend
* **Aktivitas:** Mengonversi model Naïve Bayes (`model_naive_bayes.joblib`) yang ada di backend menjadi format data terstruktur yang bisa dibaca oleh JavaScript di HP (misalnya format `.json` yang berisi nilai probabilitas kata, daftar *stopwords*, dan daftar kata kasar).
* **Hasil:** File `naive_bayes_model.json` yang siap diimpor ke aplikasi HP.

### Tahap 2: Porting Logika Klasifikasi ke Frontend (React Native / JS)
* **Aktivitas:** 
  * Menulis fungsi prapemrosesan teks (*case folding*, pembersihan karakter khusus) di file frontend (misalnya membuat layanan `clientClassificationService.ts`).
  * Mengintegrasikan library stemming bahasa Indonesia yang ringan di sisi klien (JS/TS).
  * Membuat fungsi kalkulasi Naïve Bayes lokal yang memuat data dari file `naive_bayes_model.json` untuk menghitung skor probabilitas apakah pesan berisiko atau aman.
* **Hasil:** Modul AI lokal yang mampu mengklasifikasikan string teks langsung di RAM handphone.

### Tahap 3: Restrukturisasi Enkripsi & Alur Kirim di Frontend
* **Aktivitas:**
  * Memodifikasi fungsi kirim pesan di halaman chat frontend agar memanggil `clientClassificationService` terlebih dahulu sebelum melakukan enkripsi.
  * Mengubah alur enkripsi pada `encryptionService.ts` untuk menghapus fungsionalitas enkripsi kunci server (`encryptedServerKey` & `ciphertextServer`).
  * Mengatur agar frontend hanya menghasilkan enkripsi untuk penerima (`encryptedUserKey`) dan enkripsi untuk pengirim sendiri (`encryptedSenderKey`).
* **Hasil:** Frontend mandiri yang mampu menyensor pesannya sendiri dan hanya mengirimkan satu jenis *ciphertext* penerima ke server.

### Tahap 4: Penyederhanaan Kode Backend (Clean Up)
* **Aktivitas:**
  * Memodifikasi file route websocket (`websocket.py`) dan chat service (`chat_service.py`) di backend.
  * Menghapus proses impor kunci privat server, fungsi dekripsi pesan server, dan pemanggilan `classification_service` pada saat pengiriman pesan.
  * Backend diubah agar murni bertindak sebagai *router* dan tempat penyimpanan database MongoDB yang menyimpan data terenkripsi secara langsung tanpa inspeksi data.
* **Hasil:** Backend yang lebih ringan, cepat, dan terjamin buta data (*Zero-Knowledge Backend*).

### Tahap 5: Pengujian dan Validasi Privasi
* **Aktivitas:**
  * **Uji Coba Fungsional:** Menguji apakah mengetik pesan kasar di HP pengirim benar-benar memicu pop-up blokir lokal dan mencegah pesan terkirim.
  * **Audit Database:** Memeriksa tabel `messages` di MongoDB untuk memastikan tidak ada kunci server (`encrypted_aes_key_server`) atau pesan teks biasa yang tersimpan.
  * **Uji Coba Penyadapan (MITM):** Memastikan paket data WebSocket yang ditangkap di tengah jalan hanya berisi string enkripsi acak yang tidak bisa didekripsi tanpa kunci privat penerima.
* **Hasil:** Sistem pesan instan E2EE murni dengan sensor AI lokal yang siap didelegasikan dalam dokumen tugas akhir.
