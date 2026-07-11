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
