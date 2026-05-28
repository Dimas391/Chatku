import joblib
import json
import numpy as np

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
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    return obj

model_data = {
    'vocabulary': make_serializable(vectorizer.vocabulary_),
    'idf': make_serializable(vectorizer.idf_) if hasattr(vectorizer, 'idf_') else None,
    'classes': make_serializable(classifier.classes_),
    'class_log_prior': make_serializable(classifier.class_log_prior_),
    'feature_log_prob': make_serializable(classifier.feature_log_prob_),
    'stopwords': make_serializable(loaded.get('stopwords')),
    'kata_kasar': make_serializable(loaded.get('kata_kasar')),
    'pola_url': make_serializable(loaded.get('pola_url')),
    'label_map': make_serializable(loaded.get('label_map')),
    'metadata': make_serializable(loaded.get('metadata'))
}

with open('model_naive_bayes.json', 'w') as f:
    json.dump(model_data, f, indent=2)

print("Extraction completed successfully.")
