"use client";

import Link from "next/link";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import JournalForm, { TeaOption } from "./JournalForm";
import QuickBrewButton from "./QuickBrewButton";
import { dayKey, formatDay, formatTime } from "@/lib/journal/dates";
import { JournalSession } from "@/lib/journal/schema";
import {
    addSession,
    getSessions,
    removeSession,
    SessionInput,
    updateSession,
} from "@/lib/journal/sessions";
import { subscribeToJournal } from "@/lib/journal/storage";
import { pluralSteeps } from "@/lib/journal/plural";

type Props = {
    teas: TeaOption[];
};

function groupByDay(sessions: JournalSession[]) {
    const groups: { key: string; label: string; items: JournalSession[] }[] = [];

    for (const session of sessions) {
        const key = dayKey(session.brewedAt);
        const last = groups[groups.length - 1];

        if (last && last.key === key) {
            last.items.push(session);
            continue;
        }

        groups.push({ key, label: formatDay(session.brewedAt), items: [session] });
    }

    return groups;
}

function RowButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-black/20 transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default function JournalScreen({ teas }: Props) {
    // ?tea= и ?method= приходят со страницы чая. Компонент завёрнут в
    // <Suspense>, поэтому useSearchParams не делает страницу динамической.
    const params = useSearchParams();
    const prefillSlug = params.get("tea") ?? undefined;
    const prefillMethodId = params.get("method") ?? undefined;
    const [sessions, setSessions] = useState<JournalSession[]>([]);
    // «auto» — форму ещё не трогали руками: тогда её открывает ?tea=.
    const [formState, setFormState] = useState<"auto" | "open" | "closed">("auto");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const adding =
        formState === "open" || (formState === "auto" && Boolean(prefillSlug));

    useEffect(() => {
        function load() {
            setSessions(getSessions());
        }

        load();
        return subscribeToJournal(load);
    }, []);

    const teaName = (slug: string) =>
        teas.find((tea) => tea.slug === slug)?.name ?? slug;
    const methodName = (slug: string, methodId?: string) =>
        teas
            .find((tea) => tea.slug === slug)
            ?.methods.find((method) => method.id === methodId)?.name;

    function handleAdd(input: SessionInput) {
        addSession(input);
        setFormState("closed");
    }

    function handleUpdate(id: string, input: SessionInput) {
        updateSession(id, input);
        setEditingId(null);
    }

    const groups = groupByDay(sessions);

    return (
        <>
            {!adding && !editingId && (
                <QuickBrewButton
                    label="Записать сессию"
                    className="mb-[24px]"
                    icon={<PlusIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />}
                    onClick={() => setFormState("open")}
                />
            )}

            {adding && (
                <JournalForm
                    teas={teas}
                    defaultSlug={prefillSlug}
                    defaultMethodId={prefillMethodId}
                    onSave={handleAdd}
                    onCancel={() => setFormState("closed")}
                />
            )}

            {sessions.length === 0 && !adding ? (
                <p className="text-[19px]">
                    Записей пока нет. Запишите сессию — хоть сейчас, хоть задним числом:
                    дату и время можно поставить любые.
                </p>
            ) : null}

            {groups.map((group) => (
                <section key={group.key} className="mb-[24px]">
                    <h2 className="mb-[12px] text-[19px] text-black/60 dark:text-white/60">
                        {group.label}
                    </h2>

                    <div className="flex flex-col gap-[12px]">
                        {group.items.map((session) =>
                            editingId === session.id ? (
                                <JournalForm
                                    key={session.id}
                                    teas={teas}
                                    session={session}
                                    onSave={(input) => handleUpdate(session.id, input)}
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <article
                                    key={session.id}
                                    className="flex items-start gap-[12px] border-2 border-black/10 p-[12px] dark:border-white/10"
                                >
                                    <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                                        <div className="flex flex-wrap items-baseline gap-x-[8px]">
                                            <Link
                                                href={`/${session.slug}`}
                                                className="text-[22px] leading-none underline-offset-2 hover:underline"
                                            >
                                                {teaName(session.slug)}
                                            </Link>
                                            <span className="text-[14px] text-black/60 dark:text-white/60">
                                                {formatTime(session.brewedAt)}
                                            </span>
                                        </div>

                                        <div className="text-[14px] text-black/60 dark:text-white/60">
                                            {[
                                                methodName(session.slug, session.methodId),
                                                session.steepsDone !== undefined
                                                    ? pluralSteeps(session.steepsDone)
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </div>

                                        {session.note && (
                                            <p className="text-[16px] leading-[1.3]">
                                                {session.note}
                                            </p>
                                        )}
                                    </div>

                                    {confirmId === session.id ? (
                                        <div className="flex shrink-0 flex-wrap gap-[8px]">
                                            <button
                                                type="button"
                                                className="min-h-11 shrink-0 rounded-full border-2 border-black bg-black px-[14px] text-[14px] text-white dark:border-white dark:bg-white dark:text-black"
                                                onClick={() => {
                                                    removeSession(session.id);
                                                    setConfirmId(null);
                                                }}
                                            >
                                                Удалить
                                            </button>
                                            <button
                                                type="button"
                                                className="min-h-11 shrink-0 rounded-full border-2 border-black/20 px-[14px] text-[14px] dark:border-white/20"
                                                onClick={() => setConfirmId(null)}
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex shrink-0 gap-[8px]">
                                            <RowButton
                                                label="Изменить запись"
                                                onClick={() => {
                                                    setEditingId(session.id);
                                                    setFormState("closed");
                                                }}
                                            >
                                                <PencilIcon className="size-5" strokeWidth={2} />
                                            </RowButton>
                                            <RowButton
                                                label="Удалить запись"
                                                onClick={() => setConfirmId(session.id)}
                                            >
                                                <Trash2Icon className="size-5" strokeWidth={2} />
                                            </RowButton>
                                        </div>
                                    )}
                                </article>
                            )
                        )}
                    </div>
                </section>
            ))}
        </>
    );
}
