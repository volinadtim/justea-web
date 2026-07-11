"use client";

import { BrewMethod } from "@/types/tea";

type Props = {
    methods: BrewMethod[];
    activeId: string;
    onChange: (id: string) => void;
};

function buttonClass(isActive: boolean) {
    return [
        "shrink-0 rounded-full border-2 px-3 py-1.5 text-[14px] transition-colors sm:px-[14px] sm:py-[6px] sm:text-[16px]",
        isActive
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40",
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
