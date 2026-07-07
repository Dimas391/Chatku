import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for idx, cell in enumerate(nb.get('cells', [])):
    if cell.get('cell_type') == 'code':
        source = cell.get('source', [])
        new_source = []
        for l_idx, line in enumerate(source):
            if "PREPROCESS_VERSION      =" in line:
                line = line.replace("preprocess_v1_", "preprocess_v2_")
            new_source.append(line)
        nb['cells'][idx]['source'] = new_source

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)
