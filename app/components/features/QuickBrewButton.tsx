"use client";

import { PlayIcon } from "lucide-react";

type Props = {
    label: string;
    onClick: () => void;
    className?: string;
};

/**
 * Запуск таймера из начала блока заваривания: один тап от открытия страницы
 * чая до идущего пролива. Вид — активная «пилюля» BrewMethodSwitcher.
 */
export default function QuickBrewButton({ label, onClick, className = "" }: Props) {
    return (
        <button
            type="button"
            className={`inline-flex min-h-11 shrink-0 items-center gap-[8px] rounded-full border-2 border-black bg-black px-4 text-[16px] text-white transition-colors hover:border-black/80 hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:border-white/80 dark:hover:bg-white/80 ${className}`}
            onClick={onClick}
        >
            <PlayIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            {label}
        </button>
    );
}
