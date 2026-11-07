import { JournalSession } from "./schema";
import { readJournal, updateJournal } from "./storage";

export type SessionInput = {
    slug: string;
    methodId?: string;
    brewedAt: string;
    steepsDone?: number;
    note?: string;
};

function createId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Новые записи сверху: дневник читают с последней сессии. */
export function getSessions(): JournalSession[] {
    return [...readJournal().sessions].sort((a, b) =>
        b.brewedAt.localeCompare(a.brewedAt)
    );
}

export function getSession(id: string): JournalSession | undefined {
    return readJournal().sessions.find((session) => session.id === id);
}

export function addSession(input: SessionInput): JournalSession {
    const now = new Date().toISOString();
    const session: JournalSession = {
        id: createId(),
        ...input,
        createdAt: now,
        updatedAt: now,
    };

    updateJournal((data) => ({ ...data, sessions: [...data.sessions, session] }));

    return session;
}

export function updateSession(id: string, input: SessionInput): void {
    const now = new Date().toISOString();

    updateJournal((data) => ({
        ...data,
        sessions: data.sessions.map((session) =>
            session.id === id ? { ...session, ...input, updatedAt: now } : session
        ),
    }));
}

export function removeSession(id: string): void {
    updateJournal((data) => ({
        ...data,
        sessions: data.sessions.filter((session) => session.id !== id),
    }));
}
