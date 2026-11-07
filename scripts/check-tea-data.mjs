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
const TEA_TYPES = [
    "green",
    "black",
    "oolong",
    "pu-erh",
    "dark",
    "white",
    "yellow",
];

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
    dark: "dark",
    white: "white",
    yellow: "yellow",
};

/** `BrewMethodType`. */
const BREW_METHOD_TYPES = [
    "gongfu",
    "western",
    "grandpa",
    "cold-brew",
    "iced",
    "boiled",
    "whisked",
];

const WHISK_STYLES = ["usucha", "koicha"];
const WHISK_MOTIONS = ["whisk", "knead"];

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

/**
 * Поля, которые код действительно читает.
 *
 * Проверка на лишние поля нужна не от опечаток, а от **молчаливого
 * несоответствия**. Сегодня я убрал поле `onlyFor`, и данные в соседней ветке
 * ещё несли его: мой код просто перестал бы его замечать, записи перестали бы
 * сужаться, и никто бы не узнал. То же будет, если justea-sources заведут
 * поле и скажут об этом не мне, а в своём файле: тихое игнорирование хуже
 * ошибки, потому что обе стороны уверены, что всё работает.
 */
const BREW_OUTCOME_FIELDS = [
    "id",
    "change",
    "consequence",
    "sources",
    "confidence",
    "replaces",
];

const MISCONCEPTION_FIELDS = ["claim", "correction", "sources", "kind"];

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
const warnings = [];

function fail(slug, message) {
    errors.push(`${slug}: ${message}`);
}

/**
 * Предупреждение: сборку не валит.
 *
 * Отличается от `fail` не строгостью, а природой. `fail` — это нарушение
 * инварианта: его видно по форме данных, ложных срабатываний не бывает.
 * `warn` — догадка по тексту: она может ошибиться, и жёсткое падение на
 * догадке заставило бы обходить проверку, а не чинить данные.
 *
 * Молчать о таком тоже нельзя: догадка ниже нашла настоящий дефект на проде.
 */
function warn(slug, message) {
    warnings.push(`${slug}: ${message}`);
}

/** Промывку в тексте выдают эти слова. */
const RINSE_WORDS = /промыв|ополосн|ополаск|醒茶|пробужд/i;

/**
 * Регистр «сколько в чае полезного», которого на сайте нет по решению
 * пользователя от 06.11.2026.
 *
 * Проверяется в видимых текстах — `description` чая и способа, `notes`. Поле
 * `caution` пропускается: оно для того и заведено, там кофеин и пороги EFSA
 * стоят законно и с источниками.
 *
 * **Проверок две, и различие между ними — главное здесь.**
 *
 * `HEALTH_CLAIMS` — слова, которые сами по себе о пользе: «польза», «вред»,
 * «бодрит». Их на сайте нет ни в каком виде.
 *
 * `SUBSTANCE_WORDS` ловятся **только вместе с** `MORE_IS_BETTER`, и вот
 * почему. Сначала я ловил «полифенолы» в любом контексте и получил четыре
 * срабатывания на нормативных порогах состава: «по GB/T 22111 прессованный
 * шэн — это чай с полифенолами не ниже 28 %», «ISO 11287 снижает для гёкуро
 * пороги полифенолов». Это **определение продукта**, а не обещание пользы, и
 * запрещать его значило бы запретить объяснять, чем шэн отличается от шу.
 *
 * Запретна не сама молекула, а рамка «чем больше, тем лучше»: «максимум
 * общих полифенолов даёт 90 °C и пролив на 5 минут» — это уже указание
 * заваривать ради вещества.
 *
 * Поиск только с начала слова: без этого «польз» находилось внутри
 * «Используйте». `\b` не годится — в JavaScript он опирается на латиницу и
 * кириллицу не видит. Предупреждение, которое врёт в половине случаев,
 * перестают читать целиком, вместе с верными.
 */
const WORD_START = "(?<![а-яёa-z])";

const HEALTH_CLAIMS = new RegExp(
    WORD_START +
        "(?:польз|вред|бодрит|тонизир|успокаива|иммунит|похуд|оздоров)",
    "i",
);

const SUBSTANCE_WORDS = new RegExp(
    WORD_START + "(?:полифенол|антиоксидант|флавоноид)",
    "i",
);

const MORE_IS_BETTER = new RegExp(
    WORD_START + "(?:максимум|максимальн|больше всего|выше всего|оптимум|ориентир)",
    "i",
);

/** Что именно не так с текстом, или `null`, если всё в порядке. */
function healthRegisterHit(text) {
    const claim = HEALTH_CLAIMS.exec(text ?? "");

    if (claim) {
        return claim[0];
    }

    const substance = SUBSTANCE_WORDS.exec(text ?? "");

    return substance && MORE_IS_BETTER.test(text ?? "") ? substance[0] : null;
}

