const STORAGE_KEY = "justea-recent-teas";
const MAX_RECENT = 6;

export type RecentTea = {
    slug: string;
    viewedAt: string;
};

export function getRecentTeas(): RecentTea[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as RecentTea[]) : [];
    } catch {
        return [];
    }
}

export function addRecentTea(slug: string): void {
    if (!slug || typeof window === "undefined") {
        return;
    }

    const recent = getRecentTeas().filter((item) => item.slug !== slug);
    recent.unshift({ slug, viewedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
    window.dispatchEvent(new Event("justea-recent-teas-change"));
}
