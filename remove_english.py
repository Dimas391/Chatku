import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

source = nb['cells'][7]['source']
new_source = []
for line in source:
    if "'the','a','an'" in line:
        continue
    if "'have','has','had'" in line:
        continue
    if "'can','could','may'" in line:
        continue
    if "'in','on','at'" in line:
        continue
    if "'this','it','i'" in line:
        continue
    if "'your','his','her'" in line:
        continue
    if "'and','so','if'" in line:
        continue
    if "'what','who','which'" in line:
        continue
    if "Sastrawi + custom + English" in line:
        line = line.replace("Sastrawi + custom + English", "Sastrawi + custom")
    new_source.append(line)

nb['cells'][7]['source'] = new_source

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)
