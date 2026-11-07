import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "../../components/Breadcrumbs";
import TeaCard from "../../components/TeaCard";
import TeaTypeFilter from "../../components/TeaTypeFilter";
import JsonLd from "../../components/seo/JsonLd";
import { teaTypeListSchema } from "../../components/seo/schema";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import {
    isKnownTeaTypePage,
    TEA_TYPE_PAGES,
    teaTypeLabel,
    teaTypePath,
} from "@/lib/tea-type-pages";
import { filterTeasByType, getAvailableTeaTypes, TEA_TYPES } from "@/lib/teas";
import { toTeaCardData } from "@/lib/plain-text";

interface PageProps {
    params: Promise<{ type: string }>;
}

/**
 * Страницы есть у всех типов, даже если в каталоге нет ни одного такого чая.
 *
 * На этапе 1 страница зависела от каталога (нет чаёв → 404), потому что пустой
 * листинг — это thin content. Семантическое ядро показало, что посылка была
 * неверной: странице типа листинг не нужен, её закрывает руководство по
 * завариванию. У пуэра информационный спрос ~510 (`type-puerh` 171 +
 * `brewing-howto` с `связанный_тип=puerh` 339) — «как заваривать шу пуэр в
 * таблетках», «температура шен пуэра», «нужно ли промывать лист». Ответ на
 * это не требует ни одного сорта в каталоге.
 *
 * Подробнее — docs/seo/site-structure.md §3.
 */
export async function generateStaticParams() {
    return TEA_TYPES.map((type) => ({ type }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { type } = await params;

    if (!isKnownTeaTypePage(type)) {
        return {};
    }

    const page = TEA_TYPE_PAGES[type];

    return {
        ...createPageMetadata({
            title: page.title,
            description: page.description,
            path: teaTypePath(type),
        }),
        title: { absolute: `${page.title} — Justea` },
    };
}

export default async function TeaTypePage({ params }: PageProps) {
    const { type } = await params;

    if (!isKnownTeaTypePage(type)) {
        notFound();
    }

    const teas = filterTeasByType(type);
    const page = TEA_TYPE_PAGES[type];
    const filledTypes =
        teas.length === 0
            ? getAvailableTeaTypes().filter((filled) => filled !== type)
            : [];
    const crumbs = [
        { label: "Главная", href: "/" },
        { label: teaTypeLabel(type) },
    ];

    return (
        <main>
            <JsonLd
                data={teaTypeListSchema({
                    pageUrl: absoluteUrl(teaTypePath(type)),
                    name: page.heading,
                    description: page.description,
                    crumbs,
                    teas,
                })}
            />

            <Breadcrumbs items={crumbs} />

            <h1 className="mb-3 text-[36px] leading-none sm:mb-4 sm:text-[44px] lg:text-[50px]">
                {page.heading}
            </h1>
            <p className="mb-8 text-[19px] leading-[1.4] sm:mb-10">{page.intro}</p>

            <TeaTypeFilter activeType={type} />

            {teas.length > 0 ? (
                <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                    {teas.map((tea) => (
                        <TeaCard key={tea.id} tea={toTeaCardData(tea)} />
                    ))}
                </div>
            ) : (
                // Тупик без выхода выглядит как ошибка, даже когда страница
                // полезна краулеру: даём ссылки на типы, где сорта есть
                // (нашёл justea-design 06.11.2026).
                <div className="text-[19px] leading-[1.4]">
                    <p className="mb-3">
                        Отдельных сортов этого типа в справочнике пока нет —
                        всё, что нужно для заваривания, в тексте выше.
                    </p>
                    {filledTypes.length > 0 && (
                        <p>
                            Сорта с разобранными проливами есть у других типов:{" "}
                            {filledTypes.map((filled, index) => (
                                <span key={filled}>
                                    {index > 0 && ", "}
                                    <Link
                                        href={teaTypePath(filled)}
                                        className="underline underline-offset-2"
                                    >
                                        {teaTypeLabel(filled).toLowerCase()}
                                    </Link>
                                </span>
                            ))}
                            .
                        </p>
                    )}
                </div>
            )}
        </main>
    );
}
