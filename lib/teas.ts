import teasData from "@/data/teas.json";
import { BrewMethod, Tea, TeaType } from "@/types/tea";

const teas = teasData as Tea[];

/**
 * Подписи типов. **Этот объект — источник правды и для списка типов.**
 *
 * `Record<TeaType, string>` компилятор проверяет на полноту: забыть тип здесь
 * нельзя, сборка упадёт. А массив `TeaType[]` компилятор не проверяет вовсе —
 * короткий массив принимается молча, и новый тип исчез бы из фильтра, из
 * `sitemap.xml` и из генерации страниц без единой ошибки.
 *
 * Поэтому `TEA_TYPES` выводится отсюда ключами, а не пишется рядом руками.
 * Порядок ключей — порядок показа; у строковых ключей он сохраняется.
 *
 * Находка из аудита тихих ограничений justea-design, 07.11.2026.
 */
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

/**
 * Все типы в порядке показа — выведены из `TEA_TYPE_LABELS`, см. его докблок.
 * Руками сюда ничего не дописывать: тип добавляется в `TeaType` и в подписи,
 * а здесь появляется сам.
 */
export const TEA_TYPES = Object.keys(TEA_TYPE_LABELS) as TeaType[];

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
    const methods = tea.brewMethods ?? [];

    return (
        methods.find((method) => method.type === tea.primaryBrewMethod) ??
        methods[0]
    );
}
