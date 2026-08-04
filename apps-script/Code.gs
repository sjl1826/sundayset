/**
 * Serves a Google Doc's tabs to the set list page as JSON.
 *
 * Setup (about five minutes, no Google Cloud project needed):
 *   1. script.google.com -> New project. Paste this file in, replacing Code.gs.
 *   2. Put your document's ID in DOC_ID below (from the doc URL:
 *      docs.google.com/document/d/<THIS PART>/edit).
 *   3. Deploy -> New deployment -> Web app.
 *        Execute as:      Me
 *        Who has access:  Anyone
 *      Copy the /exec URL it gives you into config.js as SETLIST_DOC_URL.
 *
 * "Execute as: Me" means the doc itself stays private — only this JSON is public,
 * and it holds nothing the set list page wasn't going to show anyway.
 *
 * Response: { "tabs": [ { "title": "2026-08-02", "text": "..." } ], "pulledAt": "..." }
 */
const DOC_ID = "PASTE_YOUR_GOOGLE_DOC_ID_HERE";

/* Reading a long doc takes a few seconds, and a whole band refreshing at once asks for
   the same bytes over and over. Serving a recent copy keeps those requests quick — and
   quick requests are the ones that don't time out. */
const CACHE_KEY = "setlist-tabs";
const CACHE_SECONDS = 30;

function doGet(e) {
  const skipCache = Boolean(e && e.parameter && e.parameter.fresh);
  return ContentService
    .createTextOutput(payload(skipCache))
    .setMimeType(ContentService.MimeType.JSON);
}

function payload(skipCache) {
  const cache = CacheService.getScriptCache();
  if (!skipCache) {
    const hit = cache.get(CACHE_KEY);
    if (hit) return hit;
  }
  const json = JSON.stringify({ tabs: readTabs(DocumentApp.openById(DOC_ID)), pulledAt: new Date().toISOString() });
  try {
    cache.put(CACHE_KEY, json, CACHE_SECONDS);   // silently skipped if over the 100KB limit
  } catch (err) {
    Logger.log("Not cached: %s", err);
  }
  return json;
}

/** Every tab, in document order, child tabs right after their parent. */
function readTabs(doc) {
  if (!doc.getTabs) return [{ title: doc.getName(), text: bodyText(doc.getBody()) }];

  const tabs = [];
  const walk = (list) => (list || []).forEach((tab) => {
    tabs.push({ title: tab.getTitle(), text: bodyText(tab.asDocumentTab().getBody()) });
    walk(tab.getChildTabs ? tab.getChildTabs() : []);
  });
  walk(doc.getTabs());
  return tabs;
}

/**
 * A tab's text, with heading paragraphs marked "#", "##", "###".
 *
 * That way a doc where people style song titles as real headings parses exactly like
 * one where they typed "### Song Title" — the page only ever sees the markers.
 */
function bodyText(body) {
  const marks = {};
  marks[DocumentApp.ParagraphHeading.TITLE] = "#";
  marks[DocumentApp.ParagraphHeading.SUBTITLE] = "#";
  marks[DocumentApp.ParagraphHeading.HEADING1] = "#";
  marks[DocumentApp.ParagraphHeading.HEADING2] = "##";
  marks[DocumentApp.ParagraphHeading.HEADING3] = "###";
  marks[DocumentApp.ParagraphHeading.HEADING4] = "###";
  marks[DocumentApp.ParagraphHeading.HEADING5] = "###";
  marks[DocumentApp.ParagraphHeading.HEADING6] = "###";

  const lines = [];
  for (let i = 0; i < body.getNumChildren(); i++) {
    const child = body.getChild(i);
    const type = child.getType();
    if (type === DocumentApp.ElementType.PARAGRAPH) {
      const paragraph = child.asParagraph();
      const mark = marks[paragraph.getHeading()];
      const text = paragraph.getText();
      lines.push(mark ? mark + " " + text.replace(/^#+\s*/, "") : text);
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      lines.push(child.asListItem().getText());
    }
  }
  return lines.join("\n");
}

/** Run this once from the editor to see what the page will receive. */
function preview() {
  const tabs = readTabs(DocumentApp.openById(DOC_ID));
  tabs.forEach((tab) => Logger.log("=== %s ===\n%s", tab.title, tab.text));
}
