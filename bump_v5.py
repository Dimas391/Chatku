import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

source = nb['cells'][14]['source']
new_source = []
for line in source:
    if "PREPROCESS_VERSION      = " in line:
        line = "PREPROCESS_VERSION      = 'preprocess_v5_case_token_stopword_stemming'\n"
    new_source.append(line)

nb['cells'][14]['source'] = new_source

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Bumped cache to v5")
