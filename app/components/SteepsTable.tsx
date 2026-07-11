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
        <div
            className={`flex flex-col gap-1 rounded-md px-[2px] py-[2px] ${
                isActive ? "bg-main-300" : ""
            }`}
        >
            <div className="text-center font-comfortaa text-[19px] font-bold leading-none">
                {value}
            </div>
            <span className="text-center text-[14px] leading-none">сек</span>
        </div>
    );
}

export default function SteepsTable({ steeps, activeIndex = null }: Props) {
    return (
        <div className="flex flex-1 flex-col gap-[15px]">
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
