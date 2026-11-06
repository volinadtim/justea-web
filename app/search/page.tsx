import type { Metadata } from "next";
import TeaCard from "../components/TeaCard";
import { createPageMetadata } from "@/lib/metadata";
import { searchTeas } from "@/lib/search";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
    searchParams,
}: SearchPageProps): Promise<Metadata> {
    const { q } = await searchParams;
    const query = q?.trim();

    // Страницы поиска закрыты от индексации: `?q=` — бесконечное
    // пространство обхода и чистый thin content. `follow` оставляем, чтобы
    // краулер шёл по ссылкам на карточки чая.
    // Canonical у всех вариантов один — `/search` без параметров.
    if (!query) {
        return createPageMetadata({
            title: "Поиск по справочнику чая",
            description:
                "Поиск чая по названию, типу и вкусовым характеристикам в справочнике Justea.",
            path: "/search",
            noindex: true,
        });
    }

    return createPageMetadata({
        title: `Поиск: ${query}`,
        path: "/search",
        noindex: true,
    });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q?.trim() ?? "";
    const results = query ? searchTeas(query) : [];

    return (
        <main>
            <h1 className="mb-5 text-[36px] leading-none sm:text-[44px] lg:text-[50px]">
                Поиск
            </h1>

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
