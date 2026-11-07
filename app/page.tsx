import type { Metadata } from "next";
import Hero from "./components/Hero";
import TeaCard from "./components/TeaCard";
import TeaTypeFilter from "./components/TeaTypeFilter";
import RecentTeasSection from "./components/RecentTeasSection";
import FavoriteTeasSection from "./components/FavoriteTeasSection";
import JsonLd from "./components/seo/JsonLd";
import { teaTypeListSchema } from "./components/seo/schema";
import { getAllTeas } from "@/lib/teas";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import { toTeaCardData } from "@/lib/plain-text";

/**
 * TODO(voice): временный вариант под ключ «как заваривать чай». Оркестратору
 * отправлены три варианта H1 на утверждение — после ответа заменить здесь и
 * в `Hero`.
 */
const HOME_HEADING = "Как заваривать чай: проливы, температура, пропорции";
const HOME_DESCRIPTION =
    "Справочник по завариванию чая: сколько грамм на 100 мл, температура воды и время каждого пролива — для зелёного, чёрного, белого и жёлтого чая, улунов и пуэров.";

export const metadata: Metadata = {
    ...createPageMetadata({
        title: HOME_HEADING,
        description: HOME_DESCRIPTION,
        path: "/",
    }),
    // На главной шаблон `%s — Justea` не нужен: title уже самодостаточный.
    title: {
        absolute: "Justea — как заваривать чай: проливы, температура, пропорции",
    },
};

export default function Home() {
    const teas = getAllTeas();

    return (
        <main>
            <JsonLd
                data={teaTypeListSchema({
                    pageUrl: absoluteUrl("/"),
                    name: HOME_HEADING,
                    description: HOME_DESCRIPTION,
                    teas,
                })}
            />

            <Hero />
            <RecentTeasSection />
            <FavoriteTeasSection />
            <TeaTypeFilter />

            {teas.length > 0 ? (
                <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                    {teas.map((tea) => (
                        <TeaCard key={tea.id} tea={toTeaCardData(tea)} />
                    ))}
                </div>
            ) : (
                <p className="text-[19px]">Чаи этого типа пока нет в справочнике.</p>
            )}
        </main>
    );
}
