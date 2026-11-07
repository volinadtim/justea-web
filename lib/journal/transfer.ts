import {
    JOURNAL_SCHEMA_VERSION,
    JournalData,
    JournalSession,
    normalizeJournal,
} from "./schema";
import { readJournal, writeJournal } from "./storage";

/**
 * Перенос всех личных данных: выгрузка в файл и загрузка обратно.
 * Аккаунтов и сервера нет, поэтому файл — единственный способ перевезти
 * накопленное на другой телефон или вернуть после очистки браузера.
 *
 * Кроме дневника в файл попадают избранное, просмотренные чаи и история
 * поиска: человек, который нажимает «выгрузить все мои данные», ждёт там и их.
 * Эти три ключа живут отдельно от версионированной схемы, поэтому читаем и
 * пишем их здесь, не трогая чужие модули.
 */
export const TRANSFER_FORMAT = "justea-data";
export const TRANSFER_FORMAT_VERSION = 1;

const FAVORITES_KEY = "justea-favorites";
const RECENT_TEAS_KEY = "justea-recent-teas";
const RECENT_SEARCHES_KEY = "justea-recent-searches";

const FAVORITES_EVENT = "justea-favorites-change";
const RECENT_TEAS_EVENT = "justea-recent-teas-change";

export type RecentTeaRecord = { slug: string; viewedAt: string };

export type TransferFile = {
    format: typeof TRANSFER_FORMAT;
    formatVersion: number;
    exportedAt: string;
    journal: JournalData;
    favorites: string[];
    recentTeas: RecentTeaRecord[];
    recentSearches: string[];
};

export type TransferSummary = {
    sessions: number;
    brews: number;
    favorites: number;
    recentTeas: number;
    recentSearches: number;
    exportedAt?: string;
    /** Файл сделан версией схемы новее нашей: часть полей может потеряться. */
    fromNewerVersion: boolean;
};

function readStringArray(key: string): string[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];

        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : [];
    } catch {
        return [];
    }
}

function readRecentTeas(): RecentTeaRecord[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = localStorage.getItem(RECENT_TEAS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(
            (item): item is RecentTeaRecord =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof item.slug === "string" &&
                typeof item.viewedAt === "string"
        );
    } catch {
        return [];
    }
}

export function buildTransferFile(): TransferFile {
    return {
        format: TRANSFER_FORMAT,
        formatVersion: TRANSFER_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        journal: readJournal(),
        favorites: readStringArray(FAVORITES_KEY),
        recentTeas: readRecentTeas(),
        recentSearches: readStringArray(RECENT_SEARCHES_KEY),
    };
}

export function transferFileName(date = new Date()): string {
    const stamp = date.toISOString().slice(0, 10);

    return `justea-${stamp}.json`;
}

export class TransferError extends Error {}

/**
 * Разбирает содержимое файла. Всё лишнее отбрасывается, всё недостающее
 * заполняется пустым: файл мог быть сделан другой версией сайта или
 * отредактирован руками.
 */
