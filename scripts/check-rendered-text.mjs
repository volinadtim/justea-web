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
 * Строки, в которых тире ставит код, а не автор.
 *
 * Вычитаются по тексту самого шаблона, а не по месту в разметке: один и
 * тот же заголовок лежит в `<title>`, в `headline` разметки и ещё раз во
 * flight-данных Next в экранированном виде. Исключать по месту пришлось
 * бы трижды и всё равно неполно.
 *
 * `«Ассам — как заваривать: проливы, температура, пропорции — Justea»` —
 * разделитель частей заголовка; `«Ассам — 2,5 г на 100 мл воды»` собирает
 * `schema.ts`. Проза внутри разметки приходит из тех же полей, что и
 * страница, поэтому проверяется вместе с ними.
 */
const GENERATED = [
    /\u2014\s*как заваривать(?: чай)?: проливы, температура, пропорции/g,
    /\u2014\s*Justea/g,
    /\u2014\s*[\d,.]+ г на \d+ мл воды/g,
    /\u2014\s*проливы, температура, пропорции/g,
];

const stripGenerated = (html) =>
    GENERATED.reduce((text, pattern) => text.replace(pattern, " "), html);

/*
 * Правило аппарата проверяется по ВСЕМУ исходнику страницы, а не по
 * видимому тексту.
 *
 * Фильтр стоял перед выводом, и этого было мало: «DB53/T 236-2007» и
 * «GB/T 23776» уезжали клиенту в сериализованных пропсах Next на семи
 * страницах, а «пик катехинов» — в `HowToStep` разметки. Читатель их не
 * видел, краулер видел. Нашёл justea-catalog.
 */
/*
 * Оба правила идут по СЫРОМУ исходнику страницы.
 *
 * Правило про тире сначала шло по видимому тексту, то есть по HTML без
 * `<script>`. Этого мало: вкладки неглавных способов заваривания в
 * пререндер не попадают и лежат только во flight-данных Next внутри
 * `<script>`. Пятьдесят пять строк у семи чаёв проверка не видела —
 * тире там прошло бы её и было бы видно тому, кто нажал «Варка».
 * Нашёл justea-voice, тем же разбором, которым ошибся сам.
 *
 * Из правила про тире исключены заголовок окна и блоки JSON-LD. В обоих
 * тире ставит код, а не автор: «Ассам — как заваривать… — Justea»
 * разделяет части заголовка, «Ассам — 2,5 г на 100 мл воды» собирается
 * шаблоном в `schema.ts`. Проза внутри разметки приходит из тех же полей,
 * что и страница, так что она проверяется вместе с ними. Аппарат в
 * JSON-LD проверяется по-прежнему — там он как раз и прятался.
 */

/*
 * Обход рекурсивный, и это не мелочь.
 *
 * Плоский `readdirSync` видел двадцать пять страниц из тридцати двух: семь
 * страниц типов лежат в `tea/`, и проверка про них не знала. На
 * `/tea/pu-erh` в это время стояло «По стандарту пуэр относится к тёмным
 * чаям», а в семи вводных абзацах — двадцать одно длинное тире. Проверка
 * печатала «ноль» и была права по тому множеству, которое смотрела.
 */
const pages = [];

(function walk(dir, prefix) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            walk(join(dir, entry.name), `${prefix}${entry.name}/`);
        } else if (entry.name.endsWith(".html") && !entry.name.startsWith("_")) {
            pages.push(`${prefix}${entry.name}`);
        }
    }
})(DIR, "");

pages.sort();

let failed = 0;

for (const rule of RULES) {
    const hits = [];

    for (const page of pages) {
        const html = readFileSync(join(DIR, page), "utf8");
        const text = (
            rule.name === "длинное тире" ? stripGenerated(html) : html
        ).replace(/\s+/g, " ");
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

/*
 * Внутренние пометки: их содержимого в собранном HTML быть не должно.
 *
 * Это другое правило, чем два верхних, и проверяет другое. Те ищут слова,
 * которых не должно быть ни в одном тексте; это ищет **конкретные строки из
 * данных** — те, что помечены как пометки для ревью, а не для читателя.
 *
 * Зачем. У Дун Дина внутреннее рассуждение лежало в `notes` и не выводилось
 * ровно потому, что в нём стоял иероглиф: фильтр аппарата его ловил. Убрали
 * иероглиф при чистке текста, и рассуждение уехало на прод. Пометку держало
 * совпадение. `BrewMethod.reviewNote` не выводится по устройству, а эта
 * проверка показывает, что устройство работает: поле снимается в
 * `plainBrewMethods`, и ни один байт его содержимого до страницы не доходит.
 *
 * Сравнение по буквам и цифрам: во flight-данных Next кавычки экранированы,
 * пробелы расставлены иначе, а знаки могут отличаться. Совпадение по буквам
 * это переживает. Берём первые 80 букв — чтобы поймать и обрезанную утечку,
 * а не только дословную.
 */
const internalNotes = (() => {
    const data = JSON.parse(readFileSync("data/teas.json", "utf8"));
    const teas = Array.isArray(data) ? data : data.teas;

    return teas.flatMap((tea) =>
        (tea.brewMethods ?? [])
            .filter((method) => method.reviewNote)
            .map((method) => ({
                where: `${tea.slug} · ${method.id}.reviewNote`,
                text: method.reviewNote,
            })),
    );
})();

const squash = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

if (internalNotes.length === 0) {
    console.log("внутренние пометки: ни одной в данных");
} else {
    const squashed = pages.map((page) => [
        page,
        squash(readFileSync(join(DIR, page), "utf8")),
    ]);
    const leaks = [];

    for (const note of internalNotes) {
        const needle = squash(note.text).slice(0, 80);

        // Слишком короткую пометку искать нечем: три слова найдутся в любом
        // тексте. Длину требует валидатор данных, здесь только говорим, что
        // эта строка осталась непроверенной.
        if (needle.length < 20) {
            console.error(`  ${note.where}: короче 20 букв, проверить нечем`);
            failed += 1;
            continue;
        }

        for (const [page, html] of squashed) {
            if (html.includes(needle)) {
                leaks.push({ ...note, page });
            }
        }
    }

    if (leaks.length === 0) {
        console.log(
            `внутренние пометки: ${internalNotes.length}, ни одной на ${pages.length} страницах`,
        );
    } else {
        failed += 1;
        console.error(
            `\nвнутренние пометки на страницах: ${leaks.length} из ${internalNotes.length}`,
        );
        console.error(
            "  `reviewNote` не выводится нигде: ни на страницу, ни в пропсы " +
                "клиента, ни в разметку. Снимается в lib/plain-text.ts, " +
                "plainBrewMethods. Если строка дошла до HTML, её выводят в " +
                "обход этой границы — или её скопировали в notes.",
        );

        for (const leak of leaks) {
            console.error(`\n  ${leak.page} — ${leak.where}`);
            console.error(`    …${leak.text.slice(0, 90)}…`);
        }
    }
}

process.exit(failed > 0 ? 1 : 0);
