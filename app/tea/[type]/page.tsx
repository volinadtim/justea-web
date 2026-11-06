import type { Metadata } from "next";
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
import { filterTeasByType, getAvailableTeaTypes } from "@/lib/teas";

interface PageProps {
    params: Promise<{ type: string }>;
}

/**
 * Только типы, для которых в каталоге есть хотя бы один чай: страница без
 * товаров — это thin content, в индекс ей не надо. Остальные отдают 404, пока
 * чай не появится; при появлении страница возникает со следующей сборкой.
 */
export async function generateStaticParams() {
    return getAvailableTeaTypes().map((type) => ({ type }));
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

    if (teas.length === 0) {
        notFound();
    }

    const page = TEA_TYPE_PAGES[type];
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

            <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                {teas.map((tea) => (
                    <TeaCard key={tea.id} tea={tea} />
                ))}
            </div>
        </main>
    );
}
