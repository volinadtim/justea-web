import { BrewRecord } from "./schema";
import { readJournal, updateJournal } from "./storage";

export type BrewEntry = BrewRecord & { slug: string };

export function getBrewRecord(slug: string): BrewRecord | undefined {
    return readJournal().brews[slug];
}

/**
 * Запоминает запуск таймера: только по запуску, а не по открытию страницы.
 * «Мои чаи» — те, что человек действительно заваривал.
 */
export function rememberBrewStart(slug: string, methodId: string): void {
    if (!slug || !methodId) {
        return;
    }

    updateJournal((data) => {
        const previous = data.brews[slug];

        return {
            ...data,
            brews: {
                ...data.brews,
                [slug]: {
                    methodId,
                    lastStartedAt: new Date().toISOString(),
                    count: (previous?.count ?? 0) + 1,
                },
            },
        };
    });
}

export function getRecentBrews(limit?: number): BrewEntry[] {
    const entries = Object.entries(readJournal().brews)
        .map(([slug, record]) => ({ slug, ...record }))
        .sort((a, b) => b.lastStartedAt.localeCompare(a.lastStartedAt));

    return typeof limit === "number" ? entries.slice(0, limit) : entries;
}
