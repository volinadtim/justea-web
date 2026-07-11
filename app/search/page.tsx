import type { Metadata } from "next";
import TeaCard from "../components/TeaCard";
import { searchTeas } from "@/lib/search";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
    searchParams,
}: SearchPageProps): Promise<Metadata> {
    const { q } = await searchParams;
    const query = q?.trim();

    if (!query) {
        return { title: "Поиск — Justea" };
    }

    return {
        title: `Поиск: ${query} — Justea`,
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q?.trim() ?? "";
    const results = query ? searchTeas(query) : [];

    return (
        <main>
            <h1 className="mb-[20px] text-[50px] leading-none">Поиск</h1>

            {!query && (
                <p className="text-[19px]">Введите запрос в строке поиска выше.</p>
            )}

            {query && results.length > 0 && (
                <>
                    <p className="mb-[32px] text-[19px]">
                        Найдено: {results.length} по запросу «{query}»
                    </p>
                    <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                        {results.map((tea) => (
                            <TeaCard key={tea.id} tea={tea} />
                        ))}
                    </div>
                </>
            )}

            {query && results.length === 0 && (
                <p className="text-[19px]">
                    Ничего не найдено по запросу «{query}».
                </p>
            )}
        </main>
    );
}
