import sys, json
try:
    import pymupdf as fitz  # PyMuPDF 新包名
except ImportError:
    import fitz

src, outdir = sys.argv[1], sys.argv[2]
doc = fitz.open(src)
if doc.needs_pass:
    print(json.dumps({"error": "encrypted"}))
    sys.exit(0)

max_pages = 40
pages = []
total = doc.page_count
for i in range(min(total, max_pages)):
    page = doc[i]
    text = (page.get_text("text") or "").strip()
    has_img = len(page.get_images(full=True)) > 0
    use_text = (not has_img and len(text) >= 12) or len(text) >= 40
    if use_text:
        pages.append({"page": i + 1, "kind": "text", "text": text})
    else:
        pix = page.get_pixmap(dpi=180)
        path = f"{outdir}/pdf-{i + 1}.png"
        pix.save(path)
        pages.append({"page": i + 1, "kind": "scan", "png": path})

print(json.dumps({"pages": pages, "total": total, "truncated": total > max_pages}, ensure_ascii=False))
