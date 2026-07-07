import csv

# Additional gambling and adult messages
additional_messages = [
    # Togel / Judi
    "prediksi angka togel malam ini",
    "angka jitu malam ini pasti tembus",
    "prediksi angka hongkong keluar besok",
    "bocoran angka sgp hari ini",
    "jitu togel macau",
    "pasang angka hongkong sekarang",
    "rumus angka jitu tembus 4d",
    "bocoran hk malam ini paling jitu",
    "keluaran angka hongkong terbaru",
    # Dewasa
    "pap tetek dong",
    "tetek kamu besar banget",
    "mau pegang payudara kamu",
    "payudara montok banget",
    "foto payudara dong",
    "isep tetek kamu",
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

for msg in additional_messages:
    msg = msg.strip()
    if not msg:
        continue
    
    # Kategori Judi untuk togel, Konten Ilegal untuk dewasa
    kategori = "Judi" if "angka" in msg or "togel" in msg or "hk" in msg else "Konten Ilegal"
    
    max_id += 1
    new_rows.append([max_id, msg, kategori, "Berisiko"])
    # Duplicate slightly
    for i in range(2):
        max_id += 1
        new_rows.append([max_id, msg + f" {i}", kategori, "Berisiko"])

with open('e:\\Messaging_Pengamanan_Data\\Dataset\\dataset_fixed.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)

print("Berhasil menambahkan data judi dan dewasa tambahan ke dataset.")
