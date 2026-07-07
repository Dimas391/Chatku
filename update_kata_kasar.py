import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Find cell 7 (INISIALISASI NLP) and add new adult words to KATA_KASAR.update()
source = nb['cells'][7]['source']
new_source = []
for line in source:
    if "KATA_KASAR.update({" in line:
        # Replace with expanded update that includes adult content keywords
        line = line.replace(
            "KATA_KASAR.update({",
            "KATA_KASAR.update({\n"
            "    # Konten dewasa tambahan\n"
            "    'peler','puting','nenen','susu','vagina','penis',\n"
            "    'sange','horny','birahi','nudes','nude',\n"
            "    'ngaceng','tegang','basah','montok',\n"
            "    'ml','ngewe','ngentot','colmek','coli',\n"
            "    'bo','vcs','vc',\n"
            "    'pap','tt',\n"
            "    # Kata kasar sebelumnya\n"
        )
    new_source.append(line)

nb['cells'][7]['source'] = new_source

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("KATA_KASAR updated with adult content keywords in notebook")
