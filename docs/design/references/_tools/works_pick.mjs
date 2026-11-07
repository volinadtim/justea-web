// Скачивает все крупные картинки со страницы работы во временную папку,
// дальше выбор лучших трёх делает pick_ink.py по насыщенности кадра.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [url, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 1600); await page.waitForTimeout(800); }
const imgs = await page.evaluate(() => [...document.querySelectorAll('img')]
  .filter(i => i.naturalWidth >= 700).map(i => i.currentSrc || i.src));
const seen = new Set(); let n = 0;
for (const src of imgs) {
  if (seen.has(src) || n >= 12) continue;
  seen.add(src);
  const r = await ctx.request.get(src);
  if (!r.ok()) continue;
  const buf = await r.body();
  const ext = (r.headers()['content-type'] || '').includes('png') ? 'png' : 'jpg';
  fs.writeFileSync(path.join(outDir, `cand-${String(++n).padStart(2, '0')}.${ext}`), buf);
}
console.log('candidates:', n);
await browser.close();
