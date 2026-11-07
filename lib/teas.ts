import teasData from "@/data/teas.json";
import { BrewMethod, Tea, TeaType } from "@/types/tea";

const teas = teasData as Tea[];

export const TEA_TYPES: TeaType[] = [
    "green",
    "black",
    "oolong",
    "pu-erh",
    "dark",
    "white",
    "yellow",
];

export const TEA_TYPE_LABELS: Record<TeaType, string> = {
    green: "Зелёный чай",
    black: "Чёрный чай",
    oolong: "Улун",
    "pu-erh": "Пуэр",
    // Народное название в скобках: «хэй ча» как запрос почти не встречается
    // (около тридцати показов), но без него подпись «тёмный чай» ничего не
    // говорит человеку, который пришёл за любао.
    dark: "Тёмный чай (хэй ча)",
    white: "Белый чай",
    yellow: "Жёлтый чай",
};

export function isTeaType(value: string): value is TeaType {
    return TEA_TYPES.includes(value as TeaType);
}

export function getAllTeas(): Tea[] {
    return teas;
}

export function getTeaBySlug(slug: string): Tea | undefined {
    return teas.find((tea) => tea.slug === slug);
}

export function getAvailableTeaTypes(): TeaType[] {
    const types = new Set(teas.map((tea) => tea.type));
    return TEA_TYPES.filter((type) => types.has(type));
}

export function filterTeasByType(type?: TeaType): Tea[] {
    if (!type) {
        return teas;
    }

    return teas.filter((tea) => tea.type === type);
}

export function getPrimaryBrewMethod(tea: Tea): BrewMethod | undefined {
    return (
        tea.brewMethods.find((method) => method.type === tea.primaryBrewMethod) ??
        tea.brewMethods[0]
    );
}
