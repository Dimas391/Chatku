import csv
import re
import uuid

# Parse the user's text from the previous prompt
text = """
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: hack akun] cara hack akun instagram orang lain
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: keylogger] download keylogger gratis
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: mencuri password] cara mencuri password wifi tetangga
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: script phishing] script phishing facebook terbaru
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: bypass otp] cara bypass otp bank
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: crack software] crack software premium tanpa bayar
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: jual database] jual database pelanggan lengkap
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: bobol akun] cara bobol akun gmail
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: exploit website] exploit website target menggunakan sql i
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 7 — Cyber abuse: mengontrol hp korban] unduh malware untuk mengontrol hp korban
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] klik b i t . l y / hadiah sekarang
  Berisiko          Berisiko           91.7%  ✓ OK  [Model NB — P(Berisiko)=91.7%] akses bank-login dot xyz sekarang
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] kunjungi hxxp://bonus-saldo.xyz
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] cek hadiah di bi t .ly /claim
  Berisiko          Berisiko           97.6%  ✓ OK  [Model NB — P(Berisiko)=97.6%] login di bank[dot]security-verif[dot]com
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] verifikasi akun melalui tinyurl.com/bonu
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] akses goo.gl/reward
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] buka link berikut t.me/bonusgratis
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] join grup hadiah di wa.me/628123456789
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] cek promo di bitly.com/claimreward
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: nomor kartu] saya dari bank, sebutkan nomor kartu and
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: cvv] berikan cvv kartu kredit anda
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: kirim otp] tolong kirim otp yang baru masuk
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: pin m banking] konfirmasi pin m banking anda
  Berisiko          Berisiko           95.5%  ✓ OK  [Model NB — P(Berisiko)=95.5%] masukkan password email untuk validasi
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: verifikasi identitas] akun anda dibekukan segera verifikasi id
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: rekening tidak diblokir] klik tautan berikut agar rekening tidak 
  Berisiko          Berisiko           94.3%  ✓ OK  [Model NB — P(Berisiko)=94.3%] data anda tidak valid silakan kirim nik 
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: klaim hadiah] klaim hadiah sekarang sebelum hangus
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: memenangkan undian] anda memenangkan undian nasional sebesar
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: ga pantas hidup] orang kayak lo ga pantas hidup
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: bodoh seperti kamu] semua orang bodoh seperti kamu
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: harap lo celaka] gue harap lo celaka
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: hidup lo ga ada gunanya] hidup lo ga ada gunanya
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: sampah masyarakat] pergi sana sampah masyarakat
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: manusia gagal] dasar manusia gagal
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: mati aja] mending lo mati aja
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: ga ada yang suka sama lo] ga ada yang suka sama lo
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: beban keluarga] lo memang beban keluarga
  Berisiko          Berisiko           94.0%  ✓ OK  [Layer 12 — Harassment: jangan muncul lagi] jangan muncul lagi di depan gue
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: ingin mengakhiri hidup] aku ingin mengakhiri hidupku
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: lebih baik mati] lebih baik mati saja
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: capek hidup] aku capek hidup
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: tidak ada alasan untuk hidup] tidak ada alasan untuk hidup lagi
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: ingin bunuh diri] aku ingin bunuh diri
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: cara untuk mati] aku sudah menyiapkan cara untuk mati
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: kalau aku tidak ada] semuanya akan lebih baik kalau aku tidak
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: melukai diriku] aku ingin melukai diriku sendiri
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: tidak sanggup hidup] aku tidak sanggup hidup lagi
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: menghilang selamanya] aku ingin menghilang selamanya
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: jual sabu] jual sabu kualitas terbaik
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: narkoba] cara membuat narkoba sendiri
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: beli ganja] tempat beli ganja online
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: paket ekstasi] paket ekstasi murah
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: putaw] jual putaw aman
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: distributor narkotika] distributor narkotika terpercaya
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: sabu] cara konsumsi sabu yang benar
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: beli kokain] beli kokain tanpa resep
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: obat terlarang paling kuat] obat terlarang paling kuat
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 5 — Narkoba: transaksi ganja] transaksi ganja via telegram
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: slot gacor] slot gacor hari ini
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: deposit sekarang menang besar] deposit sekarang menang besar
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: togel] prediksi togel malam ini
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: judi online] link judi online terpercaya
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: casino] main casino online resmi
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: bonus member baru] bonus member baru 100 persen
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: taruhan] pasang taruhan sekarang
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: bandar togel] bandar togel terbesar
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: poker] situs poker online terbaik
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 6 — Judi: jackpot] jackpot slot gampang menang
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] @nj!ng lo
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] a.n.j.i.n.g
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: kontol] k0nt0l
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: goblok] g*b*l*k
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bangsat] b@ngs@t
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: goblok] goblokkkkkkkkk
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: kontol] koooontol
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: babi] babiiiii
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjg] anjg lu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: njing] njing banget
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: kontol] kontol lo!
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: babi, kontol] kontol lahh kau babi
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bangsat] BANGSAT!!
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] dasar anjing kamu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: babi] babi lu ngomong apa
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: tai] tai banget sih orang ini
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: goblog] goblog kamu tuh
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: kampret] kampret emang dasar
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: mampus] mampus lo sana
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: keparat] keparat kamu ini
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: sialan] sialan dasar munafik
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: pukimak] pukimak kau
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bangsat] bangsat pergi sana
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bacot] bacot mulu dari tadi
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bego] bego banget sih
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: monyet] monyet kamu tuh
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bedebah] bedebah emang orang itu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: goblok] goblok banget lo
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] anjing beneran lo
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: setan] setan kamu pergi
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] anjinggg banget sih lo
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] 4nj1ng lu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjing] a n j i n g kamu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: bangsat] b4ngsat banget
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: goblok] g0bl0k kamu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: kontoll] kontoll lu
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: babi] b*bi emang
  Berisiko          Berisiko           94.7%  ✓ OK  [Model NB — P(Berisiko)=94.7%] k*ntol lo
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: anjir] anjirrr parah banget
  Berisiko          Berisiko           99.0%  ✓ OK  [Layer 13 — Kata kasar/obfuscation: njirr] njirr nyebelin banget
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: gue habisin] awas lo gue habisin nanti
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: gue bunuh] gue bunuh kamu kalau berani
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: gue cari] tunggu aja nanti gue cari
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: berani berani] berani-berani lo gue sikat
  Berisiko          Berisiko           97.0%  ✓ OK  [Layer 4 — Self-harm: mati aja] mati aja lo sekalian
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: gue tembak] gue tembak kamu kalau ketemu
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: rumah lo gue bakar] rumah lo gue bakar
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: nyawa lo gue ambil] nyawa lo gue ambil
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: jangan sampe ketemu] jangan sampe ketemu di jalan
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 10 — Ancaman kekerasan: gue hajar] gue laporin dan gue hajar kamu
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: nonton bokep] yuk nonton bokep bareng
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: video porno] ayo lihat video porno sama aku
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: foto bugil] kirim foto bugil ke sini
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: nonton yang mesum] mau nonton yang mesum yuk
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: konten telanjang] share konten telanjang dong
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: porno gratis] download video porno gratis di sini
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: bokep] link bokep terbaru klik sini
  Berisiko          Berisiko           96.0%  ✓ OK  [Layer 11 — Konten dewasa: gabung grup foto bugil] gabung grup foto bugil
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] Akun BRI terdeteksi mencurigakan. Verifi
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] Download APK WhatsApp terbaru di shortur
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] klik link ini bit.ly/hadiahgratis untuk 
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] login ke https://bank-login.xyz/akun sek
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] verifikasi akun di hxxps://bank-palsu.xy
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] buka hxxps://bank-palsu.xyz/login untuk 
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] masuk ke http://192.168.1.1/login sekara
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] akses s.id/bonussaldo untuk klaim reward
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] unduh aplikasi di cutt.ly/apk-update
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 9 — URL mencurigakan] cek hadiahmu di rb.gy/reward123
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: menang rp] Selamat menang Rp50 juta. Klik link ini 
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: kode otp] Berikan kode OTP 819234 kepada saya untu
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: dijamin wa] Bisnis online profit 30% dijamin WA 0812
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: free entry] Free entry win FA Cup final tkts! Text t
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: lucky winner] WINNER!! You have been selected as a luc
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: kirim password] tolong kirim password akun kamu ke nomor
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: pin atm] masukkan pin atm kamu di form berikut un
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: kode verifikasi] berikan kode verifikasi yang masuk ke hp
  Berisiko          Berisiko           99.1%  ✓ OK  [Model NB — P(Berisiko)=99.1%] selamat anda terpilih mendapat hadiah 10
  Berisiko          Berisiko           99.9%  ✓ OK  [Model NB — P(Berisiko)=99.9%] akun anda akan diblokir segera verifikas
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: saldo gratis] dapatkan saldo gratis Rp500.000 daftar s
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: buka blokir akun] transfer Rp100.000 sekarang untuk buka b
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: kirim sandi] kirim sandi akun kamu ke admin untuk pro
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: minta pin] minta pin akun kamu sekarang untuk keama
  Berisiko          Berisiko           95.0%  ✓ OK  [Layer 8 — Social engineering: isi email dan password] isi email dan password kamu di form ini 
"""

