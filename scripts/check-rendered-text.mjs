#!/usr/bin/env node
/*
 * Проверка собранных страниц, а не данных.
 *
 * Проверка по данным уже один раз обманула: она перечисляла поля вручную
 * (`description`, `brewMethods[].description`, `notes`) и показала ноль
 * длинных тире, когда их оставалось пятьдесят одно — в `infusions[].notes`,
 * `caution.text`, `brewOutcomes[].consequence` и `meta.origin`. Инструмент
 * измерял не то множество, которое доходит до читателя.
 *
 * Поэтому здесь читается `.next/server/app/*.html` — то, что видит человек.
 * Список полей отсюда выпадает вовсе: новое поле попадает под проверку в
 * тот момент, когда его начинают выводить, а не когда о нём вспомнят.
 *
 * Запускать после `next build`: `node scripts/check-rendered-text.mjs`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = ".next/server/app";

if (!existsSync(DIR)) {
    console.error(`нет ${DIR} — сначала next build`);
    process.exit(2);
}

/*
 * Правила. `hint` печатается рядом с находкой: инструмент тупой, правило
 * стилистическое, и зазор между ними закрывается только словами.
 */
const RULES = [
    {
        name: "длинное тире",
        pattern: /—/g,
        hint:
            "Решение пользователя 06.11.2026: пунктуация авторская, без «нейронной». " +
            "Дело не в знаке, а в его однообразной частоте. " +
            "В конструкции «подлежащее — сказуемое» тире меняется НЕ на запятую, " +
            "а перестройкой фразы: «Диапазон навески — 4,5–6 г» → «Диапазон навески: 4,5–6 г». " +
            "«Диапазон навески, 4,5–6 г» не менее машинно и вдобавок неграмотно. " +
            "При отрицании тире и не ставится: «Габа не сорт, а обработка».",
    },
    {
        name: "справочный аппарат",
        pattern:
            /GB\s?\/?\s?T\s?\d|\bISO\b|\bDB\s?53\b|[　-鿿]|полифенол|катехин|теанин|EGCG|\bppm\b|\b[A-Z][a-z]+\s+(?:19|20)\d\d\b|стандарт\w*|нормативн\w*|экспертн\w*/g,
        hint:
            "Решение пользователя 07.11.2026: на странице нет номеров стандартов, " +
            "иероглифов, химии и ссылок на работы. Фактура остаётся в data/** и " +
            "docs/sources/**, она не исчезает — она не выводится. " +
            "Ограждение на выходе: lib/plain-text.ts.",
    },
];

/*
 * Заголовок окна и мета-описание из проверки на тире исключены намеренно.
 *
 * «Ассам — как заваривать: проливы, температура, пропорции — Justea»: здесь
 * тире не стилистическая пауза, а разделитель частей заголовка, обычная
 * типографика выдачи. Правило пользователя про прозу; гнать его на шаблон
 * заголовка значило бы переписывать `lib/metadata.ts` ради проверки.
 * Справочный аппарат в заголовке проверяется по-прежнему.
 */
const stripHead = (html) =>
    html
        .replace(/<title[\s\S]*?<\/title>/gi, " ")
        .replace(/<meta[^>]*>/gi, " ");

const visible = (html) =>
    html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&mdash;/g, "—")
        .replace(/&[a-z]+;|&#\d+;/g, " ")
        .replace(/\s+/g, " ");

const pages = readdirSync(DIR)
    .filter((name) => name.endsWith(".html") && !name.startsWith("_"))
    .sort();

let failed = 0;

for (const rule of RULES) {
    const hits = [];

    for (const page of pages) {
        const html = readFileSync(join(DIR, page), "utf8");
        const text = visible(
            rule.name === "длинное тире" ? stripHead(html) : html,
        );
        const found = text.match(rule.pattern);

        if (!found) continue;

        // Для тире показываем контекст: без него непонятно, какую фразу
        // перестраивать, а замена вслепую и даёт неграмотный результат.
        const samples = [...text.matchAll(rule.pattern)]
            .slice(0, 3)
            .map((m) => text.slice(Math.max(0, m.index - 45), m.index + 45).trim());

        hits.push({ page, count: found.length, samples });
    }

    if (hits.length === 0) {
        console.log(`${rule.name}: ноль на ${pages.length} страницах`);
        continue;
    }

    failed += 1;
    const total = hits.reduce((sum, hit) => sum + hit.count, 0);
    console.error(`\n${rule.name}: ${total} на ${hits.length} страницах из ${pages.length}`);
    console.error(`  ${rule.hint}`);

    for (const hit of hits) {
        console.error(`\n  ${hit.page} — ${hit.count}`);
        for (const sample of hit.samples) console.error(`    …${sample}…`);
    }
}

process.exit(failed > 0 ? 1 : 0);
