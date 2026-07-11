"use client";

import { HeartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

type Props = {
    slug: string;
    className?: string;
};

export default function FavoriteButton({ slug, className = "" }: Props) {
    const [favorite, setFavorite] = useState(false);

    useEffect(() => {
        setFavorite(isFavorite(slug));

        function handleChange() {
            setFavorite(isFavorite(slug));
        }

        window.addEventListener("justea-favorites-change", handleChange);
        return () => window.removeEventListener("justea-favorites-change", handleChange);
    }, [slug]);

    return (
        <button
            type="button"
            aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
            aria-pressed={favorite}
            className={`rounded-full p-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${className}`}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setFavorite(toggleFavorite(slug));
            }}
        >
            <HeartIcon
                className="size-5"
                fill={favorite ? "currentColor" : "none"}
            />
        </button>
    );
}
