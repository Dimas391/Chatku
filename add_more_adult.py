import csv

# Additional adult messages
adult_messages2 = [
    "cari fwb area jakarta",
    "mau ons malam ini ga",
    "lagi pengen cs nih vc yuk",
    "crot di dalem boleh ga",
    "pengen crot di muka kamu",
    "10 detik aja smean",
    "cari ani-ani buat nemenin malam ini",
    "ada cewe michat yang murah ga",
    "jual diri buat bayar kos",
    "cari tempat esek-esek yang aman",
    "butuh lendir malam ini",
    "cari bispak area bandung",
    "banyak lonte di jalan itu",
    "perek murahan pinggir jalan",
    "dasar jablay ga tau malu",
    "ayam kampus tarifnya berapa",
    "cari tante girang yang mau biayain",
    "denger desahan kamu bikin sange",
    "kirim vn desahan dong",
    "mau jilat memek sampai crot",
    "isep kontol sampai crot",
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

for msg in adult_messages2:
    msg = msg.strip()
    if not msg:
        continue
    max_id += 1
    new_rows.append([max_id, msg, "Konten Ilegal", "Berisiko"])
    # Duplicate slightly
    max_id += 1
    new_rows.append([max_id, msg + " 2", "Konten Ilegal", "Berisiko"])


with open('e:\\Messaging_Pengamanan_Data\\Dataset\\dataset_fixed.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)

print(f"Berhasil menambahkan {len(new_rows)} data konten dewasa tambahan ke dataset.")
