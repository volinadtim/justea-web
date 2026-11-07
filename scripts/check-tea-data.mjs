/**
 * Проверка инвариантов `data/teas.json`.
 *
 * Зачем отдельный скрипт, когда есть типы. `lib/teas.ts` читает каталог как
 * `teasData as Tea[]` — это приведение, а не проверка: TypeScript выводит из
 * JSON строковые типы, они «сравнимы» с union'ами строковых литералов, и
 * приведение проходит молча. То есть опечатка в `type` или `puerhKind`
 * компилятором не ловится вообще. Плюс часть правил типом не выражается: «шэн
 * без прессовки не бывает» — это пункт стандарта, а не форма данных.
 *
 * Запуск: `pnpm run check:data`. Выход 1 при любой ошибке.
 *
 * Списки значений ниже — копия `types/tea.ts`. Держать их в синхроне
 * приходится руками: alias `@/` и `.ts` из обычного node не импортируются, а
 * тянуть сюда сборщик ради восьми строк дороже, чем сверять их глазами.
 * Меняешь union в `types/tea.ts` — поменяй и здесь.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "teas.json");
const typesPath = join(root, "data", "tea-types.json");

/** `TeaType` — ключи маршрутов `/tea/<type>`. */
const TEA_TYPES = ["green", "black", "oolong", "pu-erh", "white", "yellow"];

/** `StandardTeaCategory` — категория по ISO 20715 и GB/T. */
const STANDARD_CATEGORIES = [
    "green",
    "black",
    "oolong",
    "white",
    "yellow",
    "dark",
];

/**
 * Какую категорию по стандарту ожидаем у каждого типа. Поле `standardCategory`
 * заполняют только там, где оно расходится с ожидаемым, поэтому проверяем не
 * наличие, а отсутствие противоречия.
 */
const EXPECTED_STANDARD_CATEGORY = {
    green: "green",
    black: "black",
    oolong: "oolong",
    "pu-erh": "dark",
    white: "white",
    yellow: "yellow",
};

/** `PuerhKind`. */
const PUERH_KINDS = ["shu", "sheng"];

/** `PressedForm` — GB/T 22111-2008 п. 5.2.2. */
const PRESSED_FORMS = ["cake", "tuo", "brick", "column"];

/** `TeaProcessing` — модификация обработки, тип при этом не меняется. */
const PROCESSINGS = ["gaba"];

/**
 * Границы правдоподобия для навески и температуры.
 *
 * Это защита от описки в разряде, а не от неверного значения: сказать,
 * сколько грамм правильно, скрипт не может. Границы намеренно широкие.
 *
 * Верхняя граница навески — 25 г/100 мл, потому что законный выброс уже
 * известен: **официальная навеска гёкуро это 10 г на 60 мл при 50 °C и
 * 150 с, то есть 16,7 г/100 мл** против 2,2 у сенчи. Если гёкуро внести «по
 * шаблону зелёного чая», получится совсем другой напиток. Не «исправляйте»
 * это число, когда оно появится в каталоге.
 *
 * Нижняя граница температуры — 40 °C, и она тоже из-за гёкуро: 50 °C для
 * чая выглядит опиской, но это норма.
 */
const RATIO_RANGE = [0.5, 25];
const TEMPERATURE_RANGE = [40, 100];

/** `Misconception.kind`. */
const MISCONCEPTION_KINDS = [
    "classification",
    "origin",
    "processing",
    "composition",
    "brewing",
];

/** Подстановки, которые разворачивает lib/tea-type-facts.ts. */
const PLACEHOLDERS = ["temperature", "ratio"];

const errors = [];

function fail(slug, message) {
    errors.push(`${slug}: ${message}`);
}

/**
 * Ошибки заваривания и заблуждения проверяются одинаково и на уровне типа, и
 * на уровне сорта — поэтому вынесено в функцию, а не продублировано.
 */
