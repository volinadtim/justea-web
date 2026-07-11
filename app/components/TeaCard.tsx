"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { TEA_TYPE_LABELS } from "@/lib/teas";
import { Tea } from "@/types/tea";

type Props = {
    tea: Tea;
};

export default function TeaCard({ tea }: Props) {
    const liquorColor = tea.characteristics.liquorColor;

    return (
        <Link
            href={`/${tea.slug}`}
            className="group relative flex flex-col gap-[12px] border-2 border-black/10 p-[16px] transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
        >
            <FavoriteButton
                slug={tea.slug}
                className="absolute top-[12px] right-[12px] z-10"
            />

            <div
                className="flex aspect-[4/3] items-center justify-center bg-main-200"
                style={liquorColor ? { backgroundColor: liquorColor } : undefined}
            >
                <Leaf className="size-10 opacity-40" />
            </div>

            <div className="flex flex-col gap-[4px]">
                <span className="text-[14px] text-black/60 dark:text-white/60">
                    {TEA_TYPE_LABELS[tea.type]}
                </span>
                <h2 className="text-[28px] leading-none group-hover:underline">
                    {tea.name}
                </h2>
                {tea.description && (
                    <p className="line-clamp-2 text-[16px] leading-[1.3] text-black/70 dark:text-white/70">
                        {tea.description}
                    </p>
                )}
            </div>
        </Link>
    );
}
