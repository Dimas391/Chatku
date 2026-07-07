import re

with open('e:\\Messaging_Pengamanan_Data\\run_model.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "import matplotlib" in line or "import seaborn" in line:
        continue
    if "plt." in line or "sns." in line or "matplotlib." in line:
        continue
    # Let's also handle inline plots if any
    if "%matplotlib" in line:
        continue
    new_lines.append(line)

with open('e:\\Messaging_Pengamanan_Data\\run_model_no_plot.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
