/**
 * Приводит public/og.jpg к 1200×630 — размеру, который ждут Telegram, VK,
 * Twitter и Facebook. Исходник 1200×800 каждый сервис обрезал по-своему.
 *
 * Это техническая правка кадра, без смены облика: берётся та же фотография
 * и кадрируется по центру, ничего не дорисовывается.
 *
 *   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs \
 *     node docs/design/og/render.mjs path/to/source.jpg
 *
 * Без аргумента источником служит docs/design/og/source.jpg.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

const source = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(here, "source.jpg");

const playwrightPath = process.env.PLAYWRIGHT ?? "playwright";
const { chromium } = await import(playwrightPath);

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
});

// Страница пишется рядом с исходником: из about:blank браузер не читает
// file://, поэтому нужен настоящий файл в той же папке.
const shell = path.join(path.dirname(source), ".og-crop.html");
await fs.writeFile(
    shell,
    `<!doctype html><meta charset="utf-8" />
     <style>
        html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
        img { width: 1200px; height: 630px; object-fit: cover; object-position: center; display: block; }
     </style>
     <img src="${path.basename(source)}" alt="" />`
);

await page.goto("file://" + shell, { waitUntil: "load" });
await page.waitForFunction(() => {
    const img = document.querySelector("img");
    return img && img.complete && img.naturalWidth > 0;
});
await page.waitForTimeout(300);

const out = path.join(repoRoot, "public/og.jpg");
await page.screenshot({ path: out, type: "jpeg", quality: 88 });

await fs.rm(shell, { force: true });
console.log(`${source} → ${out} (1200×630)`);
await browser.close();
