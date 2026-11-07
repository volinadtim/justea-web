"use client";

import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecentBrews } from "@/lib/journal/brews";
import { subscribeToJournal } from "@/lib/journal/storage";
import { getPrimaryBrewMethod, getTeaBySlug } from "@/lib/teas";
import { Tea } from "@/types/tea";

const MAX_ITEMS = 4;

type Item = {
    tea: Tea;
    methodName: string;
};

function collectItems(): Item[] {
    return getRecentBrews(MAX_ITEMS)
        .map((entry) => {
            const tea = getTeaBySlug(entry.slug);

            if (!tea) {
                return null;
            }

            const method =
                tea.brewMethods.find((item) => item.id === entry.methodId) ??
                getPrimaryBrewMethod(tea);

            if (!method) {
                return null;
            }

            return { tea, methodName: method.name };
        })
        .filter((item): item is Item => Boolean(item));
}

export default function BrewAgainSection() {
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        function load() {
            setItems(collectItems());
        }

        load();
        return subscribeToJournal(load);
    }, []);

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="mb-8 sm:mb-10">
            <h2 className="mb-4 text-[24px] leading-none sm:mb-5 sm:text-[28px]">
                Заварить снова
            </h2>
            <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                {items.map(({ tea, methodName }) => (
                    <Link
                        key={tea.slug}
                        href={`/${tea.slug}?start=1`}
                        aria-label={`Заварить ${tea.name}: ${methodName}`}
                        className="group flex items-center gap-[12px] border-2 border-black/10 p-[12px] transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
                    >
                        <span
                            aria-hidden="true"
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-black/20 group-hover:border-black/40 dark:border-white/20 dark:group-hover:border-white/40"
                        >
                            <PlayIcon className="size-5" strokeWidth={2} />
                        </span>
                        <span className="flex min-w-0 flex-col gap-[2px]">
                            <span className="truncate text-[22px] leading-none group-hover:underline">
                                {tea.name}
                            </span>
                            <span className="truncate text-[14px] text-black/60 dark:text-white/60">
                                {methodName}
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
