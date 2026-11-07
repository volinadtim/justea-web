import type { MetadataRoute } from "next";
import { getAllTeas, TEA_TYPES } from "@/lib/teas";
import { teaTypePath } from "@/lib/tea-type-pages";
import { absoluteUrl } from "@/lib/site";
import type { Tea } from "@/types/tea";

/**
 * `lastmod` обязан отражать реальное изменение содержимого. Если подставлять
 * `new Date()`, каждая сборка меняет дату у всех URL, краулер перестаёт
 * доверять сигналу и обходит сайт по своему графику. Поэтому берём даты из
 * данных чая, а где их нет — не выводим `lastmod` вовсе.
 */
function teaLastModified(tea: Tea): Date | undefined {
    const times = [tea.meta.addedDate, tea.meta.harvestDate]
        .filter((value): value is string => Boolean(value))
        .map((value) => new Date(value).getTime())
        .filter((time) => !Number.isNaN(time));

    return times.length ? new Date(Math.max(...times)) : undefined;
}

function latest(dates: (Date | undefined)[]): Date | undefined {
    const times = dates
        .filter((date): date is Date => date instanceof Date)
        .map((date) => date.getTime());

    return times.length ? new Date(Math.max(...times)) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const teas = getAllTeas();
    const teaDates = new Map(teas.map((tea) => [tea.slug, teaLastModified(tea)]));

    // `/search` в карту не кладём: страница под `noindex`.
    return [
        {
            url: absoluteUrl("/"),
            lastModified: latest([...teaDates.values()]),
            changeFrequency: "weekly",
            priority: 1,
        },
        // Страницы есть у всех типов, независимо от наполнения каталога
        // (см. docs/seo/site-structure.md §3).
        ...TEA_TYPES.map((type) => ({
            url: absoluteUrl(teaTypePath(type)),
            lastModified: latest(
                teas
                    .filter((tea) => tea.type === type)
                    .map((tea) => teaDates.get(tea.slug)),
            ),
            changeFrequency: "weekly" as const,
            priority: 0.9,
        })),
        ...teas.map((tea) => ({
            url: absoluteUrl(`/${tea.slug}`),
            lastModified: teaDates.get(tea.slug),
            changeFrequency: "monthly" as const,
            priority: 0.8,
        })),
    ];
}
