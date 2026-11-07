import JsonLd from "./JsonLd";
import { ceremonyPageSchema, type Crumb } from "./schema";

/**
 * Разметка лендинга церемоний: WebPage + BreadcrumbList + место с адресом,
 * а когда появится дата — ещё и Event с ценой.
 *
 * **Кто это подключает.** Компонент написан для `app/ceremony/page.tsx`
 * (зона justea-ceremony), на ветке `agent/seo` его пока никто не
 * импортирует: страницы церемоний здесь нет. Строка для подключения:
 *
 * ```tsx
 * import CeremonyJsonLd from "../components/seo/CeremonyJsonLd";
 *
 * <CeremonyJsonLd
 *     path="/ceremony"
 *     name={`Чайная церемония ${CEREMONY_CITY_IN}`}
 *     description={…}            // тот же текст, что в createPageMetadata
 *     crumbs={[{ label: "Главная", href: "/" }, { label: "Церемония" }]}
 *     venueName={CEREMONY_VENUE}
 *     streetAddress={CEREMONY_ADDRESS}
 *     addressLocality={CEREMONY_CITY}
 *     price={1500}
 *     hostName={CEREMONY_HOST_NAME}
 * />
 * ```
 *
 * Крошки передавать те же, что и в визуальный `Breadcrumbs`, из одного
 * массива: разметка обязана соответствовать видимому контенту.
 *
 * `nextDate` не передавать, пока дата — заглушка. Без неё узел `Event` не
 * выводится, и это правильное поведение: событие без даты невалидно, а
 * выдуманная дата хуже отсутствующей разметки.
 */
export default function CeremonyJsonLd(
    props: Parameters<typeof ceremonyPageSchema>[0] & { crumbs: Crumb[] },
) {
    return <JsonLd data={ceremonyPageSchema(props)} />;
}
