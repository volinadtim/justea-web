"use client";

import { HeartIcon } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

type Props = {
    slug: string;
    className?: string;
};

function subscribe(onChange: () => void) {
    window.addEventListener("justea-favorites-change", onChange);
    return () => window.removeEventListener("justea-favorites-change", onChange);
}

export default function FavoriteButton({ slug, className = "" }: Props) {
    // Избранное живёт в localStorage и меняется из любой карточки на странице —
    // это внешнее хранилище, а не состояние компонента.
    const getSnapshot = useCallback(() => isFavorite(slug), [slug]);
    const favorite = useSyncExternalStore(subscribe, getSnapshot, () => false);

    return (
        <button
            type="button"
            aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
            aria-pressed={favorite}
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${className}`}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleFavorite(slug);
            }}
        >
            <HeartIcon
                className="size-5"
                fill={favorite ? "currentColor" : "none"}
            />
        </button>
    );
}
