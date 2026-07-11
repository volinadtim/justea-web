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
        <div className="flex items-center gap-[33px]">
            <div>
                <Icon />
            </div>
            <div className="flex gap-[16px]">
                {values.map((value, index) => (
                    <div className="w-[29px] shrink basis-[29px]" key={index}>
                        <ValueComponent value={value} index={index} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SteepsTableRow;
