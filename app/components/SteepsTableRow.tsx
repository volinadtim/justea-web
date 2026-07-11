"use client";

import React from "react";

type ValueComponentProps = {
    value: string | number;
    index: number;
};

function DefaultValueComponent({ value }: ValueComponentProps) {
    return (
        <div className="text-center font-comfortaa text-[14px] font-bold leading-none">
            {value}
        </div>
    );
}

type Props = {
    values: (string | number)[];
    icon: React.ComponentType<{ className?: string }>;
    valueComponent?: React.ComponentType<ValueComponentProps>;
};

function SteepsTableRow({ values, icon, valueComponent }: Props) {
    const Icon = icon;
    const ValueComponent = valueComponent ?? DefaultValueComponent;

    return (
        <div className="flex min-w-0 items-center gap-4 sm:gap-[33px]">
            <div className="shrink-0">
                <Icon />
            </div>
            <div className="-mx-1 flex min-w-0 flex-1 gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
                {values.map((value, index) => (
                    <div
                        className="w-[26px] shrink-0 basis-[26px] sm:w-[29px] sm:basis-[29px]"
                        key={index}
                    >
                        <ValueComponent value={value} index={index} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SteepsTableRow;
