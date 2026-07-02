# 🎸 Band Setlist

A simple, pretty, printable setlist site — band members with photos, a clickable
table of contents, and per-song key / singer / chords / links. Includes a
draggable auto-scroll controller (with a super-slow speed) for hands-free reading.

## Files

| File | What it is |
|------|------------|
| `index.html` | The site. This is what GitHub Pages serves. |
| `images/` | Member photos (real image files). |
| `template.html` | Design source. Editable in the browser; used by `build.py`. |
| `build.py` | Regenerates `index.html` (and `images/`) from a content backup. |

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

The published page shows whatever is baked into `index.html`. To change songs,
keys, singers, chords, links, or photos:

1. Open `template.html` in your browser (double-click).
2. Edit everything inline — click text to type, click a photo circle to swap it,
   click 🔗 to set a song link, paste chords.
3. Click **Save backup** → you get `band-setlist-backup.json`.
4. Rebuild, then push:
   ```sh
   python3 build.py band-setlist-backup.json
   git add -A && git commit -m "Update setlist" && git push
   ```

Running `build.py` with the backup extracts any new photos into `images/` and
bakes your text/links into `index.html`.

---

## Auto-scroll

Bottom-right corner: press **▶** to start scrolling, **⏸** to stop. Scroll your
mouse wheel over the number box to set the speed (**1 = super slow**, up to 300).
Drag the **⠿** handle to move the controller anywhere. It's hidden when printing.

## Export to PDF

Click **Export to PDF** (top-right) → *Save as PDF*. Photos and colors are set to
print automatically, and songs won't split across pages.
 
