#!/usr/bin/env node
/**
 * Tests for the Google Doc format, run against the real parser in template.html.
 *
 * Usage:
 *     node test_doc.mjs
 *
 * The heart of it is a round trip: the sample tabs in sample-doc/ are generated from
 * sets/*.json, so parsing them has to reproduce those sets exactly. If the parser and
 * the format ever drift apart, this fails.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function loadParser() {
  const html = readFileSync(join(HERE, "template.html"), "utf8");
  const source = /const SETLIST_DOC = \(function \(\) \{[\s\S]*?\n  \}\)\(\);/.exec(html);
  if (!source) throw new Error("Could not find the SETLIST_DOC block in template.html");
  return new Function(source[0] + "\nreturn SETLIST_DOC;")();
}

/** One top-level helper out of the page script, by name. */
function loadFunction(name) {
  const html = readFileSync(join(HERE, "template.html"), "utf8");
  const source = new RegExp(`\\n  function ${name}\\([\\s\\S]*?\\n  \\}`).exec(html);
  if (!source) throw new Error(`Could not find ${name}() in template.html`);
  return new Function(source[0] + `\nreturn ${name};`)();
}

const SETLIST_DOC = loadParser();
const tabsFrom = loadFunction("tabsFrom");
const describeBody = loadFunction("describeBody");
const failures = [];

function check(name, actual, expected) {
  const got = JSON.stringify(actual);
  const want = JSON.stringify(expected);
  if (got === want) return;
  failures.push(`${name}\n  expected: ${want}\n  actual:   ${got}`);
}

const parseOne = (text, title = "2026-01-04") => {
  const parsed = SETLIST_DOC.parse([{ title, text }]);
  return parsed.sets[parsed.defaultId];
};

/* ---- the round trip: sample-doc/ must rebuild sets/ exactly ---- */
const tabs = readdirSync(join(HERE, "sample-doc"))
  .filter((name) => name.endsWith(".txt"))
  .sort()
  .map((name) => ({ title: name.replace(/\.txt$/, ""), text: readFileSync(join(HERE, "sample-doc", name), "utf8") }));

check("every sample tab is a set", tabs.length > 0 && tabs.length, tabs.length);

const doc = SETLIST_DOC.parse(tabs);
check("newest set list is the default", doc.defaultId, "2026-08-02");
check("picker lists newest first", doc.order, ["2026-08-02", "2026-07-05"]);

for (const { title } of tabs) {
  const expected = JSON.parse(readFileSync(join(HERE, "sets", `${title}.json`), "utf8"));
  const parsed = doc.sets[title];
  check(`${title}: exists`, Boolean(parsed), true);
  if (!parsed) continue;

  check(`${title}: every text field round-trips`, parsed.text, expected.text);
  check(`${title}: links round-trip`, parsed.links, expected.links);
  check(`${title}: team round-trips`,
    parsed.roster.map(({ name, role, icon }) => ({ name, role, icon })),
    expected.roster.map(({ name, role, icon }) => ({ name, role, icon })));
  check(`${title}: photos come from images/ by name`, parsed.roster.every((m) => !m.photo), true);
}

check("a 10-song set splits 7 + 3 extras",
  [doc.sets["2026-07-05"].songCount, doc.sets["2026-07-05"].extraCount], [7, 3]);
check("a 7-song set has no extras",
  [doc.sets["2026-08-02"].songCount, doc.sets["2026-08-02"].extraCount], [7, 0]);

/* ---- how people will really type it ---- */
const LOOSE = [
  "Title: Sunday Set List",
  "Date: Sunday · August 9, 2026",
  "",
  "Team",
  "Joanne - Keyboard / Vox",
  "Edwin | Bass Guitar | 🎸",
  "",
  "Songs",
  "",
  "Song: 1. Christ in Me - Key: A",
  "Singer: Ana",
  "Link: https://example.com/chords",
  "Chords:",
  "A         E",
  "Christ in me is to live",
  "",
  "Extra Songs",
  "### Center — Key: G — Singer: Sam",
  "G  D",
  "Oh Christ be the center",
].join("\n");
const loose = parseOne(LOOSE, "2026-08-09");

