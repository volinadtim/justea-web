import type { Metadata } from "next";
import { publicImageSize } from "./image-size";
import { absoluteUrl, isMultilingual, siteConfig } from "./site";

/** hreflang-альтернативы. Пока локаль одна — возвращаем undefined. */
function languageAlternates(
    path: string,
): Record<string, string> | undefined {
    if (!isMultilingual) {
        return undefined;
    }

    return Object.fromEntries(
        siteConfig.locales.map((locale) => [
            locale.code,
            locale.default ? absoluteUrl(path) : absoluteUrl(`/${locale.code}${path}`),
        ]),
    );
}

export function createPageMetadata({
    title,
    description,
    path = "",
    image,
    /** `true` — страница закрыта от индексации (noindex, follow). */
    noindex = false,
}: {
    title: string;
    description?: string;
    path?: string;
    image?: string;
    noindex?: boolean;
}): Metadata {
    const pageDescription = description ?? siteConfig.description;
    const pageUrl = absoluteUrl(path);
    const pageImage = image ?? siteConfig.ogImage;
    // Размер читаем из самого файла: заявить неверный хуже, чем не заявить.
    const size = publicImageSize(pageImage);

    return {
        title,
        description: pageDescription,
        alternates: {
            canonical: pageUrl,
            languages: languageAlternates(path),
        },
        robots: noindex
            ? { index: false, follow: true, googleBot: { index: false, follow: true } }
            : undefined,
        openGraph: {
            type: "website",
            locale: siteConfig.locale,
            url: pageUrl,
            siteName: siteConfig.name,
            title,
            description: pageDescription,
            images: [{ url: pageImage, ...size, alt: title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: pageDescription,
            images: [pageImage],
        },
    };
}
