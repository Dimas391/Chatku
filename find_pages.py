import pypdf
import re

reader = pypdf.PdfReader("Skripsi-Dimas-hacker.pdf")
print(f"Total pages: {len(reader.pages)}")

# Print where chapters start
for i, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    for line in text.split("\n"):
        line_strip = line.strip()
        if re.match(r"^(BAB\s+[I|V|X]+|DAFTAR\s+ISI|ABSTRAK|ABSTRACT)", line_strip, re.IGNORECASE):
            print(f"Page {i+1}: {line_strip}")
