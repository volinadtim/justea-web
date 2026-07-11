"use client";

import { HashIcon, TimerIcon } from "lucide-react";
import SteepsTableRow from "./SteepsTableRow";

type Props = {
    steeps: number[];
    activeIndex?: number | null;
};

const STEEP_NUMBERS = ["一", "二", "三", "四", "五", "六"];

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
                values={STEEP_NUMBERS.slice(0, steeps.length)}
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
