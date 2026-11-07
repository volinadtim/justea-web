import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import JournalScreen from "../components/features/JournalScreen";
import DataTransfer from "../components/features/DataTransfer";
import { TeaOption } from "../components/features/JournalForm";
import { getAllTeas } from "@/lib/teas";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
    ...createPageMetadata({
        title: "Дневник",
        description:
            "Записи о заваренных чаях: что, когда и как получилось. Хранится только в вашем браузере.",
        path: "/journal",
    }),
    // Страница личная и пустая для всех, кроме хозяина браузера:
    // в поиске ей делать нечего.
    robots: { index: false, follow: true },
};

export default function JournalPage() {
    const teas: TeaOption[] = getAllTeas().map((tea) => ({
        slug: tea.slug,
        name: tea.name,
        methods: tea.brewMethods.map((method) => ({
            id: method.id,
            name: method.name,
        })),
    }));

    return (
        <main>
            <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Дневник" }]} />

            <h1 className="mb-3 text-[36px] leading-none sm:mb-4 sm:text-[44px] lg:text-[50px]">
                Дневник
            </h1>
            <p className="mb-[32px] text-[19px] leading-[1.4]">
                Что заваривали и что получилось. Записи хранятся только в этом браузере:
                ни аккаунта, ни сервера.
            </p>

            <Suspense fallback={null}>
                <JournalScreen teas={teas} />
            </Suspense>

            <DataTransfer />
        </main>
    );
}
