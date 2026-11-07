"use client";

import { useState } from "react";
import QuickBrewButton from "./QuickBrewButton";
import { CheckIcon, XIcon } from "lucide-react";
import {
    fromInputValues,
    shiftDays,
    toDateInputValue,
    toTimeInputValue,
    todayInputValue,
} from "@/lib/journal/dates";
import { SessionInput } from "@/lib/journal/sessions";
import { JournalSession } from "@/lib/journal/schema";

export type TeaOption = {
    slug: string;
    name: string;
    methods: { id: string; name: string }[];
};

type Props = {
    teas: TeaOption[];
    session?: JournalSession;
    defaultSlug?: string;
    defaultMethodId?: string;
    onSave: (input: SessionInput) => void;
    onCancel: () => void;
};

const FIELD_CLASS =
    "min-h-11 w-full rounded-md border-2 border-black/20 bg-transparent px-[12px] text-[17px] transition-colors hover:border-black/40 focus:border-black/40 dark:border-white/20 dark:hover:border-white/40 dark:focus:border-white/40";

const LABEL_CLASS = "mb-[4px] block text-[14px] text-black/60 dark:text-white/60";

function DayShortcut({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className="min-h-11 shrink-0 rounded-full border-2 border-black/20 px-[14px] text-[14px] transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
            onClick={onClick}
        >
            {label}
        </button>
    );
}

/**
 * Форма записи в дневник. Дату и время человек правит свободно, в том числе
 * задним числом: «сегодня» и «вчера» — просто быстрые кнопки, а не ограничение.
 */
export default function JournalForm({
    teas,
    session,
    defaultSlug,
    defaultMethodId,
    onSave,
    onCancel,
}: Props) {
    const initialSlug = session?.slug ?? defaultSlug ?? teas[0]?.slug ?? "";
    const initialTea = teas.find((tea) => tea.slug === initialSlug);

    const [slug, setSlug] = useState(initialSlug);
    const [methodId, setMethodId] = useState(
        session?.methodId ?? defaultMethodId ?? initialTea?.methods[0]?.id ?? ""
    );
    const [date, setDate] = useState(
        session ? toDateInputValue(session.brewedAt) : todayInputValue()
    );
    const [time, setTime] = useState(
        session ? toTimeInputValue(session.brewedAt) : toTimeInputValue(new Date().toISOString())
    );
    const [steeps, setSteeps] = useState(
        session?.steepsDone !== undefined ? String(session.steepsDone) : ""
    );
    const [note, setNote] = useState(session?.note ?? "");
    const [error, setError] = useState<string | null>(null);

    const tea = teas.find((item) => item.slug === slug);

    function handleTeaChange(nextSlug: string) {
        setSlug(nextSlug);

        const nextTea = teas.find((item) => item.slug === nextSlug);
        setMethodId(nextTea?.methods[0]?.id ?? "");
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const brewedAt = fromInputValues(date, time);

        if (!slug || !brewedAt) {
            setError("Выберите чай и дату.");
            return;
        }

        const steepsDone = steeps.trim() === "" ? undefined : Number(steeps);

        onSave({
            slug,
            methodId: methodId || undefined,
            brewedAt,
            steepsDone:
                steepsDone !== undefined && Number.isFinite(steepsDone) && steepsDone >= 0
                    ? steepsDone
                    : undefined,
            note: note.trim() === "" ? undefined : note.trim(),
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-[24px] rounded-md border-2 border-black/10 p-[16px] dark:border-white/10"
        >
            <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
                <div>
                    <label className={LABEL_CLASS} htmlFor="journal-tea">
                        Чай
                    </label>
                    <select
                        id="journal-tea"
                        className={FIELD_CLASS}
                        value={slug}
                        onChange={(event) => handleTeaChange(event.target.value)}
                    >
                        {teas.map((item) => (
                            <option key={item.slug} value={item.slug}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="journal-method">
                        Способ заваривания
                    </label>
                    <select
                        id="journal-method"
                        className={FIELD_CLASS}
                        value={methodId}
                        onChange={(event) => setMethodId(event.target.value)}
                    >
                        <option value="">Не указан</option>
                        {tea?.methods.map((method) => (
                            <option key={method.id} value={method.id}>
                                {method.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="journal-date">
                        Дата
                    </label>
                    <input
                        id="journal-date"
                        type="date"
                        className={FIELD_CLASS}
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                    />
                    <div className="mt-[8px] flex flex-wrap gap-[8px]">
                        <DayShortcut label="Сегодня" onClick={() => setDate(todayInputValue())} />
                        <DayShortcut
                            label="Вчера"
                            onClick={() => setDate(shiftDays(todayInputValue(), -1))}
                        />
                        <DayShortcut
                            label="Позавчера"
                            onClick={() => setDate(shiftDays(todayInputValue(), -2))}
                        />
                    </div>
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="journal-time">
                        Время
                    </label>
                    <input
                        id="journal-time"
                        type="time"
                        className={FIELD_CLASS}
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS} htmlFor="journal-steeps">
                        Проливов
                    </label>
                    <input
                        id="journal-steeps"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Сколько получилось"
                        className={FIELD_CLASS}
                        value={steeps}
                        onChange={(event) => setSteeps(event.target.value)}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className={LABEL_CLASS} htmlFor="journal-note">
                        Заметка
                    </label>
                    <textarea
                        id="journal-note"
                        rows={3}
                        placeholder="Вода, посуда, что получилось"
                        className={`${FIELD_CLASS} py-[10px]`}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                </div>
            </div>

            {error && (
                <p className="mt-[12px] text-[16px] text-black/70 dark:text-white/70">{error}</p>
            )}

            <div className="mt-[16px] flex flex-wrap gap-[8px]">
                <button
                    type="submit"
                    className="inline-flex min-h-11 shrink-0 items-center gap-[8px] rounded-full border-2 border-black bg-black px-4 text-[16px] text-white transition-colors hover:border-black/80 hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:border-white/80 dark:hover:bg-white/80"
                >
                    <CheckIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                    Сохранить
                </button>
                <QuickBrewButton
                    label="Отмена"
                    variant="secondary"
                    icon={<XIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />}
                    onClick={onCancel}
                />
            </div>
        </form>
    );
}
