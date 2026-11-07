import Link from "next/link";

type Variant = "primary" | "secondary";

type Props = {
    /** primary — «Записаться», secondary — переходное действие. */
    variant?: Variant;
    href?: string;
    children?: React.ReactNode;
    className?: string;
};

const VARIANT_CLASS: Record<Variant, string> = {
    primary:
        "border-black bg-black text-white hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/80",
    secondary:
        "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40",
};

/** Кнопка-ссылка на форму записи. */
export default function CeremonyCta({
    variant = "primary",
    href = "/ceremony#booking",
    children = "Записаться на церемонию",
    className = "",
}: Props) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center rounded-full border-2 px-[20px] py-[10px] text-[16px] transition-colors sm:px-[24px] sm:py-[12px] sm:text-[19px] ${VARIANT_CLASS[variant]} ${className}`}
        >
            {children}
        </Link>
    );
}
