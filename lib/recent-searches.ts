const STORAGE_KEY = "justea-recent-searches";
const MAX_RECENT = 5;

export function getRecentSearches(): string[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(query: string): void {
    const normalized = query.trim();

    if (!normalized || typeof window === "undefined") {
        return;
    }

    const recent = getRecentSearches().filter((item) => item !== normalized);
    recent.unshift(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}
