import csv

# Dataset pesan konten dewasa yang komprehensif untuk training model klasifikasi
# Tujuan: model dapat mendeteksi konten seksual eksplisit dalam pesan
adult_messages = [
    # Kata organ/tubuh dalam konteks seksual
    "peler kamu gede banget ya",
    "mau liat peler dong",
    "peler gue lagi tegang",
    "puting susu kamu mulus banget",
    "puting kamu keliatan nih",
    "foto puting dong",
    "memek kamu basah ga",
    "pap memek sekarang",
    "foto memek kamu dong",
    "kontol lagi berdiri nih",
    "foto kontol dong",
    "pap kontol kamu",
    "toket gede pap dong",
    "pap toket montok kamu",
    "titit kamu besar ga",
    "titit lagi kencang nih",
    "pepek basah dong liat aku",
    "pepek kamu harum ga",
    "pap pepek kamu sekarang",
    "bokong kamu gede banget sexy",
    "pap bokong kamu dong",
    "mau liat vagina kamu",
    "penis kamu panjang ga",
    "foto vagina dong kirimin ke aku",
    "pap penis dong biar sange",
    # Pap / foto seksual
    "kirim pap nudes sekarang",
    "pap badan tanpa baju dong",
    "foto telanjang bulat dong",
    "kirim foto bugil kamu",
    "share foto vulgar dong",
    "pap lingerie kamu yang tipis",
    "foto pap nude dong",
    "kirimin video bugil kamu",
    "mau liat foto bokep kamu",
    "kirim konten hot dong",
    # Aktivitas seksual
    "mau ngentot bareng ga",
    "pengen ML bareng kamu",
    "pengen ngewe sama kamu",
    "ayo ngewe sekarang",
    "colmek bareng yuk",
    "coli liat foto kamu",
    "pengen ML di rumah kamu",
    "vc bugil yuk biar sange",
    "vc sex malam ini",
    "vc sambil colmek yuk",
    "mau mainin kamu sampai basah",
    "mau jilat memek kamu",
    "mau isep peler kamu",
    "oral sex dulu dong",
    "anal bareng yuk",
    # Ungkapan birahi/seksual
    "sange banget nih lagi",
    "lagi horny mau ML ga",
    "birahi banget pengen kamu",
    "pengen ranjang bareng kamu",
    "mau one night stand ga",
    "open BO area sini",
    "open VCS murahan ga",
    "tarif BO kamu berapa",
    "cari teman tidur malam ini",
    "cari yang mau ML no strings",
    # Konten pornografi
    "link bokep terbaru dong",
    "share situs porno gratis",
    "download bokep hd di mana",
    "nonton film porno bareng yuk",
    "punya video mesum ga",
    "share video hot kamu",
    "kirimin video porno ke aku",
    "video ngentot paling baru",
    "link situs bokep terlengkap",
    "download video bugil dong",
    # Grup/komunitas konten dewasa
    "gabung grup foto bugil yuk",
    "join grup bokep telegram",
    "masuk grup VCS murah",
    "invite grup konten panas",
    "grup foto hot ada ga",
    # Kata kunci selingkuh / pelecehan seksual
    "mau selingkuh bareng sama aku",
    "pengen cium bibir kamu",
    "pengen pegang dada kamu",
    "boleh pegang bokong kamu ga",
    "pengen tidur sama kamu semalam",
    # Variasi slang
    "nenen besar pap dong",
    "pap susu dong gede",
    "tt kamu kencang banget",
    "idungnya mancung sekalian pap toket",
    "minta pap dada polos dong",
    "kirim foto dada tanpa bra",
    "liat cd kamu boleh ga",
    "pap celana dalem kamu dong",
    "pap bra kamu yang tipis",
    "nudes full body dong kirimin",
]

new_rows = []
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

for msg in adult_messages:
    msg = msg.strip()
    if not msg:
        continue
    max_id += 1
    new_rows.append([max_id, msg, "Konten Ilegal", "Berisiko"])

with open('e:\\Messaging_Pengamanan_Data\\Dataset\\dataset_fixed.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)

print(f"Berhasil menambahkan {len(new_rows)} data konten dewasa ke dataset.")