check("bare section names work", [loose.songCount, loose.extraCount], [1, 1]);
check("a leading number is not part of the title", loose.text["song-title-1"], "Christ in Me");
check("fields may sit under the heading", loose.text["song-key-1"], "A");
check("Singer: on its own line", loose.text["song-singer-1"], "Ana");
check("Link: becomes the song link", loose.links["1"], "https://example.com/chords");
check("Chords: starts the chord block",
  loose.text["song-chords-1"], "A         E\nChrist in me is to live");
check("hyphen separators work", loose.roster[0], { name: "Joanne", role: "Keyboard / Vox", icon: "🎹", photo: "" });
check("pipe separators work", loose.roster[1], { name: "Edwin", role: "Bass Guitar", icon: "🎸", photo: "" });
check("extras land in the extra section", loose.text["song-title-2"], "Center");

/* ---- an icon is guessed from the role when nobody gives one ---- */
const ICONS = ["Team", "A - Drums", "B - Violin", "C - Vox", "D - Sound", "E - Acoustic Guitar", "F - Cowbell"].join("\n");
check("icons follow the instrument",
  parseOne("Songs\n### X\nC\n" + "\n" + ICONS).roster.map((m) => m.icon),
  ["🥁", "🎻", "🎤", "🎛️", "🎸", "🎵"]);

/* ---- Google Docs quirks ---- */
check("soft line breaks become real ones",
  parseOne("## Songs\n### X\nA\u000bB").text["song-chords-1"], "A\nB");
check("non-breaking spaces keep chord alignment",
  parseOne("## Songs\n### X\nA\u00a0\u00a0\u00a0E").text["song-chords-1"], "A   E");
check("real Doc headings (marked by the Apps Script) parse the same",
  parseOne("# Sunday Set List\n## Songs\n### X — Key: D\nD").text["song-key-1"], "D");
check("the tab's big heading titles the set, it isn't a song",
  (() => { const s = parseOne("# Sunday Set List\n## Songs\n### X — Key: D\nD");
           return [s.text["band-name"], s.songCount]; })(), ["Sunday Set List", 1]);
check("Title: wins over the big heading",
  parseOne("Title: Real Name\n# Ignored\n## Songs\n### X\nC").text["band-name"], "Real Name");
check("a tab with no songs is skipped",
  SETLIST_DOC.parse([{ title: "Notes", text: "Ideas for next month\nMaybe Oceans?" }]).order, []);
check("an unnamed tab still gets an id",
  SETLIST_DOC.parse([{ title: "Aug 9 (draft)", text: "## Songs\n### X\nC" }]).order, ["aug-9-draft"]);
check("Set: overrides the tab name",
  SETLIST_DOC.parse([{ title: "whatever", text: "Set: 2026-08-09\n## Songs\n### X\nC" }]).order, ["2026-08-09"]);
check("two tabs with one name don't collide",
  SETLIST_DOC.parse([
    { title: "2026-08-09", text: "## Songs\n### X\nC" },
    { title: "2026-08-09", text: "## Songs\n### Y\nD" },
  ]).order.length, 2);

/* ---- the newest date opens by default, whatever order the tabs are in ---- */
const OUT_OF_ORDER = [
  { title: "2026-07-05", text: "## Songs\n### Old\nC" },
  { title: "2026-08-16", text: "## Songs\n### Newest\nG" },
  { title: "2026-08-02", text: "## Songs\n### Middle\nD" },
];
check("newest first regardless of tab order",
  SETLIST_DOC.parse(OUT_OF_ORDER).order, ["2026-08-16", "2026-08-02", "2026-07-05"]);
check("the newest date is the default",
  SETLIST_DOC.parse(OUT_OF_ORDER).defaultId, "2026-08-16");
