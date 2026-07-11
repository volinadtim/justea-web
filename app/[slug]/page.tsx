import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeaDescription from "../components/TeaDescription";
import TeaTypeLink from "../components/TeaTypeLink";
import TeaBrewSection from "../components/TeaBrewSection";
import RowAdvertisement from "../components/Advertisement/RowAdvertisement";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import RecentTeaTracker from "../components/RecentTeaTracker";
import {
    getAllTeas,
    getPrimaryBrewMethod,
    getTeaBySlug,
    TEA_TYPE_LABELS,
} from "@/lib/teas";
import { createPageMetadata } from "@/lib/metadata";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return getAllTeas().map((tea) => ({ slug: tea.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tea = getTeaBySlug(slug);

    if (!tea) {
        return {};
    }

    return createPageMetadata({
        title: tea.name,
        description: tea.description,
        path: `/${tea.slug}`,
        image: tea.photo ?? undefined,
    });
}

export default async function TeaPage({ params }: PageProps) {
    const { slug } = await params;
    const tea = getTeaBySlug(slug);

    if (!tea) {
        notFound();
    }

    const primaryBrewMethod = getPrimaryBrewMethod(tea);

    if (!primaryBrewMethod) {
        notFound();
    }

    return (
        <div className="">
            <RecentTeaTracker slug={tea.slug} />
            <main>
                <Breadcrumbs
                    items={[
                        { label: "Главная", href: "/" },
                        {
                            label: TEA_TYPE_LABELS[tea.type],
                            href: `/?type=${tea.type}`,
                        },
                        { label: tea.name },
                    ]}
                />

                <div className="mb-1 flex items-center justify-between gap-4">
                    <TeaTypeLink type={tea.type} />
                    <FavoriteButton slug={tea.slug} />
                </div>

                <h1 className="mb-[16px] text-[50px] leading-none">{tea.name}</h1>

                {tea.meta.origin && (
                    <p className="mb-[20px] text-[19px] text-black/70 dark:text-white/70">
                        {tea.meta.origin}
                    </p>
                )}

                {tea.description && (
                    <p className="mb-[40px] text-[19px] leading-[1.4]">{tea.description}</p>
                )}

                <TeaDescription
                    className="mb-[40px]"
                    aroma={tea.characteristics.aroma}
                    taste={tea.characteristics.flavor}
                    aftertaste={tea.characteristics.aftertaste}
                />

                <TeaBrewSection
                    brewMethods={tea.brewMethods}
                    defaultMethodId={primaryBrewMethod.id}
                />

                <RowAdvertisement />
            </main>
        </div>
    );
}
