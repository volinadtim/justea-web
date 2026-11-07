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
import { brewOutcomesFor } from "@/lib/tea-type-facts";
import { formatRatio } from "@/lib/format-number";
import { createPageMetadata } from "@/lib/metadata";
import type { Tea } from "@/types/tea";
import { hasApparatus, plainBrewMethods } from "@/lib/plain-text";

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
    /*
     * У взбивания проливов нет, и «0 проливов» в сниппете было бы ошибкой, а
     * не недомолвкой.
     *
     * Навеску у взбивания тоже не выводим, и это не упрощение. У матчи
     * навесок две, и они расходятся более чем в пять раз: 2,4 г/100 мл у
     * усучи против 13,3 у коичи. Поле `ratio` у способа одно, то есть любое
     * выбранное число будет неверным для второго стиля. Сниппет короткий, в
     * нём негде оговорить, какой стиль имеется в виду, — лучше не называть
     * числа вовсе, чем назвать одно из двух. К тому же с правки justea-design
     * (PR #27) навеска у взбивания не показывается и на самой странице.
     */
    const facts =
        !method || method.ratio === undefined || !infusions.length
            ? method
                ? `${tea.name}: вода ${temperature} °C.`
                : `${tea.name}.`
            : `${tea.name}: ${formatRatio(method.ratio)}, вода ${temperature} °C, ${
                  infusions.length
              } ${pluralInfusions(infusions.length)}.`;
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

    /*
     * Способов заваривания может не быть ни одного — у чая, для которого
     * проверенных параметров пока нет.
     *
     * **Раньше здесь стоял `notFound()`,** то есть такой чай отдавал бы 404.
     * Это не срабатывало только потому, что валидатор требовал хотя бы один
     * способ — и тем самым заставлял выдумывать параметры. Убрав требование,
     * надо было убрать и эту ветку, иначе первая же честная запись исчезла
     * бы из выдачи вместе со всем, что про неё известно.
     */
    const primaryBrewMethod = getPrimaryBrewMethod(tea);

    const brewOutcomes = brewOutcomesFor(tea).filter(
        (item) => !hasApparatus(item.change) && !hasApparatus(item.consequence),
    );

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

                {/*
                    Регион — одной строкой.

                    Сорта куста здесь больше нет. Решение пользователя
                    07.11.2026: «сорт куста не очень понятно зачем, как будто
                    он вообще не нужен тут нигде ни для какого чая». Поле
                    остаётся в `data/teas.json`, на страницу не выводится — и
                    из разметки убрано вместе со строкой, потому что заявлять
                    в JSON-LD то, чего читатель не видит, нельзя.
                */}
                {tea.meta.origin && (
                    <p className="mb-[20px] text-[19px] text-black/70 dark:text-white/70">
                        {tea.meta.origin}
                    </p>
                )}

                {tea.description && (
                    <p className="mb-[40px] text-[19px] leading-[1.4]">{tea.description}</p>
                )}

                {/*
                    Связный текст по характеристикам — после списка
                    дескрипторов. Одно другого не заменяет: список слов нельзя
                    прочитать, а из абзаца нельзя собрать `PropertyValue`.
                    В разметку не выводим, чтобы не заявить одно дважды.
                */}
                <TeaDescription
                    className={
                        tea.characteristicsText || tea.characteristicsScope
                            ? "mb-[20px]"
                            : "mb-[40px]"
                    }
                    aroma={tea.characteristics.aroma}
                    taste={tea.characteristics.flavor}
                    aftertaste={tea.characteristics.aftertaste}
                />

                {tea.characteristicsScope && (
                    <p
                        className={
                            "text-[17px] leading-[1.4] sm:text-[19px] " +
                            (tea.characteristicsText ? "mb-[12px]" : "mb-[40px]")
                        }
                    >
                        {tea.characteristicsScope}
                    </p>
                )}

                {tea.characteristicsText && (
                    <p className="mb-[40px] text-[17px] leading-[1.4] sm:text-[19px]">
                        {tea.characteristicsText}
                    </p>
                )}

                {/*
                    Если проверенных параметров нет, блок не показываем — но и
                    не молчим.

                    Молчание здесь выглядит поломкой: у всех остальных чаёв на
                    этом месте главный блок страницы, и его исчезновение
                    читается как «сайт не догрузился», а не как «мы не знаем».
                    Это отличается от пустой рубрики в характеристиках, где
                    отсутствие строки незаметно.

                    TODO(voice): формулировку даёт justea-voice. Здесь
                    рабочая — она не должна обещать, что параметры появятся,
                    и не должна извиняться.
                */}
                {primaryBrewMethod ? (
                    <TeaBrewSection
                        brewMethods={plainBrewMethods(tea.brewMethods ?? [])}
                        defaultMethodId={primaryBrewMethod.id}
                    />
                ) : (
                    <p className="text-[17px] text-black/70 dark:text-white/70 sm:text-[19px]">
                        {/*
                            Фраза от justea-voice — она про сам чай: «Тёмный
                            чай не боится ни кипятка, ни долгого
                            настаивания». Общая запасная говорит читателю
                            только то, что мы чего-то не знаем, и годится
                            лишь пока своей нет.
                        */}
                        {tea.noBrewParamsNote ??
                            "Параметров заваривания для этого чая у нас пока нет."}
                    </p>
                )}

                {/*
                    Что меняет вкус.

                    Блок отвечает на то, отчего вкус вышел другим: «больше
                    листа — настой крепче». Рядом раньше стоял второй блок,
                    «Частые заблуждения», — он убран по решению пользователя
                    07.11.2026: справочного раздела с поправками читателю на
                    странице быть не должно. Сами записи остались в
                    `data/tea-types.json` и в полях сорта как основание — они
                    больше не выводятся.

                    Заголовок не «Типичные ошибки», и это не смягчение
                    формулировки: рекомендованная навеска различается почти
                    вдвое между редко пьющим и ежедневным, и обе названы
                    рекомендуемыми. Здесь же живёт запись тёмного чая «долго
                    и горячо — норма», которая под заголовком «ошибки»
                    опровергала бы сама себя.

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
