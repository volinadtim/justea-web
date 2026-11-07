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

/**
 * Дескрипторы, описывающие **тело пьющего**, а не настой во рту.
 *
 * Проверяется в `characteristics` — и только там: это одиночные слова без
 * контекста, а публикуются они машиночитаемо, как `PropertyValue` в
 * `Product.additionalProperty`. То есть «Согревающее» уходит в
 * структурированные данные утверждением о телесном ощущении.
 *
 * ⚠️ **Граница проходит не там, где кажется, и это предупреждение
 * justea-sources стоит прочитать до любого расширения списка.** Не «про тело
 * или не про тело»: нормативное определение вяжущести в GB/T 14487 само
 * описано через тело — 涩 это «ощущение толстого, заторможенного языка».
 * Граница в том, **про тело пьющего или про ощущение во рту от настоя.**
 * Расширив список на описания ощущений во рту, мы зацепим сердцевину
 * сенсорного словаря.
 *
 * **«Освежающий» в списке НЕ значится, и у исключения есть документ.** 爽 —
 * нормативный термин GB/T 14487-2017 (отрицание 不爽 стоит в определении
 * дефекта 熟闷味), а «сладко-освежающий» — дословно 甘爽 из таблицы грейдов
 * GB/T 22111, вкус высшего грейда 特级. Полный список с документами и
 * пунктами — `docs/sources/sensory-terms-normative.json` у justea-sources,
 * одиннадцать терминов. Сверено 07.11.2026: **ни один из одиннадцати эта
 * проверка не трогает.**
 *
 * **Если список когда-нибудь применят к `description` или `notes` —
 * исключение по корню станет дырой.** «Освежающий» о настое и «освежает»
 * о человеке — разные утверждения с одним корнем, и в связном тексте пройдёт
 * второе. Тогда в текстах надо ловить глагольные формы, а исключать только
 * формы прилагательного. В `characteristics` это безопасно: там одиночные
 * дескрипторы, а не фразы. Наблюдение justea-sources; кода под него нет
 * намеренно — проверка к связным текстам не применяется, и заводить список
 * без пользователя я не стану.
 *
 * Измерено на 149 дескрипторах каталога: со словом «освежа» — 5
 * срабатываний, верное 1; без него — 1 и 1. Случай нашли justea-sources,
 * проверка делает его механическим.
 */
const BODY_DESCRIPTORS = new RegExp(
    WORD_START +
        "(?:согрева|охлажда|расслабля|взбодр|бодря|тонизирующ|успокаивающ)",
    "i",
);

/*
 * Персональный порог в сноске-предосторожности: ловим ФОРМЫ, не корни.
 *
 * Поправку принесли justea-sources через justea-catalog, и она отменяет
 * первую версию исключений. Все пять живых сносок устроены одинаково:
 * факт о чае плюс «если вы ограничиваете кофеин, норму определяет врач»,
 * и вторая половина не даёт ни порога, ни совета — это отказ их давать.
 *
 * Наивный список корней («ограничи», «не более», «избега», «пейте»)
 * срабатывает на всех пяти верных сносках, потому что «ограничи» стоит
 * внутри «если вы ограничиваете». Тот же капкан, что «освежающий» против
 * «освежает», только в новом месте: условное наклонение против
 * повелительного, один корень — разные утверждения. Обходится он не
 * расширением списка, а тем, что ловить надо формы.
 *
 * Запрещены три вещи: числовой персональный порог, повелительный совет и
 * название состояния.
 *
 * ОБЛАСТЬ — только `caution.text`, и это не осторожность, а необходимость.
 * Прогон по всем полям дал шесть ложных срабатываний: «Пейте без молока,
 * чтобы оценить тонкий букет» — указание о заваривании, а «от 4,5 до 6 г
 * на 100 мл» — навеска, и «до 6 г» попадает под числовой порог. В заметках
 * о заваривании повелительное наклонение и граммы законны; запрещены они
 * ровно там, где текст адресован здоровью пьющего.
 *
 * То есть правило от поля неотделимо, и это уточняет пары «поле плюс
 * правило»: бывает и наоборот — правило, живущее в одном поле.
 */
