"use client";

import Link from "next/link";

type Props = {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    /** Если задан, кнопка становится ссылкой — вид тот же. */
    href?: string;
    variant?: "primary" | "secondary";
    className?: string;
};

const VARIANT_CLASS: Record<"primary" | "secondary", string> = {
    primary:
        "border-black bg-black text-white hover:border-black/80 hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:border-white/80 dark:hover:bg-white/80",
    secondary:
        "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40",
};

/**
 * Кнопки над схемой пролива: запуск таймера и полноэкранный режим.
 * Вид — «пилюля» BrewMethodSwitcher, активная и обычная, с целью 44 px.
 */
export default function QuickBrewButton({
    label,
    icon,
    onClick,
    href,
    variant = "primary",
    className = "",
}: Props) {
    const classes = `inline-flex min-h-11 shrink-0 items-center gap-[8px] rounded-full border-2 px-4 text-[16px] transition-colors ${VARIANT_CLASS[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={classes}>
                {icon}
                {label}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} onClick={onClick}>
            {icon}
            {label}
        </button>
    );
}
