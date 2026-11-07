/**
 * Сверка: число с единицей внутри текста способа должно совпадать с полем
 * того же способа.
 *
 * Пятый жанр из коллекции, названный justea-sources: значение исправлено, а
 * фраза, которая его объясняет, нет. Поля и текст расходятся, и каждое по
 * отдельности выглядит исправленным. Ни одна наша проверка этого не видит:
 * реестр смотрит на известные выведенные строки, фильтр аппарата и правило
 * про тире к числам равнодушны, а `check:data` сверяет поля с диапазонами
 * правдоподобия, но не с текстом рядом.
 *
 * Прогон: node numbers-vs-fields.mjs [ref]
 */

import { execFileSync } from "node:child_process";

const ref = process.argv[2] ?? "origin/master";
const teas = JSON.parse(
    execFileSync("git", ["show", `${ref}:data/teas.json`], { encoding: "utf8", maxBuffer: 1 << 26 }),
);

/** Числа с единицей: «80 °C», «75–85 °C», «2,9 г на 100 мл», «120 мл». */
const WITH_UNIT = /(?<sign>[−\-±]\s*)?(\d+(?:[.,]\d+)?)(?:\s*[–—]\s*(\d+(?:[.,]\d+)?))?\s*(°C|г на 100 мл|мл|г\b|с\b|секунд|минут)/gu;

/**
 * «≈ −10 °C» у сенчи — это НА сколько остынет вода при переливе, а не
 * температура. Знак перед числом отличает разницу от значения, и без этого
 * различения проверка сообщает о расхождении там, где текст про другое.
 */
const isDelta = (match) => Boolean(match.groups?.sign);

const num = (s) => Number(String(s).replace(",", "."));
const findings = [];
let texts = 0;
let numbers = 0;

for (const tea of teas) {
    for (const method of tea.brewMethods ?? []) {
        const temps = new Set([method.temperature?.from, method.temperature?.to].filter((x) => x !== undefined));
        const ratios = new Set([method.ratio, ...(method.whisked ?? []).flatMap((s) =>
            [s.powder, s.water].flatMap((v) => (typeof v === "object" && v ? [v.from, v.to] : [v])),
        )].filter((x) => x !== undefined));

        for (const [field, text] of [
            ["description", method.description],
            ...(method.notes ?? []).map((n, i) => [`notes[${i}]`, n]),
        ]) {
            if (!text) continue;
            texts += 1;

            for (const m of text.matchAll(WITH_UNIT)) {
                numbers += 1;
                const [, , a, b, unit] = m;

                if (isDelta(m)) continue;

                if (unit !== "°C") continue;

                const mentioned = [num(a), ...(b ? [num(b)] : [])];
                const unknown = mentioned.filter((v) => !temps.has(v));

                // Упоминание чужой температуры законно («остудите до 70»),
                // поэтому сообщаем только когда НИ одно число не совпало с
                // полем: тогда текст говорит про этот же способ и расходится.
                if (unknown.length === mentioned.length && temps.size) {
                    findings.push(
                        `${tea.slug}/${method.id}.${field}: в тексте ${m[0]}, ` +
                            `в поле ${[...temps].join("–")} °C`,
                    );
                }
            }
        }
    }
}

console.log(`ref: ${ref}`);
console.log(`проверено текстов: ${texts}, чисел с единицей: ${numbers}`);
console.log(`сверялись только температуры: навеску и время текст называет и для других способов`);
console.log(findings.length ? `⚠ расхождений: ${findings.length}` : "✅ расхождений нет");
for (const f of findings) console.log(`  ${f}`);
