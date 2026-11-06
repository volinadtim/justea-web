import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeaDescription from "../components/TeaDescription";
import TeaTypeLink from "../components/TeaTypeLink";
import TeaBrewSection from "../components/TeaBrewSection";
import RowAdvertisement from "../components/Advertisement/RowAdvertisement";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import RecentTeaTracker from "../components/RecentTeaTracker";
import JsonLd from "../components/seo/JsonLd";
import { teaPageSchema } from "../components/seo/schema";
import {
    getAllTeas,
    getPrimaryBrewMethod,
    getTeaBySlug,
    TEA_TYPE_LABELS,
} from "@/lib/teas";
import { teaTypePath } from "@/lib/tea-type-pages";
import { createPageMetadata } from "@/lib/metadata";
import type { Tea } from "@/types/tea";

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Description под сниппет: сначала конкретика, которую и ищут (граммовка,
 * температура, число проливов), затем описание сорта. Обрезаем по 160 символам
 * — дальше Google и Яндекс всё равно ставят многоточие.
 */
function teaMetaDescription(tea: Tea): string {
    const method = getPrimaryBrewMethod(tea);
    const facts = method
        ? `${tea.name}: ${method.ratio} г на 100 мл, вода ${
              method.temperature.from === method.temperature.to
                  ? `${method.temperature.from}`
                  : `${method.temperature.from}–${method.temperature.to}`
          } °C, ${method.infusions.length} ${pluralInfusions(method.infusions.length)}.`
        : `${tea.name}.`;
    const full = [facts, tea.description].filter(Boolean).join(" ");

    if (full.length <= 160) {
        return full;
    }

    const cut = full.slice(0, 157);

    return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function pluralInfusions(n: number): string {
    const mod100 = n % 100;
    const mod10 = n % 10;

    if (mod100 >= 11 && mod100 <= 14) return "проливов";
    if (mod10 === 1) return "пролив";
    if (mod10 >= 2 && mod10 <= 4) return "пролива";

    return "проливов";
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
        // Название сорта + то, что ищут вместе с ним.
        title: `${tea.name} — как заваривать: проливы, температура, пропорции`,
        description: teaMetaDescription(tea),
        path: `/${tea.slug}`,
        // Размеры фото сорта не указываем: они разные и не 1200×630,
        // а врать краулеру о размере хуже, чем не сообщать его.
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

    const crumbs = [
        { label: "Главная", href: "/" },
        { label: TEA_TYPE_LABELS[tea.type], href: teaTypePath(tea.type) },
        { label: tea.name },
    ];

    return (
        <div className="">
            <JsonLd data={teaPageSchema(tea, crumbs)} />
            <RecentTeaTracker slug={tea.slug} />
            <main>
                <Breadcrumbs items={crumbs} />

                <div className="mb-1 flex min-w-0 items-center justify-between gap-3">
                    <TeaTypeLink type={tea.type} />
                    <FavoriteButton slug={tea.slug} />
                </div>

                <h1 className="mb-3 text-[36px] leading-none sm:mb-4 sm:text-[44px] lg:text-[50px]">
                    {tea.name}
                </h1>

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
