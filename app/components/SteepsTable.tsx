"use client";

import { HashIcon, TimerIcon } from "lucide-react";
import SteepsTableRow from "./SteepsTableRow";

type Props = {
    steeps: number[];
    onSteepsChange?: (steeps: number[]) => void;
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

function EditableSteepTime({
    value,
    isActive,
    onChange,
}: {
    value: number;
    isActive: boolean;
    onChange: (value: number) => void;
}) {
    return (
        <div
            className={`flex flex-col items-center gap-1 rounded-md px-[2px] py-[2px] ${
                isActive ? "bg-main-300" : ""
            }`}
        >
            <input
                type="number"
                min={1}
                max={3600}
                value={value}
                aria-label="Время пролива в секундах"
                className="w-[40px] bg-transparent text-center font-comfortaa text-[19px] font-bold leading-none"
                onChange={(event) => {
                    const nextValue = Number.parseInt(event.target.value, 10);
                    onChange(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1);
                }}
            />
            <span className="text-center text-[14px] leading-none">сек</span>
        </div>
    );
}

export default function SteepsTable({ steeps, onSteepsChange, activeIndex = null }: Props) {
    const isEditable = Boolean(onSteepsChange);

    function updateSteep(index: number, value: number) {
        if (!onSteepsChange) {
            return;
        }

        const nextSteeps = [...steeps];
        nextSteeps[index] = value;
        onSteepsChange(nextSteeps);
    }

    return (
        <div className="flex flex-1 flex-col gap-[15px]">
            <SteepsTableRow
                icon={HashIcon}
                values={STEEP_NUMBERS.slice(0, steeps.length)}
            />
            <SteepsTableRow
                icon={TimerIcon}
                values={steeps}
                valueComponent={({ value, index }) => {
                    const steepValue = value as number;

                    return isEditable ? (
                        <EditableSteepTime
                            value={steepValue}
                            isActive={activeIndex === index}
                            onChange={(nextValue) => updateSteep(index, nextValue)}
                        />
                    ) : (
                        <SteepTimeDisplay
                            value={steepValue}
                            isActive={activeIndex === index}
                        />
                    );
                }}
            />
        </div>
    );
}
