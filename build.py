#!/usr/bin/env python3
"""
Build a GitHub Pages-ready static site from template.html.

Usage:
    python3 build.py                       # build with default/placeholder content
    python3 build.py band-setlist-backup.json   # bake in content exported from the browser

What it does:
  * Extracts every member photo into images/ as a real file.
  * Rewrites index.html so photos load from images/ (no giant base64 blob).
  * Bakes your text, keys, singers, chords, and song links into index.html.
The result is a self-contained folder you can push straight to GitHub Pages.
"""
import base64
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "template.html")
OUT_HTML = os.path.join(HERE, "index.html")
IMAGES_DIR = os.path.join(HERE, "images")

# Order MUST match the `members` array inside template.html.
MEMBERS = [
    ("Joanne", "joanne"),
    ("Sam", "sam"),
    ("Ana", "ana"),
    ("Abraham", "abraham"),
    ("Edwin", "edwin"),
    ("Gabe", "gabe"),
    ("Andrew", "andrew"),
]

DATA_URI = re.compile(r"data:image/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)")


def decode_data_uri(uri):
    """Return (extension, raw_bytes) for a data: URI (optionally wrapped in url(...))."""
    if not uri:
        return None, None
    match = DATA_URI.search(uri)
    if not match:
        return None, None
    ext = match.group(1).lower()
    ext = "jpg" if ext in ("jpeg", "jpg") else ext
    raw = base64.b64decode(re.sub(r"\s+", "", match.group(2)))
    return ext, raw


def main():
    backup_path = sys.argv[1] if len(sys.argv) > 1 else None
    backup = None
    if backup_path:
        with open(backup_path, "r", encoding="utf-8") as f:
            backup = json.load(f)
        print(f"Loaded content from {backup_path}")

    with open(TEMPLATE, "r", encoding="utf-8") as f:
        html = f.read()

    # Default photos are stored in the template's `const PHOTOS = {...};` (name -> data URI).
    photos_match = re.search(r"const PHOTOS = (\{.*?\});", html, re.S)
    default_photos = json.loads(photos_match.group(1))

    os.makedirs(IMAGES_DIR, exist_ok=True)
    rel_by_name = {}
    for idx, (name, slug) in enumerate(MEMBERS):
        uri = None
        if backup:
            uri = backup.get("photos", {}).get(str(idx))  # e.g. url("data:image/jpeg;base64,...")
        if not uri:
            uri = default_photos.get(name, "")
        ext, raw = decode_data_uri(uri)
        if raw:
            filename = f"{idx + 1:02d}-{slug}.{ext}"
            with open(os.path.join(IMAGES_DIR, filename), "wb") as f:
                f.write(raw)
            rel_by_name[name] = f"images/{filename}"
        else:
            rel_by_name[name] = ""

    # Swap the huge base64 PHOTOS blob for lightweight relative paths.
    lean_photos = "const PHOTOS = " + json.dumps(rel_by_name) + ";"
    html = re.sub(r"const PHOTOS = \{.*?\};", lambda _m: lean_photos, html, count=1, flags=re.S)

    # Bake in the authored content, keyed by date so the picker can load it.
    if backup:
        project = {
            "text": backup.get("text", {}),
            "links": backup.get("links", {}),
            "photos": {},
        }
        for idx, (name, _slug) in enumerate(MEMBERS):
            rel = rel_by_name.get(name)
            if rel:
                project["photos"][str(idx)] = f"url('{rel}')"
        iso = backup.get("date")
        sets = {iso: project} if iso else {}
        head_inject = (
            "<script>window.PROJECT_SETS = " + json.dumps(sets) + ";"
            " window.DEFAULT_DATE = " + json.dumps(iso) + ";</script>\n</head>"
        )
        # The date picker (in the page script) reads window.PROJECT_SETS / window.DEFAULT_DATE.
        html = html.replace("</head>", head_inject, 1)

    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Wrote {os.path.relpath(OUT_HTML, HERE)}")
    print(f"Wrote {len([n for n in rel_by_name.values() if n])} images to images/")
    if not backup:
        print("Note: built with placeholder song text. Re-run with your backup JSON to bake in your content.")


if __name__ == "__main__":
    main()
