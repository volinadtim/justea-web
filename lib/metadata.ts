import type { Metadata } from "next";
import { siteConfig } from "./site";

export function createPageMetadata({
    title,
    description,
    path = "",
    image,
}: {
    title: string;
    description?: string;
    path?: string;
    image?: string;
}): Metadata {
    const pageDescription = description ?? siteConfig.description;
    const pageUrl = `${siteConfig.url}${path}`;
    const pageImage = image ?? siteConfig.ogImage;

    return {
        title,
        description: pageDescription,
        openGraph: {
            type: "website",
            locale: siteConfig.locale,
            url: pageUrl,
            siteName: siteConfig.name,
            title,
            description: pageDescription,
            images: [
                {
                    url: pageImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: pageDescription,
            images: [pageImage],
        },
    };
}