/**
 * Ошибки заваривания и заблуждения проверяются одинаково и на уровне типа, и
 * на уровне сорта — поэтому вынесено в функцию, а не продублировано.
 */
function checkFacts(where, facts) {
    const seenIds = new Set();

    for (const outcome of facts.brewOutcomes ?? []) {
        for (const field of Object.keys(outcome)) {
            if (!BREW_OUTCOME_FIELDS.includes(field)) {
                fail(
                    where,
                    `brewOutcomes: поле "${field}" код не читает. Либо опечатка, либо ` +
                        "поле завели, не сказав мне — молчаливое игнорирование хуже ошибки",
                );
            }
        }

        if (outcome.id !== undefined) {
            if (seenIds.has(outcome.id)) {
                fail(where, `brewOutcomes: id "${outcome.id}" повторяется — на него не сослаться`);
            }
            seenIds.add(outcome.id);
        }

        for (const field of ["change", "consequence"]) {
            if (typeof outcome[field] !== "string" || !outcome[field].trim()) {
                fail(where, `brewOutcomes: поле "${field}" пустое или не строка`);
            }
        }

        // На странице это «{change}. {consequence}», то есть `consequence`
        // начинает предложение после точки. Со строчной буквы выглядит как
        // опечатка — а это крупнейшие страницы сайта.
        if (/^[a-zа-яё]/.test(String(outcome.consequence ?? ""))) {
            fail(
                where,
                `brewOutcomes: "${String(outcome.consequence).slice(0, 30)}…" начинается со ` +
                    "строчной буквы. На странице это отдельное предложение после точки",
            );
        }

        // «Что сделано иначе» без нормы: «больше листа», не «больше, чем
        // нужно». По Cao 2022 нормы нет — разброс рекомендованной навески
        // в 1,7 раза, и обе величины названы рекомендуемыми.
        if (/чем нужно|неправильно|ошибк/i.test(String(outcome.change ?? ""))) {
            fail(
                where,
                `brewOutcomes: "${outcome.change}" утверждает норму. Блок говорит, что ` +
                    "меняется, а не что сделано неправильно — см. Cao 2022",
            );
        }

        // `high` без источника — это `derived`, назвавшийся измеренным.
        // Ровно тот жанр, от которого проект уходит.
        if (
            outcome.confidence === "high" &&
            (!Array.isArray(outcome.sources) || outcome.sources.length === 0)
        ) {
            fail(
                where,
                `brewOutcomes: confidence "high" без источников. Без ссылки это derived, ` +
                    "а не измеренное",
            );
        }

        if (
            outcome.confidence !== undefined &&
            !["high", "medium", "derived"].includes(outcome.confidence)
        ) {
            fail(where, `brewOutcomes: confidence "${outcome.confidence}" неизвестен`);
        }

        for (const [, name] of String(outcome.consequence ?? "").matchAll(
            /\{(\w+)\}/g,
        )) {
            if (!PLACEHOLDERS.includes(name)) {
                fail(
                    where,
                    `brewOutcomes: подстановка "{${name}}" неизвестна. Известные: ` +
                        PLACEHOLDERS.map((placeholder) => `{${placeholder}}`).join(", "),
                );
            }
        }
    }

    for (const item of facts.misconceptions ?? []) {
        for (const field of Object.keys(item)) {
            if (!MISCONCEPTION_FIELDS.includes(field)) {
                fail(
                    where,
                    `misconceptions: поле "${field}" код не читает. Либо опечатка, либо ` +
                        "поле завели, не сказав мне",
                );
            }
        }

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

/** Все `id` наследуемых записей (`all` и категории) — на них ссылается `replaces`. */
const inheritedOutcomeIds = new Set(
    Object.entries(typeFacts)
        .filter(([key]) => key !== "$comment")
        .flatMap(([, facts]) => facts.brewOutcomes ?? [])
        .map((outcome) => outcome.id)
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

    const descriptionHit = healthRegisterHit(tea.description);

    if (descriptionHit) {
        warn(
            slug,
            `«${descriptionHit}» в описании сорта. О пользе и вреде мы не пишем`,
        );
    }

    checkFacts(slug, tea);

    for (const outcome of tea.brewOutcomes ?? []) {
        if (outcome.replaces && !inheritedOutcomeIds.has(outcome.replaces)) {
            fail(
                slug,
                `brewOutcomes: replaces "${outcome.replaces}" не находит записи с таким id ` +
                    "в data/tea-types.json. Отменяемое осталось бы на странице рядом " +
                    "с отменяющим — то есть правило и его опровержение одновременно",
            );
        }
    }

    if (tea.cultivar !== undefined) {
        if (typeof tea.cultivar !== "string" || !tea.cultivar.trim()) {
            fail(slug, "cultivar пустой или не строка");
        } else if (tea.cultivar.trim() === tea.name) {
            // Сорт куста и сорт чая по-русски оба «сорт», и спутать их легко.
            // «Молочный улун» как сорт куста — это и есть то заблуждение,
            // которое страница должна снимать: куст называется 台茶12號.
            fail(
                slug,
                `cultivar совпадает с названием чая («${tea.name}»). Сорт куста — это ` +
                    "растение, а не продукт: из одного куста делают разные чаи",
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

        if (!BREW_METHOD_TYPES.includes(method.type)) {
            fail(
                slug,
                `способ "${method.id}": тип "${method.type}" неизвестен. Известные: ` +
                    BREW_METHOD_TYPES.join(", "),
            );
        }

        const hasInfusions =
            Array.isArray(method.infusions) && method.infusions.length > 0;

        if (method.type === "whisked") {
            // Взбивание и проливы взаимоисключимы: если заданы оба, разметка
            // соберётся из шагов взбивания, а таблица на странице покажет
            // проливы — то есть разметка разойдётся с видимым контентом.
            if (hasInfusions) {
                fail(
                    slug,
                    `способ "${method.id}" типа "whisked" имеет и infusions, и whisked. ` +
                        "Это взаимоисключимо: у взбивания проливов нет ни одного",
                );
            }

            if (!Array.isArray(method.whisked) || method.whisked.length === 0) {
                fail(
                    slug,
                    `способ "${method.id}" типа "whisked" без параметров взбивания. ` +
                        "HowTo соберётся без шагов, а это хуже отсутствия разметки",
                );
            }

            for (const preparation of method.whisked ?? []) {
                if (!WHISK_STYLES.includes(preparation.style)) {
                    fail(
                        slug,
                        `whisked: style "${preparation.style}" неизвестен. Известные: ` +
                            WHISK_STYLES.join(", "),
                    );
                }

                // Усучу взбивают (点てる), коичу вымешивают (練る) — это разные
                // глаголы и разный результат: пена против густой массы без
                // пены. Перепутать их значит дать неработающую инструкцию.
                if (!WHISK_MOTIONS.includes(preparation.motion)) {
                    fail(
                        slug,
                        `whisked: motion "${preparation.motion}" неизвестен. Известные: ` +
                            WHISK_MOTIONS.join(", "),
                    );
                }

                if (
                    preparation.style === "usucha" &&
                    preparation.motion === "knead"
                ) {
                    fail(
                        slug,
                        "whisked: усучу взбивают (点てる), а не вымешивают — проверьте motion",
                    );
                }

                if (
                    preparation.style === "koicha" &&
                    preparation.motion === "whisk"
                ) {
                    fail(
                        slug,
                        "whisked: коичу вымешивают (練る) до массы без пены, а не взбивают — " +
                            "проверьте motion",
                    );
                }
            }
        } else if (!hasInfusions) {
            // Разметка HowTo собирается из `infusions`. Способ без проливов
            // выродится в HowTo без шагов, а это хуже отсутствия разметки:
            // она заявляет инструкцию и не даёт инструкции.
            fail(
                slug,
                `способ "${method.id}" без проливов: HowTo в разметке соберётся без шагов`,
            );
        }

        // Правило «у варки ровно одна запись» стояло здесь до 07.11.2026 и
        // было **неверным**: я вывел его из удобства проверки, а не из
        // источника. DB53/T 236 п. 6.2.7 описывает последовательные варки
        // одного листа с растущим временем — первая 30–60 с, дальше от
        // минуты. Нашёл justea-catalog при вводе данных.
        //
        // Монотонность времени не проверяю: «дальше от минуты» — это один
        // источник по одному чаю, и превращать его в инвариант значило бы
        // повторить ту же ошибку обобщения.

        if (method.type === "whisked") {
            // У взбивания нет ни одной верной навески: 2,4 г/100 мл у усучи
            // против 13,3 у коичи. Обязательное поле без правильного
            // значения — приглашение положить туда хоть что-нибудь, и ровно
            // это произошло: 2,4 протекло в сниппет выдачи, где было неверно
            // для коичи. Количества задаются в whisked[].
            if (method.ratio !== undefined) {
                fail(
                    slug,
                    `способ "${method.id}" типа "whisked" имеет ratio ${method.ratio}. ` +
                        "У взбивания нет одной верной навески: 2,4 г/100 мл у усучи против " +
                        "13,3 у коичи. Количества задаются в whisked[].powder и water",
                );
            }

            continue;
        }

        if (method.rinse) {
            const { count, time } = method.rinse;
            const counts =
                typeof count === "number" ? [count] : [count?.from, count?.to];

            for (const value of counts) {
                if (typeof value !== "number" || value < 1 || value > 5) {
                    fail(
                        slug,
                        `способ "${method.id}": rinse.count ${JSON.stringify(count)} вне 1–5. ` +
                            "Промывка — один-два раза; пять уже вымывает чай, а не будит",
                    );
                    break;
                }
            }

            // Единственный нормативный источник на промывку секунд не задаёт
            // вовсе: «немедленно слить». Привычные «5–10 с» взяты из
            // практики, а не из источника — поэтому `sources` обязательны,
            // если время всё-таки проставили.
            if (
                method.rinse.time !== undefined &&
                (!Array.isArray(method.rinse.sources) ||
                    method.rinse.sources.length === 0)
            ) {
                fail(
                    slug,
                    `способ "${method.id}": у rinse задано время, но нет источников. ` +
                        "Стандарт говорит «немедленно слить» и секунд не называет — " +
                        "число без ссылки здесь взято из практики",
                );
            }

            if (time !== undefined && (typeof time !== "number" || time < 1 || time > 60)) {
                fail(
                    slug,
                    `способ "${method.id}": rinse.time ${time} вне 1–60 с. Промывку сливают сразу; ` +
                        "если держать минуту, это уже пролив",
                );
            }

            // Пока промывка жила в notes, её писали туда текстом. Если поле
            // заполнили, а строку не убрали, на странице она будет дважды.
            for (const note of method.notes ?? []) {
                if (/醒茶|ополосн|промыв/i.test(note)) {
                    fail(
                        slug,
                        `способ "${method.id}": промывка задана полем rinse и упомянута в notes ` +
                            `(«${note.slice(0, 40)}…»). На странице она выведется дважды`,
                    );
                }
            }
        }

        for (const text of [method.description, ...(method.notes ?? [])]) {
            const hit = healthRegisterHit(text);

            if (hit) {
                warn(
                    slug,
                    `способ "${method.id}": «${hit}» в видимом тексте ` +
                        `(«${String(text).slice(0, 45)}…»). О пользе и вреде мы не пишем; ` +
                        "если это про вкус и экстракцию — переформулировать, если про " +
                        "содержание вещества — убрать",
                );
            }
        }

        // Промывка, спрятанная в проливах, завышает их число. Это не
        // косметика: `yield` в разметке говорит «6 проливов», таблица
        // показывает шесть, а пьют пять — шестой сливают. Ровно ради этого
        // заведено поле `rinse`, которое стоит вне счёта.
        //
        // Проверка по словам, то есть догадка: поэтому предупреждение, а не
        // ошибка. Найдено justea-sources на данных прода 07.11.2026.
        if (!method.rinse) {
            const first = (method.infusions ?? [])[0];

            if (first && RINSE_WORDS.test(first.notes ?? "")) {
                warn(
                    slug,
                    `способ "${method.id}": первый пролив похож на промывку ` +
                        `(«${(first.notes ?? "").slice(0, 45)}…»). Тогда проливов не ` +
                        `${(method.infusions ?? []).length}, а на один меньше — ` +
                        "перенести в поле rinse, оно вне счёта",
                );
            }

            for (const note of method.notes ?? []) {
                if (RINSE_WORDS.test(note)) {
                    warn(
                        slug,
                        `способ "${method.id}": промывка описана в notes ` +
                            `(«${note.slice(0, 45)}…»). Если она входит в число проливов — ` +
                            "их на один меньше; место промывки в поле rinse",
                    );
                }
            }
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
        (method.infusions ?? []).forEach((infusion, index) => {
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
for (const category of ["all", ...STANDARD_CATEGORIES]) {
    if (!typeFacts[category]) {
        fail(
            "data/tea-types.json",
            `нет ключа "${category}". Файл ключуется категорией по стандарту плюс «all» и ` +
                "должен покрывать все семь, иначе категория молча останется без фактов",
        );
        continue;
    }

    checkFacts(`data/tea-types.json → ${category}`, typeFacts[category]);
}

for (const key of Object.keys(typeFacts)) {
    if (key !== "$comment" && key !== "all" && !STANDARD_CATEGORIES.includes(key)) {
        fail(
            "data/tea-types.json",
            `лишний ключ "${key}" — такой категории нет. Файл ключуется ` +
                "StandardTeaCategory, а не TeaType: «pu-erh» здесь не ключ, его факты лежат под «dark»",
        );
    }
}

if (warnings.length) {
    console.warn(`\nПредупреждения (сборку не валят): ${warnings.length}\n`);
    for (const warning of warnings) {
        console.warn(`  ~ ${warning}`);
    }
    console.warn("");
}

if (errors.length) {
    console.error(`data/teas.json — ошибок: ${errors.length}\n`);
    for (const error of errors) {
        console.error(`  • ${error}`);
    }
    process.exit(1);
}

console.log(
    `data/teas.json — ${teas.length} записей, data/tea-types.json — ${STANDARD_CATEGORIES.length} категорий и all, ` +
        "инварианты в порядке",
);
