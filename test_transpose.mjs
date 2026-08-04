#!/usr/bin/env node
/**
 * Tests for the transposer's music theory, run against the real code in template.html.
 *
 * Usage:
 *     node test_transpose.mjs
 *
 * The `MUSIC` block in template.html is pure text-in/text-out (no DOM), so it can be
 * lifted out and exercised directly. If the block is renamed, this test says so loudly.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function loadMusic() {
  const html = readFileSync(join(HERE, "template.html"), "utf8");
  const source = /const MUSIC = \(function \(\) \{[\s\S]*?\n  \}\)\(\);/.exec(html);
  if (!source) throw new Error("Could not find the MUSIC block in template.html");
  return new Function(source[0] + "\nreturn MUSIC;")();
}

const MUSIC = loadMusic();
const key = (label) => MUSIC.parseKey(label);
const failures = [];

function check(name, actual, expected) {
  const got = JSON.stringify(actual);
  const want = JSON.stringify(expected);
  if (got === want) return;
  failures.push(`${name}\n  expected: ${want}\n  actual:   ${got}`);
}

/* ---- chord recognition ---- */
check("chord: plain", MUSIC.parseChord("A").root, "A");
check("chord: slash bass", MUSIC.parseChord("E/G#").bass, "G#");
check("chord: extensions", MUSIC.parseChord("D7sus").quality, "7sus");
check("chord: half diminished", MUSIC.parseChord("Bm7b5").quality, "m7b5");
check("lyric word is not a chord", MUSIC.parseChord("Be"), null);
check("chant is not a chord", MUSIC.parseChord("Na-Na"), null);
check("heading is not a chord", MUSIC.parseChord("[Chorus]"), null);

/* ---- transposition ---- */
check("up a semitone", MUSIC.transposeTo("A E F#m", key("A"), key("Bb")), "Bb F Gm");
check("down a whole step", MUSIC.transposeTo("A E F#m", key("A"), key("G")), "G D Em");
check("same key is untouched", MUSIC.transposeTo("A#  Gm7 D#", key("A#"), key("A#")), "A#  Gm7 D#");
check("keeps the author's spelling at the written key",
  MUSIC.transposeTo("A# D#", key("A#"), key("Bb")), "A# D#");
check("flat key spells flats", MUSIC.transposeTo("D Em7 A", key("D"), key("Eb")), "Eb Fm7 Bb");
check("sharp key spells sharps", MUSIC.transposeTo("D Em7 A", key("D"), key("E")), "E F#m7 B");
check("minor key follows its relative major",
  MUSIC.transposeTo("Am Dm E", key("Am"), key("Cm")), "Cm Fm G");
check("slash chords move both notes",
  MUSIC.transposeTo("A E/G# D Bm", key("A"), key("C")), "C G/B  F Dm");

/* ---- lyrics and layout ---- */
const SHEET = [
  "[Verse]",
  "        D  E         C#m  F#m",
  "He's my King, He's my song",
  "(same as verse 1)",
  "C Em G D",
].join("\n");
const MOVED = MUSIC.transposeTo(SHEET, key("A"), key("G"));
check("headings, lyrics and asides survive verbatim",
  MOVED.split("\n").filter((_, i) => [0, 2, 3].includes(i)),
  ["[Verse]", "He's my King, He's my song", "(same as verse 1)"]);
check("chord columns hold", MOVED.split("\n")[1], "        C  D         Bm   Em");
check("bare chord line transposes", MOVED.split("\n")[4], "Bb Dm F C");
check("a longer name only nudges what follows",
  MUSIC.transposeTo("F  G  C", key("C"), key("Db")), "Gb Ab Db");
check("performance notes ride along untransposed",
  MUSIC.transposeTo("Am (build sound)     F (break)      G (break)", key("C"), key("F")),
  "Dm (build sound)     Bb (break)     C (break)");
check("an aside on its own is left alone",
  MUSIC.transposeTo("(same as verse 1)", key("C"), key("F")), "(same as verse 1)");
check("a chord in parentheses still moves",
  MUSIC.transposeTo("(A) D", key("A"), key("C")), "(C) F");

/* ---- keys ---- */
check("shift reads as a drop, not a big climb", MUSIC.describeShift(10), "-2");
check("shift reads up", MUSIC.describeShift(2), "+2");
check("key falls back to the first chord", MUSIC.firstChordRoot(SHEET), "D");
check("nonsense is not a key", MUSIC.parseKey("Hey!"), null);

/* ---- every key stays readable ---- */
const DIATONIC_IN_G = "G Am Bm C D Em F#m D/F# Cmaj7";
for (const target of ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]) {
  const moved = MUSIC.transposeTo(DIATONIC_IN_G, key("G"), key(target));
  check(`G -> ${target} keeps 9 chords`, moved.split(/\s+/).length, 9);
  check(`G -> ${target} spells single accidentals only`, /bb|##/.test(moved), false);
  check(`G -> ${target} starts on the tonic`, moved.split(" ")[0], target);
}

if (failures.length) {
  console.error(`${failures.length} failing check(s):\n\n${failures.join("\n\n")}`);
  process.exit(1);
}
console.log("All transpose checks passed.");
