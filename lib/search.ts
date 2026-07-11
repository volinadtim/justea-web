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
