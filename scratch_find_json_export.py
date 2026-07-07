import json

with open("messaging_naive_bayes_fixed.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

found = False
for i, cell in enumerate(nb.get("cells", [])):
    source = "".join(cell.get("source", []))
    if "naive_bayes_model.json" in source.lower():
        print(f"--- Cell {i} contains 'naive_bayes_model.json' ---")
        print(source)
        print("="*50)
        found = True
    elif "json" in source.lower() and ("dump" in source.lower() or "write" in source.lower() or "save" in source.lower()):
        print(f"--- Cell {i} contains json save/dump ---")
        print(source)
        print("="*50)
        found = True

if not found:
    print("No references to naive_bayes_model.json or json dump found in the notebook.")
