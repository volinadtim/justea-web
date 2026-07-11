import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeaDescription from "../components/TeaDescription";
import TeaTypeLink from "../components/TeaTypeLink";
import SteepsTable from "../components/SteepsTable";
import BrewInfo from "../components/BrewInfo";
import RowAdvertisement from "../components/Advertisement/RowAdvertisement";
import Breadcrumbs from "../components/Breadcrumbs";
import {
    getAllTeas,
    getPrimaryBrewMethod,
    getTeaBySlug,
    TEA_TYPE_LABELS,
} from "@/lib/teas";

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

    return {
        title: `${tea.name} — Justea`,
        description: tea.description,
    };
}

export default async function TeaPage({ params }: PageProps) {
    const { slug } = await params;
    const tea = getTeaBySlug(slug);

    if (!tea) {
        notFound();
    }

    const brewMethod = getPrimaryBrewMethod(tea);

    if (!brewMethod) {
        notFound();
    }

    const temperature = Math.round(
        (brewMethod.temperature.from + brewMethod.temperature.to) / 2
    );
    const steeps = brewMethod.infusions.map((infusion) => infusion.time);

    return (
        <div className="">
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

                <div className="mb-1">
                    <TeaTypeLink type={tea.type} />
                </div>

                <h1 className="text-[50px] mb-[45px]">{tea.name}</h1>
                <TeaDescription
                    className="mb-[40px]"
                    aroma={tea.characteristics.aroma}
                    taste={tea.characteristics.flavor}
                />

                <h2 className="text-[37px] mb-[33px]">Как заваривать проливами</h2>

                <div className="flex gap-[14px]">
                    <BrewInfo temperature={temperature} ratio={brewMethod.ratio} />
                    <SteepsTable steeps={steeps} />
                </div>

                <RowAdvertisement />
            </main>
        </div>
    );
}
