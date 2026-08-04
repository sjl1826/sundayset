#!/usr/bin/env python3
"""
Turn every set in sets/ into the text you paste into one tab of the Google Doc.

Usage:
    python3 make_doc_sample.py            # a Link: line under each song
    python3 make_doc_sample.py --links    # one "## Links" section at the end instead

One file per set = one tab per set. Name the tab after the file (e.g. 2026-08-02) and
paste the file's contents in. See SETLIST_DOC.md for the format.
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SETS_DIR = os.path.join(HERE, "sets")
OUT_DIR = os.path.join(HERE, "sample-doc")

FIELD_SEPARATOR = " — "


def song_numbers(text, prefix="song-title-"):
    """The song slots a set actually fills, in order."""
    return sorted(int(key[len(prefix):]) for key in text if key.startswith(prefix))


def heading_line(text, links, number):
    """`### Title — Key: A — Singer: Ana`, skipping whatever wasn't filled in."""
    parts = [text.get(f"song-title-{number}", "").strip() or f"Song {number}"]
    for label, key in (("Key", "song-key-"), ("Singer", "song-singer-")):
        value = text.get(f"{key}{number}", "").strip()
        if value:
            parts.append(f"{label}: {value}")
    return "### " + FIELD_SEPARATOR.join(parts)


def song_block(text, links, number, inline_links=True):
    lines = [heading_line(text, links, number)]
    link = (links or {}).get(str(number), "").strip()
    if link and inline_links:
        lines.append(f"Link: {link}")
    chords = text.get(f"song-chords-{number}", "").strip("\n")
    if chords:
        lines.append(chords)
    return "\n".join(lines)


def links_section(text, links, numbers):
    """`## Links` — one "Song Title — url" per line, matched back up by title."""
    lines = []
    for number in numbers:
        link = (links or {}).get(str(number), "").strip()
        title = text.get(f"song-title-{number}", "").strip()
        if link and title:
            lines.append(f"{title}{FIELD_SEPARATOR}{link}")
    return ["", "## Links"] + lines if lines else []


def member_line(member):
    parts = [member.get("name", ""), member.get("role", ""), member.get("icon", "")]
    return FIELD_SEPARATOR.join(part for part in parts if part)


def tab_text(data, set_id, inline_links=True):
    """One tab: the set's heading fields, its team, its songs, its extra songs."""
    text = data.get("text", {})
    links = data.get("links", {})
    numbers = song_numbers(text)
    # The page shows the last three slots as "extra songs"; a shorter set has none.
    main, extra = (numbers[:-3], numbers[-3:]) if len(numbers) > 7 else (numbers, [])

    lines = [f"Set: {set_id}"]
    if text.get("band-name"):
        lines.append(f"Title: {text['band-name']}")
    if text.get("date"):
        lines.append(f"Date: {text['date']}")

    roster = data.get("roster") or []
    if roster:
        lines += ["", "## Team"] + [member_line(member) for member in roster]

    for title, group in (("## Songs", main), ("## Extra Songs", extra)):
        if not group:
            continue
        lines += ["", title]
        for number in group:
            lines += ["", song_block(text, links, number, inline_links)]

    if not inline_links:
        lines += links_section(text, links, numbers)

    return "\n".join(lines) + "\n"


def main():
    inline_links = "--links" not in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)
    written = []
    for path in sorted(glob.glob(os.path.join(SETS_DIR, "*.json"))):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        set_id = data.get("date") or os.path.splitext(os.path.basename(path))[0]
        out_path = os.path.join(OUT_DIR, f"{set_id}.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(tab_text(data, set_id, inline_links))
        written.append(os.path.relpath(out_path, HERE))

    print("Wrote " + ", ".join(written) if written else "No sets found in sets/")
    print("Links: " + ("a Link: line under each song" if inline_links else "one ## Links section per tab"))
    print("Paste each file into its own tab, named after the file.")


if __name__ == "__main__":
    main()
