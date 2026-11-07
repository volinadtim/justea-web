import type { MetadataRoute } from "next";
import { getAllTeas } from "@/lib/teas";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
    const teas = getAllTeas();
    const now = new Date();

    return [
        {
            url: siteConfig.url,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 1,
        },
        // ВРЕМЕННО нет /ceremony (решение оркестратора 2026-11-07, inbox #6):
        // страница под noindex, пока на ней стоят заглушки «нужны данные».
        // ВЕРНУТЬ вместе со снятием robots в app/ceremony/page.tsx:
        // { url: `${siteConfig.url}/ceremony`, lastModified: now,
        //   changeFrequency: "monthly", priority: 0.9 },
        {
            url: `${siteConfig.url}/search`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.5,
        },
        ...teas.map((tea) => ({
            url: `${siteConfig.url}/${tea.slug}`,
            lastModified: now,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        })),
    ];
}
