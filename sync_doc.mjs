#!/usr/bin/env node
/**
 * Refresh the offline copy of the set lists from the Google Doc.
 *
 * Usage:
 *     node sync_doc.mjs                  # endpoint from config.js
 *     node sync_doc.mjs <endpoint-url>
 *
 * The page pulls the doc live on every visit, so this is only about the fallback:
 * it rewrites sets/*.json from the doc so the page still has the current set lists
 * when the doc can't be reached (and so they're committed and diffable).
 *
 * Run `python3 build.py` afterwards to bake them into index.html.
 *
 * It parses with the very same SETLIST_DOC code the page uses, lifted out of
 * template.html — one format, one parser.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SETS_DIR = join(HERE, "sets");

function loadParser() {
  const html = readFileSync(join(HERE, "template.html"), "utf8");
  const source = /const SETLIST_DOC = \(function \(\) \{[\s\S]*?\n  \}\)\(\);/.exec(html);
  if (!source) throw new Error("Could not find the SETLIST_DOC block in template.html");
  return new Function(source[0] + "\nreturn SETLIST_DOC;")();
}

function endpointFromConfig() {
  const config = readFileSync(join(HERE, "config.js"), "utf8");
  const found = /SETLIST_DOC_URL\s*=\s*["'](.*?)["']/.exec(config);
  return found ? found[1].trim() : "";
}

async function fetchTabs(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
  const body = await response.text();
  const data = JSON.parse(body);
  const tabs = Array.isArray(data) ? data : data && data.tabs;
  if (!tabs || !tabs.length) throw new Error("the endpoint returned no tabs");
  return tabs;
}

/* sets/*.json shape: the page's own state plus the date it's filed under. */
function setFile(id, set) {
  return JSON.stringify({ date: id, ...set }, null, 2) + "\n";
}

const url = process.argv[2] || endpointFromConfig();
if (!url) {
  console.error("No endpoint. Put your Apps Script /exec URL in config.js, or pass it as an argument.");
  process.exit(1);
}

const { sets, order, defaultId } = loadParser().parse(await fetchTabs(url));
if (!order.length) {
  console.error("The doc parsed to no sets. Check its format against SETLIST_DOC.md.");
  process.exit(1);
}

mkdirSync(SETS_DIR, { recursive: true });
order.forEach((id) => writeFileSync(join(SETS_DIR, `${id}.json`), setFile(id, sets[id]), "utf8"));

console.log(`Wrote ${order.length} set(s) to sets/: ${order.join(", ")}`);
console.log(`Most recent: ${defaultId}`);
console.log("Now run: python3 build.py");
