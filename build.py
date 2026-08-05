#!/usr/bin/env python3
"""
Build a GitHub Pages-ready static site from template.html.

Usage:
    python3 build.py

What it does:
  * Extracts every member photo into images/ as a real file.
  * Rewrites index.html so photos load from images/ (no giant base64 blob).
  * Builds the name -> photo index the roster uses, so a set list only has to name
    people and their picture is found by name.

Set lists themselves are NOT baked in: the page reads them from the Google Doc on
every visit (see SETLIST_DOC.md). This script only ships the page and the photos.
"""
import base64
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "template.html")
OUT_HTML = os.path.join(HERE, "index.html")
IMAGES_DIR = os.path.join(HERE, "images")

# Names for the base64 photos baked into template.html, in the order they were added.
# The page itself starts with an empty roster; these only decide the images/ filenames.
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
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic")
NUMBER_PREFIX = re.compile(r"^\d+[-_]?")


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


def extract_default_photos(html):
    """Write the template's built-in base64 photos to images/; return {name: relative path}."""
    photos = json.loads(re.search(r"const PHOTOS = (\{.*?\});", html, re.S).group(1))
    paths = {}
    for idx, (name, slug) in enumerate(DEFAULT_MEMBERS):
        ext, raw = decode_data_uri(photos.get(name, ""))
        paths[name] = write_image(f"{idx + 1:02d}-{slug}.{ext}", raw) if raw else ""
    return paths


def photo_index(default_paths):
    """{name: path} for every picture in images/, so a roster can just name people.

    `08-sarah.jpg` answers to "Sarah". A set (or a Google Doc line) may still name an
    explicit photo; this is the fallback the page uses when it doesn't.
    """
    index = dict(default_paths)
    known = {path for path in index.values() if path}
    for path in sorted(glob.glob(os.path.join(IMAGES_DIR, "*"))):
        relative = f"images/{os.path.basename(path)}"
        stem, ext = os.path.splitext(os.path.basename(path))
        if ext.lower() not in IMAGE_EXTENSIONS or relative in known:
            continue
        name = NUMBER_PREFIX.sub("", stem).replace("-", " ").replace("_", " ").strip().title()
        if name:
            index.setdefault(name, relative)
    return index


def main():
    with open(TEMPLATE, "r", encoding="utf-8") as f:
        html = f.read()

    os.makedirs(IMAGES_DIR, exist_ok=True)
    default_paths = extract_default_photos(html)
    photos = photo_index(default_paths)

    # Swap the huge base64 PHOTOS blob for lightweight relative paths.
    lean_photos = "const PHOTOS = " + json.dumps(photos) + ";"
    html = re.sub(r"const PHOTOS = \{.*?\};", lambda _m: lean_photos, html, count=1, flags=re.S)

    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Wrote {os.path.relpath(OUT_HTML, HERE)}")
    print(f"Wrote {len([p for p in default_paths.values() if p])} images to images/")
    print(f"Photo index: {', '.join(sorted(photos))}")
    print("Set lists come from the Google Doc at run time; none are baked in.")


if __name__ == "__main__":
    main()
