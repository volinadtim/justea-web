"use client";

import { HashIcon, TimerIcon } from "lucide-react";
import SteepsTableRow from "./SteepsTableRow";

type Props = {
    steeps: number[];
    activeIndex?: number | null;
};

/**
 * Китайские цифры для нумерации проливов.
 *
 * Раньше это был массив ровно из шести значений, и седьмой пролив молча
 * оставался без номера. Для гунфу-ча пуэра это не теория: там обычно
 * 8–10 проливов.
 *
 * Выше десяти китайская запись становится составной (十一, 十二) и в ячейку
 * шириной 26 px не помещается, поэтому с одиннадцатого переходим на арабские
 * цифры — лучше читаемый номер, чем обрезанный иероглиф.
 */
const CHINESE_NUMERALS = [
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
];

function steepNumber(index: number): string {
    return CHINESE_NUMERALS[index] ?? String(index + 1);
}

function SteepTimeDisplay({
    value,
    isActive,
}: {
    value: number;
    isActive: boolean;
}) {
    return (
        <div className="relative flex flex-col gap-1 px-[2px] py-[2px]">
            {isActive ? (
                <span
                    aria-hidden
                    className="absolute -inset-x-[8px] -inset-y-[6px] rounded-md bg-neutral-700/25 dark:bg-neutral-500/40"
                />
            ) : null}
            <div className="relative text-center font-comfortaa text-[19px] font-bold leading-none">
                {value}
            </div>
            <span className="relative text-center text-[14px] leading-none">сек</span>
        </div>
    );
}

export default function SteepsTable({ steeps, activeIndex = null }: Props) {
    return (
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-[15px]">
            <SteepsTableRow
                icon={HashIcon}
                values={steeps.map((_, index) => steepNumber(index))}
            />
            <SteepsTableRow
                icon={TimerIcon}
                values={steeps}
                valueComponent={({ value, index }) => (
                    <SteepTimeDisplay
                        value={value as number}
                        isActive={activeIndex === index}
                    />
                )}
            />
        </div>
    );
}
