"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDay, formatTime } from "@/lib/journal/dates";
import { JournalSession } from "@/lib/journal/schema";
import { getSessions } from "@/lib/journal/sessions";
import { subscribeToJournal } from "@/lib/journal/storage";
import { getTeaBySlug } from "@/lib/teas";

const MAX_ITEMS = 3;

export default function JournalSection() {
    const [sessions, setSessions] = useState<JournalSession[]>([]);

    useEffect(() => {
        function load() {
            setSessions(getSessions().slice(0, MAX_ITEMS));
        }

        load();
        return subscribeToJournal(load);
    }, []);

    if (sessions.length === 0) {
        return null;
    }

    return (
        <section className="mb-8 sm:mb-10">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-[16px] gap-y-[4px] sm:mb-5">
                <h2 className="text-[24px] leading-none sm:text-[28px]">Дневник</h2>
                <Link
                    href="/journal"
                    className="text-[16px] underline-offset-2 hover:underline"
                >
                    Все записи
                </Link>
            </div>

            <div className="flex flex-col gap-[12px]">
                {sessions.map((session) => {
                    const tea = getTeaBySlug(session.slug);

                    return (
                        <Link
                            key={session.id}
                            href="/journal"
                            className="group flex flex-wrap items-baseline gap-x-[8px] border-2 border-black/10 p-[12px] transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
                        >
                            <span className="text-[19px] leading-none group-hover:underline">
                                {tea?.name ?? session.slug}
                            </span>
                            <span className="text-[14px] text-black/60 dark:text-white/60">
                                {formatDay(session.brewedAt)}, {formatTime(session.brewedAt)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
