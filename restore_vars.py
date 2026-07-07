import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Find the stemming cell (cell 14) and inject the missing variables
for c in nb['cells']:
    if c.get('cell_type') == 'code' and any("LANGKAH 5 — STEMMING" in line for line in c.get('source', [])):
        source = c['source']
        # Find where cache_loaded = False is
        idx = next(i for i, line in enumerate(source) if "cache_loaded = False" in line)
        
        insertions = [
            "os.makedirs('cache', exist_ok=True)\n",
            "CACHE_PREPROCESS_JOBLIB = 'cache/preprocessing_cache.joblib'\n",
            "CACHE_PREPROCESS_CSV    = 'cache/preprocessing_cache.csv'\n",
            "PREPROCESS_VERSION      = 'preprocess_v4_case_token_stopword_stemming'\n",
            "\n"
        ]
        
        source = source[:idx] + insertions + source[idx:]
        c['source'] = source
        break

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Restored missing variables in the stemming cell.")
