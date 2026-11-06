"use client";

import { BrewMethod } from "@/types/tea";

type Props = {
    methods: BrewMethod[];
    activeId: string;
    onChange: (id: string) => void;
};

function buttonClass(isActive: boolean) {
    return [
        "inline-flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 text-[14px] transition-colors sm:px-[18px] sm:text-[16px]",
        isActive
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-line hover:border-line-strong",
    ].join(" ");
}

export default function BrewMethodSwitcher({ methods, activeId, onChange }: Props) {
    if (methods.length <= 1) {
        return null;
    }

    return (
        <div
            role="tablist"
            aria-label="Способ заваривания"
            className="mb-6 flex flex-wrap gap-2 sm:mb-[24px] sm:gap-[8px]"
        >
            {methods.map((method) => (
                <button
                    key={method.id}
                    type="button"
                    role="tab"
                    aria-selected={activeId === method.id}
                    className={buttonClass(activeId === method.id)}
                    onClick={() => onChange(method.id)}
                >
                    {method.name}
                </button>
            ))}
        </div>
    );
}
