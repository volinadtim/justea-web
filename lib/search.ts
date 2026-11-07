import { getAllTeas, TEA_TYPE_LABELS } from "@/lib/teas";
import { Tea } from "@/types/tea";

/**
 * Приведение к виду, в котором строки сравниваются.
 *
 * «Ё» складывается с «е» намеренно, и это не ёфикация текста: решение
 * пользователя 07.11.2026 — «ё оставляй где нужно», то есть в видимом
 * тексте она остаётся. Но в запросе её почти никто не набирает, а в
 * каталоге категория называется «Зелёный чай» — и поиск по «зеленый чай»
 * не находил ни одного чая.
 */
function normalize(text: string): string {
    return text.trim().toLowerCase().replace(/ё/g, "е");
}

function getTeaSearchText(tea: Tea): string {
    return [
        tea.name,
        tea.slug,
        TEA_TYPE_LABELS[tea.type],
        tea.type,
        // Народные и ошибочные написания: «шен пуэр» ищут в 6,7 раза чаще,
        // чем «шэн пуэр». Только в индексе поиска, в видимый текст синонимы
        // не подставляются — см. `Tea.synonyms`.
        ...(tea.synonyms ?? []),
        ...tea.characteristics.aroma,
        ...tea.characteristics.flavor,
        // Послевкусие тоже искалось — его в индексе не было, хотя на
        // странице оно показано рядом с ароматом и вкусом.
        ...tea.characteristics.aftertaste,
    ].join(" ");
}

export function searchTeas(query: string): Tea[] {
    /*
     * Запрос разбивается на слова, и чай подходит, если найдено каждое.
     *
     * Раньше запрос искался целиком одной подстрокой, и «зеленый чай» не
     * находил ничего: в индексе рядом стоят «Зелёный чай» и «green», но
     * порядок слов в запросе может быть любым, а между ними в индексе
     * бывает другое поле. Слово — та единица, которой человек ищет.
     */
    const words = normalize(query).split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return [];
    }

    return getAllTeas().filter((tea) => {
        const text = normalize(getTeaSearchText(tea));

        return words.every((word) => text.includes(word));
    });
}
