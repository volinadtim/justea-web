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
import { brewOutcomesFor, misconceptionsFor } from "@/lib/tea-type-facts";
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
    const temperature = method
        ? method.temperature.from === method.temperature.to
            ? `${method.temperature.from}`
            : `${method.temperature.from}–${method.temperature.to}`
        : "";
    const infusions = method?.infusions ?? [];
    // У взбивания проливов нет, и «0 проливов» в сниппете было бы ошибкой,
    // а не недомолвкой. Для матчи конкретика другая: сколько порошка и воды.
    const facts = !method
        ? `${tea.name}.`
        : infusions.length
          ? `${tea.name}: ${method.ratio} г на 100 мл, вода ${temperature} °C, ${
                infusions.length
            } ${pluralInfusions(infusions.length)}.`
          : `${tea.name}: ${method.ratio} г на 100 мл, вода ${temperature} °C.`;
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

    const brewOutcomes = brewOutcomesFor(tea);
    const misconceptions = misconceptionsFor(tea);

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

                {/*
                    Что меняет вкус и частые заблуждения.

                    Два отдельных блока, а не один, и это разделение намеренное.
                    Первый отвечает на то, отчего вкус вышел другим («больше
                    листа — настой крепче»); второй — на то, во что читатель
                    верит («бывает рассыпной шэн-пуэр»). Под одним заголовком
                    рядом оказались бы «больше листа — настой крепче» и
                    «Бин Дао из Линьцана, а не из Сишуанбаньны».

                    Заголовок не «Типичные ошибки», и это не смягчение
                    формулировки. Cao 2022 измерил: рекомендованная навеска
                    различается в 1,7 раза между редко пьющим и ежедневным, и
                    обе названы рекомендуемыми. Назвать «больше листа» ошибкой
                    значило бы противоречить измерению. Здесь же живёт запись
                    тёмного чая «долго и горячо — норма», которая под
                    заголовком «ошибки» опровергала бы сама себя.

                    Оба блока собираются из `data/tea-types.json` (общее для
                    всех чаёв и для категории) и из полей сорта. Контейнер
                    пуст, поэтому блоки не выводятся — это нормальное
                    состояние, а не ошибка: фактуру даёт justea-sources.

                    В разметку не выводится. У `HowTo` нет узла «чего не
                    делать», а натягивать это на шаги инструкции значило бы
                    заявить краулеру, что взять больше листа — шаг рецепта.
                */}
                {brewOutcomes.length > 0 && (
                    <section className="mt-[40px]">
                        <h2 className="mb-3 text-[28px] leading-none sm:text-[34px] lg:text-[37px]">
                            Что меняет вкус
                        </h2>
                        <ul className="list-disc space-y-[8px] pl-[20px] text-[16px]">
                            {brewOutcomes.map((item) => (
                                <li key={item.change}>
                                    {item.change}. {item.consequence}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {misconceptions.length > 0 && (
                    <section className="mt-[40px]">
                        <h2 className="mb-3 text-[28px] leading-none sm:text-[34px] lg:text-[37px]">
                            Частые заблуждения
                        </h2>
                        <ul className="list-disc space-y-[8px] pl-[20px] text-[16px]">
                            {misconceptions.map((item) => (
                                <li key={item.claim}>
                                    «{item.claim}» — {item.correction}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/*
                    Сноска-предосторожность. Решение пользователя 06.11.2026:
                    о пользе и вреде чая не пишем вовсе, вместо раздела о
                    здоровье — одна обоснованная фраза у тех чаёв, где она
                    есть. Поэтому у большинства сортов блока нет, и это норма.

                    Стоит после заваривания и до рекламы: сноска относится ко
                    всей странице, а не к способу заваривания, и показывать её
                    после рекламного блока значило бы спрятать.

                    Оформление — существующее служебное: те же классы, что у
                    `tea.meta.origin` выше и у заметок в `TeaBrewSection`;
                    своих стилей агент не вводит (решение пользователя,
                    inbox #2). В §6 `docs/seo/content-briefs.md` этот блок
                    описан как «врезка-предупреждение» — визуально отличимая
                    от обычного абзаца, но не агрессивная. Такого элемента в
                    проекте нет, и придумывать его я не вправе: решение за
                    justea-design, когда у него будет референс. Разметка и
                    место при этом не изменятся, поменяются только классы.

                    В JSON-LD не выводится сознательно — см. `TeaCaution`.
                */}
                {tea.caution && (
                    <p className="mt-[32px] text-[16px] text-black/70 dark:text-white/70">
                        {tea.caution.text}
                    </p>
                )}

                <RowAdvertisement />
            </main>
        </div>
    );
}