lines = text.strip().split('\n')
new_rows = []

# Get current max ID
max_id = 0
with open('e:\\Messaging_Pengamanan_Data\\Dataset\\dataset_fixed.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        try:
            curr_id = int(row[0])
            if curr_id > max_id:
                max_id = curr_id
        except:
            pass

for line in lines:
    if "Berisiko" in line and "Tidak Berisiko" not in line:
        # Extract the actual message at the end
        match = re.search(r'\]\s+(.*)', line)
        if match:
            msg = match.group(1).strip()
            
            # Determine category from layer info
            layer_match = re.search(r'\[Layer \d+ — (.*?)\]', line)
            if layer_match:
                cat = layer_match.group(1).split(':')[0]
            else:
                cat = "Lainnya"
            
            # We want to use similar categories as in the existing CSV
            if "Social engineering" in line or "URL mencurigakan" in line or "phishing" in line.lower() or "cyber abuse" in line.lower():
                final_cat = "Phishing & Social Engineering"
            elif "Kata kasar" in line or "Harassment" in line or "Self-harm" in line or "Ancaman" in line:
                final_cat = "Kata Kasar & Ancaman"
            elif "Narkoba" in line or "Judi" in line or "Konten dewasa" in line:
                final_cat = "Konten Ilegal"
            else:
                final_cat = "Phishing & Social Engineering"

            max_id += 1
            new_rows.append([max_id, msg, final_cat, "Berisiko"])

print(f"Adding {len(new_rows)} new rows to dataset_fixed.csv")

with open('e:\\Messaging_Pengamanan_Data\\Dataset\\dataset_fixed.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)
