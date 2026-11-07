import { formatRatio } from "@/lib/format-number";
import { publicImageSize } from "@/lib/image-size";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { TEA_TYPE_LABELS } from "@/lib/teas";
import type { BrewMethod, Range, Tea } from "@/types/tea";

/**
 * Общие узлы графа schema.org. Ссылаемся на них по `@id`, чтобы Organization и
 * WebSite описывались один раз (в корневом layout), а страницы только ссылались.
 */
export const ORGANIZATION_ID = absoluteUrl("/#organization");
export const WEBSITE_ID = absoluteUrl("/#website");

export function organizationSchema() {
    return {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        logo: {
            "@type": "ImageObject",
            url: absoluteUrl(siteConfig.ogImage),
            // Размер из самого файла — см. lib/image-size.ts
            ...publicImageSize(siteConfig.ogImage),
        },
        // TODO(orchestrator): добавить sameAs — соцсети и каналы проекта,
        // когда они появятся.
    };
}

export function webSiteSchema() {
    return {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        inLanguage: siteConfig.defaultLocale.code,
        publisher: { "@id": ORGANIZATION_ID },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: absoluteUrl("/search?q={search_term_string}"),
            },
            "query-input": "required name=search_term_string",
        },
    };
}

export type Crumb = { label: string; href?: string };

export function breadcrumbListSchema(items: Crumb[], pageUrl: string) {
    return {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            // У последней крошки `href` нет — для неё item опускаем,
            // как требует спецификация Google.
            ...(item.href ? { item: absoluteUrl(item.href) } : {}),
        })),
    };
}

export function webPageSchema({
    pageUrl,
    name,
    description,
    hasBreadcrumbs = false,
    dateModified,
}: {
    pageUrl: string;
    name: string;
    description: string;
    hasBreadcrumbs?: boolean;
    dateModified?: string;
}) {
    return {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        description,
        inLanguage: siteConfig.defaultLocale.code,
        isPartOf: { "@id": WEBSITE_ID },
        ...(dateModified ? { dateModified } : {}),
        ...(hasBreadcrumbs
            ? { breadcrumb: { "@id": `${pageUrl}#breadcrumbs` } }
            : {}),
    };
}

/** «1 пролив», «2 пролива», «5 проливов». */
function plural(n: number, one: string, few: string, many: string): string {
    const mod100 = n % 100;
    const mod10 = n % 10;

    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;

    return many;
}

/** Склеивает фразы в текст: добивает точку там, где её нет. */
function sentences(parts: (string | undefined)[]): string {
    return parts
        .filter((part): part is string => Boolean(part?.trim()))
        .map((part) => {
            const text = part.trim();

            return /[.!?…]$/.test(text) ? text : `${text}.`;
        })
        .join(" ");
}

/** «75–80 °C», но «75 °C» когда границы совпадают. */
function formatTemperature({ from, to }: BrewMethod["temperature"]): string {
    return from === to ? `${from} °C` : `${from}–${to} °C`;
}

/** ISO 8601 duration: 95 секунд → `PT1M35S`. */
function isoDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return `PT${minutes ? `${minutes}M` : ""}${rest || !minutes ? `${rest}S` : ""}`;
}

/** Данные приходят строчными, а в тексте шага встают после точки. */
function capitalize(text?: string): string | undefined {
    return text ? `${text[0].toUpperCase()}${text.slice(1)}` : undefined;
}

/** «1,7–2 г» или «4 г», смотря задан диапазон или одно число. */
function formatAmount(value: number | Range, unit: string): string {
    return typeof value === "number"
        ? `${value} ${unit}`
        : `${value.from}–${value.to} ${unit}`;
}

/**
 * Шаги взбивания вместо проливов — для матчи.
 *
 * Отдельная ветка нужна потому, что `HowTo` здесь собирается из
 * `infusions`, а у взбивания проливов нет ни одного. Без неё разметка
 * выродилась бы в `HowTo` без шагов — инструкция, которая не инструктирует,
 * то есть хуже отсутствия разметки.
 *
 * Усуча и коича дают **разные шаги**, а не разную крепость: одну взбивают до
 * пены, другую вымешивают без пены. Поэтому стиль попадает в название шага.
 */