const PERSONAL_LIMIT = new RegExp(
    [
        // «не более 400 мг в сутки», «до 200 мг для беременных»
        "(?:не\\s+более|до)\\s+\\d+\\s*(?:мг|г|мл|чашк|кружк)",
        // повелительное наклонение второго лица
        WORD_START + "(?:пейте|выпейте|принимайте|употребляйте|ограничьте",
        "откажитесь|избегайте|проконсультируйтесь|уменьшите|сократите)",
        // название состояния как адресата совета
        WORD_START + "(?:при\\s+беременности|беременным|кормящим|детям|гипертон|бессонниц)",
    ].join("|"),
    "i",
);


/*
 * Регистр здоровья: пять правил и телесное в связной прозе.
 *
 * Правила принёс justea-catalog готовым кодом с тремя прогонами, и это было
 * условие: собранное по памяти выражение мы сегодня ловили пять раз.
 *
 * `\b` здесь нет нигде, только явные просмотры вперёд и назад. Причина
 * измерена: justea-sources проверили свою версию в Python, где `\b` знает
 * кириллицу, получили ноль ложных срабатываний — а в JavaScript та же
 * версия молчала и пропускала пять обещаний про сон из шести. Отсюда третье
 * условие проверки правила, важнее двух первых: прогон делается в том
 * языке, где проверка работает.
 */
const W = "(?<![а-яёa-z])";
const stem = (s) => new RegExp(W + s, "i");

/** Слова, которые сами по себе о пользе. Как в scripts, без изменений. */
const HEALTH_CLAIMS_EXT = stem("(?:польз|вред|бодрит|тонизир|успокаива|иммунит|похуд|оздоров)");

/** Названия состояний. Два берутся корнем: других форм у них в деле нет. */
const CONDITION_PLAIN = stem("(?:целебн|тревог)");

/**
 * Сон. Четыре короткие формы — полные слова, и им нужна граница СПРАВА:
 * без неё «сна» ловит «сначала», «снаружи», «снаряжение», и «сначала»
 * стоит в данных сегодня (гёкуро, заметка способа). «бессонниц» и «сонлив» —
 * корни, границы справа им не нужно; «сонлив» добавлен потому, что граница
 * справа выключает «сонливость» у формы «сон».
 */
const SLEEP = new RegExp(
    `${W}(?:(?:сна|сну|сном|сон)(?![а-яё])|бессонниц|сонлив)`,
    "i",
);

/** Пара «слово + предмет рядом», окно в символах. */
const near = (text, a, b, window = 40) => {
    const left = [...text.matchAll(a)];
    const right = [...text.matchAll(b)];
    return left.some((x) => right.some((y) => Math.abs(x.index - y.index) <= window));
};

const BODY_PARTS = /(?:организм|кишечник|кров|печен|шлак|токсин)[а-яё]*/gi;

/** Очищение. Пара нужна: «очищенная вода» законна и стоит в выгрузке. */
const cleansing = (text) => near(text, /очищ[а-яё]*/gi, BODY_PARTS);

/** Давление. Пара: либо «артериальное/кровяное», либо глагол изменения. */
const pressure = (text) =>
    near(text, /давлен[а-яё]*/gi, /(?:артериальн|кровян|снижа|понижа|повыша)[а-яё]*/gi);

/** Энергия. Корень производственный («энергозатраты»), поэтому только фразы. */
const energy = /заряд энергии|да[ёе]т энергию|прилив сил/i;

/** Одиннадцать нормативных терминов justea-sources, формы из поля `ru`. */
const NORMATIVE = (() => {
    const file = JSON.parse(readFileSync("docs/sources/sensory-terms-normative.json", "utf8"));
    return (file.exclude_normative ?? []).flatMap((item) =>
        String(item.ru)
            .split("/")
            .map((form) => form.replace(/\(.*?\)/g, "").trim().toLowerCase())
            .filter(Boolean),
    );
})();

