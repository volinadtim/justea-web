"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { TEA_TYPE_LABELS } from "@/lib/teas";
import { Tea } from "@/types/tea";

type Props = {
    tea: Tea;
    onSelect?: () => void;
};

const TAG_LIMIT = 4;

/**
 * Четыре тега поровну из аромата и вкуса.
 *
 * Раньше бралось `[...aroma, ...flavor].slice(0, 4)`. Склейка начинается
 * с аромата, поэтому у чая с четырьмя ароматами вкус не показывался вообще —
 * не часть его, а целиком. В каталоге из 24 записей таких шесть: Те Гуань Инь,
 * Да Хун Пао, Би Ло Чунь, Бай Хао Инь Чжэнь, сенча, дарджилинг.
 *
 * Если в одной группе меньше двух значений, недостающее добирается
 * из соседней — чтобы тегов по-прежнему было четыре.
 *
 * Повторы отбрасываются: аромат и вкус описываются одним словарём, и,
 * например, у дарджилинга «Цветочный» стоит в обоих списках. До этой правки
 * повтор был невозможен, потому что вкус в карточку не попадал.
 */
function pickTags(aroma: string[], flavor: string[]): string[] {
    const half = Math.floor(TAG_LIMIT / 2);
    const seen = new Set<string>();
    const tags: string[] = [];

    function take(values: string[], limit: number) {
        for (const value of values) {
            if (tags.length >= limit) {
                return;
            }

            const key = value.toLocaleLowerCase("ru");

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            tags.push(value);
        }
    }

    take(aroma, Math.max(half, TAG_LIMIT - flavor.length));
    take(flavor, TAG_LIMIT);
    // Если во вкусе не хватило непохожих слов, добираем из аромата.
    take(aroma, TAG_LIMIT);

    return tags;
}

export default function SearchTeaCard({ tea, onSelect }: Props) {
    const liquorColor = tea.characteristics.liquorColor;
    const tags = pickTags(tea.characteristics.aroma, tea.characteristics.flavor);

    return (
        <Link
            href={`/${tea.slug}`}
            onClick={onSelect}
            className="group flex gap-[12px] border-2 border-black/10 p-[12px] transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
        >
            <div
                className="flex size-[56px] shrink-0 items-center justify-center bg-main-200 sm:size-[64px]"
                style={liquorColor ? { backgroundColor: liquorColor } : undefined}
            >
                <Leaf className="size-5 opacity-40 sm:size-6" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <div>
                    <span className="text-[12px] text-black/60 dark:text-white/60 sm:text-[13px]">
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
                                className="rounded-full border border-black/15 px-[8px] py-[2px] text-[11px] leading-tight text-black/70 dark:border-white/15 dark:text-white/70 sm:text-[12px]"
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
