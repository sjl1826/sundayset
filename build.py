#!/usr/bin/env python3
"""
Build a GitHub Pages-ready static site from template.html.

Usage:
    python3 build.py                            # bake every set in sets/
    python3 build.py band-setlist-backup.json   # …plus extra sets exported from the browser

What it does:
  * Extracts every member photo into images/ as a real file.
  * Rewrites index.html so photos load from images/ (no giant base64 blob).
  * Bakes each set's text, keys, singers, chords, links, and lineup into index.html,
    so the "Set list" picker can switch between them.
The result is a self-contained folder you can push straight to GitHub Pages.
"""
import base64
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "template.html")
OUT_HTML = os.path.join(HERE, "index.html")
IMAGES_DIR = os.path.join(HERE, "images")
SETS_DIR = os.path.join(HERE, "sets")

# Order MUST match the `DEFAULT_ROSTER` array inside template.html.
DEFAULT_MEMBERS = [
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


def write_image(filename, raw):
    with open(os.path.join(IMAGES_DIR, filename), "wb") as f:
        f.write(raw)
    return f"images/{filename}"


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "member"


def unwrap_css_url(value):
    """`url('images/x.jpg')` -> `images/x.jpg`; anything else comes back unchanged."""
    match = re.match(r"""\s*url\(\s*['"]?(.*?)['"]?\s*\)\s*$""", value or "", re.S)
    return match.group(1) if match else value


def extract_default_photos(html):
    """Write the template's built-in base64 photos to images/; return {name: relative path}."""
    photos = json.loads(re.search(r"const PHOTOS = (\{.*?\});", html, re.S).group(1))
    paths = {}
    for idx, (name, slug) in enumerate(DEFAULT_MEMBERS):
        ext, raw = decode_data_uri(photos.get(name, ""))
        paths[name] = write_image(f"{idx + 1:02d}-{slug}.{ext}", raw) if raw else ""
    return paths


def set_paths(extra_paths):
    """Every set to bake in: the committed sets/ plus any passed on the command line.

    Newest first, so the picker lists recent sets at the top.
    """
    return sorted(glob.glob(os.path.join(SETS_DIR, "*.json")), reverse=True) + list(extra_paths)


def load_set(path):
    """Read one set file, turning any inline base64 photo into a file under images/."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    roster = data.get("roster") or []
    # A browser export keys photos by card index; fold those into the roster.
    for idx, photo in (data.get("photos") or {}).items():
        position = int(idx)
        if position < len(roster):
            roster[position]["photo"] = photo

    for member in roster:
        photo = unwrap_css_url(member.get("photo", ""))
        ext, raw = decode_data_uri(photo)
        member["photo"] = write_image(f"{slugify(member['name'])}.{ext}", raw) if raw else photo

    key = data.get("date") or os.path.splitext(os.path.basename(path))[0]
    return key, {"text": data.get("text", {}), "links": data.get("links", {}), "roster": roster}


def main():
    with open(TEMPLATE, "r", encoding="utf-8") as f:
        html = f.read()

    os.makedirs(IMAGES_DIR, exist_ok=True)
    default_paths = extract_default_photos(html)

    # Swap the huge base64 PHOTOS blob for lightweight relative paths.
    lean_photos = "const PHOTOS = " + json.dumps(default_paths) + ";"
    html = re.sub(r"const PHOTOS = \{.*?\};", lambda _m: lean_photos, html, count=1, flags=re.S)

    sets = dict(load_set(path) for path in set_paths(sys.argv[1:]))
    default_date = max(sets) if sets else None  # the picker opens on the most recent set
    head_inject = (
        "<script>window.PROJECT_SETS = " + json.dumps(sets) + ";"
        " window.DEFAULT_DATE = " + json.dumps(default_date) + ";</script>\n</head>"
    )
    # The set picker (in the page script) reads window.PROJECT_SETS / window.DEFAULT_DATE.
    html = html.replace("</head>", head_inject, 1)

    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Wrote {os.path.relpath(OUT_HTML, HERE)}")
    print(f"Baked {len(sets)} set(s): {', '.join(sorted(sets))}")
    print(f"Wrote {len([p for p in default_paths.values() if p])} images to images/")
    if not sets:
        print("Note: no sets found in sets/ — the page will show the blank template.")


if __name__ == "__main__":
    main()
