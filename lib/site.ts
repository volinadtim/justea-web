/**
 * Конфигурация сайта для SEO: metadata, OG, sitemap, robots, JSON-LD.
 *
 * Сайт пока только на русском. Чтобы добавить локаль, достаточно дописать
 * строку в `siteConfig.locales` — `alternates.languages` в `lib/metadata.ts`
 * соберёт hreflang автоматически. Пока в списке одна локаль, hreflang не
 * выводится: ссылки на несуществующие страницы дают ошибки в GSC.
 */

export type SiteLocale = {
    /** Код для hreflang (BCP 47) и префикса пути: `ru` → `/`, `en` → `/en` */
    code: string;
    /** Код для `og:locale` */
    ogLocale: string;
    /** `true` — локаль по умолчанию, живёт в корне без префикса */
    default?: boolean;
};

const locales: SiteLocale[] = [
    { code: "ru", ogLocale: "ru_RU", default: true },
    // { code: "en", ogLocale: "en_US" },
    // { code: "zh", ogLocale: "zh_CN" },
    // { code: "ja", ogLocale: "ja_JP" },
];

const defaultLocale = locales.find((locale) => locale.default) ?? locales[0];

export const siteConfig = {
    name: "Justea",
    description: "Справочник по завариванию чая — проливы, температура, пропорции",
    url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://justea.ru").replace(
        /\/+$/,
        "",
    ),
    locales,
    defaultLocale,
    /** `og:locale` основной локали */
    locale: defaultLocale.ogLocale,
    ogImage: "/og.jpg",
    /**
     * Фактический размер `public/og.jpg`. Обязан совпадать с файлом: краулеры
     * и соцсети верят этим числам при построении превью.
     *
     * TODO(seo): justea-design привёл `og.jpg` к 1200×630 в своём PR #11.
     * Когда он вольётся — поменять высоту на 630. Раньше нельзя: иначе снова
     * получим заявленный размер, не совпадающий с файлом (находка 3.5 аудита).
     */
    ogImageWidth: 1200,
    ogImageHeight: 800,
    /**
     * Коды подтверждения прав в панелях вебмастеров. Значения вставляет
     * пользователь в `.env.local` и в переменные деплоя — в репозиторий не
     * коммитим. Пустая строка = мета-тег не выводится.
     */
    verification: {
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "",
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    },
};

/** Выводить hreflang имеет смысл только когда локалей больше одной. */
export const isMultilingual = siteConfig.locales.length > 1;

/**
 * Абсолютный URL для canonical, OG, sitemap и JSON-LD.
 *
 * Корень отдаём без завершающего слэша: именно так Next.js нормализует
 * canonical через `metadataBase`, а canonical, sitemap и `@id` в JSON-LD
 * обязаны совпадать символ в символ, иначе краулер видит два разных URL.
 */
export function absoluteUrl(path = ""): string {
    if (!path || path === "/") {
        return siteConfig.url;
    }

    return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
