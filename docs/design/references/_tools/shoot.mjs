import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const sites = JSON.parse(fs.readFileSync('sites.json', 'utf8'));
const only = process.argv[3] ? process.argv[3].split(',') : null;

const BLOCK = /403 ERROR|Confirm you are human|Just a moment|Checking your browser|Attention Required|Access Denied|Один момент|Выполнение проверки безопасности|Verifying you are human|Enable JavaScript and cookies|Pardon Our Interruption/i;
const NOTFOUND = /\b(404|page can.?t be found|page not found|страница не найдена)\b/i;

const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
};


// Баннеры согласия закрываем только отказом — ничего не принимаем и не подтверждаем.
const DECLINE = [
  'decline', 'decline all', 'decline cookies', 'reject', 'reject all',
  'reject non-essential', 'only essential', 'essential only', 'necessary only',
  'only necessary', 'deny', 'no thanks', 'no, thanks', "i don't like cookies",
  'i dont like cookies', 'отклонить', 'отклонить все', 'отказаться',
  'нет, спасибо', 'только необходимые', 'принимаю только необходимые',
];

async function dismissConsent(page) {
  for (let round = 0; round < 3; round++) {
    const clicked = await page.evaluate((labels) => {
      const seen = [...document.querySelectorAll('button, a, [role="button"], input[type="button"]')];
      for (const el of seen) {
        const t = (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!t || t.length > 40) continue;
        if (!labels.includes(t)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        el.click();
        return t;
      }
      return null;
    }, DECLINE);
    if (!clicked) break;
    await page.waitForTimeout(1200);
  }
}

const browser = await chromium.launch();
const LOGPATH = path.join(OUT, '_shots.json');
// лог накапливаем: повторный прогон по части сайтов не должен стирать остальные записи
const log = fs.existsSync(LOGPATH) ? JSON.parse(fs.readFileSync(LOGPATH, 'utf8')) : [];
const put = (rec) => {
  const i = log.findIndex(r => r.id === rec.id && r.kind === rec.kind && r.view === rec.view);
  if (i >= 0) log[i] = rec; else log.push(rec);
};

for (const s of sites) {
  if (only && !only.includes(s.id)) continue;
  const dir = path.join(OUT, s.id);
  fs.mkdirSync(dir, { recursive: true });
  for (const [vname, vopts] of Object.entries(VIEWS)) {
    const ctx = await browser.newContext({ ...vopts, locale: 'ru-RU', colorScheme: 'light' });
    for (const [kind, url] of [['home', s.url], ['key', s.keyUrl]]) {
      const rec = { id: s.id, kind, view: vname, url, status: null, date: null, title: null, finalUrl: null, ok: false, why: null };
      const page = await ctx.newPage();
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        rec.status = resp?.status() ?? null;
        rec.date = resp?.headers()?.date ?? null;
        await page.waitForTimeout(5000);
        try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
        try { await dismissConsent(page); } catch {}
        rec.title = (await page.title()).slice(0, 110);
        rec.finalUrl = page.url();
        const body = (await page.evaluate(() => document.body?.innerText || '')).replace(/\s+/g, ' ').slice(0, 400);
        if (rec.status && rec.status >= 400) rec.why = 'HTTP ' + rec.status;
        else if (BLOCK.test(rec.title) || BLOCK.test(body)) rec.why = 'бот-проверка';
        else if (NOTFOUND.test(rec.title) || NOTFOUND.test(body.slice(0, 160))) rec.why = 'страница не найдена';
        if (!rec.why) {
          await page.screenshot({ path: path.join(dir, `${kind}-${vname}.jpg`), type: 'jpeg', quality: 72, animations: 'disabled', timeout: 90000 });
          rec.ok = true;
        }
      } catch (e) { rec.why = String(e).split('\n')[0].replace(/^\w+Error: /, '').slice(0, 90); }
      await page.close();
      put(rec);
      console.error(`${rec.ok ? 'ok  ' : 'FAIL'} ${s.id} ${kind}-${vname} ${rec.status ?? ''} ${rec.why ?? ''}`);
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(LOGPATH, JSON.stringify(log, null, 1));
