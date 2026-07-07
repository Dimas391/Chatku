import joblib # pyright: ignore[reportMissingImports]
import json
import numpy as np # pyright: ignore[reportMissingImports]
import sklearn # pyright: ignore[reportMissingModuleSource]

loaded = joblib.load('model_naive_bayes.joblib')
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

# Tambahkan versi scikit-learn
model_data['metadata']['sklearn_version'] = sklearn.__version__

with open('model_naive_bayes.json', 'w', encoding='utf-8') as f:
    json.dump(model_data, f, indent=2, ensure_ascii=False)

print("Extraction completed successfully with sklearn version info.")