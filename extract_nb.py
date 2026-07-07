import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

script_code = ""
for cell in nb.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = cell.get('source', [])
        for line in source:
            if not line.strip().startswith('!'): # skip shell commands
                script_code += line
        script_code += "\n\n"

with open('e:\\Messaging_Pengamanan_Data\\run_model.py', 'w', encoding='utf-8') as f:
    f.write(script_code)

print("Notebook converted to run_model.py")