check("one oddly-named tab doesn't cost the others their order",
  SETLIST_DOC.parse(OUT_OF_ORDER.concat({ title: "Template", text: "## Songs\n### Draft\nA" })).order,
  ["2026-08-16", "2026-08-02", "2026-07-05", "template"]);
check("and the newest date still wins over it",
  SETLIST_DOC.parse([{ title: "Template", text: "## Songs\n### Draft\nA" }].concat(OUT_OF_ORDER)).defaultId,
  "2026-08-16");
check("a song with no chords is still a song",
  parseOne("## Songs\n### Just Announced — Key: C").text["song-chords-1"], "");
check("blank lines inside chords survive, at the edges they don't",
  parseOne("## Songs\n### X\n\n\nA\n\n\nB\n\n").text["song-chords-1"], "A\n\n\nB");
check("an empty doc parses to nothing", SETLIST_DOC.parse([]).order, []);
check("junk parses to nothing", SETLIST_DOC.parse(null).order, []);

/* ---- a Links section, matched to songs by title ---- */
const WITH_LINKS = [
  "## Songs",
  "### Christ in Me — Key: A",
  "A  E",
  "### One Way — Key: Bb",
  "Bb  F",
  "## Extra Songs",
  "### Center — Key: G",
  "G  D",
  "## Links",
  "Christ in Me — https://youtu.be/aaa",
  "One Way: https://youtu.be/bbb",
  "Center https://youtu.be/ccc",
].join("\n");
const linked = parseOne(WITH_LINKS);
check("a Links section fills every song's link",
  [linked.links["1"], linked.links["2"], linked.links["3"]],
  ["https://youtu.be/aaa", "https://youtu.be/bbb", "https://youtu.be/ccc"]);
check("the Links section is not a song", [linked.songCount, linked.extraCount], [2, 1]);

check("titles match loosely",
  parseOne("## Songs\n### Christ in Me\nA\n## Links\nCHRIST IN ME! — https://youtu.be/x").links["1"],
  "https://youtu.be/x");
check("a URL under a title line belongs to that title",
  parseOne("## Songs\n### Christ in Me\nA\n## Links\n### Christ in Me\nhttps://youtu.be/x").links["1"],
  "https://youtu.be/x");
check("bare URLs fall back to set order",
  parseOne("## Songs\n### A Song\nA\n### B Song\nB\n## Links\nhttps://youtu.be/1\nhttps://youtu.be/2").links,
  { "1": "https://youtu.be/1", "2": "https://youtu.be/2" });
check("a song's own Link: wins over the Links section",
  parseOne("## Songs\n### X\nLink: https://own.example\nA\n## Links\nX — https://list.example").links["1"],
  "https://own.example");
check("a Links entry naming no song is simply ignored",
  parseOne("## Songs\n### X\nLink: https://own.example\nA\n## Links\nNot A Song — https://nope.example").links,
  { "1": "https://own.example" });
check("YouTube, Videos and Recordings all name the section",
  ["Videos", "YouTube", "Recordings"].map((name) =>
    parseOne(`## Songs\n### X\nA\n## ${name}\nX — https://youtu.be/z`).links["1"]),
  ["https://youtu.be/z", "https://youtu.be/z", "https://youtu.be/z"]);

