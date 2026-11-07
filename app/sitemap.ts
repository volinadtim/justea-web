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
        // ВРЕМЕННО нет /ceremony (решение оркестратора 2026-11-07, inbox #6
        // и #7): страница под noindex, пока на ней стоят заглушки «нужны
        // данные», и ссылок на неё с сайта тоже нет — она намеренно
        // недостижима для посетителя и проверяется по прямому адресу.
        // ВЕРНУТЬ ОДНИМ ЗАХОДОМ вместе с robots в app/ceremony/page.tsx и
        // ссылками на лендинг — там же расписан порядок:
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
