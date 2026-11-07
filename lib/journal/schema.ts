/** Версия схемы локальных данных пользователя. Меняется только вверх. */
export const JOURNAL_SCHEMA_VERSION = 1;

/** Что человек последним делал с этим чаём: какой способ запускал и как часто. */
export type BrewRecord = {
    methodId: string;
    lastStartedAt: string;
    count: number;
};

export type JournalData = {
    version: number;
    /** Ключ — slug чая. */
    brews: Record<string, BrewRecord>;
};

export const JOURNAL_STORAGE_KEY = "justea-journal";
export const JOURNAL_CHANGE_EVENT = "justea-journal-change";

export function createEmptyJournal(): JournalData {
    return { version: JOURNAL_SCHEMA_VERSION, brews: {} };
}

function isBrewRecord(value: unknown): value is BrewRecord {
    if (!value || typeof value !== "object") {
        return false;
    }

    const record = value as Partial<BrewRecord>;

    return (
        typeof record.methodId === "string" &&
        typeof record.lastStartedAt === "string" &&
        typeof record.count === "number"
    );
}

/**
 * Приводит прочитанное из хранилища к текущей схеме. Чужие и битые поля
 * отбрасываются: данные пользователя лежат только у него, восстановить их
 * с сервера нельзя, поэтому разбор не должен падать.
 */
export function normalizeJournal(value: unknown): JournalData {
    if (!value || typeof value !== "object") {
        return createEmptyJournal();
    }

    const raw = value as Partial<JournalData>;
    const brews: Record<string, BrewRecord> = {};

    if (raw.brews && typeof raw.brews === "object") {
        for (const [slug, record] of Object.entries(raw.brews)) {
            if (isBrewRecord(record)) {
                brews[slug] = {
                    methodId: record.methodId,
                    lastStartedAt: record.lastStartedAt,
                    count: record.count,
                };
            }
        }
    }

    return { version: JOURNAL_SCHEMA_VERSION, brews };
}
