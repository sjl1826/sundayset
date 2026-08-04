# 🎸 Band Setlist

A simple, pretty, printable setlist site — band members with photos, a clickable
table of contents, and per-song key / singer / chords / links. Tap a song's key to
transpose it. Includes a draggable auto-scroll controller (with a super-slow speed)
for hands-free reading.

**Every set list comes from one Google Doc, one tab per set**, re-pulled each time
someone opens the page. Nothing is baked into the site and nothing on the page is
editable: to change a set, edit the doc. See **[SETLIST_DOC.md](SETLIST_DOC.md)**.

## Files

| File | What it is |
|------|------------|
| `index.html` | The site. This is what GitHub Pages serves. |
| `config.js` | The Google Doc endpoint (`SETLIST_DOC_URL`). Read at page load — no rebuild needed. |
| `sets/` | Old JSON set lists. No longer served; kept only as a record and as test fixtures. |
| `images/` | Member photos. A roster can just name people: `08-sarah.jpg` answers to "Sarah". |
| `template.html` | Design source for the page; `build.py` turns it into `index.html`. |
| `build.py` | Regenerates `index.html` and the `images/` photo index. Set lists are not baked in. |
| `apps-script/Code.gs` | Paste into script.google.com to serve your Doc's tabs as JSON. |
| `sample-doc/` | Your current sets as paste-ready Google Doc tabs (`python3 make_doc_sample.py`). |
| `sync_doc.mjs` | Optional: saves the Doc's sets to `sets/*.json` as a record (`node sync_doc.mjs`). |
| `test_transpose.mjs` | Checks the transposing logic in `template.html` (`node test_transpose.mjs`). |
| `test_doc.mjs` | Checks the Google Doc format, including a round trip through `sample-doc/` (`node test_doc.mjs`). |
| `test_display.mjs` | Checks stage mode's chord-size steps (`node test_display.mjs`). |

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

**Edit the Google Doc.** Add a tab, name it `YYYY-MM-DD`, write the set. Everyone's page
picks it up on their next refresh — nothing to build, commit, or push.
[SETLIST_DOC.md](SETLIST_DOC.md) has the format and the five-minute setup.

The page opens on the newest date and lists the others in the picker. When the doc can't
be reached it falls back to the last good pull saved on that device; the line next to the
picker says which you're seeing, and tapping it syncs again right away.

The site itself is read-only — the only thing you can change on it is a song's key, and
that's per-person and resets on refresh.

## Tests

```sh
node test_transpose.mjs    # music theory: chord recognition, keys, alignment
node test_doc.mjs          # Google Doc format, round-tripped through sample-doc/
node test_display.mjs      # stage mode: chord-size steps
```

Both lift the real code out of `template.html` and exercise it, so they fail if the page
and the tests ever drift apart.

---

## Transposing

Tap a song's **Key** chip to open the key picker, then tap a key — the chords
below re-write themselves into that key, and the chip shows how far it moved
(e.g. `Key Bb +1`). Nothing is saved: it's per-person, per-visit, so the singer
can read it in Bb while the guitarist reads it in A.

- The key the chords were written in is marked **★**; **Original: A** puts it back
  exactly as written.
- Only chord lines change. Lyrics, `[Verse]` headings, and notes like
  `(build sound)` stay put, and chords keep their column over the lyric beneath.
- Spelling follows the target key — going up a semitone from A gives `Bb F Gm`,
  not `A# F Gm`.
- Wrong key on a song? Fix the `Key:` line in the Google Doc.
- Switching sets in the picker resets every song to its written key.

## Stage mode

Top-right: **🌙** switches to a dark theme for a dim room, **A− / A+** step the chord
text through six sizes. Both are per-person, saved on that device, and applied before
the page paints — no white flash in a dark sanctuary. Until you press 🌙 the page follows
the phone's own day/night setting.

Printing always uses the light palette and a normal chord size, whatever the screen shows.

## Keeping the screen awake

While the set list is on screen, the phone won't dim or lock — there's nothing to switch
on. It re-engages by itself after you switch apps and come back, and releases as soon as
you leave the page. Browsers without the Wake Lock API just behave as they always did.

## Auto-scroll

Bottom-right corner: press **▶** to start scrolling, **⏸** to stop. The slider sets the
speed from **1** (a slow crawl, ~3 minutes a song) to **10** (a fast sweep). Drag the
**⠿** handle to move the controller anywhere. It's hidden when printing.

## Export to PDF

Click **Export to PDF** (top-right) → *Save as PDF*. Photos and colors are set to
print automatically, and songs won't split across pages.
