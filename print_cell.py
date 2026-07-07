import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

source = nb['cells'][7]['source']
for i, line in enumerate(source):
    print(f"{i}: {line.rstrip()}")
