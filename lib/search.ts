import { getAllTeas, TEA_TYPE_LABELS } from "@/lib/teas";
import { Tea } from "@/types/tea";

function normalize(text: string): string {
    return text.trim().toLowerCase();
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
    ]
        .join(" ")
        .toLowerCase();
}

export function searchTeas(query: string): Tea[] {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
        return [];
    }

    return getAllTeas().filter((tea) =>
        getTeaSearchText(tea).includes(normalizedQuery)
    );
}