export function parseTransferFile(text: string): {
    file: TransferFile;
    summary: TransferSummary;
} {
    let raw: unknown;

    try {
        raw = JSON.parse(text);
    } catch {
        throw new TransferError("Это не JSON — файл не читается.");
    }

    if (!raw || typeof raw !== "object") {
        throw new TransferError("В файле нет данных Justea.");
    }

    const candidate = raw as Partial<TransferFile>;

    if (candidate.format !== TRANSFER_FORMAT) {
        throw new TransferError(
            "Файл не похож на выгрузку Justea: нет отметки формата."
        );
    }

    const journalVersion =
        candidate.journal && typeof candidate.journal === "object"
            ? Number((candidate.journal as JournalData).version)
            : 0;

    const file: TransferFile = {
        format: TRANSFER_FORMAT,
        formatVersion:
            typeof candidate.formatVersion === "number"
                ? candidate.formatVersion
                : TRANSFER_FORMAT_VERSION,
        exportedAt:
            typeof candidate.exportedAt === "string"
                ? candidate.exportedAt
                : new Date().toISOString(),
        journal: normalizeJournal(candidate.journal),
        favorites: Array.isArray(candidate.favorites)
            ? candidate.favorites.filter(
                  (item): item is string => typeof item === "string"
              )
            : [],
        recentTeas: Array.isArray(candidate.recentTeas)
            ? candidate.recentTeas.filter(
                  (item): item is RecentTeaRecord =>
                      Boolean(item) &&
                      typeof item === "object" &&
                      typeof item.slug === "string" &&
                      typeof item.viewedAt === "string"
              )
            : [],
        recentSearches: Array.isArray(candidate.recentSearches)
            ? candidate.recentSearches.filter(
                  (item): item is string => typeof item === "string"
              )
            : [],
    };

    return {
        file,
        summary: {
            sessions: file.journal.sessions.length,
            brews: Object.keys(file.journal.brews).length,
            favorites: file.favorites.length,
            recentTeas: file.recentTeas.length,
            recentSearches: file.recentSearches.length,
            exportedAt: file.exportedAt,
            fromNewerVersion:
                journalVersion > JOURNAL_SCHEMA_VERSION ||
                file.formatVersion > TRANSFER_FORMAT_VERSION,
        },
    };
}

function writeStringArray(key: string, value: string[], event?: string): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        return;
    }

    if (event) {
        window.dispatchEvent(new Event(event));
    }
}

function writeRecentTeas(value: RecentTeaRecord[]): void {
    try {
        localStorage.setItem(RECENT_TEAS_KEY, JSON.stringify(value));
    } catch {
        return;
    }

    window.dispatchEvent(new Event(RECENT_TEAS_EVENT));
}

function mergeSessions(
    mine: JournalSession[],
    theirs: JournalSession[]
): JournalSession[] {
    const byId = new Map(mine.map((session) => [session.id, session]));

    for (const session of theirs) {
        byId.set(session.id, session);
    }

    return [...byId.values()];
}

function mergeBrews(
    mine: JournalData["brews"],
    theirs: JournalData["brews"]
): JournalData["brews"] {
    const merged = { ...mine };

    for (const [slug, record] of Object.entries(theirs)) {
        const current = merged[slug];

        // Побеждает более свежий запуск, счётчики складываем.
        merged[slug] = current
            ? {
                  methodId:
                      record.lastStartedAt >= current.lastStartedAt
                          ? record.methodId
                          : current.methodId,
                  lastStartedAt:
                      record.lastStartedAt >= current.lastStartedAt
                          ? record.lastStartedAt
                          : current.lastStartedAt,
                  count: current.count + record.count,
              }
            : record;
    }

    return merged;
}

export type ImportMode = "merge" | "replace";

export function applyTransferFile(file: TransferFile, mode: ImportMode): void {
    if (typeof window === "undefined") {
        return;
    }

    if (mode === "replace") {
        writeJournal(file.journal);
        writeStringArray(FAVORITES_KEY, file.favorites, FAVORITES_EVENT);
        writeRecentTeas(file.recentTeas);
        writeStringArray(RECENT_SEARCHES_KEY, file.recentSearches);
        return;
    }

    const mine = readJournal();

    writeJournal({
        version: JOURNAL_SCHEMA_VERSION,
        brews: mergeBrews(mine.brews, file.journal.brews),
        sessions: mergeSessions(mine.sessions, file.journal.sessions),
    });

    const favorites = [
        ...new Set([...readStringArray(FAVORITES_KEY), ...file.favorites]),
    ];
    writeStringArray(FAVORITES_KEY, favorites, FAVORITES_EVENT);

    const recentTeas = [...readRecentTeas(), ...file.recentTeas]
        .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
        .filter(
            (item, index, all) =>
                all.findIndex((other) => other.slug === item.slug) === index
        )
        .slice(0, 6);
    writeRecentTeas(recentTeas);

    const searches = [
        ...new Set([...readStringArray(RECENT_SEARCHES_KEY), ...file.recentSearches]),
    ].slice(0, 5);
    writeStringArray(RECENT_SEARCHES_KEY, searches);
}