function whiskedSteps(method: BrewMethod, pageUrl: string) {
    return (method.whisked ?? []).flatMap((preparation, index) => {
        const position = index + 1;
        const isWhisk = preparation.motion === "whisk";
        const style = preparation.style === "usucha" ? "усуча" : "коича";
        const motion = isWhisk ? "Взбивать венчиком" : "Вымешивать";
        // Цель — словами источника, когда она есть. Когда нет, её роль
        // берёт на себя описание движения, иначе шаг не говорит, к чему
        // приводить: «взбивать» без «до чего» — не инструкция.
        const fallbackTarget = isWhisk
            ? "до мелкой пены"
            : "до однородной массы без пены";
        const duration = preparation.duration
            ? `, ${formatAmount(preparation.duration, "с")}`
            : "";

        return [
            {
                "@type": "HowToStep",
                "@id": `${pageUrl}#howto-${method.id}-step-${position}`,
                position,
                name: `${style}: ${formatAmount(preparation.powder, "г")} порошка`,
                text: sentences([
                    preparation.sift ? "Просеять порошок" : undefined,
                    `Залить ${formatAmount(preparation.water, "мл")} воды ${formatTemperature(preparation.temperature)}`,
                    preparation.target
                        ? `${motion}${duration}`
                        : `${motion} ${fallbackTarget}${duration}`,
                    // Цель приходит из данных строчной и встаёт после точки.
                    capitalize(preparation.target),
                ]),
            },
        ];
    });
}

/**
 * Шаг промывки (醒茶) — отдельно от проливов.
 *
 * Положить её первой записью в `infusions` нельзя: `infusions` — это то, что
 * пьют. Промывка назвалась бы проливом, который не пьют, и превратила бы
 * восемь проливов в девять и в таблице, и в `yield`.
 */
function rinseStep(method: BrewMethod, pageUrl: string) {
    const { rinse } = method;

    if (!rinse) {
        return [];
    }

    const times =
        typeof rinse.count === "number"
            ? `${rinse.count} ${plural(rinse.count, "раз", "раза", "раз")}`
            : `${rinse.count.from}–${rinse.count.to} раза`;

    return [
        {
            "@type": "HowToStep",
            "@id": `${pageUrl}#howto-${method.id}-rinse`,
            position: 1,
            name: "Промывка",
            text: sentences([
                `Ополоснуть лист горячей водой ${times} и сразу слить`,
                rinse.time ? `Держать около ${rinse.time} с` : undefined,
                rinse.note,
            ]),
            ...(rinse.time ? { performTime: isoDuration(rinse.time) } : {}),
        },
    ];
}

const WHISK_TOOL_NAMES: Record<string, string> = {
    chasen: "Бамбуковый венчик (тясэн)",
    "electric-frother": "Электрический вспениватель",
    shaker: "Шейкер",
};

/** `HowToTool` для взбивания — без повторов, если стилей несколько. */
function whiskTools(method: BrewMethod) {
    const names = new Set(
        (method.whisked ?? [])
            .map((preparation) => preparation.tool)
            .filter((tool) => tool !== undefined)
            .map((tool) => WHISK_TOOL_NAMES[tool] ?? tool),
    );

    return [...names].map((name) => ({ "@type": "HowToTool", name }));
}

