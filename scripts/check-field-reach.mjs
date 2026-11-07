#!/usr/bin/env node
/*
 * Какие поля данных доходят до читателя.
 *
 * Отвечает на вопрос, который за один вечер выясняли трижды, поодиночке и
 * по случайному поводу: доходит ли `meta.altitude` (нет), доходят ли
 * `infusions[].notes` (нет), доходит ли `appearance` (нет). Каждый раз это
 * был отдельный разбор, и каждый раз незнание стоило работы: высота
 * лежала в реестре запрещённого рядом с текстами, которые читатель видит,
 * тире искали по перечню полей, пятнадцать текстов попали в работу зря.
 *
 * Список «поле → доходит ли» вести руками нельзя — ровно за перечни,
 * отстающие от вывода, мы весь день и платили. Поэтому здесь нет списка:
 * значения берутся из данных и ищутся в собранных страницах. Это прямой
 * ответ на «доходит ли», и он не устаревает молча.
 *
 * Способ предложил justea-catalog, им же и проверил `appearance`.
 *
 * ДВА РАЗНЫХ ВОПРОСА, и первая версия их смешала. «Доходит до исходника»
 * и «видит читатель» — не одно и то же: заметки проливов находятся в
 * собранном HTML, потому что уезжают в разметку `HowTo` и во flight-данные
 * Next, а на странице их нет. Для утечек аппарата важен исходник, для
 * текста и пунктуации — видимое. Поэтому считаются обе колонки.
 *
 * Запускать после `next build`: `node scripts/check-field-reach.mjs`.
 * Проверка ничего не запрещает: она печатает инвентарь. Падает только
 * если собранных страниц нет.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PAGES = ".next/server/app";
const DATA = "data/teas.json";

if (!existsSync(PAGES)) {
    console.error(`нет ${PAGES} — сначала next build`);
    process.exit(2);
}

const sources = readdirSync(PAGES, { recursive: true })
    .filter((name) => String(name).endsWith(".html"))
    .map((name) => readFileSync(join(PAGES, String(name)), "utf8"));

const html = sources.join("\n");

/** То, что остаётся на странице после снятия скриптов и тегов. */
const visible = sources
    .map((page) =>
        page
            .replace(/<script[\s\S]*?<\/script>/g, " ")
            .replace(/<style[\s\S]*?<\/style>/g, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&quot;/g, '"')
            .replace(/&#x27;|&apos;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/\s+/g, " "),
    )
    .join("\n");

const raw = JSON.parse(readFileSync(DATA, "utf8"));
const teas = raw.teas ?? raw;

/*
 * Короткие значения не ищутся: «1», «Мягкий», «shu» встречаются в
 * собранной странице по сотне посторонних причин, от классов вёрстки до
 * чужого текста. Порог в двенадцать знаков — не точность, а признание
 * границы: поэтому в выводе печатается и сколько значений пропущено.
 */
const MIN = 12;

const fields = new Map();

const visit = (value, path) => {
    if (typeof value === "string") {
        const key = path.join(".");
        const entry =
            fields.get(key) ?? { total: 0, short: 0, found: 0, seen: 0, sample: null };
        entry.total += 1;

        if (value.length < MIN) {
            entry.short += 1;
        } else {
            if (html.includes(value)) entry.found += 1;
            if (visible.includes(value.replace(/\s+/g, " "))) entry.seen += 1;
            if (!entry.sample && !html.includes(value)) entry.sample = value;
        }

        fields.set(key, entry);
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) visit(item, path);
        return;
    }

    if (value && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) visit(item, [...path, key]);
    }
};

for (const tea of teas) visit(tea, []);

const rows = [...fields.entries()]
    .map(([field, e]) => ({ field, ...e, checked: e.total - e.short }))
    .sort((a, b) => a.field.localeCompare(b.field));

const seen = rows.filter((r) => r.checked > 0 && r.seen === r.checked);
const inSourceOnly = rows.filter((r) => r.checked > 0 && r.found > 0 && r.seen === 0);
const never = rows.filter((r) => r.checked > 0 && r.found === 0);
const partly = rows.filter(
    (r) => r.checked > 0 && r.seen > 0 && r.seen < r.checked && r.found > 0,
);
const unknown = rows.filter((r) => r.checked === 0);

const show = (title, list, note) => {
    if (list.length === 0) return;
    console.log(`\n${title} (${list.length})${note ? " — " + note : ""}`);
    for (const r of list) {
        const tail = r.sample ? `  пример: «${r.sample.slice(0, 55)}…»` : "";
        console.log(
            `  ${r.field.padEnd(32)} видно ${String(r.seen).padStart(3)}/${r.checked}` +
                `  в исходнике ${String(r.found).padStart(3)}/${r.checked}${tail}`,
        );
    }
};

console.log(
    `поля с текстом: ${rows.length}, значений ${rows.reduce((s, r) => s + r.total, 0)}, ` +
        `из них короче ${MIN} знаков и не проверялись ${rows.reduce((s, r) => s + r.short, 0)}`,
);

show("видит читатель", seen);
show(
    "только в исходнике",
    inSourceOnly,
    "на странице нет, но уезжает в разметку или во flight-данные",
);
show("не доходят вовсе", never, "ни на странице, ни в исходнике");
show(
    "видно частично",
    partly,
    "две известные причины, обе не дефект: вкладки неглавных способов " +
        "в пререндер не попадают, а дескрипторы на странице склеиваются " +
        "в предложение и теряют исходный регистр",
);
show("нечего проверить", unknown, `все значения короче ${MIN} знаков`);
