import typeFactsData from "@/data/tea-types.json";
import type { BrewMistake, Misconception, Tea, TeaType } from "@/types/tea";
import { getPrimaryBrewMethod } from "./teas";

/**
 * Факты уровня типа чая — ошибки заваривания и расхожие заблуждения — и их
 * сборка со свойственными конкретному сорту.
 *
 * Почему уровень типа. Наблюдение justea-voice от 07.11.2026: последствия
 * ошибок почти целиком определяются типом, а не сортом. «Зелёный + кипяток →
 * горечь» верно для всех зелёных, и держать это по восьми сортам отдельно
 * значит заполнить поле одинаковым текстом — читатель это заметит.
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

function factsForType(type: TeaType): TypeFacts {
    return typeFacts[type] ?? {};
}

/**
 * Ошибки заваривания для страницы сорта: сначала общие для типа, затем
 * свойственные самому сорту. Порядок именно такой — общее объясняет
 * механизм, частное уточняет.
 */
export function brewMistakesFor(tea: Tea): BrewMistake[] {
    return [
        ...(factsForType(tea.type).brewMistakes ?? []),
        ...(tea.brewMistakes ?? []),
    ].map((mistake) => fillMistake(mistake, tea));
}

/** Заблуждения для страницы сорта: общие для типа плюс сортовые. */
export function misconceptionsFor(tea: Tea): Misconception[] {
    return [
        ...(factsForType(tea.type).misconceptions ?? []),
        ...(tea.misconceptions ?? []),
    ];
}
