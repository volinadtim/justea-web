/** Версия схемы локальных данных пользователя. Меняется только вверх. */
export const JOURNAL_SCHEMA_VERSION = 2;

/** Что человек последним делал с этим чаём: какой способ запускал и как часто. */
export type BrewRecord = {
    methodId: string;
    lastStartedAt: string;
    count: number;
};

/**
 * Запись дневника. `brewedAt` человек правит свободно, в том числе задним
 * числом: сначала пьют чай, записывают потом.
 */
export type JournalSession = {
    id: string;
    /** Чай из каталога. */
    slug: string;
    methodId?: string;
    /** Когда заваривали, ISO. */
    brewedAt: string;
    /** Сколько проливов получилось. */
    steepsDone?: number;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

export type JournalData = {
    version: number;
    /** Ключ — slug чая. */
    brews: Record<string, BrewRecord>;
    sessions: JournalSession[];
};

export const JOURNAL_STORAGE_KEY = "justea-journal";
export const JOURNAL_CHANGE_EVENT = "justea-journal-change";

export function createEmptyJournal(): JournalData {
    return { version: JOURNAL_SCHEMA_VERSION, brews: {}, sessions: [] };
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

function normalizeSession(value: unknown): JournalSession | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const raw = value as Partial<JournalSession>;

    if (typeof raw.id !== "string" || typeof raw.slug !== "string") {
        return null;
    }

    if (typeof raw.brewedAt !== "string" || Number.isNaN(Date.parse(raw.brewedAt))) {
        return null;
    }

    return {
        id: raw.id,
        slug: raw.slug,
        methodId: typeof raw.methodId === "string" ? raw.methodId : undefined,
        brewedAt: raw.brewedAt,
        steepsDone:
            typeof raw.steepsDone === "number" && Number.isFinite(raw.steepsDone)
                ? raw.steepsDone
                : undefined,
        note: typeof raw.note === "string" ? raw.note : undefined,
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : raw.brewedAt,
        updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : raw.brewedAt,
    };
}

/**
 * Приводит прочитанное из хранилища к текущей схеме. Чужие и битые поля
 * отбрасываются, недостающие добавляются: данные пользователя лежат только
 * у него, восстановить их с сервера нельзя, поэтому разбор не должен падать.
 *
 * Версия 1 не знала о дневнике — у неё просто не было поля `sessions`,
 * и пустой список здесь и есть миграция 1 → 2.
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

    const sessions = Array.isArray(raw.sessions)
        ? raw.sessions
              .map(normalizeSession)
              .filter((session): session is JournalSession => session !== null)
        : [];

    return { version: JOURNAL_SCHEMA_VERSION, brews, sessions };
}