/* ---- retrying a flaky doc ---- */
/* syncWithDoc's retry loop, with the network and the clock faked out. */
function loadSync({ attempts }) {
  const html = readFileSync(join(HERE, "template.html"), "utf8");
  const pick = (name) => {
    const found = new RegExp(`\\n  (?:async )?function ${name}\\([\\s\\S]*?\\n  \\}`).exec(html);
    if (!found) throw new Error(`Could not find ${name}() in template.html`);
    return found[0];
  };
  const delays = /const RETRY_DELAYS_MS = (\[[^\]]*\]);/.exec(html)[1];
  const calls = [];
  const statuses = [];
  const source = `
    const RETRY_DELAYS_MS = ${delays};
    const wait = () => Promise.resolve();          // no real waiting in tests
    let syncing = false;
    ${pick("syncWithDoc")}
    return { syncWithDoc, tries: () => calls.length, statuses, delays: RETRY_DELAYS_MS };`;
  const pullOnce = () => {
    const outcome = attempts[calls.length];
    calls.push(outcome);
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  };
  return new Function("pullOnce", "writeCache", "applyDoc", "showStatus", "clockTime",
                      "reportFailure", "readCache", "console", "Date", "calls", "statuses", source)(
    pullOnce,
    () => {},
    () => {},
    (message, tone) => statuses.push(tone || "ok"),
    () => "12:00 PM",
    () => statuses.push("failed"),
    () => null,
    { warn: () => {} },
    { now: () => 0 },
    calls, statuses);
}

const good = { parsed: { order: ["2026-08-09"] }, tabs: [] };
const blip = new Error("HTTP 503");
const unreadable = new Error("the endpoint returned a web page, not JSON — is the deployment shared with “Anyone”?");

await checkAsync("a first-try success doesn't retry", async () => {
  const sync = loadSync({ attempts: [good] });
  await sync.syncWithDoc("u");
  return [sync.tries(), sync.statuses[sync.statuses.length - 1]];
}, [1, "ok"]);

await checkAsync("a blip is retried and recovers", async () => {
  const sync = loadSync({ attempts: [blip, blip, good] });
  await sync.syncWithDoc("u");
  return [sync.tries(), sync.statuses[sync.statuses.length - 1]];
}, [3, "ok"]);

await checkAsync("it gives up after the last delay, not forever", async () => {
  const sync = loadSync({ attempts: [blip, blip, blip, blip, good] });
  await sync.syncWithDoc("u");
  return [sync.tries(), sync.statuses[sync.statuses.length - 1]];
}, [4, "failed"]);

await checkAsync("a misconfigured deployment fails fast instead of retrying", async () => {
  const sync = loadSync({ attempts: [unreadable, good] });
  await sync.syncWithDoc("u");
  return [sync.tries(), sync.statuses[sync.statuses.length - 1]];
}, [1, "failed"]);

await checkAsync("overlapping triggers don't stack up pulls", async () => {
  const sync = loadSync({ attempts: [good, good] });
  await Promise.all([sync.syncWithDoc("u"), sync.syncWithDoc("u")]);
  return sync.tries();
}, 1);

await checkAsync("a later trigger works once the first pull is done", async () => {
  const sync = loadSync({ attempts: [good, good] });
  await sync.syncWithDoc("u");
  await sync.syncWithDoc("u");
  return sync.tries();
}, 2);

/* ---- what comes back from the endpoint ---- */
check("the Apps Script payload", tabsFrom(JSON.stringify({ tabs: [{ title: "a", text: "b" }] })),
  [{ title: "a", text: "b" }]);
check("a bare array of tabs", tabsFrom(JSON.stringify([{ title: "a", text: "b" }])),
  [{ title: "a", text: "b" }]);
check("a plain-text endpoint is one untitled tab", tabsFrom("## Songs\n### X\nC"),
  [{ title: "", text: "## Songs\n### X\nC" }]);
check("an error payload becomes a tab that parses to no sets",
  SETLIST_DOC.parse(tabsFrom('{"error":"not found"}')).order, []);
check("an empty body parses to no sets", SETLIST_DOC.parse(tabsFrom("")).order, []);

/* ---- the head start: the <head> asks for the doc, the page script uses that answer ---- */
async function checkAsync(name, run, expected) {
  try {
    check(name, await run(), expected);
  } catch (error) {
    check(name, `threw: ${error && error.message}`, expected);
  }
}