function brewMethodHowTo(tea: Tea, method: BrewMethod, pageUrl: string) {
    const infusions = method.infusions ?? [];
    const rinse = rinseStep(method, pageUrl);
    // Промывка входит в общее время — оно на неё тратится, — но не в `yield`:
    // чашки она не даёт.
    const totalSeconds =
        infusions.reduce((sum, infusion) => sum + infusion.time, 0) +
        (method.rinse?.time ?? 0);

    const temperature = formatTemperature(method.temperature);
    const isBoiled = method.type === "boiled";
    const isWhisked = method.type === "whisked";

    return {
        "@type": "HowTo",
        // «Как заваривать» для варки и взбивания — неправда: чай варят и
        // взбивают, а не заваривают. Разметка не должна называть действие
        // не своим именем.
        "@id": `${pageUrl}#howto-${method.id}`,
        name: `${tea.name}: ${
            isBoiled ? "как варить" : isWhisked ? "как взбивать" : "как заваривать"
        } (${method.name})`,
        /*
         * Только собственное описание способа. **Заметки `notes` отсюда
         * убраны 07.11.2026, и это отмена моего же решения этапа 1.**
         *
         * Тогда я рассуждал так: заметки — это совет, а не инвентарь, значит
         * им место в `description`, а не в `tool`. Рассуждение про поле было
         * верным, а про канал — нет.
         *
         * Что из этого вышло, нашли justea-sources и justea-catalog в аудите
         * заметок прода. На живой странице Те Гуань Инь в `HowTo.description`
         * стояло: «Оптимум по Cao et al. 2022: 5 г/100 мл при 100 °C». В
         * работе Cao четыре рекомендованных режима и ни одного «оптимума» —
         * то есть мы опубликовали в структурированных данных **ссылку на
         * источник под утверждением, которого в источнике нет**. Это хуже
         * числа без ссылки: названный источник выглядит проверенным.
         *
         * Причина не в конкретной заметке. `notes` пишутся для страницы,
         * меняются вместе с данными, и никто, правя их, не думает про
         * разметку — а они автоматически становились опубликованным
         * машиночитаемым утверждением. Связь, которую никто не охранял.
         *
         * Заметки остаются видимыми на странице: правило соответствия
         * одностороннее — разметка не должна заявлять **больше**, чем видно,
         * а меньше может.
         */
        description: sentences([method.description]),
        inLanguage: siteConfig.defaultLocale.code,
        ...(totalSeconds ? { totalTime: isoDuration(totalSeconds) } : {}),
        // У взбивания количества, которое имело бы смысл назвать, нет вовсе.
        // У варки оно есть — но это варки, а не проливы: источник описывает
        // последовательные варки одного листа с растущим временем.
        ...(isWhisked
            ? {}
            : {
                  yield: `${infusions.length} ${
                      isBoiled
                          ? plural(infusions.length, "варка", "варки", "варок")
                          : plural(infusions.length, "пролив", "пролива", "проливов")
                  }`,
              }),
        supply: [
            {
                "@type": "HowToSupply",
                // У взбивания навеска одна в поле и две в жизни: 2,4 г/100 мл
                // у усучи против 13,3 у коичи. Назвать одну значило бы
                // соврать про вторую, поэтому здесь только чай, а количества
                // стоят в шагах, где у каждого свой стиль.
                name:
                    method.ratio === undefined
                        ? tea.name
                        : `${tea.name} — ${formatRatio(method.ratio)} воды`,
            },
            {
                "@type": "HowToSupply",
                name: `Вода ${temperature}`,
            },
        ],
        // Инструмент есть только у взбивания: венчик это именно инвентарь, а
        // не совет. У проливных способов посуда лежит в `notes` вперемешку с
        // параметрами воды, и вытаскивать её оттуда разбором я не стану.
        ...(whiskTools(method).length ? { tool: whiskTools(method) } : {}),
        step: isWhisked
            ? whiskedSteps(method, pageUrl)
            : [
                  ...rinse,
                  ...infusions.map((infusion) => ({
                  "@type": "HowToStep",
                  // Номер нужен, только когда варок несколько: «Варка 1» у
                  // единственной варки выглядит обещанием второй.
                  name: isBoiled
                      ? infusions.length > 1
                          ? `Варка ${infusion.number}`
                          : "Варка"
                      : `Пролив ${infusion.number}`,
                  text: sentences([
                      isBoiled
                          ? `Довести до кипения и варить ${infusion.time} с.`
                          : `Залить водой ${temperature} и настаивать ${infusion.time} с.`,
                      infusion.notes,
                  ]),
                      // `position` — порядок в инструкции, и промывка его
                      // сдвигает. Номер для человека остаётся в `name`:
                      // «Пролив 1» стоит вторым шагом, и это верно — перед
                      // ним промывка, которую не пьют.
                      position: infusion.number + rinse.length,
                      ...(infusion.time
                          ? { performTime: isoDuration(infusion.time) }
                          : {}),
                  })),
              ],
    };
}