/**
 * Телесные дескрипторы в связной прозе.
 *
 * justea-sources предложили исключением их список нормативных терминов. Он
 * нужен, но недостаточен, и это измерено: ни один из одиннадцати не содержит
 * ни «согрева», ни «охлажда», зато обычная чайная инструкция содержит.
 * «Чайник согревают кипятком» и «Настой охлаждают до 10 °C» — законный текст,
 * и от «Чай согревает в холодный день» корень их не отличает.
 *
 * Поэтому пара обратная: слово срабатывает, только если рядом НЕТ посуды,
 * воды или листа. У обещания человеку подлежащее — чай, у инструкции рядом
 * всегда предмет.
 */
const VESSEL = /(?:чайник|посуд|гайван|чашк|настой|вод|лист|кипят|термос|холодильник)[а-яё]*/gi;

const bodyInProse = (text) => {
    if (!/(?:согрева|охлажда|расслабл)/i.test(text)) return false;
    if (NORMATIVE.some((term) => text.toLowerCase().includes(term))) return false;
    return !near(text, /(?:согрева|охлажда|расслабл)[а-яё]*/gi, VESSEL, 50);
};

/*
 * Пробы живут вместе с правилами и прогоняются при каждом запуске.
 *
 * Зелёный прогон одинаково выглядит у работающей проверки и у той, что
 * смотрит не туда, — поэтому «проверку проверяют подброшенным нарушением»
 * стоит не в инструкции, а в коде.
 */
const VIOLATIONS = [
    "Целебные свойства пуэра известны давно.",
    "Снимает тревогу после тяжёлого дня.",
    "Не пейте перед сном.",
    "Мешает сну.",
    "Вызывает бессонницу.",
    "Вызывает сонливость.",
    "Улучшает сон.",
    "Очищает организм от шлаков.",
    "Снижает артериальное давление.",
    "Даёт энергию на весь день.",
    "Прилив сил после первой чашки.",
    "Чай согревает в холодный день.",
    "Зелёный чай охлаждает в жару.",
    "Расслабляет после работы.",
    "Полезен для иммунитета.",
];

const LEGITIMATE = [
    "Воду сначала наливают в чайник и остужают.",
    "Снаружи блин выглядит плотным.",
    "Лист засыпают в прогретый чайник.",
    "Очищенная вода пригоднее родниковой и водопроводной.",
    "Давление в чайнике растёт при нагреве.",
    "Энергозатраты при обжарке выше, чем при завяливании.",
    "Чайник согревают кипятком перед первым проливом.",
    "Настой охлаждают до 10 °C и подают со льдом.",
    "Холодный настой охлаждают в холодильнике шесть часов.",
    "Сосновый дым даёт узнаваемый аромат.",
    "Мягкий округлый вкус с явным сладким послевкусием.",
];
const HEALTH_RULES = [
    ["обещание о пользе", (t) => HEALTH_CLAIMS_EXT.test(t)],
    ["название состояния", (t) => CONDITION_PLAIN.test(t)],
    ["сон", (t) => SLEEP.test(t)],
    ["очищение организма", cleansing],
    ["давление", pressure],
    ["энергия", (t) => energy.test(t)],
    ["телесное о пьющем", bodyInProse],
];

const healthRulesHit = (text) =>
    HEALTH_RULES.filter(([, test]) => test(text)).map(([name]) => name);

