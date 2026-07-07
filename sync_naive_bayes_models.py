import joblib # type: ignore
import json
import os
import numpy as np # type: ignore
import sklearn

# Paths
joblib_path = 'model/model_naive_bayes.joblib'
json_paths = [
    'model/model_naive_bayes.json',
    'Frontend/app/src/services/naive_bayes_model.json',
    'chatku-admin/chatku-admin/src/services/naive_bayes_model.json'
]

print(f"Loading joblib model from {joblib_path}...")
if not os.path.exists(joblib_path):
    print(f"Error: {joblib_path} does not exist.")
    exit(1)

loaded = joblib.load(joblib_path)
classifier = loaded['model']
vectorizer = loaded['vectorizer']

def make_serializable(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, set):
        return list(obj)
    if hasattr(obj, 'pattern'):
        return obj.pattern
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, type):
        return str(obj)
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    return obj

model_data = {
    'vocabulary': make_serializable(getattr(vectorizer, 'vocabulary_', None)),
    'idf': make_serializable(getattr(vectorizer, 'idf_', None)),
    'classes': make_serializable(getattr(classifier, 'classes_', None)),
    'class_log_prior': make_serializable(getattr(classifier, 'class_log_prior_', None)),
    'feature_log_prob': make_serializable(getattr(classifier, 'feature_log_prob_', None)),
    'stopwords': make_serializable(loaded.get('stopwords')),
    'kata_kasar': make_serializable(loaded.get('kata_kasar')),
    'pola_url': make_serializable(loaded.get('pola_url')),
    'label_map': make_serializable(loaded.get('label_map')),
    'metadata': make_serializable(loaded.get('metadata', {}))
}

# Add sklearn version
model_data['metadata']['sklearn_version'] = sklearn.__version__

print("Metadata loaded:")
meta = model_data['metadata']
print(f"  Total Data    : {meta.get('total_data')}")
print(f"  Accuracy Test : {meta.get('accuracy_test') or meta.get('accuracy')}")
print(f"  Accuracy Val  : {meta.get('accuracy_val')}")
print(f"  Vocabulary size: {len(model_data['vocabulary'])}")

# Write to all destinations
for path in json_paths:
    dir_name = os.path.dirname(path)
    if not os.path.exists(dir_name):
        print(f"Warning: Directory {dir_name} does not exist. Skipping.")
        continue
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(model_data, f, indent=2, ensure_ascii=False)
    print(f"Successfully saved to {path} (size: {os.path.getsize(path)} bytes)")

print("\nAll models synchronized successfully!")
