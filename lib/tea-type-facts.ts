import typeFactsData from "@/data/tea-types.json";
import type {
    BrewMistake,
    Misconception,
    StandardTeaCategory,
    Tea,
    TeaType,
} from "@/types/tea";
import { getPrimaryBrewMethod } from "./teas";

/**
 * Факты уровня типа чая — ошибки заваривания и расхожие заблуждения — и их
 * сборка со свойственными конкретному сорту.
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
    brewMistakes?: BrewMistake[];
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

function formatRatio(tea: Tea): string | undefined {
    const method = getPrimaryBrewMethod(tea);

    return method ? `${method.ratio} г на 100 мл` : undefined;
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
        const value = key === "temperature" ? formatTemperature(tea) : formatRatio(tea);

        return value ?? match;
    });
}

function fillMistake(mistake: BrewMistake, tea: Tea): BrewMistake {
    return {
        ...mistake,
        result: fill(mistake.result, tea),
        fix: fill(mistake.fix, tea),
    };
}

/**
 * Категория по стандарту для типа маршрута, когда она не задана в данных явно.
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
 * Ошибки заваривания для страницы сорта: сначала общие для типа, затем
 * свойственные самому сорту. Порядок именно такой — общее объясняет
 * механизм, частное уточняет.
 */
export function brewMistakesFor(tea: Tea): BrewMistake[] {
    return [
        ...(factsForTea(tea).brewMistakes ?? []),
        ...(tea.brewMistakes ?? []),
    ].map((mistake) => fillMistake(mistake, tea));
}

/** Заблуждения для страницы сорта: общие для типа плюс сортовые. */
export function misconceptionsFor(tea: Tea): Misconception[] {
    return [
        ...(factsForTea(tea).misconceptions ?? []),
        ...(tea.misconceptions ?? []),
    ];
}
