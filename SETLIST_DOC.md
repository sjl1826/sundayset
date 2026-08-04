# 📄 Set lists from a Google Doc

The page pulls its set lists from one Google Doc **every time someone opens or returns
to it**. You keep pictures in `images/` and everything else — who's playing, which
songs, which keys, the chords — in the doc. One tab per set.

The doc is the only source — nothing is baked into the site. If it can't be reached (no
signal in the sanctuary, Google having a bad day), the page shows the last set lists that
phone successfully pulled; on a phone that has never loaded it, the page says so plainly.
The status line next to the **Set list** picker always says which you're looking at.

---

## One-time setup (~5 minutes)

1. **Make the doc.** One tab per set. Name each tab `YYYY-MM-DD` (e.g. `2026-08-02`) —
   that's how the page sorts them and picks the most recent one to open on.
2. **Paste in a set.** `sample-doc/2026-08-02.txt` and `sample-doc/2026-07-05.txt` are
   your two existing sets in exactly the right format. Paste each into its own tab.
3. **Add the script.** Go to [script.google.com](https://script.google.com) → **New
   project**, and replace `Code.gs` with the contents of `apps-script/Code.gs`. Put your
   doc's ID in `DOC_ID` at the top (it's the long part of the doc URL between `/d/` and
   `/edit`).
4. **Deploy it.** **Deploy → New deployment → Web app**, with:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Approve the permission prompt, then copy the `/exec` URL.
5. **Point the page at it.** Put that URL in `config.js`:
   ```js
   window.SETLIST_DOC_URL = "https://script.google.com/macros/s/AKfy…/exec";
   ```
   Commit and push. Done — editing the doc now changes the site on the next refresh.

Because the script runs as *you*, the doc itself stays private. Only the JSON is public,
and it contains nothing the set list page wasn't already showing.

### Trying it before you commit

- Test a deployment without touching `config.js`: `index.html?doc=<the /exec URL>`.
- The page must be served over `http(s)` — a page opened straight off the disk
  (`file://`) isn't allowed to fetch the doc, and will say so. Locally:
  ```sh
  python3 -m http.server 8000 --directory .
  # then open http://localhost:8000/index.html
  ```
- See what the script sees: run the `preview` function in the Apps Script editor and
  check **Execution log**.
- Refresh the offline copy in `sets/` from the doc: `node sync_doc.mjs`, then
  `python3 build.py`.
- Regenerate the paste-ready samples from `sets/`: `python3 make_doc_sample.py`
  (add `--links` to get the `## Links` style instead of per-song `Link:` lines).

---

## The format

```
Set: 2026-08-02                      ← optional; defaults to the tab's name
Title: Sunday Set List
Date: Sunday · August 2, 2026

## Team
Sarah — Keyboard / Vox — 🎹
Sam — Acoustic Guitar / Vox — 🎸
Ana — Vox
Andrew — Sound — 🎛️ — images/07-andrew.jpg

## Songs

### Christ in Me — Key: A — Singer: Ana
Link: https://www.youtube.com/watch?v=…
[Chorus]
A         E        F#m
Christ in me is to live
   D E       A  E
To die is to gain

### You're Worthy of My Praise — Key: A — Singer: Sam
[Verse 1]
A
I will worship

## Extra Songs

### Draw Me Close to You — Key: C — Singer: Ana
C  F
Draw me close to You

## Links
Christ in Me — https://youtu.be/dQw4w9WgXcQ
You're Worthy of My Praise — https://youtu.be/xyz123
```

**Sections** are `Team`, `Songs`, `Extra Songs`, and `Links` — as a heading or just as a
line by itself. Anything under *Extra Songs* lands in the page's extra section.

**Songs** are Heading 2 or 3 (or literal `### Title`, or `Song: Title`). Put `Key`,
`Singer`, and `Link` on the heading line separated by ` — `, or on their own lines
beneath it:

```
### Christ in Me
Key: A
Singer: Ana
Link: https://…
```

Everything after that is the chords, kept exactly as typed. Songs are numbered
automatically, so reorder them freely; a leading `1.` is ignored if you like numbering
them anyway.

**People** are `Name — Role — Icon — Photo`, and only the name is required. With no
photo given, the page looks in `images/` for a picture whose name matches (`08-sarah.jpg`
answers to "Sarah"), so adding someone is: drop in a photo, add a line. With no icon
given, one is guessed from the role (keys 🎹, guitar/bass 🎸, drums 🥁, strings 🎻,
sound 🎛️, vocals 🎤).

**Links (YouTube and anything else)** can go in either place, whichever you prefer:

- `Link: https://…` under a song, alongside `Key` and `Singer`.
- One `## Links` section, listing them together:
  ```
  ## Links
  Christ in Me — https://youtu.be/aaa
  One Way: https://youtu.be/bbb
  Center https://youtu.be/ccc
  ```

The song title in the list is matched loosely — case, punctuation, and spacing don't
matter, so `CHRIST IN ME!` still finds "Christ in Me". A URL sitting on the line under a
title belongs to that title, so pasting a heading and a link underneath works too. If a
song has both a `Link:` line and a Links entry, the `Link:` line wins. A list of bare
URLs with no titles is matched to the songs in order. The section can equally be called
`Videos`, `YouTube`, `Recordings`, or `References`.

The song title becomes the link on the page — tap it to open the video.

**A tab with no songs is ignored**, so keep notes, drafts, and scratch tabs in the same
doc without them showing up as set lists.

### Chords in a Google Doc

Chord charts line up by spaces, so **select your chord blocks and set them to Courier
New**. The page renders them in a monospace font either way — this is just so the
alignment you see while editing is the alignment people get.

Two Docs habits to know:

- **Markdown detection** (Tools → Preferences) turns `## Songs` into a real Heading 2 and
  eats the `##`. That's fine: the script re-marks real headings, so both ways work.
- **Smart quotes** turn `'Cause` into `'Cause`. Harmless, just cosmetic.

Avoid starting a lyric line with `#` — that's how headings are marked.

---

## Troubleshooting

| The status line says | What to check |
|---|---|
| nothing at all | `config.js` has no URL, or the page was opened without `config.js` next to it |
| *Open this page over http://* | The page is a `file://` document; serve the folder (see above) |
| *Doc not loading* | It already retried three times, so this is not a blip. Is the deployment's access set to **Anyone**? Open the `/exec` URL in a browser — it should print JSON. After editing `Code.gs` you must **Deploy → New deployment** (or *Manage deployments* → edit → Version: New) for the change to go live. The browser console says which of these it was |
| *Live from the Google Doc*, but a set is missing | That tab has no song headings — check that its songs are Heading 2/3 or start with `###` |
| a song's chords are in the wrong place | A `Key:`/`Singer:`/`Link:` line has to come before the chords start; after that it's treated as a chord line |

**Tap the status line to sync right now** — handy when someone edits the doc mid-practice
and you don't want to wait.

### When it syncs

On load, on coming back to the tab, on regaining focus, when the network returns, and
every 5 minutes while the page sits open (at most one pull a minute, and never two at
once). A failed attempt is retried three times over ~10 seconds before it gives up, so a
cold start or a moment of bad signal recovers on its own.

`Code.gs` serves a 30-second cached copy so a whole band refreshing at once doesn't make
Google re-read the doc for each phone. That means an edit can take up to half a minute to
appear; add `?fresh=1` to the `/exec` URL to bypass it.
