import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

source = nb['cells'][7]['source']
new_source = []
for line in source:
    if "'peler','puting','nenen','susu','vagina','penis'," in line:
        line = line + "    'fwb','ons','cs','crot','smean','ebes','ani-ani','michat',\n    'lendir','esek-esek','bispak','jablay','pecun','desahan',\n"
    new_source.append(line)

nb['cells'][7]['source'] = new_source

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("KATA_KASAR updated with more adult words")
