"use client";

import { useEffect, useState } from "react";
import TeaCard from "./TeaCard";
import { getTeaBySlug } from "@/lib/teas";
import { getRecentTeas } from "@/lib/recent-teas";
import { Tea } from "@/types/tea";

export default function RecentTeasSection() {
    const [teas, setTeas] = useState<Tea[]>([]);

    useEffect(() => {
        function loadRecent() {
            const recentTeas = getRecentTeas()
                .map((item) => getTeaBySlug(item.slug))
                .filter((tea): tea is Tea => Boolean(tea));

            setTeas(recentTeas);
        }

        loadRecent();
        window.addEventListener("justea-recent-teas-change", loadRecent);
        return () => window.removeEventListener("justea-recent-teas-change", loadRecent);
    }, []);

    if (teas.length === 0) {
        return null;
    }

    return (
        <section className="mb-[40px]">
            <h2 className="mb-[20px] text-[28px] leading-none">Недавно просмотренные</h2>
            <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                {teas.map((tea) => (
                    <TeaCard key={tea.id} tea={tea} />
                ))}
            </div>
        </section>
    );
}
