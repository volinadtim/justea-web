import Link from "next/link";
import { CEREMONY_PRICE } from "@/app/ceremony/content";

type Props = {
    className?: string;
};

/**
 * Ненавязчивое упоминание церемонии — для страницы чая.
 * Одна строка текстом, без кнопки: не перебивает основной сценарий страницы.
 */
export default function CeremonyInlineCta({ className = "" }: Props) {
    return (
        <aside
            className={`border-t-2 border-black/10 pt-[16px] text-[16px] leading-[1.4] text-black/70 dark:border-white/10 dark:text-white/70 ${className}`}
        >
            Этот чай можно попробовать не в одиночку:{" "}
            <Link
                href="/ceremony#booking"
                className="underline underline-offset-2 hover:no-underline"
            >
                записаться на чайную церемонию
            </Link>{" "}
            — {CEREMONY_PRICE}.
        </aside>
    );
}
