#!/usr/bin/env node
/**
 * Bundles the web build into ONE self-contained .html file — no external
 * requests — so the app can be dropped on any static host (or published as a
 * Claude Artifact) and opened on a phone.
 *
 *   node tools/build-web-single-file.mjs [outfile]
 *
 * Requires `pyftsubset` (pip install fonttools brotli) on PATH.
 *
 * Why subset: the shipped Pretendard TTFs are ~2.7MB each because they carry
 * the full Hangul syllable range. Base64'd, four weights blow past any sane
 * single-file budget. Subsetting to woff2 — still the complete U+AC00–D7A3
 * block, so anything the user types renders — brings all four to ~2.6MB.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'dist-single', 'packit.html'));
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'packit-web-'));
const WEB = path.join(WORK, 'web');
const SUBSET = path.join(WORK, 'subset');

// Latin, punctuation, currency, arrows, maths, enclosed + geometric shapes,
// dingbats (✓ ✎), CJK punctuation, Hangul jamo, every modern Hangul syllable,
// and fullwidth forms (＋).
const UNICODES = [
  'U+0020-007E', 'U+00A0-00FF', 'U+2000-206F', 'U+20A0-20BF', 'U+2190-21FF',
  'U+2200-22FF', 'U+2460-24FF', 'U+25A0-25FF', 'U+2600-26FF', 'U+2700-27BF',
  'U+3000-303F', 'U+1100-11FF', 'U+3130-318F', 'U+AC00-D7A3', 'U+FF01-FF5E',
].join(',');

const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

console.log('› exporting web build');
run('npx', ['expo', 'export', '--platform', 'web', '--output-dir', WEB]);

console.log('› subsetting Pretendard');
fs.mkdirSync(SUBSET, { recursive: true });
for (const file of fs.readdirSync(path.join(ROOT, 'assets', 'fonts'))) {
  const name = path.basename(file, '.ttf');
  run('pyftsubset', [
    path.join(ROOT, 'assets', 'fonts', file),
    `--output-file=${path.join(SUBSET, `${name}.woff2`)}`,
    '--flavor=woff2',
    '--layout-features=*',
    `--unicodes=${UNICODES}`,
  ]);
}

const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
const bundlePath = html.match(/<script src="([^"]+)"/)?.[1];
if (!bundlePath) throw new Error('no <script src> in the exported index.html');
let js = fs.readFileSync(path.join(WEB, bundlePath.replace(/^\//, '')), 'utf8');

const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;

console.log('› inlining fonts');
const assets = [...new Set(js.match(/\/assets\/[^"']*?\.ttf/g) ?? [])];
if (!assets.length) throw new Error('found no font assets to inline');
for (const url of assets) {
  const name = path.basename(url).replace(/\.[a-f0-9]{32}\.ttf$/, '');
  const subset = path.join(SUBSET, `${name}.woff2`);
  const uri = fs.existsSync(subset)
    ? dataUri(subset, 'font/woff2')
    : dataUri(path.join(WEB, url.replace(/^\//, '')), 'font/ttf');
  js = js.split(url).join(uri);
  console.log(`  ${name} ${mb(uri.length)}`);
}

// A <meta name="viewport"> placed in <body> is not reliably honoured, and some
// hosts (Claude Artifacts) own the <head>. Install it from script instead.
const boot = `(function(){
  function meta(n,c){var m=document.createElement('meta');m.name=n;m.content=c;document.head.appendChild(m);}
  meta('viewport','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
  meta('apple-mobile-web-app-capable','yes');
})();`;

const out = `<title>짐 — Pack It</title>
<style>
  html, body { height: 100%; }
  body {
    overflow: hidden;
    margin: 0;
    background: #FFFBF3;
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
  }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>${boot}</script>
<script>${js.split('</script').join('<\\/script')}</script>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
fs.rmSync(WORK, { recursive: true, force: true });
console.log(`\n✓ ${OUT}  ${mb(Buffer.byteLength(out))}`);
