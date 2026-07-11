const STORAGE_KEY = "justea-favorites";

export function getFavoriteSlugs(): string[] {
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

export function isFavorite(slug: string): boolean {
    return getFavoriteSlugs().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
    const favorites = getFavoriteSlugs();
    const isCurrentlyFavorite = favorites.includes(slug);

    const next = isCurrentlyFavorite
        ? favorites.filter((item) => item !== slug)
        : [slug, ...favorites];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("justea-favorites-change"));

    return !isCurrentlyFavorite;
}