/* fetchTabs closes over window, fetch, and the timeout constant. */
function loadFetchTabs({ prefetch, fetchImpl, timeoutMs = 9000 }) {
  const html = readFileSync(join(HERE, "template.html"), "utf8");
  const pick = (name) => {
    const found = new RegExp(`\\n  (?:async )?function ${name}\\([\\s\\S]*?\\n  \\}`).exec(html);
    if (!found) throw new Error(`Could not find ${name}() in template.html`);
    return found[0];
  };
  const source = `${pick("tabsFrom")}\n${pick("withTimeout")}\n${pick("fetchTabs")}\nreturn fetchTabs;`;
  return new Function("window", "fetch", "PULL_TIMEOUT_MS", source)(prefetch, fetchImpl, timeoutMs);
}

const never = () => { throw new Error("fetched again instead of using the head start"); };
const payloadBody = JSON.stringify({ tabs: [{ title: "2026-08-09", text: "## Songs\n### X\nC" }] });

await checkAsync("the in-flight request from the head is used, not repeated", async () => {
  const win = { SETLIST_DOC_REQUEST: { url: "u", body: Promise.resolve(payloadBody) } };
  const { tabs } = await loadFetchTabs({ prefetch: win, fetchImpl: never })("u");
  return [tabs[0].title, win.SETLIST_DOC_REQUEST];
}, ["2026-08-09", null]);

await checkAsync("a second pull goes to the network, not the spent head start", async () => {
  const win = { SETLIST_DOC_REQUEST: { url: "u", body: Promise.resolve(payloadBody) } };
  const fetchTabsFn = loadFetchTabs({
    prefetch: win,
    fetchImpl: async () => ({ ok: true, text: async () => JSON.stringify({ tabs: [{ title: "fresh", text: "## Songs\n### Y\nD" }] }) }),
  });
  await fetchTabsFn("u");
  const { tabs } = await fetchTabsFn("u");
  return tabs[0].title;
}, "fresh");

await checkAsync("a different url ignores the head start", async () => {
  const win = { SETLIST_DOC_REQUEST: { url: "other", body: Promise.resolve(payloadBody) } };
  const { tabs } = await loadFetchTabs({
    prefetch: win,
    fetchImpl: async () => ({ ok: true, text: async () => JSON.stringify({ tabs: [{ title: "direct", text: "## Songs\n### Y\nD" }] }) }),
  })("u");
  return tabs[0].title;
}, "direct");

await checkAsync("a head start that never answers gives up instead of hanging", async () => {
  const win = { SETLIST_DOC_REQUEST: { url: "u", body: new Promise(() => {}) } };
  try {
    await loadFetchTabs({ prefetch: win, fetchImpl: never, timeoutMs: 40 })("u");
    return "no error";
  } catch (error) {
    return /timed out/.test(error.message) ? "timed out" : error.message;
  }
}, "timed out");

await checkAsync("a failed head start surfaces as an error, not a blank page", async () => {
  const win = { SETLIST_DOC_REQUEST: { url: "u", body: Promise.reject(new Error("HTTP 403")) } };
  try {
    await loadFetchTabs({ prefetch: win, fetchImpl: never })("u");
    return "no error";
  } catch (error) { return error.message; }
}, "HTTP 403");


check("a sign-in page is diagnosed as a sharing problem",
  /Anyone/.test(describeBody('<!DOCTYPE html><html>Sign in</html>')), true);
check("valid JSON with nothing in it is diagnosed as a format problem",
  /SETLIST_DOC/.test(describeBody('{"tabs":[]}')), true);

/* ---- the whole runtime path: endpoint body -> the sets the page shows ---- */
const payload = JSON.stringify({ tabs, pulledAt: "2026-08-03T12:00:00Z" });
const live = SETLIST_DOC.parse(tabsFrom(payload));
check("a real endpoint response yields both sets", live.order, ["2026-08-02", "2026-07-05"]);
check("and they match the offline copies", live.sets, doc.sets);

if (failures.length) {
  console.error(`${failures.length} failing check(s):\n\n${failures.join("\n\n")}`);
  process.exit(1);
}
console.log("All Google Doc format checks passed.");
