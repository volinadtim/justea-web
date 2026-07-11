import teasData from "@/data/teas.json";
import { BrewMethod, Tea, TeaType } from "@/types/tea";

const teas = teasData as Tea[];

export const TEA_TYPE_LABELS: Record<TeaType, string> = {
    green: "Зелёный чай",
    black: "Чёрный чай",
    oolong: "Улун",
    "pu-erh": "Пуэр",
    white: "Белый чай",
    yellow: "Жёлтый чай",
};

export function getAllTeas(): Tea[] {
    return teas;
}

export function getTeaBySlug(slug: string): Tea | undefined {
    return teas.find((tea) => tea.slug === slug);
}

export function getPrimaryBrewMethod(tea: Tea): BrewMethod | undefined {
    return (
        tea.brewMethods.find((method) => method.type === tea.primaryBrewMethod) ??
        tea.brewMethods[0]
    );
}