function checkFacts(where, facts) {
    const seenIds = new Set();

    for (const mistake of facts.brewMistakes ?? []) {
        if (mistake.id !== undefined) {
            if (seenIds.has(mistake.id)) {
                fail(where, `brewMistakes: id "${mistake.id}" повторяется — на него не сослаться`);
            }
            seenIds.add(mistake.id);
        }

        for (const field of ["mistake", "result", "fix"]) {
            if (typeof mistake[field] !== "string" || !mistake[field].trim()) {
                fail(where, `brewMistakes: поле "${field}" пустое или не строка`);
            }
        }

        // На странице три поля склеиваются в «{result} — {mistake}. {fix}»,
        // то есть `fix` начинает новое предложение. Со строчной буквы оно
        // выглядит как опечатка — а это крупнейшие страницы сайта.
        if (/^[a-zа-яё]/.test(String(mistake.fix ?? ""))) {
            fail(
                where,
                `brewMistakes: "${String(mistake.fix).slice(0, 30)}…" начинается со строчной буквы. ` +
                    "На странице это отдельное предложение после точки",
            );
        }

        // Неизвестная подстановка не развернётся и уедет на страницу как
        // «{whatever}» посреди предложения.
        for (const text of [mistake.result, mistake.fix]) {
            for (const [, name] of String(text ?? "").matchAll(/\{(\w+)\}/g)) {
                if (!PLACEHOLDERS.includes(name)) {
                    fail(
                        where,
                        `brewMistakes: подстановка "{${name}}" неизвестна. Известные: ` +
                            PLACEHOLDERS.map((p) => `{${p}}`).join(", "),
                    );
                }
            }
        }
    }

    for (const item of facts.misconceptions ?? []) {
        for (const field of ["claim", "correction"]) {
            if (typeof item[field] !== "string" || !item[field].trim()) {
                fail(where, `misconceptions: поле "${field}" пустое или не строка`);
            }
        }

        // «Это миф» без ссылки — такое же неподтверждённое утверждение, как и
        // сам миф, только с обратным знаком (условие justea-sources).
        if (!Array.isArray(item.sources) || item.sources.length === 0) {
            fail(
                where,
                `misconceptions: «${String(item.claim).slice(0, 40)}…» без источников. ` +
                    "Опровержение без ссылки не публикуем",
            );
        }

        if (!MISCONCEPTION_KINDS.includes(item.kind)) {
            fail(
                where,
                `misconceptions: kind "${item.kind}" неизвестен. Известные: ` +
                    MISCONCEPTION_KINDS.join(", "),
            );
        }
    }
}

const teas = JSON.parse(readFileSync(dataPath, "utf8"));
const typeFacts = JSON.parse(readFileSync(typesPath, "utf8"));

/** Все `id` записей уровня категории — на них ссылается `replaces`. */
const categoryMistakeIds = new Set(
    Object.entries(typeFacts)
        .filter(([key]) => key !== "$comment")
        .flatMap(([, facts]) => facts.brewMistakes ?? [])
        .map((mistake) => mistake.id)
        .filter(Boolean),
);

if (!Array.isArray(teas)) {
    console.error("data/teas.json: ожидался массив записей");
    process.exit(1);
}

const seenSlugs = new Set();

