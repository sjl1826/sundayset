#!/usr/bin/env node
/**
 * Tests for stage mode's chord-size steps, run against the real code in template.html.
 *
 * Usage:
 *     node test_display.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "template.html"), "utf8");
const sizes = JSON.parse(/const CHORD_SIZES = (\[[^\]]*\]);/.exec(html)[1]);
const phone = JSON.parse(/const PHONE_SIZES = (\[[^\]]*\]);/.exec(html)[1]);
const body = /    function clampStep\(value\) \{([\s\S]*?)\n    \}/.exec(html)[1];
const clamp = new Function("value", "CHORD_SIZES", "DEFAULT_STEP", body);
const c = (v) => clamp(v, sizes, 1);

let fails = 0;
const check = (name, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) { fails++; console.error(`FAIL ${name}\n  want ${JSON.stringify(want)}\n  got  ${JSON.stringify(got)}`); }
};

check("same number of steps on phone and desktop", phone.length, sizes.length);
check("desktop sizes ascend", sizes.every((v,i)=>i===0||v>sizes[i-1]), true);
check("phone sizes ascend", phone.every((v,i)=>i===0||v>phone[i-1]), true);
check("phone sizes never exceed desktop", sizes.every((v,i)=>phone[i] <= v), true);
check("default step is a readable 14px", sizes[1], 14);
check("largest is worth having", sizes[sizes.length-1] >= 24, true);

check("clamps below zero", c(-5), 0);
check("clamps above the top", c(99), sizes.length-1);
check("garbage falls back to default", c("abc"), 1);
check("null falls back to default", c(null), 1);
check("a stored string still works", c("3"), 3);
check("rounds a fractional step", c(2.4), 2);
check("every step maps to a size", sizes.map((_,i)=>Number.isFinite(sizes[c(i)])).every(Boolean), true);

if (fails) process.exit(1);
console.log(`Display checks passed (${sizes.length} sizes: ${sizes.join(", ")}px; phone: ${phone.join(", ")}px)`);
