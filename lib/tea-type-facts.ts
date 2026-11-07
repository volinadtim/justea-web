import typeFactsData from "@/data/tea-types.json";
import type {
    BrewOutcome,
    Misconception,
    StandardTeaCategory,
    Tea,
    TeaType,
} from "@/types/tea";
import { formatRatio } from "./format-number";
import { getPrimaryBrewMethod } from "./teas";

/**
 * Факты уровня категории по стандарту — ошибки заваривания и расхожие
 * заблуждения — и их сборка со свойственными конкретному сорту.
 *
 * Почему не уровень сорта. Наблюдение justea-voice от 07.11.2026: последствия
 * ошибок почти целиком определяются типом, а не сортом. «Зелёный + кипяток →
 * горечь» верно для всех зелёных, и держать это по восьми сортам отдельно
 * значит заполнить поле одинаковым текстом — читатель это заметит.
 * justea-sources это подтвердили измерением: у белого, зелёного и чёрного
 * оптимумы противоположные, а сортовых исключений пять на шестнадцать чаёв.
 *
 * Почему ключ — категория по стандарту, а не наш `TeaType`. Поведение при
 * перегреве задаётся категорией, а не ключом маршрута: пуэр, любао и фу
 * чжуань ведут себя одинаково («долго и горячо» для тёмных — норма, а не
 * ошибка), хотя маршруты у них разные и будут разными дальше. Поэтому пуэр
 * ищет факты по своей `standardCategory` — `"dark"`, — и если появится
 * отдельный тип `dark` под любао, факты для него уже на месте.
 * `brewing-errors.json` у sources размечен ровно так же.
 *
 * Почему при этом есть подстановки. Блок существует ровно затем, чтобы
 * страница сорта отвечала на запрос «<сорт> эффект»; одинаковый текст на
 * восьми страницах не помогает ранжированию ни одной из них. Подстановки
 * `{temperature}` и `{ratio}` разворачиваются в числа **этого** сорта, так
 * что один хранимый текст даёт на каждой странице свои числа.
 */

type TypeFacts = {
    brewOutcomes?: BrewOutcome[];
    misconceptions?: Misconception[];
};

const typeFacts = typeFactsData as Record<string, TypeFacts>;

/** «75–80 °C», но «75 °C» когда границы совпадают. */
function formatTemperature(tea: Tea): string | undefined {
    const method = getPrimaryBrewMethod(tea);

    if (!method) {
        return undefined;
    }

    const { from, to } = method.temperature;

    return from === to ? `${from} °C` : `${from}–${to} °C`;
}

function ratioOf(tea: Tea): string | undefined {
    const method = getPrimaryBrewMethod(tea);

    return method ? formatRatio(method.ratio) : undefined;
}

/**
 * Разворачивает `{temperature}` и `{ratio}` в числа сорта.
 *
 * Неизвестную подстановку оставляем как есть: пустая строка посреди
 * предложения читается как опечатка, а видимая `{whatever}` сразу покажет,
 * что в данных ошибка. То же и когда у сорта нет способа заваривания.
 */
function fill(text: string, tea: Tea): string {
    return text.replace(/\{(temperature|ratio)\}/g, (match, key: string) => {
        const value = key === "temperature" ? formatTemperature(tea) : ratioOf(tea);

        return value ?? match;
    });
}

function fillOutcome(outcome: BrewOutcome, tea: Tea): BrewOutcome {
    return { ...outcome, consequence: fill(outcome.consequence, tea) };
}

/**
 * Категория по стандарту для ключа маршрута, когда она не задана в данных
 * явно.
 *
 * Поле `standardCategory` заполняют только там, где оно расходится с
 * ожидаемым (Аньцзи байча по названию «белый чай», по стандарту зелёный),
 * поэтому у большинства записей его нет — и тогда берём отсюда.
 */
const DEFAULT_CATEGORY: Record<TeaType, StandardTeaCategory> = {
    green: "green",
    black: "black",
    oolong: "oolong",
    "pu-erh": "dark",
    dark: "dark",
    white: "white",
    yellow: "yellow",
};

export function standardCategoryOf(tea: Tea): StandardTeaCategory {
    return tea.standardCategory ?? DEFAULT_CATEGORY[tea.type];
}

function factsForTea(tea: Tea): TypeFacts {
    return typeFacts[standardCategoryOf(tea)] ?? {};
}

/**
 * Что меняет вкус — для страницы сорта: сначала общее для всех чаёв, затем
 * общее для категории, затем свойственное самому сорту. Порядок именно
 * такой: общее объясняет механизм, частное уточняет.
 *
 * Уровень `all` — для того, что от категории не зависит вовсе: навеска в обе
 * стороны и вода. Заводить их по шести категориям значило бы завести шесть
 * мест для одной правки.
 *
 * Сортовая запись с `replaces` **убирает** названную запись, а не
 * добавляется к ней. Иначе на странице гёкуро встали бы рядом «больше листа
 * — настой крепче» и «у гёкуро высокая навеска норма, 16,7 г/100 мл» —
 * правило и его прямое опровержение.
 */
export function brewOutcomesFor(tea: Tea): BrewOutcome[] {
    const own = tea.brewOutcomes ?? [];
    const replaced = new Set(
        own
            .map((outcome) => outcome.replaces)
            .filter((id): id is string => Boolean(id)),
    );
    const inherited = [
        ...(typeFacts.all?.brewOutcomes ?? []),
        ...(factsForTea(tea).brewOutcomes ?? []),
    ];

    return [
        ...inherited.filter(
            (outcome) => !outcome.id || !replaced.has(outcome.id),
        ),
        ...own,
    ].map((outcome) => fillOutcome(outcome, tea));
}

/** Заблуждения для страницы сорта: общие для категории плюс сортовые. */
export function misconceptionsFor(tea: Tea): Misconception[] {
    return [
        ...(typeFacts.all?.misconceptions ?? []),
        ...(factsForTea(tea).misconceptions ?? []),
        ...(tea.misconceptions ?? []),
    ];
}
