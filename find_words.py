import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for idx, cell in enumerate(nb.get('cells', [])):
    if cell.get('cell_type') == 'code':
        source = cell.get('source', [])
        for l_idx, line in enumerate(source):
            if "'the','a','an'" in line or 'the' in line:
                print(f"Cell {idx}, Line {l_idx}: {line}")
