import {
    JOURNAL_CHANGE_EVENT,
    JOURNAL_STORAGE_KEY,
    JournalData,
    createEmptyJournal,
    normalizeJournal,
} from "./schema";

export function readJournal(): JournalData {
    if (typeof window === "undefined") {
        return createEmptyJournal();
    }

    try {
        const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
        return raw ? normalizeJournal(JSON.parse(raw)) : createEmptyJournal();
    } catch {
        return createEmptyJournal();
    }
}

export function writeJournal(data: JournalData): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(data));
    } catch {
        return;
    }

    window.dispatchEvent(new Event(JOURNAL_CHANGE_EVENT));
}

export function updateJournal(
    update: (data: JournalData) => JournalData
): JournalData {
    const next = update(readJournal());
    writeJournal(next);
    return next;
}

export function subscribeToJournal(listener: () => void): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    window.addEventListener(JOURNAL_CHANGE_EVENT, listener);
    return () => window.removeEventListener(JOURNAL_CHANGE_EVENT, listener);
}
