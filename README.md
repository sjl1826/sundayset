# 🎸 Band Setlist

A simple, pretty, printable setlist site — band members with photos, a clickable
table of contents, and per-song key / singer / chords / links. Includes a
draggable auto-scroll controller (with a super-slow speed) for hands-free reading.

## Files

| File | What it is |
|------|------------|
| `index.html` | The site. This is what GitHub Pages serves. |
| `sets/` | One JSON file per set list (`sets/2026-08-02.json`). The content source. |
| `images/` | Member photos (real image files). |
| `template.html` | Design source. Editable in the browser; used by `build.py`. |
| `build.py` | Regenerates `index.html` (and `images/`) from every set in `sets/`. |

---

## Put it online with GitHub Pages

1. Create a new repository on GitHub (e.g. `band-setlist`).
2. From this folder, push everything:
   ```sh
   git init
   git add .
   git commit -m "Band setlist site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/band-setlist.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages**. Under *Build and deployment*, set
   **Source: Deploy from a branch**, **Branch: `main` / `root`**, then **Save**.
4. Wait ~1 minute. Your site is live at:
   ```
   https://<your-username>.github.io/band-setlist/
   ```

That's it — `index.html` at the repo root is served automatically.

---

## Updating the content

The published page shows whatever is baked into `index.html`. Every set list lives in
its own file under `sets/`, and the **Set list** dropdown at the top of the page
switches between them (it opens on the most recent date).

### Add a new set

1. Copy an existing set as a starting point:
   ```sh
   cp sets/2026-08-02.json sets/2026-08-09.json
   ```
2. Edit the new file:
   - `date` — the set's ID (`YYYY-MM-DD`); the file name should match.
   - `text` — `band-name`, `date` (the label people read), and per-song
     `song-title-N` / `song-key-N` / `song-singer-N` / `song-chords-N`.
     Anything you leave out shows the blank placeholder.
   - `links` — `"N": "https://…"` per song.
   - `roster` — the lineup for *that* set: `name`, `role`, `icon`, `photo`.
     Lineups may differ in size between sets; the member grid adapts.
3. Rebuild, then push:
   ```sh
   python3 build.py
   git add -A && git commit -m "Add 2026-08-09 set" && git push
   ```

### Edit in the browser instead

1. Open `template.html` in your browser (double-click).
2. Edit everything inline — click text to type, click 🔗 to set a song link,
   paste chords.
3. Save the JSON it gives you, then bake it in alongside the committed sets:
   ```sh
   python3 build.py band-setlist-backup.json
   ```

Running `build.py` extracts any inline (base64) photos into `images/` and bakes
every set's text, links, and lineup into `index.html`.

---

## Auto-scroll

Bottom-right corner: press **▶** to start scrolling, **⏸** to stop. Scroll your
mouse wheel over the number box to set the speed (**1 = super slow**, up to 300).
Drag the **⠿** handle to move the controller anywhere. It's hidden when printing.

## Export to PDF

Click **Export to PDF** (top-right) → *Save as PDF*. Photos and colors are set to
print automatically, and songs won't split across pages.
