import sys, json, docx
p = sys.argv[1]
d = docx.Document(p)
out = []
for para in d.paragraphs:
    t = para.text.strip()
    if t:
        out.append(t)
print('\n'.join(out))