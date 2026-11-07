import Hero from "./components/Hero";
import TeaCard from "./components/TeaCard";
import TeaTypeFilter from "./components/TeaTypeFilter";
import RecentTeasSection from "./components/RecentTeasSection";
import FavoriteTeasSection from "./components/FavoriteTeasSection";
import BrewAgainSection from "./components/features/BrewAgainSection";
import JournalSection from "./components/features/JournalSection";
import { filterTeasByType, isTeaType } from "@/lib/teas";
import { TeaType } from "@/types/tea";

interface HomeProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
    const { type: typeParam } = await searchParams;
    const activeType: TeaType | undefined =
        typeParam && isTeaType(typeParam) ? typeParam : undefined;
    const teas = filterTeasByType(activeType);

    return (
        <main>
            <Hero />
            <BrewAgainSection />
            <JournalSection />
            <RecentTeasSection />
            <FavoriteTeasSection />
            <TeaTypeFilter activeType={activeType} />

            {teas.length > 0 ? (
                <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                    {teas.map((tea) => (
                        <TeaCard key={tea.id} tea={tea} />
                    ))}
                </div>
            ) : (
                <p className="text-[19px]">Чаи этого типа пока нет в справочнике.</p>
            )}
        </main>
    );
}