/**
 * Граф страницы чая: WebPage + Article (сама статья) + Product-подобный
 * узел самого чая + по одному HowTo на способ заваривания + BreadcrumbList.
 */
export function teaPageSchema(tea: Tea, crumbs: Crumb[]) {
    const pageUrl = absoluteUrl(`/${tea.slug}`);
    const image = tea.photo ? absoluteUrl(tea.photo) : absoluteUrl(siteConfig.ogImage);
    const characteristics = [
        ...tea.characteristics.aroma.map((value) => ["Аромат", value] as const),
        ...tea.characteristics.flavor.map((value) => ["Вкус", value] as const),
        ...tea.characteristics.aftertaste.map((value) => ["Послевкусие", value] as const),
    ];

    return {
        "@context": "https://schema.org",
        "@graph": [
            webPageSchema({
                pageUrl,
                name: tea.name,
                description: tea.description ?? siteConfig.description,
                hasBreadcrumbs: true,
                dateModified: tea.meta.addedDate,
            }),
            breadcrumbListSchema(crumbs, pageUrl),
            {
                "@type": "Article",
                "@id": `${pageUrl}#article`,
                headline: `${tea.name} — как заваривать: проливы, температура, пропорции`,
                description: tea.description ?? siteConfig.description,
                image,
                inLanguage: siteConfig.defaultLocale.code,
                mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
                datePublished: tea.meta.addedDate,
                dateModified: tea.meta.addedDate,
                author: { "@id": ORGANIZATION_ID },
                publisher: { "@id": ORGANIZATION_ID },
                about: { "@id": `${pageUrl}#tea` },
                articleSection: TEA_TYPE_LABELS[tea.type],
            },
            {
                "@type": "Product",
                "@id": `${pageUrl}#tea`,
                name: tea.name,
                description: tea.description ?? siteConfig.description,
                image,
                category: TEA_TYPE_LABELS[tea.type],
                // `countryOfOrigin` ждёт объект Country, а в данных строка
                // вида «Ханчжоу, Китай» — регион, а не страна. Поэтому
                // кладём его в additionalProperty, а не врём типом.
                additionalProperty: [
                    // Сорт куста — не то же, что сорт чая: из одного куста
                    // делают разные чаи. Выводим только потому, что он виден
                    // на странице; разметка не должна заявлять больше.
                    ...(tea.cultivar
                        ? [
                              {
                                  "@type": "PropertyValue",
                                  name: "Сорт куста",
                                  value: tea.cultivar,
                              },
                          ]
                        : []),
                    ...(tea.meta.origin
                        ? [
                              {
                                  "@type": "PropertyValue",
                                  name: "Регион",
                                  value: tea.meta.origin,
                              },
                          ]
                        : []),
                    ...characteristics.map(([name, value]) => ({
                        "@type": "PropertyValue",
                        name,
                        value,
                    })),
                ],
                // `offers` и `aggregateRating` сознательно не выводим:
                // чай не продаётся, а `meta.rating` — личная оценка автора,
                // а не отзывы пользователей. Разметка отзывов без реальных
                // отзывов — повод для ручных санкций.
            },
            // Способов может не быть вовсе — тогда и инструкций нет. Это
            // честнее, чем `HowTo` с выдуманными параметрами: разметка без
            // рецепта лучше рецепта без источника.
            ...(tea.brewMethods ?? []).map((method) =>
                brewMethodHowTo(tea, method, pageUrl),
            ),
        ],
    };
}

/** Граф страницы типа чая: WebPage + BreadcrumbList + ItemList с чаями. */
export function teaTypeListSchema({
    pageUrl,
    name,
    description,
    crumbs,
    teas,
}: {
    pageUrl: string;
    name: string;
    description: string;
    /**
     * Крошки. Для главной не передаём: список из одного элемента без ссылки
     * — не навигационная цепочка, Google такую разметку игнорирует.
     */
    crumbs?: Crumb[];
    teas: Tea[];
}) {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                ...webPageSchema({
                    pageUrl,
                    name,
                    description,
                    hasBreadcrumbs: Boolean(crumbs?.length),
                }),
                "@type": "CollectionPage",
            },
            ...(crumbs?.length ? [breadcrumbListSchema(crumbs, pageUrl)] : []),
            {
                "@type": "ItemList",
                "@id": `${pageUrl}#list`,
                name,
                numberOfItems: teas.length,
                itemListElement: teas.map((tea, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: tea.name,
                    url: absoluteUrl(`/${tea.slug}`),
                })),
            },
        ],
    };
}