{
    const missed = VIOLATIONS.filter((t) => healthRulesHit(t).length === 0);
    const falsePositives = LEGITIMATE.filter((t) => healthRulesHit(t).length > 0);

    if (missed.length > 0 || falsePositives.length > 0) {
        console.error(
            `регистр здоровья: пробы не проходят — пропущено ${missed.length}, ` +
                `ложных ${falsePositives.length}`,
        );
        for (const t of missed) console.error(`  ПРОПУСК «${t}»`);
        for (const t of falsePositives) console.error(`  ЛОЖНОЕ «${t}»`);
        process.exitCode = 1;
    }
}

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

    /*
     * Регистр пользы проверяется по ВСЕМ строкам записи, а исключения
     * перечислены. Раньше перечислялись места, где смотреть, и каждое новое
     * поле по умолчанию не охранялось — так «согревающее» и прожило в
     * заметке пролива всю чистку, хотя слово в списке было.
     *
     * Переворот предложил justea-catalog, измерив цену: прогон всех трёх
     * регистров по 902 строкам даёт ноль срабатываний, то есть исключений
     * нужно четыре имени против открытого перечня публикуемых полей. Это то
     * же различение, что в `check-rendered-text.mjs`: он не перечисляет
     * поля, он читает всё, что вышло.
     *
     * Исключения завели сразу, а не после первого ложного срабатывания:
     * в `caution` пороги стоят законно и с источниками, и появись там
     * «полифенолов не ниже 28 %» — а такое определение продукта в выгрузках
     * sources есть, — проверка сработала бы на верном тексте.
     *
     * `BODY_DESCRIPTORS` переворот не касается: к связной прозе его
     * применять нельзя («освежающий» о настое против «освежает» о
     * человеке), и это названный предел, а не недоделка.
     *
     * И то, из-за чего «согревающее» прожило так долго: ни одна из семидесяти
     * заметок проливов не видна на странице, а в разметку `HowTo` уходят все.
     * Текст, который публикуется поисковику и не публикуется человеку, —
     * третья категория: не «видно» и не «мертво», а «видно не нам».
     */
    /*
     * Исключение — пара «поле плюс правило», а не имя поля.
     *
     * Поправка sources, и она по существу: исключив `caution.text` целиком,
     * мы сделали бы единственное чувствительное место каталога единственным
     * непроверяемым. Плохая оговорка там опаснее плохой строки где угодно
     * ещё — читатель обязан принимать её всерьёз, она для того и стоит.
     *
     * `caution.text` выводится только из-под правила о веществах, где
     * назвать кофеин законно, и остаётся под правилом о персональных
     * порогах. Имя поля выключало бы все правила разом.
     */
    const HEALTH_EXEMPT = new Map([
        ["caution.text", new Set(["вещество"])],
        ["caution.basis", new Set(["все"])],
        ["reviewNote", new Set(["все"])],
        ["sources", new Set(["все"])],
        ["confidence", new Set(["все"])],
    ]);

    const walkStrings = (value, path, onString) => {
        if (typeof value === "string") {
            onString(value, path);
            return;
        }

        if (Array.isArray(value)) {
            for (const item of value) walkStrings(item, path, onString);
            return;
        }

        if (value && typeof value === "object") {
            for (const [key, item] of Object.entries(value)) {
                walkStrings(item, [...path, key], onString);
            }
        }
    };

    walkStrings(tea, [], (text, path) => {
        const field = path.join(".");
        const leaf = path[path.length - 1] ?? "";

        const exempt = HEALTH_EXEMPT.get(field) ?? HEALTH_EXEMPT.get(leaf);

        if (exempt?.has("все")) {
            return;
        }

        if (!exempt?.has("вещество")) {
            const hit = healthRegisterHit(text);

            if (hit) {
                warn(
                    tea.slug,
                    `${field}: «${hit}» в публикуемом тексте («${text.slice(0, 45)}…»). ` +
                        "О пользе и вреде мы не пишем; если это про вкус и экстракцию — " +
                        "переформулировать, если про содержание вещества — убрать",
                );
            }
        }

        for (const name of healthRulesHit(text)) {
            warn(
                tea.slug,
                `${field}: правило «${name}» («${text.slice(0, 45)}…»). ` +
                    "О пользе, вреде и состоянии пьющего мы не пишем",
            );
        }

        // Правило живёт только в сноске: см. докблок `PERSONAL_LIMIT`.
        const limit = field === "caution.text" ? PERSONAL_LIMIT.exec(text) : null;

        if (limit) {
            warn(
                tea.slug,
                `${field}: «${limit[0]}» — персональный порог или совет ` +
                    `(«${text.slice(0, 45)}…»). Норму определяет врач: сноска ` +
                    "называет свойство чая и отказывается давать порог, а не даёт его",
            );
        }
    });

    const descriptionHit = healthRegisterHit(tea.description);

    if (descriptionHit) {
        warn(
            slug,
            `«${descriptionHit}» в описании сорта. О пользе и вреде мы не пишем`,
        );
    }

    const descriptors = [
        ...(tea.characteristics?.aroma ?? []),
        ...(tea.characteristics?.flavor ?? []),
        ...(tea.characteristics?.aftertaste ?? []),
        ...(tea.characteristics?.appearance ?? []),
    ];

    for (const descriptor of descriptors) {
        const hit = BODY_DESCRIPTORS.exec(descriptor);

        if (hit) {
            warn(
                slug,
                `дескриптор «${descriptor}» описывает человека, а не настой. ` +
                    "Он уходит в разметку как свойство продукта; если это " +
                    "нормативный сенсорный термин — скажите, добавлю в исключения",
            );
        }
    }

    for (const [field, value] of [
        ["characteristicsText", tea.characteristicsText],
        ["noBrewParamsNote", tea.noBrewParamsNote],
    ]) {
        if (value !== undefined && (typeof value !== "string" || !value.trim())) {
            fail(slug, `${field} пустой или не строка`);
        }
    }

    if (tea.noBrewParamsNote !== undefined && (tea.brewMethods ?? []).length) {
        warn(
            slug,
            "noBrewParamsNote задан, но способы заваривания есть — фраза не покажется",
        );
    }

    const altitude = tea.meta?.altitude;

    if (altitude !== undefined) {
        const bounds =
            typeof altitude === "number"
                ? [altitude, altitude]
                : [altitude?.from, altitude?.to];

        if (bounds.some((value) => typeof value !== "number")) {
            fail(slug, `meta.altitude ${JSON.stringify(altitude)} — не число и не диапазон`);
        } else if (bounds[0] > bounds[1]) {
            fail(slug, `meta.altitude: границы переставлены (${bounds[0]} > ${bounds[1]})`);
        } else if (bounds[0] < 0 || bounds[1] > 3000) {
            // Чайные сады выше трёх километров неизвестны; ноль — уровень
            // моря, ниже не бывает.
            fail(
                slug,
                `meta.altitude ${bounds[0]}–${bounds[1]} м вне правдоподобного 0–3000`,
            );
        }
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

    /*
     * Отсутствие способов заваривания — **не ошибка**, и требование «хотя бы
     * один» отсюда убрано 07.11.2026.
     *
     * Оно выглядело безобидным, а работало так: когда источника на параметры
     * нет, поле всё равно надо заполнить, и человек кладёт туда самое
     * правдоподобное из доступного. У семи чаёв этим оказался метод
     * ISO 3103 — шесть минут кипятком, то есть процедура дегустационной
     * экспертизы, выданная за рецепт. Нашёл justea-catalog, проверив опытом.
     *
     * **Валидатор, требующий полноты там, где данных нет, не защищает
     * данные, а производит догадки.**
     */
    if (!Array.isArray(tea.brewMethods) || tea.brewMethods.length === 0) {
        if (tea.primaryBrewMethod !== undefined) {
            fail(
                slug,
                `primaryBrewMethod "${tea.primaryBrewMethod}" задан, а способов нет. ` +
                    "Выбирать не из чего — либо убрать поле, либо добавить способ",
            );
        }

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

        /*
         * Пометка для ревью. Проверяется трижды, и каждая проверка закрывает
         * свой способ её потерять.
         *
         * Имя: поле называется `reviewNote`, как и всё остальное в записи.
         * `review_note` в данных сработало бы как опечатка, которую никто не
         * видит: поле с незнакомым именем просто не читают, и пометка тихо
         * исчезает. Поэтому это ошибка с подсказкой, а не предупреждение.
         *
         * Длина: проверку по собранным страницам нечем выполнять, если
         * строка короче двадцати букв — три слова найдутся в любом тексте.
         * Поле, которое нельзя проверить, защищено так же, как было у Дун
         * Дина: совпадением.
         *
         * Копия в `notes`: если то же рассуждение лежит и там, оно выйдет на
         * страницу, и граница поля не поможет. Именно так пометка и уехала
         * на прод — она жила в `notes`.
         */
        if (method.review_note !== undefined) {
            fail(
                slug,
                `способ "${method.id}": поле называется reviewNote, не review_note. ` +
                    "С чужим именем пометка не читается и тихо теряется",
            );
        }

        if (method.reviewNote !== undefined) {
            const note = method.reviewNote;

            if (typeof note !== "string" || note.trim().length < 20) {
                fail(
                    slug,
                    `способ "${method.id}": reviewNote короче 20 символов. ` +
                        "Такую строку не найти в собранных страницах, то есть " +
                        "нельзя проверить, что она не выводится",
                );
            } else {
                const letters = (text) =>
                    String(text)
                        .toLowerCase()
                        .replace(/[^\p{L}\p{N}]+/gu, "");
                const needle = letters(note).slice(0, 40);

                for (const text of [
                    method.description,
                    ...(method.notes ?? []),
                    ...(method.infusions ?? []).map((infusion) => infusion.notes),
                ]) {
                    if (text && letters(text).includes(needle)) {
                        fail(
                            slug,
                            `способ "${method.id}": reviewNote повторён в видимом тексте ` +
                                `(«${String(text).slice(0, 45)}…»). Поле не выводится, ` +
                                "а копия выводится",
                        );
                    }
                }
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

    if (
        tea.primaryBrewMethod !== undefined &&
        !tea.brewMethods.some((method) => method.type === tea.primaryBrewMethod)
    ) {
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

/*
 * Длинные тире здесь больше не считаются.
 *
 * Проверка стояла в этом файле и обманула: она перечисляла поля вручную
 * (`description`, `brewMethods[].description`, `notes`) и показала ноль,
 * когда оставалось пятьдесят одно тире — в `infusions[].notes`,
 * `caution.text`, `brewOutcomes[].consequence` и `meta.origin`. Список
 * полей и есть ошибка: он отстаёт от того, что выводится.
 *
 * Теперь это `scripts/check-rendered-text.mjs` — он читает собранные
 * страницы, то есть то, что видит человек, и список полей ему не нужен.
 */

/*
 * Числа в заметке должны сходиться с полями того же способа.
 *
 * Предложил justea-catalog после второго за вечер расхождения текста с
 * данными: в полях матчи стояло 80 °C, а в заметке — «75–85 °C взяты из
 * обычной практики». Панель показывала одно, подпись под ней другое, и
 * ни одна проверка этого не видела: оба числа легальны по отдельности.
 *
 * «Сходиться» — не «совпадать», и это существенно. Заметка законно
 * называет диапазон, из которого взято значение в таблице: «навеска
 * бывает от 4,5 до 6 г на 100 мл, в таблице нижняя граница». Это как раз
 * та оговорка, которую мы весь день возвращали на страницу. Поэтому:
 * назван диапазон — значение способа должно лежать внутри; названа одна
 * величина — должна совпадать.
 *
 * Проверяются температура и навеска, у которых в способе есть своё поле.
 * Время не проверяется: там та же логика диапазона, но единиц больше и
 * формулировки свободнее — ложные срабатывания дороже находок.
 *
 * ГРАНИЦА ПОЛЕЙ, и она не пробел, а решение. Читаются `description` и
 * `notes` способа — 34 числа с единицей из 41. Остальные семь не читаются
 * намеренно, и механически добавить их нельзя:
 *
 * - `infusions[].notes` — пять чисел, и все пять дали бы ложное
 *   срабатывание: «Три порции по 60 мл; подают при 50 °C» при поле 70 у
 *   сенчи, и так же у второй сенчи, двух гёкуро и ходзичи. Это
 *   температура ПОДАЧИ, а не заваривания. Поле лежит внутри способа, а
 *   число в нём про другое.
 * - `brewOutcomes` и заблуждения — два числа, с полями сходятся.
 *
 * Отсюда правило для этой проверки: сверять надо не всё выводимое, а
 * текст, говорящий о параметрах ЭТОГО способа. Для правила про тире верно
 * обратное — там важно всё, что видит человек, — поэтому его переезд в
 * `check-rendered-text.mjs` был прав, а здесь был бы неправ.
 *
 * Границу нашёл justea-catalog. Она продолжает урок «−10 °C»: там единица
 * не говорила, значение перед нами или приращение, здесь не говорит, о
 * какой величине речь вообще. Жанр числа различает одно соседнее слово.
 */
{
    const problems = [];
    let checked = 0;

    /** Пары «значение или диапазон» из текста: [[от, до], …]. */
    const temperatures = (text) =>
        [...text.matchAll(/(?<!−|-)(\d{2,3})\s*(?:[–—-]\s*(\d{2,3}))?\s*°C/g)].map((m) => [
            Number(m[1]),
            Number(m[2] ?? m[1]),
        ]);

    const RANGE =
        /(?:от\s*)?(\d+(?:[.,]\d+)?)\s*(?:до|[–—-])\s*(\d+(?:[.,]\d+)?)\s*(?:г|гр)\s+на\s+(\d+)\s*мл/g;
    const SINGLE = /(\d+(?:[.,]\d+)?)\s*(?:г|гр)\s+на\s+(\d+)\s*мл/g;

    const num = (x) => Number(String(x).replace(",", "."));
    const per100 = (grams, volume) => (num(grams) / num(volume)) * 100;

    /*
     * Диапазоны разбираются первыми, и найденное вырезается из текста.
     * Иначе «от 5 до 7 г на 100 мл» второй раз читается как одиночное
     * «7 г на 100 мл» — верхняя граница диапазона притворяется величиной.
     */
    const ratios = (text) => {
        const found = [];
        const rest = text.replace(RANGE, (...m) => {
            const [, low, high, volume] = m;
            found.push([per100(low, volume), per100(high, volume)].sort((a, b) => a - b));
            return " ";
        });

        for (const m of rest.matchAll(SINGLE)) {
            const value = per100(m[1], m[2]);
            found.push([value, value]);
        }

        return found;
    };

    for (const tea of teas) {
        for (const method of tea.brewMethods ?? []) {
            const notes = [method.description, ...(method.notes ?? [])].filter(Boolean);

            for (const note of notes) {
                checked += 1;

                const { from, to } = method.temperature ?? {};
                if (from !== undefined) {
                    for (const [low, high] of temperatures(note)) {
                        const inside = from >= low - 1 && to <= high + 1;
                        const overlaps = low <= Math.max(from, to) && high >= Math.min(from, to);
                        if (!inside && !overlaps) {
                            problems.push(
                                `${tea.slug} · ${method.id}: в заметке ${low === high ? low : `${low}–${high}`} °C, в способе ${from}–${to} °C`,
                            );
                        }
                    }
                }

                if (typeof method.ratio === "number") {
                    for (const [low, high] of ratios(note)) {
                        if (method.ratio < low - 0.2 || method.ratio > high + 0.2) {
                            problems.push(
                                `${tea.slug} · ${method.id}: в заметке ${low.toFixed(1)}–${high.toFixed(1)} г на 100 мл, в способе ${method.ratio}`,
                            );
                        }
                    }
                }
            }
        }
    }

    if (problems.length > 0) {
        console.error(`числа в заметках расходятся с полями способа: ${problems.length}`);
        for (const line of problems) console.error(`  ${line}`);
        process.exitCode = 1;
    } else {
        console.log(
            `числа в заметках сверены с полями способа: ${checked} строк, расхождений нет`,
        );
        // Названная граница вместо молчащего пробела: см. докблок выше.
        console.log(
            "  сверяются description и notes способа; не сверяются infusions[].notes " +
                "(там температура подачи, а не заваривания), brewOutcomes и заблуждения",
        );
    }
}