for (const tea of teas) {
    const slug = tea.slug ?? "<без slug>";

    if (seenSlugs.has(slug)) {
        fail(slug, "slug повторяется — два чая не могут жить по одному URL");
    }
    seenSlugs.add(slug);

    if (!TEA_TYPES.includes(tea.type)) {
        fail(
            slug,
            `type "${tea.type}" неизвестен. Известные: ${TEA_TYPES.join(", ")}. ` +
                "Новый тип добавляется в TeaType, TEA_TYPES, TEA_TYPE_LABELS и " +
                "TEA_TYPE_PAGES — иначе страница типа и крошки сломаются",
        );
    }

    if (tea.standardCategory !== undefined) {
        if (!STANDARD_CATEGORIES.includes(tea.standardCategory)) {
            fail(
                slug,
                `standardCategory "${tea.standardCategory}" не из шести значений стандарта: ` +
                    STANDARD_CATEGORIES.join(", "),
            );
        } else {
            const expected = EXPECTED_STANDARD_CATEGORY[tea.type];

            if (expected && tea.standardCategory !== expected) {
                fail(
                    slug,
                    `standardCategory "${tea.standardCategory}" противоречит type "${tea.type}" ` +
                        `(ожидалось "${expected}"). Если расхождение намеренное — ` +
                        "обоснуй его в docs/sources и поправь карту в этом скрипте",
                );
            }
        }
    }

    if (tea.puerhKind !== undefined) {
        if (!PUERH_KINDS.includes(tea.puerhKind)) {
            fail(slug, `puerhKind "${tea.puerhKind}" — ожидалось "shu" или "sheng"`);
        }

        if (tea.type !== "pu-erh") {
            fail(
                slug,
                `puerhKind задан при type "${tea.type}". Шу и шэн — подтипы пуэра; ` +
                    "для прочих тёмных чаёв (любао, фу чжуань) нужен postFermentation, " +
                    "а не puerhKind",
            );
        }

        // GB/T 22111-2008 п. 5.1 и 6.5.2: рассыпным бывает только шу, шэн
        // становится пуэром лишь после прессования. Рассыпное сырьё — это
        // маоча (晒青茶), а не пуэр.
        if (tea.puerhKind === "sheng" && tea.pressedForm === undefined) {
            fail(
                slug,
                "puerhKind \"sheng\" без pressedForm противоречит GB/T 22111 п. 5.1 и 6.5.2: " +
                    "рассыпного шэна стандарт не предусматривает. Либо укажи форму прессовки, " +
                    "либо это не шэн-пуэр",
            );
        }
    }

    if (
        tea.processing !== undefined &&
        !PROCESSINGS.includes(tea.processing)
    ) {
        fail(
            slug,
            `processing "${tea.processing}" неизвестен. Известные: ${PROCESSINGS.join(", ")}`,
        );
    }

    // Габа-чай — способ обработки, а не тип: габа-улун остаётся улуном.
    // Запись с type "gaba" противоречила бы источнику уровня A.
    if (tea.type === "gaba" || tea.standardCategory === "gaba") {
        fail(
            slug,
            "габа — это processing, а не type: по Минсельхозу Тайваня это способ " +
                "обработки, применимый к разному сырью. Тип должен остаться тем, " +
                "из которого чай сделан (габа-улун → oolong)",
        );
    }

    if (
        tea.pressedForm !== undefined &&
        !PRESSED_FORMS.includes(tea.pressedForm)
    ) {
        fail(
            slug,
            `pressedForm "${tea.pressedForm}" не из форм GB/T 22111 п. 5.2.2: ` +
                PRESSED_FORMS.join(", "),
        );
    }

    if (tea.caution !== undefined) {
        if (typeof tea.caution.text !== "string" || !tea.caution.text.trim()) {
            fail(
                slug,
                "caution без текста. Пустую сноску не держим: нет обоснования — нет поля",
            );
        }

        if (
            !Array.isArray(tea.caution.sources) ||
            tea.caution.sources.length === 0
        ) {
            fail(
                slug,
                "caution без источников. Сноска о здоровье без прослеживаемого источника — " +
                    "ровно то, что в проекте убирается; нужны ключи из docs/sources/catalog.json",
            );
        }
    }

    checkFacts(slug, tea);

    for (const mistake of tea.brewMistakes ?? []) {
        if (mistake.replaces && !categoryMistakeIds.has(mistake.replaces)) {
            fail(
                slug,
                `brewMistakes: replaces "${mistake.replaces}" не находит записи с таким id ` +
                    "в data/tea-types.json. Отменяемое правило осталось бы на странице рядом " +
                    "с отменяющим — то есть правило и его опровержение одновременно",
            );
        }
    }

    if (Array.isArray(tea.synonyms)) {
        for (const synonym of tea.synonyms) {
            if (typeof synonym !== "string" || !synonym.trim()) {
                fail(slug, "в synonyms пустая строка");
            }
        }
    }

    if (!Array.isArray(tea.brewMethods) || tea.brewMethods.length === 0) {
        fail(slug, "нет ни одного brewMethod");
        continue;
    }

    const methodIds = new Set();

    for (const method of tea.brewMethods) {
        if (methodIds.has(method.id)) {
            fail(slug, `id способа "${method.id}" повторяется`);
        }
        methodIds.add(method.id);

        // Разметка HowTo собирается из `infusions` (app/components/seo/schema.ts).
        // Способ без проливов выродится в HowTo без шагов, а разметка без шагов
        // хуже её отсутствия: она заявляет инструкцию и не даёт инструкции.
        // Сюда упадёт матча, если «взбивание» приедет с пустым `infusions`
        // вместо своей структуры шагов.
        if (!Array.isArray(method.infusions) || method.infusions.length === 0) {
            fail(
                slug,
                `способ "${method.id}" без проливов: HowTo в разметке соберётся без шагов. ` +
                    "Если это не проливной способ (взбивание матчи), ему нужна своя " +
                    "структура шагов и своя ветка в teaPageSchema",
            );
        }

        const [ratioMin, ratioMax] = RATIO_RANGE;

        if (
            typeof method.ratio !== "number" ||
            method.ratio < ratioMin ||
            method.ratio > ratioMax
        ) {
            fail(
                slug,
                `способ "${method.id}": навеска ${method.ratio} г/100 мл вне правдоподобного ` +
                    `диапазона ${ratioMin}–${ratioMax}. Проверьте разряд. Законный выброс — ` +
                    "гёкуро, 16,7 г/100 мл; если это он, число верное",
            );
        }

        const [tempMin, tempMax] = TEMPERATURE_RANGE;
        const { from, to } = method.temperature ?? {};

        if (
            typeof from !== "number" ||
            typeof to !== "number" ||
            from < tempMin ||
            to > tempMax ||
            from > to
        ) {
            fail(
                slug,
                `способ "${method.id}": температура ${from}–${to} °C вне диапазона ` +
                    `${tempMin}–${tempMax} или границы переставлены. Гёкуро при 50 °C — ` +
                    "норма, а не описка",
            );
        }

        // Пролив описывает и видимую таблицу, и шаг HowTo. Номер с нуля или
        // с дырой разведёт нумерацию на странице с нумерацией в разметке.
        method.infusions?.forEach((infusion, index) => {
            if (infusion.number !== index + 1) {
                fail(
                    slug,
                    `способ "${method.id}": пролив на позиции ${index + 1} имеет number ` +
                        `${infusion.number}. Номера должны идти подряд с единицы: по ним ` +
                        "строятся и видимая таблица, и шаги HowTo",
                );
            }
        });
    }

    if (!tea.brewMethods.some((method) => method.type === tea.primaryBrewMethod)) {
        fail(
            slug,
            `primaryBrewMethod "${tea.primaryBrewMethod}" не найден среди brewMethods`,
        );
    }
}

// Факты уровня категории: те же проверки плюс полнота ключей.
for (const category of STANDARD_CATEGORIES) {
    if (!typeFacts[category]) {
        fail(
            "data/tea-types.json",
            `нет ключа "${category}". Файл ключуется категорией по стандарту и должен ` +
                "покрывать все шесть, иначе категория молча останется без фактов",
        );
        continue;
    }

    checkFacts(`data/tea-types.json → ${category}`, typeFacts[category]);
}

for (const key of Object.keys(typeFacts)) {
    if (key !== "$comment" && !STANDARD_CATEGORIES.includes(key)) {
        fail(
            "data/tea-types.json",
            `лишний ключ "${key}" — такой категории нет. Файл ключуется ` +
                "StandardTeaCategory, а не TeaType: «pu-erh» здесь не ключ, его факты лежат под «dark»",
        );
    }
}

if (errors.length) {
    console.error(`data/teas.json — ошибок: ${errors.length}\n`);
    for (const error of errors) {
        console.error(`  • ${error}`);
    }
    process.exit(1);
}

console.log(
    `data/teas.json — ${teas.length} записей, data/tea-types.json — ${STANDARD_CATEGORIES.length} категорий, ` +
        "инварианты в порядке",
);
