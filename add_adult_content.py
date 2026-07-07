import csv

text = """
aku mau nenen dong
nenen kamu besar kali pap dong
pap nenen dong
pap tt dong
lagi sange nih pengen
desah dong sayang
kirim pap nudes kamu
bagi video bokep terbaru
pap susu dong biar sange
pengen sange bareng
lagi horny nih vc yuk
pap toket dong yang gede
ngaceng lihat kamu
kirim foto bugil ke sini
open bo area jakarta
open VCS murah sange
nenen kamu montok banget
pap memek dong
vc sex yuk sange
pengen ngewe sama kamu
colmek bareng yuk di vc
coli liat pap kamu
"""

lines = text.strip().split('\n')
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

for line in lines:
    msg = line.strip()
    if not msg:
        continue
    
    max_id += 1
    new_rows.append([max_id, msg, "Konten Ilegal", "Berisiko"])
    
    # duplicate slightly to reinforce
    for i in range(2):
        max_id += 1
        new_rows.append([max_id, msg + f" {i}", "Konten Ilegal", "Berisiko"])

with open('e:\\Messaging_Pengamanan_Data\\Dataset\\dataset_fixed.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)

print("Added adult content sentences to dataset")