/**
 * Разметка лендинга церемоний.
 *
 * Данные приходят из `app/ceremony/content.ts` (зона justea-ceremony) —
 * здесь их не дублируем, иначе текст на странице и разметка разойдутся, а
 * расхождение разметки с видимым контентом Google считает нарушением.
 *
 * Состав графа сознательно неполный, и это главное, что нужно знать об этой
 * функции. На 07.11.2026 известны адрес (Караванная улица, 14), город, цена
 * и частота. **Даты ближайшей церемонии нет** — на странице она стоит
 * заглушкой. Поэтому узел `Event` собирается только при переданном
 * `nextDate`: `Event` без `startDate` невалиден, а подставить любую дату —
 * значит соврать и краулеру, и человеку, который по этой дате придёт.
 *
 * Что это даёт сегодня: место с адресом (`Place` + `PostalAddress`) —
 * нормальный узел, его можно выводить и без события. Он же станет
 * `location`, когда дата появится.
 *
 * Честно про выигрыш: пока `/ceremony` под `noindex` (решение оркестратора
 * 07.11.2026, на странице пять заглушек), разметка в выдачу не попадает
 * вовсе. Это подготовка к возвращению страницы в индекс, а не прирост
 * сегодня.
 */
export function ceremonyPageSchema({
    path,
    name,
    description,
    crumbs,
    venueName,
    streetAddress,
    addressLocality,
    price,
    priceCurrency = "RUB",
    nextDate,
    hostName,
}: {
    path: string;
    name: string;
    description: string;
    crumbs: Crumb[];
    /** Название площадки, как оно написано на странице. */
    venueName: string;
    /** Улица и дом: «Караванная улица, 14». */
    streetAddress: string;
    addressLocality: string;
    /**
     * Цена числом, без знака валюты и без «от»: решение пользователя
     * 06.11.2026 — 1500 ₽ с человека, чай включён, то есть цена точная.
     */
    price: number;
    priceCurrency?: string;
    /**
     * Дата и время начала в ISO 8601 с часовым поясом
     * (`2026-12-06T16:00:00+03:00`). Без неё узел `Event` не выводится.
     */
    nextDate?: string;
    /** Имя мастера. Выводится как `performer`, только если передано. */
    hostName?: string;
}) {
    const pageUrl = absoluteUrl(path);
    const venueId = `${pageUrl}#venue`;

    const venue = {
        "@type": "Place",
        "@id": venueId,
        name: venueName,
        address: {
            "@type": "PostalAddress",
            streetAddress,
            addressLocality,
            addressCountry: "RU",
            // Почтовый индекс и координаты не выводим: их нам никто не
            // называл, а выяснять адрес по карте и выдавать догадку за факт
            // — ровно то, чего мы избегаем в данных о чае.
        },
    };

    return {
        "@context": "https://schema.org",
        "@graph": [
            webPageSchema({
                pageUrl,
                name,
                description,
                hasBreadcrumbs: crumbs.length > 0,
            }),
            ...(crumbs.length ? [breadcrumbListSchema(crumbs, pageUrl)] : []),
            venue,
            ...(nextDate
                ? [
                      {
                          "@type": "Event",
                          "@id": `${pageUrl}#event`,
                          name,
                          description,
                          startDate: nextDate,
                          eventAttendanceMode:
                              "https://schema.org/OfflineEventAttendanceMode",
                          eventStatus: "https://schema.org/EventScheduled",
                          inLanguage: siteConfig.defaultLocale.code,
                          location: { "@id": venueId },
                          organizer: { "@id": ORGANIZATION_ID },
                          ...(hostName
                              ? { performer: { "@type": "Person", name: hostName } }
                              : {}),
                          offers: {
                              "@type": "Offer",
                              price,
                              priceCurrency,
                              url: pageUrl,
                              availability: "https://schema.org/InStock",
                          },
                      },
                  ]
                : []),
        ],
    };
}
