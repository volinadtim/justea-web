export type TeaType =
    | "green"
    | "black"
    | "oolong"
    | "pu-erh"
    | "white"
    | "yellow";

export type BrewMethodType =
    | "gongfu"
    | "western"
    | "grandpa"
    | "cold-brew"
    | "iced";

export interface BrewMethod {
    id: string;
    name: string;
    type: BrewMethodType;
    description: string;
    /** Гр чая на 100 мл воды */
    ratio: number;
    temperature: {
        from: number;
        to: number;
    };
    /** Время проливов в секундах */
    infusions: {
        number: number;
        time: number;
        notes?: string;
    }[];
    /** Особые заметки по приготовлению */
    notes?: string[];
}

export interface Tea {
    id: string;
    name: string;
    photo?: string;
    description?: string;
    type: TeaType;

    /** Основной способ приготовления (для отображения в списке) */
    primaryBrewMethod: BrewMethodType;

    /** Все доступные способы приготовления для этого чая */
    brewMethods: BrewMethod[];

    /** Характеристики */
    characteristics: {
        /** Аромат/ароматы */
        aroma: string[];
        /** Вкус */
        flavor: string[];
        /** Послевкусие */
        aftertaste: string[];
        /** Внешний вид листа */
        appearance?: string[];
        /** Цвет настоя */
        liquorColor?: string;
    };

    /** Мета-данные */
    meta: {
        origin?: string;
        altitude?: number;
        harvestDate?: string;
        rating: number;
        favorite: boolean;
        addedDate: string;
    };
}
