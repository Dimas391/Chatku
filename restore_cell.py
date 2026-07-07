import json

with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# The missing source code
stemming_source = [
    "print(\"=\" * 60)\n",
    "print(\"  LANGKAH 5 — STEMMING\")\n",
    "print(\"=\" * 60)\n",
    "\n",
    "cache_loaded = False\n",
    "\n",
    "if os.path.exists(CACHE_PREPROCESS_JOBLIB):\n",
    "    try:\n",
    "        cache_obj = joblib.load(CACHE_PREPROCESS_JOBLIB)\n",
    "        cache_meta = cache_obj.get('metadata', {})\n",
    "        cache_df = cache_obj.get('dataframe')\n",
    "\n",
    "        valid_cache = (\n",
    "            cache_meta.get('dataset_signature') == dataset_signature\n",
    "            and cache_meta.get('preprocess_version') == PREPROCESS_VERSION\n",
    "            and cache_df is not None\n",
    "            and len(cache_df) == len(df_all)\n",
    "        )\n",
    "\n",
    "        if valid_cache:\n",
    "            cached_cols = [\n",
    "                'step_casefolding',\n",
    "                'step_tokenisasi',\n",
    "                'step_stopword',\n",
    "                'step_stemming',\n",
    "                'teks_bersih'\n",
    "            ]\n",
    "            for col in cached_cols:\n",
    "                df_all[col] = cache_df[col].values\n",
    "\n",
    "            cache_loaded = True\n",
    "            print(f\"  Cache preprocessing ditemukan dan valid: {CACHE_PREPROCESS_JOBLIB}\")\n",
    "            print(\"  Stemming dilewati karena hasil preprocessing sudah tersedia.\")\n",
    "        else:\n",
    "            print(\"  Cache ditemukan tetapi tidak valid karena dataset/versi preprocessing berubah.\")\n",
    "            print(\"  Preprocessing akan dijalankan ulang.\")\n",
    "    except Exception as e:\n",
    "        print(f\"  Cache gagal dibaca: {e}\")\n",
    "        print(\"  Preprocessing akan dijalankan ulang.\")\n",
    "\n",
    "if not cache_loaded:\n",
    "    start = time.time()\n",
    "    df_all['step_stemming'] = df_all['step_stopword'].apply(stemming)\n",
    "    df_all['teks_bersih']   = df_all['step_stemming'].apply(\n",
    "        lambda t: ' '.join(t) if t else 'PESAN_KOSONG'\n",
    "    )\n",
    "    elapsed = time.time() - start\n",
    "\n",
    "    cache_columns = [\n",
    "        'pesan', 'kategori', 'label',\n",
    "        'step_casefolding', 'step_tokenisasi', 'step_stopword',\n",
    "        'step_stemming', 'teks_bersih'\n",
    "    ]\n",
    "    \n",
    "    cache_data = {\n",
    "        'metadata': {\n",
    "            'dataset_signature': dataset_signature,\n",
    "            'preprocess_version': PREPROCESS_VERSION,\n",
    "            'timestamp': time.time()\n",
    "        },\n",
    "        'dataframe': df_all[cache_columns].copy()\n",
    "    }\n",
    "    \n",
    "    os.makedirs(CACHE_DIR, exist_ok=True)\n",
    "    joblib.dump(cache_data, CACHE_PREPROCESS_JOBLIB, compress=3)\n",
    "    \n",
    "    print(f\"\\n  Waktu proses stemming: {elapsed:.2f} detik.\")\n",
    "    print(f\"  Hasil preprocessing disimpan ke cache: {CACHE_PREPROCESS_JOBLIB}\")\n",
    "\n",
    "print(\"\\n  Sample Teks Bersih (setelah Stemming):\")\n",
    "display(df_all[['step_stopword', 'step_stemming', 'teks_bersih']].head(3))\n"
]

new_cell = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": stemming_source
}

# Find the cell index for step 4 to insert after it
insert_idx = -1
for idx, cell in enumerate(nb['cells']):
    if cell.get('cell_type') == 'code' and any("LANGKAH 4" in line for line in cell.get('source', [])):
        insert_idx = idx + 1
        break

if insert_idx != -1:
    nb['cells'].insert(insert_idx, new_cell)
    with open('e:\\Messaging_Pengamanan_Data\\messaging_naive_bayes_revisi.ipynb', 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)
    print("Cell restored at index", insert_idx)
else:
    print("Could not find cell 4")
