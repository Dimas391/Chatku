import json
import os

paths = {
    "model_dir": "model/model_naive_bayes.json",
    "frontend": "Frontend/app/src/services/naive_bayes_model.json",
    "admin": "chatku-admin/chatku-admin/src/services/naive_bayes_model.json"
}

for name, path in paths.items():
    print(f"=== {name} ({path}) ===")
    if not os.path.exists(path):
        print("File does not exist.")
        continue
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        meta = data.get("metadata", {})
        print(f"  Size          : {os.path.getsize(path)} bytes")
        print(f"  Accuracy Test : {meta.get('accuracy_test') or meta.get('accuracy')}")
        print(f"  Accuracy Val  : {meta.get('accuracy_val')}")
        print(f"  Total Data    : {meta.get('total_data')}")
        print(f"  Train Size    : {meta.get('train_size')}")
        print(f"  Test Size     : {meta.get('test_size')}")
        print(f"  Vocabulary size: {len(data.get('vocabulary', {}))}")
        print(f"  IDF size      : {len(data.get('idf', []))}")
        print(f"  Stopwords count: {len(data.get('stopwords', []))}")
        print(f"  Kata kasar count: {len(data.get('kata_kasar', []))}")
    except Exception as e:
        print(f"Error reading file: {e}")
    print()
