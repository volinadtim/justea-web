"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { TEA_TYPE_LABELS } from "@/lib/teas";
import { Tea } from "@/types/tea";

type Props = {
    tea: Tea;
    onSelect?: () => void;
};

export default function SearchTeaCard({ tea, onSelect }: Props) {
    const liquorColor = tea.characteristics.liquorColor;
    const tags = [
        ...tea.characteristics.aroma,
        ...tea.characteristics.flavor,
    ].slice(0, 4);

    return (
        <Link
            href={`/${tea.slug}`}
            onClick={onSelect}
            className="group flex gap-[12px] border-2 border-line p-[12px] transition-colors hover:border-line-strong"
        >
            <div
                className="flex size-[56px] shrink-0 items-center justify-center bg-main-200 sm:size-[64px]"
                style={liquorColor ? { backgroundColor: liquorColor } : undefined}
            >
                <Leaf className="size-5 opacity-40 sm:size-6" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <div>
                    <span className="text-[12px] text-muted sm:text-[13px]">
                        {TEA_TYPE_LABELS[tea.type]}
                    </span>
                    <h3 className="text-[18px] leading-tight group-hover:underline sm:text-[20px]">
                        {tea.name}
                    </h3>
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-[4px]">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-line px-[8px] py-[2px] text-[11px] leading-tight text-black/70 dark:border-white/15 dark:text-white/70 sm:text-[12px]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
