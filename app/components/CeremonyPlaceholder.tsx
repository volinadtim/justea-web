import { PLACEHOLDERS, type PlaceholderKey } from "@/app/ceremony/content";

type Props = {
    item: PlaceholderKey;
    className?: string;
};

/**
 * Явная заглушка для данных, которых пользователь пока не дал.
 * Видна на странице намеренно: лучше честная дырка, чем выдуманный факт.
 * Список: docs/ceremony/open-questions.md
 */
export default function CeremonyPlaceholder({ item, className = "" }: Props) {
    return (
        <p
            className={`border-2 border-dashed border-black/30 p-[12px] text-[16px] leading-[1.35] text-black/60 dark:border-white/30 dark:text-white/60 ${className}`}
        >
            <span className="font-comfortaa text-[14px] tracking-wide uppercase">
                нужны данные
            </span>
            <br />
            {PLACEHOLDERS[item]}
        </p>
    );
}
