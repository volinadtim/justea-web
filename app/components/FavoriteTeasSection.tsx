"use client";

import { useEffect, useState } from "react";
import TeaCard from "./TeaCard";
import { getFavoriteSlugs } from "@/lib/favorites";
import { getTeaBySlug } from "@/lib/teas";
import { Tea } from "@/types/tea";

export default function FavoriteTeasSection() {
    const [teas, setTeas] = useState<Tea[]>([]);

    useEffect(() => {
        function loadFavorites() {
            const favoriteTeas = getFavoriteSlugs()
                .map((slug) => getTeaBySlug(slug))
                .filter((tea): tea is Tea => Boolean(tea));

            setTeas(favoriteTeas);
        }

        loadFavorites();
        window.addEventListener("justea-favorites-change", loadFavorites);
        return () => window.removeEventListener("justea-favorites-change", loadFavorites);
    }, []);

    if (teas.length === 0) {
        return null;
    }

    return (
        <section className="mb-8 sm:mb-10">
            <h2 className="mb-4 text-[24px] leading-none sm:mb-5 sm:text-[28px]">Избранное</h2>
            <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                {teas.map((tea) => (
                    <TeaCard key={tea.id} tea={tea} />
                ))}
            </div>
        </section>
    );
}
